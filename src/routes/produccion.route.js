import { Router } from 'express';
import {
  createObj,
  listobjVentas,
  updateObj,
  ObtenerPeriodo,
  cambiarMetaPU,
} from '../controllers/produccion.controller.js';

const router = Router();

router.post('/', createObj);
router.get('/', listobjVentas);
router.put('/:id', updateObj);
router.get('/periodo', ObtenerPeriodo);
router.patch('/cambiar-meta', cambiarMetaPU);
// router.get('/gestion', ObtenerPeriodo);

export default router;
