import { Router } from 'express';
import { ObtenerPeriodo } from '../controllers/libs.controller.js';

const router = Router();

router.get('/', ObtenerPeriodo);

export default router;
