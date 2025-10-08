import { Router } from 'express';
import {
  createObj,
  listobj,
  ObtenerPeriodoCalidad,
  cambiarMetaCalidad,
  updateObj,
} from '../controllers/calidad.controller.js';

const router = Router();

router.post('/', createObj);
router.get('/', listobj);
router.put('/:id', updateObj);
router.patch('/cambiar-meta', cambiarMetaCalidad);
router.get('/periodo', ObtenerPeriodoCalidad);

export default router;
