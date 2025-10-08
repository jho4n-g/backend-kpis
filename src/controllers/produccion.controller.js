import { sequelize } from '../config/database.js';
import { QueryTypes, Op } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { VentasTotales } from '../models/ventasTotales.js';
import { Mes } from '../models/mes.js';
import { Produccion } from '../models/produccion.js';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const safeDiv = (a, b) => {
  const x = toNum(a, 0);
  const y = toNum(b, 0);
  return y === 0 ? 0 : x / y;
};

// export const createObj = async (req, res) => {
//   const items = req.body;

//   try {
//     const created = await sequelize.transaction(async (t) => {
//       // 1) Gestión vigente
//       const gestion = await Gestion.findOne({
//         where: { is_archived: false },
//         order: [['startYear', 'DESC']],
//         transaction: t,
//       });
//       if (!gestion) throw new Error('No hay gestión vigente');

//       // 2) Primer mes libre de la gestión (sin LEFT JOIN; lock seguro)
//       const row = await sequelize.query(
//         `
//             SELECT m.id_mes, m.numero, m.periodo
//             FROM mes m
//             WHERE m.fk_gestion_mes = :gid
//               AND NOT EXISTS (
//                 SELECT 1
//                 FROM produccion ivt
//                 WHERE ivt.mes_id = m.id_mes
//               )
//             ORDER BY m.numero
//             FOR UPDATE SKIP LOCKED
//             LIMIT 1;
//             `,
//         {
//           type: QueryTypes.SELECT,
//           transaction: t,
//           replacements: { gid: gestion.id_gestion },
//         }
//       );
//       if (row.length === 0) {
//         throw new Error(`La gestión ${gestion.label} ya está completa`);
//       }
//       const { id_mes: mesId, periodo } = row[0];

//       // 3) Sumas de MESES anteriores (¡mensuales, no acumuladas!)
//       const filtroGestion = {
//         include: [
//           {
//             model: Mes,
//             as: 'mesProduccion',
//             attributes: [],
//             where: { fk_gestion_mes: gestion.id_gestion },
//           },
//         ],
//         transaction: t,
//       };

//       // OJO: Sumamos las columnas MENSUALES (atributos del modelo):
//       const [sumProducAcu, sumMetaAcuPresu] = await Promise.all([
//         Produccion.sum('producAcu', filtroGestion),
//         Produccion.sum('metaAcuPresu', filtroGestion),
//       ]);

//       // 4) Normaliza los valores entrantes
//       const presu = toNum(items.presu);
//       const producMen = toNum(items.producMen);

//       // 5) Calcula los nuevos ACUMULADOS como prefijos
//       const producAcu = toNum(sumProducAcu) + producMen;
//       const metaAcuPresu = toNum(sumMetaAcuPresu) + presu;

//       const difProducAcuvsPresAcu = producAcu - metaAcuPresu;
//       const cumplMen = safeDiv(producMen, presu);

//       const cumpAcuPres = safeDiv(producAcu, metaAcuPresu);

//       // 7) Inserta dentro de la misma transacción
//       const payload = {
//         mes_id: mesId,
//         periodo,
//         presu,
//         producMen,
//         producAcu,
//         metaAcuPresu,
//         difProducAcuvsPresAcu,
//         cumplMen,
//         cumpAcuPres,
//       };

//       const itemSave = await Produccion.create(payload, {
//         transaction: t,
//       });
//       return itemSave;
//     });

//     res.status(201).json(created);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       message: e?.message || 'Error al crear',
//       code: e?.original?.code,
//       detail: e?.original?.detail,
//     });
//   }
// };

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
          AND NOT EXISTS (SELECT 1 FROM produccion p WHERE p.mes_id = m.id_mes)
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
      const prev = await Produccion.findOne({
        include: [
          {
            model: Mes,
            as: 'mesProduccion', // Asegúrate que tu asociación use este alias
            attributes: [],
            where: {
              fk_gestion_mes: gestion.id_gestion,
              numero: { [Op.lt]: numero },
            },
          },
        ],
        order: [[sequelize.col('mesProduccion.numero'), 'DESC']],
        transaction: t,
      });

      // 4) Normaliza los valores entrantes (mensuales)
      const presu = toNum(items.presu);
      const producMen = toNum(items.producMen);

      // 5) Acumulados correctos: (acumulado ANTERIOR) + (MENSUAL actual)
      const prevProducAcu = prev ? toNum(prev.producAcu) : 0;
      const prevMetaAcuPresu = prev ? toNum(prev.metaAcuPresu) : 0;

      const producAcu = prevProducAcu + producMen;
      const metaAcuPresu = prevMetaAcuPresu + presu;

      const difProducAcuvsPresAcu = producAcu - metaAcuPresu;
      const cumplMen = safeDiv(producMen, presu);
      const cumpAcuPres = safeDiv(producAcu, metaAcuPresu);

      // 6) Payload: si hay mes anterior, copia su 'meta'; si no, omite 'meta' (usará default=1)
      const payload = {
        mes_id: mesId,
        periodo,
        presu,
        producMen,
        producAcu,
        metaAcuPresu,
        difProducAcuvsPresAcu,
        cumplMen,
        cumpAcuPres,
        ...(prev?.meta != null ? { meta: toNum(prev.meta) } : {}), // <- clave
      };

      const itemSave = await Produccion.create(payload, { transaction: t });
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
                model: Produccion,
                as: 'produccionMes', // alias definido en Mes.hasOne(IngresoVentasTotales)
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
//Update
// async function recomputeGestionFromMonth(gestionId, startNumero, t) {
//   const rows = await Produccion.findAll({
//     include: [
//       {
//         model: Mes,
//         as: 'mesProduccion',
//         required: true, // INNER JOIN
//         attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
//         where: { fk_gestion_mes: gestionId },
//       },
//     ],
//     order: [[{ model: Mes, as: 'mesProduccion' }, 'numero', 'ASC']],
//     transaction: t,
//   });

