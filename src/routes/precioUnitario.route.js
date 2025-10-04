import { Router } from 'express';
import {
  createObj,
  listobj,
  updateObj,
  ObtenerPeriodo,
  cambiarMetaPU,
} from '../controllers/precioUnitario.controller.js';

const routes = new Router();

// Add routes
routes.post('/', createObj);
routes.get('/', listobj);
routes.put('/:id', updateObj);
routes.get('/periodo', ObtenerPeriodo);
routes.post('/meta', cambiarMetaPU);
// routes.put('/', SessionController.store);
// routes.delete('/', SessionController.store);

export default routes;
