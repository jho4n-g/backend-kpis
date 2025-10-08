import { sequelize } from '../config/database.js';
import { QueryTypes, Op } from 'sequelize';
import { Gestion } from '../models/gestion.js';
import { Calidad } from '../models/calidad.js';
import { Mes } from '../models/mes.js';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const safeDiv = (a, b) => {
  const x = toNum(a, 0);
  const y = toNum(b, 0);
  return y === 0 ? 0 : x / y;
};

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
                model: Calidad,
                as: 'calidadMes', // alias definido en Mes.hasOne(IngresoVentasTotales)
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
//revisado
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
          AND NOT EXISTS (SELECT 1 FROM calidad p WHERE p.mes_id = m.id_mes)
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
      const prev = await Calidad.findOne({
        include: [
          {
            model: Mes,
            as: 'mesCalidad', // Asegúrate que tu asociación use este alias
            attributes: [],
            where: {
              fk_gestion_mes: gestion.id_gestion,
              numero: { [Op.lt]: numero },
            },
          },
        ],
        order: [[sequelize.col('mesCalidad.numero'), 'DESC']],
        transaction: t,
      });

      // 4) Normaliza los valores entrantes (mensuales)
      const produccionMensual = toNum(items.produccionMensual);
      const presupusto = toNum(items.presupusto);
      const produccionPrimeraMensual = toNum(items.produccionPrimeraMensual);
      const produccionSegundaMensual = toNum(items.produccionSegundaMensual);
      const produccionTerceraMensual = toNum(items.produccionTerceraMensual);
      const produccionCascoteMensual = toNum(items.produccionCascoteMensual);

      const primeraCalidad = safeDiv(
        produccionPrimeraMensual,
        produccionMensual
      );
      const segundaCalidad = safeDiv(
        produccionSegundaMensual,
        produccionMensual
      );
      const terceraCalidad = safeDiv(
        produccionTerceraMensual,
        produccionMensual
      );
      const cascote = safeDiv(produccionCascoteMensual, produccionMensual);
      //console.log(cascote, '=', produccionCasMen, ' /', producMen);

      const prevProduccionAcumulada = prev
        ? toNum(prev.produccionAcumulada)
        : 0;
      const prevPrimeraCalidadAcumulada = prev
        ? toNum(prev.primeraCalidadAcumulada)
        : 0;
      const prevCascoteCalidadAcumulado = prev
        ? toNum(prev.cascoteCalidadAcumulado)
        : 0;

      const produccionAcumulada = prevProduccionAcumulada + produccionMensual;

      const primeraCalidadAcumulada =
        prevPrimeraCalidadAcumulada + produccionPrimeraMensual;

      const cascoteCalidadAcumulado =
        prevCascoteCalidadAcumulado + produccionCascoteMensual;

      const primeraAcumulada = safeDiv(
        primeraCalidadAcumulada,
        produccionAcumulada
      );
      const cascoteAcumulado = safeDiv(
        cascoteCalidadAcumulado,
        produccionAcumulada
      );

      //console.log(cascoCaliAcu, ' ', cascoAcu, ' ', producAcu);

      // 5) Acumulados correctos: (acumulado ANTERIOR) + (MENSUAL actual

      // 6) Payload: si hay mes anterior, copia su 'meta'; si no, omite 'meta' (usará default=1)
      const payload = {
        mes_id: mesId,
        periodo,
        produccionMensual,
        presupusto,
        produccionPrimeraMensual,
        produccionSegundaMensual,
        produccionTerceraMensual,
        produccionCascoteMensual,
        primeraCalidad,
        segundaCalidad,
        terceraCalidad,
        cascote,
        produccionAcumulada,
        primeraCalidadAcumulada,
        cascoteCalidadAcumulado,
        primeraAcumulada,
        cascoteAcumulado,

        ...(prev?.metaPrimera != null
          ? { metaPrimera: toNum(prev.metaPrimera) }
          : {}),
        ...(prev?.metaCascote != null
          ? { metaCascote: toNum(prev.metaCascote) }
          : {}),
      };

      const itemSave = await Calidad.create(payload, { transaction: t });
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

