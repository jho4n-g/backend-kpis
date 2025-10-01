import { Router } from 'express';
import { getAllGestion } from '../controllers/gestion.controller.js';

const router = Router();

router.get('/', getAllGestion);

export default router;
