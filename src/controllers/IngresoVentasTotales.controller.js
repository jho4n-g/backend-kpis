import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { IngresoVentasTotales } from '../models/IngresoVentasTotales.js';
import { Mes } from '../models/mes.js';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const safeDiv = (num, den) => {
  const a = toNum(num, 0);
  const b = toNum(den, 0);
  return b === 0 ? 0 : a / b;
};

/**
 * Recalcula ACUMULADOS y derivados solo desde `startNumero` (incluido)
 * hacia adelante, manteniendo como base la suma de los meses anteriores.
 *
 * Prefijos por gestión (orden por mes.numero):
 * sumPres  = Σ PresMen
 * sumOtros = Σ VentMenOtrIng
 * sumCer   = Σ venMenCer
 */
async function recomputeGestionFromMonth(gestionId, startNumero, t) {
  const rows = await IngresoVentasTotales.findAll({
    include: [
      {
        model: Mes,
        as: 'mes',
        required: true, // INNER JOIN (evita el LEFT)
        attributes: ['id_mes', 'numero', 'fk_gestion_mes'],
        where: { fk_gestion_mes: gestionId },
      },
    ],
    order: [[sequelize.col('mes.numero'), 'ASC']],
    transaction: t,
    // lock: { level: t.LOCK.UPDATE, of: IngresoVentasTotales }, // opcional: puedes omitir y confiar en el lock por UPDATE
  });

  // 1) Prefijos hasta el mes anterior a startNumero
  let sumPres = 0;
  let sumOtros = 0;
  let sumCer = 0;

  for (const r of rows) {
    if (r.mes.numero >= startNumero) break;
    sumPres += toNum(r.PresMen);
    sumOtros += toNum(r.VentMenOtrIng);
    sumCer += toNum(r.venMenCer);
  }

  // 2) Recalcular desde startNumero hacia adelante
  for (const r of rows) {
    if (r.mes.numero < startNumero) continue;

    const PresMen = toNum(r.PresMen);
    const VentMenOtrIng = toNum(r.VentMenOtrIng);
    const venMenCer = toNum(r.venMenCer);

    sumPres += PresMen;
    sumOtros += VentMenOtrIng;
    sumCer += venMenCer;

    await r.update(
      {
        // Acumulados (prefijos)
        venAcuOtros: sumOtros,
        venAcuCer: sumCer,
        acuPres: sumPres,

        // Diferencias mensuales vs presupuesto
        diffVe_OtrosvsPres: VentMenOtrIng - PresMen,
        diffVen_CervsPres: venMenCer - PresMen,

        // Cumplimientos
        cumplMenCeramica: safeDiv(venMenCer, PresMen), // mensual
        cumplOtrosIngrAcuvsAcumPres: safeDiv(sumOtros, sumPres), // acumulado
      },
      { transaction: t }
    );
  }
}
/* ================ UPDATE ================ */
export const updateIngVentTol = async (req, res) => {
  const { id } = req.params;
  const body = req.body; // { PresMen, VentMenOtrIng, venMenCer, otrIngr } (no enviar 'periodo' en UPDATE)

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Bloquear SOLO la fila de ingreso_ventas_totales (sin JOIN)
      const current = await IngresoVentasTotales.findByPk(id, {
        transaction: t,
        lock: { level: t.LOCK.UPDATE, of: IngresoVentasTotales },
      });

      if (!current) return { notFound: true };

      // 2) Traer el mes por separado (sin FOR UPDATE sobre un LEFT)
      const mesRow = await Mes.findByPk(current.mes_id, {
        transaction: t,
        attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
        // lock: t.LOCK.UPDATE, // opcional
      });

      if (!mesRow) throw new Error('Mes no encontrado para el registro');

      const gestionId = mesRow.fk_gestion_mes;
      const startNumero = mesRow.numero;

      // 3) Normalizar los valores entrantes o mantener los actuales
      const PresMen = toNum(body.PresMen, current.PresMen);
      const VentMenOtrIng = toNum(body.VentMenOtrIng, current.VentMenOtrIng);
      const venMenCer = toNum(body.venMenCer, current.venMenCer);
      const otrIngr = toNum(body.otrIngr, current.otrIngr);

      // 4) Actualizar SÓLO los valores mensuales del registro editado
      await current.update(
        { PresMen, VentMenOtrIng, venMenCer, otrIngr },
        { transaction: t }
      );

      // 5) Recalcular acumulados/derivados desde este mes hacia adelante
      await recomputeGestionFromMonth(gestionId, startNumero, t);

      // 6) Devolver el registro fresco con el mes (include SIN lock)
      const fresh = await IngresoVentasTotales.findByPk(id, {
        transaction: t,
        include: [
          {
            model: Mes,
            as: 'mes',
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

export const createIngVentTol = async (req, res) => {
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
            FROM ingreso_ventas_totales ivt
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
            as: 'mes',
            attributes: [],
            where: { fk_gestion_mes: gestion.id_gestion },
          },
        ],
        transaction: t,
      };

      // OJO: Sumamos las columnas MENSUALES (atributos del modelo):
      const [prevOtros, prevCer, prevPres] = await Promise.all([
        IngresoVentasTotales.sum('VentMenOtrIng', filtroGestion),
        IngresoVentasTotales.sum('venMenCer', filtroGestion),
        IngresoVentasTotales.sum('PresMen', filtroGestion),
      ]);

      // 4) Normaliza los valores entrantes
      const PresMen = toNum(items.PresMen);
      const VentMenOtrIng = toNum(items.VentMenOtrIng);
      const venMenCer = toNum(items.venMenCer);
      const otrIngr = toNum(items.otrIngr);

      // 5) Calcula los nuevos ACUMULADOS como prefijos
      const venAcuOtros = toNum(prevOtros) + VentMenOtrIng;
      const venAcuCer = toNum(prevCer) + venMenCer;
      const acuPres = toNum(prevPres) + PresMen;

      // 6) Derivados mensuales y % acumulado
      const diffVe_OtrosvsPres = VentMenOtrIng - PresMen;
      const diffVen_CervsPres = venMenCer - PresMen;
      const cumplMenCeramica = safeDiv(venMenCer, PresMen);
      const cumplOtrosIngrAcuvsAcumPres = safeDiv(venAcuOtros, acuPres);

      // 7) Inserta dentro de la misma transacción
      const payload = {
        mes_id: mesId,
        periodo,
        PresMen,
        VentMenOtrIng,
        venMenCer,
        otrIngr,
        venAcuOtros,
        venAcuCer,
        acuPres,
        diffVe_OtrosvsPres,
        diffVen_CervsPres,
        cumplMenCeramica,
        cumplOtrosIngrAcuvsAcumPres,
      };

      const itemSave = await IngresoVentasTotales.create(payload, {
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

export const getAllIngrVentTot = async (req, res) => {
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
                model: IngresoVentasTotales,
                as: 'ingresoVentas', // alias definido en Mes.hasOne(IngresoVentasTotales)
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

export const getIngVentTolById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await IngresoVentasTotales.findByPk(id, {
      include: [
        {
          model: Mes,
          as: 'mes',
          attributes: ['id_mes', 'numero', 'periodo', 'fk_gestion_mes'],
        },
      ],
    });
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener el registro' });
  }
};

export const deleteIngVentTol = async (req, res) => {
  try {
    const { id } = req.params;
    const n = await IngresoVentasTotales.destroy({ where: { id } });
    if (n === 0) return res.status(404).json({ message: 'No encontrado' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};
