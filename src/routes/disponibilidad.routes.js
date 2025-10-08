import { Router } from 'express';

import {
  listobj,
  createObj,
  updateObj,
  ObtenerPeriodoCalidad,
  cambiarMeta,
} from '../controllers/dispobilidad.controller.js';

const routes = new Router();

// Add routes
routes.get('/', listobj);
routes.get('/periodo', ObtenerPeriodoCalidad);
routes.post('/', createObj);
routes.put('/:id', updateObj);
routes.patch('/', cambiarMeta);

export default routes;
