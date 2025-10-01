import { Gestion } from '../models/gestion.js';

export const getAllGestion = async (req, res) => {
  try {
    const data = await Gestion.findAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
