// controllers/recibo.controller.js
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Recibo } from '../../models/GeneracionResiduoSolidos/recibo.js';
import { ReciboItem } from '../../models/GeneracionResiduoSolidos/ReciboItem.js';
import { Producto } from '../../models/GeneracionResiduoSolidos/producto.js';

// helpers
const toNum = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const normalizeHeader = (body) => ({
  nro_recibo: String(body?.nro_recibo ?? '').trim(),
  fecha: String(body?.fecha ?? '').trim(),
  nombre_cliente: String(body?.nombre_cliente ?? '').trim(),
  descripcion: String(body?.descripcion ?? '').trim(),
});
const normalizeItems = (items) =>
  (Array.isArray(items) ? items : []).map((it) => {
    const cantidad = toNum(it?.cantidad);
    const precio_unitario = toNum(it?.precio_unitario);
    const total_linea = +(cantidad * precio_unitario).toFixed(2);
    const unidadMedida = String(it?.unidadMedida ?? '').trim();
    return {
      producto_id: Number(it?.producto_id),
      cantidad,
      precio_unitario,
      unidadMedida,
      total_linea,
    };
  });

export const createRecibo = async (req, res) => {
  try {
    // 1) Validación **antes** de la transacción
    const { nro_recibo, fecha, nombre_cliente, descripcion } = normalizeHeader(
      req.body
    );
    const items = normalizeItems(req.body?.items);
    const errors = [];
    if (!nro_recibo) errors.push('nro_recibo es obligatorio');
    if (!fecha) errors.push('fecha es obligatoria (YYYY-MM-DD)');
    if (!nombre_cliente) errors.push('nombre_cliente es obligatorio');
    if (items.length === 0) errors.push('Debe incluir al menos 1 ítem');
    for (const it of items) {
      if (!it.producto_id)
        errors.push('producto_id es obligatorio en cada ítem');
      if (!it.unidadMedida)
        errors.push('unidadMedida es obligatoria en cada ítem');
      if (it.cantidad <= 0) errors.push('cantidad debe ser > 0');
      if (it.precio_unitario < 0)
        errors.push('precio_unitario no puede ser negativo');
    }
    if (errors.length) {
      return res.status(400).json({ message: 'Validación fallida', errors });
    }

    // Validar productos existentes (fuera o dentro de la transacción; aquí fuera para fallar temprano)
    const productosIds = [...new Set(items.map((i) => i.producto_id))];
    const countProd = await Producto.count({
      where: { id: { [Op.in]: productosIds } },
    });
    if (countProd !== productosIds.length) {
      return res
        .status(400)
        .json({ message: 'Hay producto_id inexistente en los ítems' });
    }

    // 2) Transacción administrada
    const createdId = await sequelize.transaction(async (t) => {
      // crear cabecera
      const total_recibo = +items
        .reduce((acc, it) => acc + it.total_linea, 0)
        .toFixed(2);
      const recibo = await Recibo.create(
        { nro_recibo, fecha, nombre_cliente, total_recibo, descripcion },
        { transaction: t }
      );

      // crear ítems
      for (const it of items) {
        await ReciboItem.create(
          {
            recibo_id: recibo.id,
            producto_id: it.producto_id,
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
            unidadMedida: it.unidadMedida,
            total_linea: it.total_linea,
          },
          { transaction: t }
        );
      }

      return recibo.id; // valor que retorna la transacción
    });

    // 3) Consulta **fuera** de la transacción (ya commit) con include/alias correctos
    const full = await Recibo.findByPk(createdId, {
      include: [
        {
          model: ReciboItem,
          as: 'items',
          include: [
            { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
          ],
        },
      ],
    });

    res.status(201).json(full);
  } catch (error) {
    console.error('createRecibo error:', error);
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'nro_recibo ya existe' });
    }
    res.status(500).json({
      message: 'Error interno del servidor',
      detail: error.message,
    });
  }
};
// -------- Listar todos (con búsqueda opcional por nro_recibo o nombre_cliente) --------
export const getAllRecibos = async (req, res) => {
  try {
    const q = (req.query.q ?? '').trim();
    const where = q
      ? {
          [Op.or]: [
            { nro_recibo: { [Op.iLike]: `%${q}%` } },
            { nombre_cliente: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {};

    const data = await Recibo.findAll({
      where,
      order: [['id', 'DESC']],
      include: [
        {
          model: ReciboItem,
          as: 'items',
          include: [
            { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
          ],
        },
      ],
    });

    res.json(data);
  } catch (error) {
    console.error('getAllRecibos error:', error);
    res
      .status(500)
      .json({ message: 'Error al listar recibos', detail: error.message });
  }
};
//consolidar itms
// (Opcional) si quieres colapsar líneas duplicadas (mismo producto + misma unidad + mismo PU)
// const consolidateItems = (items) => {
//   const map = new Map();
//   for (const it of items) {
//     const key = `${it.producto_id}|${it.unidadMedida}|${it.precio_unitario}`;
//     const prev = map.get(key);
//     if (prev) {
//       const cantidad = prev.cantidad + it.cantidad;
//       map.set(key, {
//         ...prev,
//         cantidad,
//         total_linea: +(cantidad * prev.precio_unitario).toFixed(2),
//       });
//     } else {
//       map.set(key, { ...it });
//     }
//   }
//   return [...map.values()];
// };

// -------- Obtener por ID --------
export const getReciboById = async (req, res) => {
  try {
    // El param puede ser el id (PK) o el nro_recibo
    const raw = String(req.params.id ?? '').trim();

    // Si es un entero válido, lo usamos; si no, ponemos -1 para que no matchee por id
    const maybeId = Number.isInteger(+raw) ? +raw : -1;

    const recibo = await Recibo.findOne({
      where: {
        [Op.or]: [
          { id: maybeId }, // match por PK
          { nro_recibo: raw }, // match exacto por nro_recibo (respeta ceros a la izquierda)
        ],
      },
      include: [
        {
          model: ReciboItem,
          as: 'items',
          include: [
            { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
          ],
        },
      ],
    });

    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    res.json(recibo);
  } catch (error) {
    console.error('getReciboById error:', error);
    res.status(500).json({
      message: 'Error al obtener recibo',
      detail: error.message,
    });
  }
};

// -------- Actualizar recibo + reemplazar items --------
export const updateRecibo = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Validación fuera de la transacción
    const { nro_recibo, fecha, nombre_cliente, descripcion } = normalizeHeader(
      req.body
    );
    let items = normalizeItems(req.body?.items);

    const errors = [];
    if (!nro_recibo) errors.push('nro_recibo es obligatorio');
    if (!fecha) errors.push('fecha es obligatoria (YYYY-MM-DD)');
    if (!nombre_cliente) errors.push('nombre_cliente es obligatorio');
    if (items.length === 0) errors.push('Debe incluir al menos 1 ítem');
    for (const it of items) {
      if (!it.producto_id)
        errors.push('producto_id es obligatorio en cada ítem');
      if (!it.unidadMedida)
        errors.push('unidadMedida es obligatoria en cada ítem');
      if (it.cantidad <= 0) errors.push('cantidad debe ser > 0');
      if (it.precio_unitario < 0)
        errors.push('precio_unitario no puede ser negativo');
    }
    if (errors.length) {
      return res.status(400).json({ message: 'Validación fallida', errors });
    }

    // (Opcional) descomenta si quieres consolidar duplicados
    // items = consolidateItems(items);

    // Validar productos existentes
    const productosIds = [...new Set(items.map((i) => i.producto_id))];
    const countProd = await Producto.count({
      where: { id: { [Op.in]: productosIds } },
    });
    if (countProd !== productosIds.length) {
      return res
        .status(400)
        .json({ message: 'Hay producto_id inexistente en los ítems' });
    }

    // 2) Transacción administrada
    await sequelize.transaction(async (t) => {
      const recibo = await Recibo.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!recibo) {
        throw Object.assign(new Error('Recibo no encontrado'), { status: 404 });
      }

      // Actualizar encabezado (sin tocar total aún)
      await recibo.update(
        { nro_recibo, fecha, nombre_cliente, descripcion },
        { transaction: t }
      );

      // Reemplazar items
      await ReciboItem.destroy({ where: { recibo_id: id }, transaction: t });

      // Inserción masiva de nuevos items
      const itemsToCreate = items.map((it) => ({
        ...it,
        recibo_id: id,
      }));
      await ReciboItem.bulkCreate(itemsToCreate, { transaction: t });

      // Recalcular total
      const nuevoTotal = items.reduce((acc, it) => acc + it.total_linea, 0);
      await recibo.update(
        { total_recibo: +nuevoTotal.toFixed(2) },
        { transaction: t }
      );
    });

    // 3) Consulta final fuera de la transacción
    const updated = await Recibo.findByPk(id, {
      include: [
        {
          model: ReciboItem,
          as: 'items',
          include: [
            { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
          ],
        },
      ],
    });
    if (!updated) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('updateRecibo error:', error);
    if (error?.status === 404) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    if (error?.name === 'SequelizeUniqueConstraintError') {
      // Si vuelve a aparecer, es que la constraint única (recibo_id, producto_id) sigue existiendo en la BD
      return res.status(409).json({
        message: 'Conflicto por constraint única en recibo_item',
        detail: error.message,
      });
    }
    res
      .status(500)
      .json({ message: 'Error al actualizar recibo', detail: error.message });
  }
};

// // -------- Eliminar recibo (y sus items) --------
export const deleteRecibo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const recibo = await Recibo.findByPk(id, { transaction: t });
    if (!recibo) {
      await t.rollback();
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    await ReciboItem.destroy({ where: { recibo_id: id }, transaction: t });
    await recibo.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Recibo eliminado' });
  } catch (error) {
    await t.rollback();
    console.error('deleteRecibo error:', error);
    res
      .status(500)
      .json({ message: 'Error al eliminar recibo', detail: error.message });
  }
};

// ---- GET /api/recibos/tabla  -----------------------------------------------
// Parámetros opcionales:
//   ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD   (rango de fecha de la cabecera)
//   ?q=texto                             (busca en nro_recibo, cliente o producto)
//   ?orden=fechaAsc|fechaDesc            (por defecto fechaAsc)
export const getTablaListado = async (req, res) => {
  try {
    const { desde, hasta, q = '', orden = 'fechaAsc' } = req.query;

    const where = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    // Búsqueda: nro_recibo / cliente / producto
    const qTrim = String(q).trim();
    const includeItems = {
      model: ReciboItem,
      as: 'items',
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
      ],
    };

    // Si hay q, usamos where con OR a nivel cabecera o producto (se filtra en memoria si prefieres)
    const recibos = await Recibo.findAll({
      where: {
        ...where,
        ...(qTrim && {
          [Op.or]: [
            { nro_recibo: { [Op.iLike]: `%${qTrim}%` } },
            { nombre_cliente: { [Op.iLike]: `%${qTrim}%` } },
          ],
        }),
      },
      include: [includeItems],
      order: [
        ['fecha', orden === 'fechaDesc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
        [{ model: ReciboItem, as: 'items' }, 'id', 'ASC'],
      ],
    });

    // Aplanar a filas: una por ítem
    let rows = [];
    for (const r of recibos) {
      for (const it of r.items || []) {
        // si hay q por producto, podemos filtrar aquí
        if (qTrim) {
          const prodName = (it.producto?.nombre ?? '').toLowerCase();
          const matchProd = prodName.includes(qTrim.toLowerCase());
          const matchHeader =
            r.nro_recibo?.toLowerCase().includes(qTrim.toLowerCase()) ||
            r.nombre_cliente?.toLowerCase().includes(qTrim.toLowerCase());
          if (!matchProd && !matchHeader) continue;
        }

        const cantidad = toNum(it.cantidad);
        const pu = toNum(it.precio_unitario);
        const total = +(cantidad * pu).toFixed(2);

        rows.push({
          FECHA: r.fecha,
          'No RECIBO': r.nro_recibo,
          DETALLE: it.producto?.nombre ?? '',
          CANTIDAD: cantidad,
          'U.M.': it.unidadMedida,
          'PRECIO UN. (Bs)': pu,
          'TOTAL (Bs)': total,
        });
      }
    }

    res.json({
      headers: [
        'FECHA',
        'No RECIBO',
        'DETALLE',
        'CANTIDAD',
        'U.M.',
        'PRECIO UN. (Bs)',
        'TOTAL (Bs)',
      ],
      rows,
    });
  } catch (error) {
    console.error('getTablaListado error:', error);
    res
      .status(500)
      .json({ message: 'Error al listar tabla', detail: error.message });
  }
};

// ---- GET /api/recibos/:id/tabla  -------------------------------------------
export const getTablaById = async (req, res) => {
  try {
    const { id } = req.params;

    const recibo = await Recibo.findByPk(id, {
      include: [
        {
          model: ReciboItem,
          as: 'items',
          include: [
            { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
          ],
        },
      ],
      order: [
        ['fecha', 'ASC'],
        ['id', 'ASC'],
        [{ model: ReciboItem, as: 'items' }, 'id', 'ASC'],
      ],
    });

    if (!recibo)
      return res.status(404).json({ message: 'Recibo no encontrado' });

    const rows = (recibo.items || []).map((it) => {
      const cantidad = toNum(it.cantidad);
      const pu = toNum(it.precio_unitario);
      const total = +(cantidad * pu).toFixed(2);

      return {
        FECHA: recibo.fecha, // YYYY-MM-DD
        'No RECIBO': recibo.nro_recibo,
        DETALLE: it.producto?.nombre ?? '',
        CANTIDAD: cantidad,
        'U.M.': it.unidadMedida,
        'PRECIO UN. (Bs)': pu,
        'TOTAL (Bs)': total,
      };
    });

    const totalGeneral = rows.reduce((a, r) => a + toNum(r['TOTAL (Bs)']), 0);

    res.json({
      headers: [
        'FECHA',
        'No RECIBO',
        'DETALLE',
        'CANTIDAD',
        'U.M.',
        'PRECIO UN. (Bs)',
        'TOTAL (Bs)',
      ],
      rows,
      resumen: { totalGeneral },
    });
  } catch (error) {
    console.error('getTablaById error:', error);
    res.status(500).json({
      message: 'Error al listar tabla del recibo',
      detail: error.message,
    });
  }
};