//as
async function recomputeGestionFromMonthCalidad(gestionId, startNumero, t) {
  // 1) Trae el último registro anterior (prefijo) y lo BLOQUEA
  const prev = await Calidad.findOne({
    include: [
      {
        model: Mes,
        as: 'mesCalidad',
        attributes: [],
        where: { fk_gestion_mes: gestionId, numero: { [Op.lt]: startNumero } },
      },
    ],
    order: [[sequelize.col('mesCalidad.numero'), 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  // 2) Filas desde el mes modificado hacia adelante
  const toUpdate = await Calidad.findAll({
    include: [
      {
        model: Mes,
        as: 'mesCalidad',
        attributes: ['numero'],
        where: { fk_gestion_mes: gestionId, numero: { [Op.gte]: startNumero } },
        required: true,
      },
    ],
    order: [[{ model: Mes, as: 'mesCalidad' }, 'numero', 'ASC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  // 3) Prefijo: acumulados del mes anterior
  let prevProduccionAcumulada = prev ? toNum(prev.produccionAcumulada) : 0;
  let prevPrimeraCalidadAcumulada = prev
    ? toNum(prev.primeraCalidadAcumulada)
    : 0;
  let prevCascoteCalidadAcumulado = prev
    ? toNum(prev.cascoteCalidadAcumulado)
    : 0;

  // 4) Recalcular en orden
  for (const r of toUpdate) {
    const produccionMensual = toNum(r.produccionMensual);
    const produccionPrimeraMensual = toNum(r.produccionPrimeraMensual);
    const produccionSegundaMensual = toNum(r.produccionSegundaMensual);
    const produccionTerceraMensual = toNum(r.produccionTerceraMensual);
    const produccionCascoteMensual = toNum(r.produccionCascoteMensual);

    // --- NUEVAS VARIABLES: los acumulados reales ---
    const produccionAcumulada = prevProduccionAcumulada + produccionMensual;
    const primeraCalidadAcumulada =
      prevPrimeraCalidadAcumulada + produccionPrimeraMensual;
    const cascoteCalidadAcumulado =
      prevCascoteCalidadAcumulado + produccionCascoteMensual;

    // --- Ratios mensuales ---
    const primeraCalidad = safeDiv(produccionPrimeraMensual, produccionMensual);
    const segundaCalidad = safeDiv(produccionSegundaMensual, produccionMensual);
    const terceraCalidad = safeDiv(produccionTerceraMensual, produccionMensual);
    const cascote = safeDiv(produccionCascoteMensual, produccionMensual);

    // --- Ratios acumulados ---
    const primeraAcumulada = safeDiv(
      primeraCalidadAcumulada,
      produccionAcumulada
    );
    const cascoteAcumulado = safeDiv(
      cascoteCalidadAcumulado,
      produccionAcumulada
    );

    // --- Actualizar registro ---
    await r.update(
      {
        produccionAcumulada,
        primeraCalidadAcumulada,
        cascoteCalidadAcumulado,
        primeraCalidad,
        segundaCalidad,
        terceraCalidad,
        cascote,
        primeraAcumulada,
        cascoteAcumulado,
      },
      { transaction: t }
    );

    // --- Actualizar prefijos para el siguiente loop ---
    prevProduccionAcumulada = produccionAcumulada;
    prevPrimeraCalidadAcumulada = primeraCalidadAcumulada;
    prevCascoteCalidadAcumulado = cascoteCalidadAcumulado;
  }
}

// ---------------------------------------------------------------------------

export const updateObj = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Bloquear la fila actual
      const current = await Calidad.findByPk(id, {
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

      const gestionId = mesRow.fk_gestion_mes;
      const startNumero = mesRow.numero;

      // 3) Normalizar entradas (o conservar existentes)
      const produccionMensual = toNum(
        body.produccionMensual ?? current.produccionMensual
      );
      const presupusto = toNum(body.presupusto ?? current.presupusto);
      const produccionPrimeraMensual = toNum(
        body.produccionPrimeraMensual ?? current.produccionPrimeraMensual
      );
      const produccionSegundaMensual = toNum(
        body.produccionSegundaMensual ?? current.produccionSegundaMensual
      );
      const produccionTerceraMensual = toNum(
        body.produccionTerceraMensual ?? current.produccionTerceraMensual
      );
      const produccionCascoteMensual = toNum(
        body.produccionCascoteMensual ?? current.produccionCascoteMensual
      );

      // 4) Actualizar los valores mensuales
      await current.update(
        {
          produccionMensual,
          presupusto,
          produccionPrimeraMensual,
          produccionSegundaMensual,
          produccionTerceraMensual,
          produccionCascoteMensual,
        },
        { transaction: t }
      );

      // 5) Recalcular acumulados desde este mes
      await recomputeGestionFromMonthCalidad(gestionId, startNumero, t);

      // 6) Devolver registro actualizado (fresco)
      const fresh = await Calidad.findByPk(id, {
        transaction: t,
        include: [
          {
            model: Mes,
            as: 'mesCalidad',
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
    console.error('❌ Error en updateObj Calidad:', e);
    res.status(500).json({
      message: e?.message || 'Error al actualizar',
      code: e?.original?.code,
      detail: e?.original?.detail,
      stack: process.env.NODE_ENV === 'production' ? undefined : e?.stack,
    });
  }
};

// ============================
// 1. Obtener periodo disponible
// ============================
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
            FROM calidad c
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

// ============================
// 2. Cambiar meta general
// ============================
export const cambiarMetaCalidad = async (req, res) => {
  const { metaPrimera, metaCascote } = req.body ?? {};

  try {
    // Validar ambas metas si existen
    const metaPrimeVal = metaPrimera != null ? Number(metaPrimera) : null;
    const metaCascoVal = metaCascote != null ? Number(metaCascote) : null;

    if (
      (metaPrimeVal != null &&
        (!Number.isFinite(metaPrimeVal) ||
          metaPrimeVal < 0 ||
          metaPrimeVal > 1)) ||
      (metaCascoVal != null &&
        (!Number.isFinite(metaCascoVal) ||
          metaCascoVal < 0 ||
          metaCascoVal > 1))
    ) {
      return res.status(400).json({
        error: 'meta inválida (valores permitidos entre 0 y 1)',
      });
    }

    const metaPrimeStr = metaPrimeVal?.toFixed(4);
    const metaCascoStr = metaCascoVal?.toFixed(4);

    // Gestión vigente
    const gestion = await Gestion.findOne({
      where: { is_archived: false },
      order: [['startYear', 'DESC']],
    });

    if (!gestion) {
      return res.status(404).json({ error: 'No hay gestión vigente' });
    }

    //  Transacción: aplica los cambios a todos los meses de la gestión
    const result = await sequelize.transaction(async (t) => {
      const updates = [];

      if (metaPrimeStr != null) {
        const [_, infoPrime] = await sequelize.query(
          `
          UPDATE calidad c
          SET meta_primera = :m, updated_at = NOW()
          FROM mes m
          WHERE c.mes_id = m.id_mes
            AND m.fk_gestion_mes = :gid
            AND c.meta_primera IS DISTINCT FROM :m;
          `,
          {
            type: QueryTypes.UPDATE,
            transaction: t,
            replacements: { m: metaPrimeStr, gid: gestion.id_gestion },
          }
        );
        updates.push({
          tipo: 'metaPrimera',
          afectadas: infoPrime?.rowCount ?? 0,
        });
      }

      if (metaCascoStr != null) {
        const [_, infoCasco] = await sequelize.query(
          `
          UPDATE calidad c
          SET meta_cascote = :m, updated_at = NOW()
          FROM mes m
          WHERE c.mes_id = m.id_mes
            AND m.fk_gestion_mes = :gid
            AND c.meta_cascote IS DISTINCT FROM :m;
          `,
          {
            type: QueryTypes.UPDATE,
            transaction: t,
            replacements: { m: metaCascoStr, gid: gestion.id_gestion },
          }
        );
        updates.push({
          tipo: 'metaCascote',
          afectadas: infoCasco?.rowCount ?? 0,
        });
      }

      return updates;
    });

    // Respuesta final
    const summary = result
      .map((r) =>
        r.afectadas
          ? `${r.tipo} actualizada en ${r.afectadas} registro(s)`
          : `Sin cambios en ${r.tipo}`
      )
      .join('; ');

    return res.status(200).json({
      ok: true,
      metaPrimera: metaPrimeStr,
      metaCascote: metaCascoStr,
      message: summary,
    });
  } catch (err) {
    console.error('❌ Error en cambiarMetaCalidad:', err);
    return res
      .status(500)
      .json({ error: err.message || 'Error al actualizar metas' });
  }
};