//   // 1) Prefijos hasta el mes anterior a startNumero
//   let ProducAcu = 0;
//   let MetaAcuPresu = 0;

//   for (const r of rows) {
//     const n = toNum(r.mesProduccion?.numero);
//     if (n >= startNumero) break;
//     ProducAcu += toNum(r.producAcu);
//     MetaAcuPresu += toNum(r.metaAcuPresu);
//   }

//   // 2) Recalcular desde startNumero hacia adelante
//   for (const r of rows) {
//     const n = toNum(r.mesProduccion?.numero);
//     if (n < startNumero) continue;

//     const presu = toNum(r.presu);
//     const producMen = toNum(r.producMen);

//     ProducAcu += producMen;producMen
//     MetaAcuPresu += presu;

//     const difProducAcuvsPresAcu = ProducAcu - MetaAcuPresu;
//     const cumplMen = safeDiv(producMen, presu);

//     const cumpAcuPres = safeDiv(ProducAcu, MetaAcuPresu);

//     await r.update(
//       {
//         producAcu: ProducAcu,
//         metaAcuPresu: MetaAcuPresu,
//         difProducAcuvsPresAcu,
//         cumplMen,
//         cumpAcuPres,
//       },
//       { transaction: t }
//     );
//   }
// }

async function recomputeGestionFromMonth(gestionId, startNumero, t) {
  // 1) Trae el último registro anterior (prefijo) y lo BLOQUEA
  const prev = await Produccion.findOne({
    include: [
      {
        model: Mes,
        as: 'mesProduccion',
        attributes: [],
        where: { fk_gestion_mes: gestionId, numero: { [Op.lt]: startNumero } },
      },
    ],
    order: [[sequelize.col('mesProduccion.numero'), 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE, // bloquea la fila previa usada como base
  });

  // 2) Filas a actualizar (desde startNumero en adelante), BLOQUEADAS y ordenadas
  const toUpdate = await Produccion.findAll({
    include: [
      {
        model: Mes,
        as: 'mesProduccion',
        attributes: ['numero'],
        where: { fk_gestion_mes: gestionId, numero: { [Op.gte]: startNumero } },
        required: true,
      },
    ],
    order: [[{ model: Mes, as: 'mesProduccion' }, 'numero', 'ASC']],
    transaction: t,
    lock: t.LOCK.UPDATE, // evita carreras con otras transacciones
  });

  // 3) Prefijo correcto: toma el acumulado del mes anterior (o 0 si no hay)
  let ProducAcu = prev ? toNum(prev.producAcu) : 0;
  let MetaAcuPresu = prev ? toNum(prev.metaAcuPresu) : 0;

  // 4) Recalcular en orden
  for (const r of toUpdate) {
    const presu = toNum(r.presu); // mensual
    const producMen = toNum(r.producMen); // mensual

    ProducAcu += producMen; // ← correcto
    MetaAcuPresu += presu; // ← correcto

    const difProducAcuvsPresAcu = ProducAcu - MetaAcuPresu;
    const cumplMen = safeDiv(producMen, presu); // mensual
    const cumpAcuPres = safeDiv(ProducAcu, MetaAcuPresu); // acumulado

    await r.update(
      {
        producAcu: ProducAcu,
        metaAcuPresu: MetaAcuPresu,
        difProducAcuvsPresAcu,
        cumplMen,
        cumpAcuPres,
      },
      { transaction: t }
    );
  }
}

export const updateObj = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      // (1) Bloquear SOLO la fila a editar
      const current = await Produccion.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!current) return { notFound: true };

      // (2) Mes asociado
      const mesRow = await Mes.findByPk(current.mes_id, {
        transaction: t,
        attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
      });
      if (!mesRow) throw new Error('Mes no encontrado para el registro');

      const gestionId = mesRow.fk_gestion_mes;
      const startNumero = mesRow.numero;

      // (3) Normalizar entradas (o conservar las actuales)
      const presu = toNum(body.presu, current.presu);
      const producMen = toNum(body.producMen, current.producMen);

      // (4) Actualizar SOLO mensuales
      await current.update({ presu, producMen }, { transaction: t });

      // (5) Recalcular derivados desde este mes
      await recomputeGestionFromMonth(gestionId, startNumero, t);

      // (6) Devolver fresco
      const fresh = await Produccion.findByPk(id, {
        transaction: t,
        include: [
          {
            model: Mes,
            as: 'mesProduccion',
            attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
            required: true,
          },
        ],
      });

      return { fresh };
    });

    if (result?.notFound)
      return res.status(404).json({ message: 'No encontrado' });
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

