// routes/recibo.routes.js
import { Router } from 'express';
import {
  getAllRecibos,
  getReciboById,
  createRecibo,
  updateRecibo,
  deleteRecibo,
  getTablaById,
  getTablaListado,
} from '../controllers/generacionResiduos/recibo.controller.js';

const router = Router();

//tabla
router.get('/tabla', getTablaListado);
router.get('/:id/tabla', getTablaById);

router.get('/', getAllRecibos);
router.get('/:id', getReciboById);
router.post('/', createRecibo);
router.put('/:id', updateRecibo);
router.delete('/:id', deleteRecibo);

export default router;
