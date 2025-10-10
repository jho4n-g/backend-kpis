// controllers/producto.controller.js
import { Op } from 'sequelize';
import { Producto } from '../../models/GeneracionResiduoSolidos/producto.js';

// GET /productos?q=texto
export const getAllProductos = async (req, res) => {
  try {
    const q = (req.query.q ?? '').trim();

    const where = q
      ? { nombre: { [Op.iLike]: `%${q}%` } } // Postgres (case-insensitive)
      : {};

    const data = await Producto.findAll({
      where,
      order: [['id', 'ASC']],
    });

    res.json(data);
  } catch (error) {
    console.error('getAllProductos error:', error);
    res
      .status(500)
      .json({ message: 'Error al listar productos', detail: error.message });
  }
};

// GET /productos/:id
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await Producto.findByPk(id);
    if (!prod)
      return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(prod);
  } catch (error) {
    console.error('getProductoById error:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener producto', detail: error.message });
  }
};

// POST /productos
export const createProducto = async (req, res) => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();

    const errors = [];
    if (!nombre) errors.push('El nombre es obligatorio');
    if (nombre.length > 120)
      errors.push('El nombre debe tener máximo 120 caracteres');

    if (errors.length)
      return res.status(400).json({ message: 'Validación fallida', errors });

    const nuevo = await Producto.create({ nombre });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('createProducto error:', error);
    res
      .status(500)
      .json({ message: 'Error al crear producto', detail: error.message });
  }
};

// PUT /productos/:id
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await Producto.findByPk(id);
    if (!prod)
      return res.status(404).json({ message: 'Producto no encontrado' });

    const nombre = String(req.body?.nombre ?? '').trim();

    const errors = [];
    if (!nombre) errors.push('El nombre es obligatorio');
    if (nombre.length > 120)
      errors.push('El nombre debe tener máximo 120 caracteres');

    if (errors.length)
      return res.status(400).json({ message: 'Validación fallida', errors });

    prod.nombre = nombre;
    await prod.save();

    res.json(prod);
  } catch (error) {
    console.error('updateProducto error:', error);
    res
      .status(500)
      .json({ message: 'Error al actualizar producto', detail: error.message });
  }
};

// DELETE /productos/:id
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await Producto.findByPk(id);
    if (!prod)
      return res.status(404).json({ message: 'Producto no encontrado' });

    await prod.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('deleteProducto error:', error);
    res
      .status(500)
      .json({ message: 'Error al eliminar producto', detail: error.message });
  }
};
