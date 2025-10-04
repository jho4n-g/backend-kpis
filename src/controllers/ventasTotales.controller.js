import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { Op } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { VentasTotales } from '../models/ventasTotales.js';
import { Mes } from '../models/mes.js';

// Helpers
const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const safeDiv = (a, b) => {
  const x = toNum(a, 0);
  const y = toNum(b, 0);
  return y === 0 ? 0 : x / y;
};

/**
 * Recalcula desde el mes `startNumero` hacia adelante dentro de la misma gestión.
 * - Usa el alias correcto 'mesVentasTotales'
 * - Construye acumulados con prefijos hasta el mes anterior
 * - Recalcula DifVentMenvsPre, VenAcu, PresAcu, DiffVentaAcuvsPresAcu, CumMen, CumAcu
 */
async function recomputeGestionFromMonth(gestionId, startNumero, t) {
  const rows = await VentasTotales.findAll({
    include: [
      {
        model: Mes,
        as: 'mesVentasTotales',
        required: true, // INNER JOIN
        attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
        where: { fk_gestion_mes: gestionId },
      },
    ],
    order: [[{ model: Mes, as: 'mesVentasTotales' }, 'numero', 'ASC']],
    transaction: t,
  });

  // 1) Prefijos hasta el mes anterior a startNumero
  let venAcu = 0;
  let presAcu = 0;

  for (const r of rows) {
    const n = toNum(r.mesVentasTotales?.numero);
    if (n >= startNumero) break;
    presAcu += toNum(r.PresMen);
    venAcu += toNum(r.VentMen);
  }

  // 2) Recalcular desde startNumero hacia adelante
  for (const r of rows) {
    const n = toNum(r.mesVentasTotales?.numero);
    if (n < startNumero) continue;

    const PresMen = toNum(r.PresMen);
    const VentMen = toNum(r.VentMen);

    presAcu += PresMen;
    venAcu += VentMen;

    const DifVentaMenvsPreMen = VentMen - PresMen; // conserva signo
    const DiffVentaAcuvsPresAcu = venAcu - presAcu; // conserva signo
    const CumMen = safeDiv(VentMen, PresMen); // 0..1
    const CumAcu = safeDiv(venAcu, presAcu); // 0..1

    await r.update(
      {
        DifVentaMenvsPreMen,
        VenAcu: venAcu,
        PresAcu: presAcu,
        DiffVentaAcuvsPresAcu,
        CumMen,
        CumAcu,
      },
      { transaction: t }
    );
  }
}

/**
 * UPDATE de un registro y recomputo en cadena
 * - Bloquea sólo la fila editada
 * - Lee el mes por separado
 * - Actualiza los valores mensuales
 * - Recalcula acumulados a partir de ese mes
 */
export const updateObjVentas = async (req, res) => {
  const { id } = req.params;
  const body = req.body; // { PresMen, VentMen }

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Bloquear SOLO la fila a editar
      const current = await VentasTotales.findByPk(id, {
        transaction: t,
        lock: { level: t.LOCK.UPDATE, of: VentasTotales },
      });
      if (!current) return { notFound: true };

      // 2) Traer el mes asociado (sin LEFT ni FOR UPDATE sobre el join)
      const mesRow = await Mes.findByPk(current.mes_id, {
        transaction: t,
        attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
      });
      if (!mesRow) throw new Error('Mes no encontrado para el registro');

      const gestionId = mesRow.fk_gestion_mes;
      const startNumero = mesRow.numero;

      // 3) Normalizar entradas (si no llegan, mantener lo actual)
      const PresMen = toNum(body.PresMen, current.PresMen);
      const VentMen = toNum(body.VentMen, current.VentMen);

      // 4) Actualizar sólo los valores mensuales
      await current.update({ PresMen, VentMen }, { transaction: t });

      // 5) Recalcular acumulados/derivados desde este mes
      await recomputeGestionFromMonth(gestionId, startNumero, t);

      // 6) Devolver el registro fresco con su Mes (con el alias correcto)
      const fresh = await VentasTotales.findByPk(id, {
        transaction: t,
        include: [
          {
            model: Mes,
            as: 'mesVentasTotales',
            attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
            required: true,
          },
        ],
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
      stack: process.env.NODE_ENV === 'production' ? undefined : e?.stack,
    });
  }
};

//****************************++ */

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
                FROM ventas_totales ivt
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

      // 3) Sumas de MESES anteriores (¡mensuales, no acumuladas!)
      const filtroGestion = {
        include: [
          {
            model: Mes,
            as: 'mesVentasTotales',
            attributes: [],
            where: { fk_gestion_mes: gestion.id_gestion },
          },
        ],
        transaction: t,
      };

      // OJO: Sumamos las columnas MENSUALES (atributos del modelo):
      const [CalVenAcu, CalPresAcu] = await Promise.all([
        VentasTotales.sum('VenAcu', filtroGestion),
        VentasTotales.sum('PresAcu', filtroGestion),
      ]);

      // 4) Normaliza los valores entrantes
      const PresMen = toNum(items.PresMen);
      const VentMen = toNum(items.VentMen);

      // 5) Calcula los nuevos ACUMULADOS como prefijos
      const VenAcu = toNum(CalVenAcu) + VentMen;
      const PresAcu = toNum(CalPresAcu) + PresMen;

      const CumMen = safeDiv(VentMen, PresMen);
      const CumAcu = safeDiv(VenAcu, PresAcu);

      // 6) Derivados mensuales y % acumulado
      const DifVentaMenvsPreMen = Math.abs(VentMen - PresMen);
      const DiffVentaAcuvsPresAcu = Math.abs(VenAcu - PresAcu);

      // 7) Inserta dentro de la misma transacción
      const payload = {
        mes_id: mesId,
        periodo,
        PresMen,
        VentMen,
        VenAcu,
        PresAcu,
        DifVentaMenvsPreMen,
        DiffVentaAcuvsPresAcu,
        CumMen,
        CumAcu,
      };

      const itemSave = await VentasTotales.create(payload, {
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

export const listobjVentas = async (req, res) => {
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
                model: VentasTotales,
                as: 'ventasTotalesMes', // alias definido en Mes.hasOne(IngresoVentasTotales)
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
                FROM ventas_totales ivt
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