// export const updateObjVentas = async (req, res) => {
//   const { id } = req.params;
//   const body = req.body; // { PresMen, VentMen }

//   try {
//     const result = await sequelize.transaction(async (t) => {
//       // 1) Bloquear SOLO la fila a editar
//       const current = await Produccion.findByPk(id, {
//         transaction: t,
//         lock: { level: t.LOCK.UPDATE, of: Produccion },
//       });
//       if (!current) return { notFound: true };

//       // 2) Traer el mes asociado (sin LEFT ni FOR UPDATE sobre el join)
//       const mesRow = await Mes.findByPk(current.mes_id, {
//         transaction: t,
//         attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
//       });
//       if (!mesRow) throw new Error('Mes no encontrado para el registro');

//       const gestionId = mesRow.fk_gestion_mes;
//       const startNumero = mesRow.numero;

//       // 3) Normalizar entradas (si no llegan, mantener lo actual)
//       const presu = toNum(body.presu, current.presu);
//       const producMen = toNum(body.producMen, current.producMen);

//       // 4) Actualizar sólo los valores mensuales
//       await current.update({ presu, producMen }, { transaction: t });

//       // 5) Recalcular acumulados/derivados desde este mes
//       await recomputeGestionFromMonth(gestionId, startNumero, t);

//       // 6) Devolver el registro fresco con su Mes (con el alias correcto)
//       const fresh = await Produccion.findByPk(id, {
//         transaction: t,
//         include: [
//           {
//             model: Mes,
//             as: 'mesProduccion',
//             attributes: ['id_mes', 'numero', 'fk_gestion_mes', 'periodo'],
//             required: true,
//           },
//         ],
//       });

//       return { fresh };
//     });

//     if (result?.notFound) {
//       return res.status(404).json({ message: 'No encontrado' });
//     }

//     res.json(result.fresh);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       message: e?.message || 'Error al actualizar',
//       code: e?.original?.code,
//       detail: e?.original?.detail,
//       stack: process.env.NODE_ENV === 'production' ? undefined : e?.stack,
//     });
//   }
// };

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
                FROM produccion ivt
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
  const { meta } = req.body ?? {};
  try {
    // Validación y normalización
    const val = Number(meta);
    if (!Number.isFinite(val) || val < 0 || val > 1) {
      return res
        .status(400)
        .json({ error: 'meta inválida (use fracción 0–1)' });
    }
    const metaStr = val.toFixed(4); // ajusta a la precisión de tu columna

    // Obtener gestión vigente (una sola)
    const gestion = await Gestion.findOne({
      where: { is_archived: false },
      order: [['startYear', 'DESC']],
    });
    if (!gestion) {
      return res.status(404).json({ error: 'No hay gestión vigente' });
    }

    // Transacción opcional (recomendado)
    const result = await sequelize.transaction(async (t) => {
      const [_, info] = await sequelize.query(
        `
        UPDATE produccion pu
           SET meta = :m,
               updated_at = NOW()
        FROM mes m
        WHERE pu.mes_id = m.id_mes
          AND m.fk_gestion_mes = :gid              -- ← solo la gestión vigente
          AND pu.meta IS DISTINCT FROM :m
        `,
        {
          type: QueryTypes.UPDATE,
          transaction: t,
          replacements: { m: metaStr, gid: gestion.id_gestion },
        }
      );

      const affected = info?.rowCount ?? 0;
      return { affected };
    });

    return res.status(200).json({
      ok: true,
      meta: metaStr,
      affected: result.affected,
      message: result.affected
        ? `Meta actualizada en ${result.affected} registro(s) de ${gestion.label}`
        : `Sin cambios: los registros de ${gestion.label} ya tenían esa meta`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error aplicando meta' });
  }
};
