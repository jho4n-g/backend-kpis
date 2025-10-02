import { Router } from 'express';
import {
  createObj,
  listobjVentas,
  updateObjVentas,
} from '../controllers/ventasTotales.controller.js';

const router = Router();

router.post('/', createObj);
router.get('/', listobjVentas);
router.put('/:id', updateObjVentas);

export default router;
