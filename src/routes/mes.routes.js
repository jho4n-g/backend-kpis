import { Router } from 'express';
import { getAllMes } from '../controllers/mes.controller.js';

const router = Router();

router.get('/', getAllMes);

export default router;
