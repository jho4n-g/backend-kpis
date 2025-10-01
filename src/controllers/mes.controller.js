import { Mes } from '../models/mes.js';

export const getAllMes = async (req, res) => {
  try {
    const data = await Mes.findAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
