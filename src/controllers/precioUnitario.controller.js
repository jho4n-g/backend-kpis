import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { Op } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { Mes } from '../models/mes.js';
import { PrecioUnitario } from '../models/precioUnitario.js';

const safeDiv = (a, b) => {
  const x = toNum(a, 0);
  const y = toNum(b, 0);
  return y === 0 ? 0 : x / y;
};

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const createObj = async (req, res) => {
  const items = req.body;

  try {
    const created = await sequelize.transaction(async (t) => {
      // 1) Gestión vigente
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });
      if (!gestion) throw new Error('No hay gestión vigente');

      // 2) Primer mes libre de la gestión (sin LEFT JOIN; lock seguro)
      const row = await sequelize.query(
        `
            SELECT m.id_mes, m.numero, m.periodo
            FROM mes m
            WHERE m.fk_gestion_mes = :gid
              AND NOT EXISTS (
                SELECT 1
                FROM precio_unitario ivt
                WHERE ivt.mes_id = m.id_mes
              )
            ORDER BY m.numero
            FOR UPDATE SKIP LOCKED
            LIMIT 1;
            `,
        {
          type: QueryTypes.SELECT,
          transaction: t,
          replacements: { gid: gestion.id_gestion },
        }
      );
      if (row.length === 0) {
        throw new Error(`La gestión ${gestion.label} ya está completa`);
      }
      const { id_mes: mesId, periodo } = row[0];

      // 4) Normaliza los valores entrantes
      const presMen = toNum(items.presMen);
      const precProm = toNum(items.precProm);
      const regionCentro = toNum(items.regionCentro);
      const regionEste = toNum(items.regionEste);
      const regionOeste = toNum(items.regionOeste);
      const fabrica = toNum(items.fabrica);
      const exportacion = toNum(items.exportacion);
      const cumplimientoMensual = safeDiv(precProm, presMen);

      // 7) Inserta dentro de la misma transacción
      const payload = {
        mes_id: mesId,
        periodo,
        presMen,
        precProm,
        regionCentro,
        regionEste,
        regionOeste,
        fabrica,
        exportacion,
        cumplimientoMensual,
      };

      const itemSave = await PrecioUnitario.create(payload, {
        transaction: t,
      });
      return itemSave;
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: e?.message || 'Error al crear',
      code: e?.original?.code,
      detail: e?.original?.detail,
    });
  }
};

//listar ventas

export const listobj = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Buscar gestión vigente
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });

      if (!gestion) throw new Error('No hay gestión vigente');

      const data = await Gestion.findOne({
        where: { is_archived: false },
        include: [
          {
            model: Mes,
            as: 'mesesGestion',
            include: [
              {
                model: PrecioUnitario,
                as: 'precioUnitarioMes',
              },
            ],
          },
        ],
        order: [['startYear', 'DESC']],
      });

      return { data };
    });

    res.status(201).json(result.data);
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ message: e.message });
  }
};

// PATCH /precio-unitario/:id
export const updateObj = async (req, res) => {
  const { id } = req.params;
  const body = req.body; // { presMen?, precProm?, regionCentro?, regionEste?, regionOeste?, fabrica?, exportacion? }

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Bloquear la fila a editar
      const current = await PrecioUnitario.findByPk(id, {
        transaction: t,
        lock: { level: t.LOCK.UPDATE, of: PrecioUnitario },
      });
      if (!current) return { notFound: true };

      // 2) Tomar nuevos valores si vienen; si no, usar los actuales
      const presMen = toNum(body.presMen, toNum(current.presMen));
      const precProm = toNum(body.precProm, toNum(current.precProm));
      const regionCentro = toNum(
        body.regionCentro,
        toNum(current.regionCentro)
      );
      const regionEste = toNum(body.regionEste, toNum(current.regionEste));
      const regionOeste = toNum(body.regionOeste, toNum(current.regionOeste));
      const fabrica = toNum(body.fabrica, toNum(current.fabrica));
      const exportacion = toNum(body.exportacion, toNum(current.exportacion));

      // 3) Recalcular derivados
      const cumplimientoMensual = safeDiv(precProm, presMen);

      // 4) Actualizar (NO tocar mes_id ni periodo aquí)
      await current.update(
        {
          presMen,
          precProm,
          regionCentro,
          regionEste,
          regionOeste,
          fabrica,
          exportacion,
          cumplimientoMensual,
        },
        { transaction: t }
      );

      // 5) Devolver fresco (si tienes la asoc. como 'mes', puedes incluirla)
      const fresh = await PrecioUnitario.findByPk(id, {
        transaction: t,
        // include: [{ model: Mes, as: 'mes', attributes: ['id_mes', 'numero', 'periodo'] }],
      });

      return { fresh };
    });

    if (result?.notFound) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    res.json(result.fresh);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: e?.message || 'Error al actualizar',
      code: e?.original?.code,
      detail: e?.original?.detail,
    });
  }
};

