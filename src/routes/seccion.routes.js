import { Router } from 'express';
import {
  getAllSecciones,
  getSeccion,
  createSeccion,
  updateSeccion,
  deleteSeccion,
} from '../controllers/seccion.controller.js';

const router = Router();

router.get('/', getAllSecciones);
router.get('/:id', getSeccion);
router.post('/', createSeccion);
router.put('/:id', updateSeccion);
router.delete('/:id', deleteSeccion);

export default router;
