import { Router } from 'express';
import {
  getAllUtilities,
  getUtilities,
  createUtilities,
  updateUtilities,
  deleteUtilities,
} from '../controllers/utilities.controller.js';

const router = Router();

router.get('/', getAllUtilities);
router.get('/:id', getUtilities);
router.post('/', createUtilities);
router.put('/:id', updateUtilities);
router.delete('/:id', deleteUtilities);

export default router;
