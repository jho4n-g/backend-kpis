import { Router } from 'express';
import {
  createIngVentTol,
  getAllIngrVentTot,
  updateIngVentTol,
} from '../controllers/IngresoVentasTotales.controller.js';

const router = Router();

router.post('/', createIngVentTol);
router.get('/', getAllIngrVentTot);
router.put('/:id', updateIngVentTol);

export default router;
