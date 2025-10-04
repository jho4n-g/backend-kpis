import { Router } from 'express';
import {
  createObj,
  listobjVentas,
  updateObjVentas,
  ObtenerPeriodo,
} from '../controllers/ventasTotales.controller.js';

const router = Router();

router.post('/', createObj);
router.get('/', listobjVentas);
router.put('/:id', updateObjVentas);
router.get('/gestion', ObtenerPeriodo);

export default router;
