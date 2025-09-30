import { Utilidades } from '../models/Utilidades.js';

export const getAllUtilities = async (req, res) => {
  try {
    const data = await Utilidades.findAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUtilities = async (req, res) => {
  try {
    const item = await Utilidades.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Utilidad no encontrada' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUtilities = async (req, res) => {
  try {
    const {
      periodo,
      mensualidad_mensual,
      meta_mensual,
      utilidades_acumuladas,
      meta_acumulada,
      meta,
      cumplimento_mensual,
      cumplimiento_acumulado,
    } = req.body;

    const payload = {
      periodo,
      mensualidad_mensual,
      meta_mensual,
      utilidades_acumuladas,
      meta_acumulada,
      cumplimento_mensual,
      cumplimiento_acumulado,
      meta,
    };
    console.log(payload);
    const item = await Utilidades.create(payload);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

export const updateUtilities = async (req, res) => {
  try {
    const item = await Utilidades.findByPk(req.params.id);
    if (!item)
      return res.status(404).json({ message: 'Utiliad no encontrada' });
    const {
      periodo,
      mensualidad_mensual,
      meta_mensual,
      utilidades_acumuladas,
      meta_acumulada,
      meta,
      cumplimento_mensual,
      cumplimiento_acumulado,
    } = await req.body;

    const payload = {
      periodo,
      mensualidad_mensual,
      meta_mensual,
      utilidades_acumuladas,
      meta_acumulada,
      cumplimento_mensual,
      cumplimiento_acumulado,
      meta,
    };

    await item.update(payload);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const deleteUtilities = async (req, res) => {
  try {
    const item = await Utilidades.findByPk(req.params.id);
    if (!item)
      return res.status(404).json({ message: 'Utilidad no encontrado' });
    await item.destroy();
    res.json({ message: 'Utilidad eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
