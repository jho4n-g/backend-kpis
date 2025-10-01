import { getGestionFromPeriodo } from '../lib/getGestionFromPeriodo.js';

export const createIngVentTol = async (req, res) => {
  try {
    const items = req.body;

    // Validar que exista body
    if (!items) {
      return res.status(400).json({ message: 'No se recibieron datos' });
    }

    const data = getGestionFromPeriodo(items.periodo);
    const fecha = new Date();
    const timestamp = getGestionFromPeriodo(fecha);
    //const año = fecha.getFullYear(); // 2024
    //const mes = fecha.getMonth() + 1; // 1-12 (getMonth() devuelve 0-11)

    // Responder al cliente
    res.status(200).json({
      message: 'Datos recibidos correctamente',
      data: data,
      Items: items,
      timestamp: timestamp,
    });
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ message: e.message });
  }
};
