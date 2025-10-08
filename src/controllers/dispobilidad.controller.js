import { sequelize } from '../config/database.js';
import { QueryTypes, Op } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { Disponibilidad } from '../models/disponibilidaLinea.js';
import { Mes } from '../models/mes.js';

import { safeDiv, toNum } from '../lib/libs.js';

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
            as: 'mesesGestion', // alias definido en la asociación
            include: [
              {
                model: Disponibilidad,
                as: 'disponibilidadMes', // alias definido en Mes.hasOne(IngresoVentasTotales)
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

      // 2) Primer mes libre de la gestión (bloqueando filas)
      const row = await sequelize.query(
        `
        SELECT m.id_mes, m.numero, m.periodo
        FROM mes m
        WHERE m.fk_gestion_mes = :gid
          AND NOT EXISTS (SELECT 1 FROM disponibilidad p WHERE p.mes_id = m.id_mes)
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
      if (row.length === 0)
        throw new Error(`La gestión ${gestion.label} ya está completa`);
      const { id_mes: mesId, numero, periodo } = row[0];

      // 3) Buscar el registro anterior de Produccion en la misma gestión (mes < actual)
      const prev = await Disponibilidad.findOne({
        include: [
          {
            model: Mes,
            as: 'mesDisponibilidad', // Asegúrate que tu asociación use este alias
            attributes: [],
            where: {
              fk_gestion_mes: gestion.id_gestion,
              numero: { [Op.lt]: numero },
            },
          },
        ],
        order: [[sequelize.col('mesDisponibilidad.numero'), 'DESC']],
        transaction: t,
      });

      // 4) Normaliza los valores entrantes (mensuales)
      const nroHorasProactivasPlanificadas = toNum(
        items.nroHorasProactivasPlanificadas
      );
      const nroHorasParadasLineaB = toNum(items.nroHorasParadasLineaB);
      const nroHorasParadasLineaC = toNum(items.nroHorasParadasLineaC);
      const nroHorasParadasLineaD = toNum(items.nroHorasParadasLineaD);

      //calculos

      const disponibilidadLineaB = safeDiv(696 - nroHorasParadasLineaB, 696);
      const disponibilidadLineaC = safeDiv(696 - nroHorasParadasLineaC, 696);
      const disponibilidadLineaD = safeDiv(696 - nroHorasParadasLineaD, 696);

      const payload = {
        mes_id: mesId,
        periodo,
        nroHorasProactivasPlanificadas,
        nroHorasParadasLineaB,
        nroHorasParadasLineaC,
        nroHorasParadasLineaD,
        disponibilidadLineaB,
        disponibilidadLineaC,
        disponibilidadLineaD,
        ...(prev?.meta != null ? { meta: toNum(prev.meta) } : {}),
      };

      const itemSave = await Disponibilidad.create(payload, { transaction: t });
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

export const updateObj = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Bloquear la fila actual
      const current = await Disponibilidad.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!current) return { notFound: true };

      // 2) Obtener mes vinculado
      const mesRow = await Mes.findByPk(current.mes_id, {
        transaction: t,
        attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
      });
      if (!mesRow) throw new Error('Mes no encontrado para el registro');

      // 3) Normalizar entradas (o conservar existentes)
      const nroHorasProactivasPlanificadas = toNum(
        body.nroHorasProactivasPlanificadas ??
          current.nroHorasProactivasPlanificadas
      );
      const nroHorasParadasLineaB = toNum(
        body.nroHorasParadasLineaB ?? current.nroHorasParadasLineaB
      );
      const nroHorasParadasLineaC = toNum(
        body.nroHorasParadasLineaC ?? current.nroHorasParadasLineaC
      );
      const nroHorasParadasLineaD = toNum(
        body.nroHorasParadasLineaD ?? current.nroHorasParadasLineaD
      );
      //calculos

      const disponibilidadLineaB = safeDiv(696 - nroHorasParadasLineaB, 696);
      const disponibilidadLineaC = safeDiv(696 - nroHorasParadasLineaC, 696);
      const disponibilidadLineaD = safeDiv(696 - nroHorasParadasLineaD, 696);

      // 4) Actualizar los valores mensuales
      await current.update(
        {
          nroHorasProactivasPlanificadas,
          nroHorasParadasLineaB,
          nroHorasParadasLineaC,
          nroHorasParadasLineaD,
          disponibilidadLineaB,
          disponibilidadLineaC,
          disponibilidadLineaD,
        },
        { transaction: t }
      );

      const fresh = await Disponibilidad.findByPk(id, {
        transaction: t,
        include: [
          {
            model: Mes,
            as: 'mesDisponibilidad',
            attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
          },
        ],
      });

      return { fresh };
    });

    if (result?.notFound)
      return res.status(404).json({ message: 'Registro no encontrado' });

    res.json(result.fresh);
  } catch (e) {
    console.error('❌ Error en updateObj Disponibilidad:', e);
    res.status(500).json({
      message: e?.message || 'Error al actualizar',
      code: e?.original?.code,
      detail: e?.original?.detail,
      stack: process.env.NODE_ENV === 'production' ? undefined : e?.stack,
    });
  }
};

export const ObtenerPeriodoCalidad = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Gestión vigente
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });

      if (!gestion) throw new Error('No hay gestión vigente');

      // 2) Buscar mes libre (sin registro de calidad)
      const row = await sequelize.query(
        `
        SELECT m.id_mes, m.numero, m.periodo
        FROM mes m
        WHERE m.fk_gestion_mes = :gid
          AND NOT EXISTS (
            SELECT 1
            FROM disponibilidad c
            WHERE c.mes_id = m.id_mes
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

    if (!result.row?.length) {
      return res
        .status(404)
        .json({ message: 'La gestión vigente ya está completa' });
    }

    const response = {
      periodo: result.row[0].periodo,
      gestion: result.gestion.label,
    };

    return res.status(200).json(response);
  } catch (e) {
    console.error('❌ Error en ObtenerPeriodoCalidad:', e);
    return res
      .status(500)
      .json({ message: e.message || 'Error al obtener periodo' });
  }
};

export const cambiarMeta = async (req, res) => {
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
      UPDATE disponibilidad pu
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