//obtenerPeriodo

export const ObtenerPeriodo = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });

      if (!gestion) throw new Error('No hay gestión vigente');
      // Antes de ejecutar la query, verifica:

      // 2) Buscar mes libre
      const row = await sequelize.query(
        `
            SELECT m.id_mes, m.numero, m.periodo
            FROM mes m
            WHERE m.fk_gestion_mes = :gid
              AND NOT EXISTS (
                SELECT 1
                FROM precio_unitario ivt
                WHERE ivt.mes_id = m.id_mes
              )
            ORDER BY m.numero
            FOR UPDATE SKIP LOCKED
            LIMIT 1;
            `,
        {
          type: QueryTypes.SELECT,
          transaction: t,
          replacements: { gid: gestion.id_gestion },
        }
      );

      return { row, gestion };
    });

    if (!result.row) {
      return res.status(404).json({ message: 'No hay gestión vigente' });
    }
    const date = {
      periodo: result.row[0].periodo,
    };

    return res.status(200).json(date);
  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ message: e.message });
  }
};

export const cambiarMetaPU = async (req, res) => {
  try {
    // (Opcional) if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'No autorizado' });

    const { meta } = req.body ?? {};

    // Validación simple
    if (
      meta === undefined ||
      meta === null ||
      meta === '' ||
      Number.isNaN(Number(meta))
    ) {
      return res.status(400).json({ error: 'meta inválida' });
    }

    // Para NUMERIC es mejor enviar como string (evita redondeos de JS)
    const metaStr = String(meta);

    const [_, info] = await sequelize.query(
      `
      UPDATE precio_unitario pu
         SET meta = :m, updated_at = NOW()
      FROM mes m
      JOIN gestion g ON g.id_gestion = m.fk_gestion_mes
      WHERE pu.mes_id = m.id_mes
        AND g.is_archived = false
        AND pu.meta IS DISTINCT FROM :m
      `,
      { replacements: { m: metaStr } }
    );

    // En Postgres, info.rowCount suele traer afectadas
    const affected = info?.rowCount ?? 0;

    return res.status(200).json({
      ok: true,
      meta: metaStr,
      affected,
      message: affected
        ? `Meta actualizada en ${affected} registro(s) de la gestión activa`
        : 'No hubo cambios (todos ya tenían ese meta)',
    });
  } catch (err) {
    // Log y respuesta estándar
    console.error(err);
    return res.status(500).json({ error: 'Error aplicando meta' });
    // o next(err) si tienes middleware de errores centralizado
  }
};

export async function applyMetaPrecioUnitario(meta) {
  if (meta == null || Number.isNaN(Number(meta))) {
    throw new Error('meta inválida');
  }
  await sequelize.query(
    `UPDATE precio_unitario pu
        SET meta = :m, updated_at = NOW()
      FROM mes m
      JOIN gestion g ON g.id_gestion = m.fk_gestion_mes
      WHERE pu.mes_id = m.id_mes
        AND g.is_archived = false
        AND pu.meta IS DISTINCT FROM :m`,
    { replacements: { m: meta } }
  );
}
