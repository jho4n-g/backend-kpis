import IngresoVentasTotales from '../models/IngresoVentasTotales.js';

export const createIngVentTol = (req, res) => {
  const {
    periodo,
    VentMenOtrIng,
    venMenCer,
    otrIngr,
    venAcuOtros,
    venAcuCer,
    acuPres,
    diffVe_OtrosvsPres,
    diffVen_CervsPres,
    meta,
    cumplOtrosIngrAcuvsAcumPres,
    gestion,
  } = req.body;
};
