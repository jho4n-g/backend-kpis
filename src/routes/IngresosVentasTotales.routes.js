import { Router } from 'express';
import { createIngVentTol } from '../controllers/IngresoVentasTotales.controller.js';

const router = Router();

router.post('/', createIngVentTol);

export default router;
