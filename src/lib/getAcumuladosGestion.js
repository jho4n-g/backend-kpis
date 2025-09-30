import { fn, col } from 'sequelize';

export async function getAcumuladosGestion(label) {
  const [startYearStr] = label.split('-');
  const startYear = parseInt(startYearStr, 10);
  const startDate = `${startYear}-04-01`;
  const endDate = `${startYear + 1}-03-31`;

  const [row] = await IngresoVentasTotales.findAll({
    attributes: [
      [fn('sum', col('venMenCer')), 'sumVenMenCer'],
      [fn('sum', col('ventMenOtrIng')), 'sumVenMenOtros'],
      [fn('sum', col('otrIngr')), 'sumOtrosIngresos'],
    ],
    where: { periodo: { [Op.between]: [startDate, endDate] } },
    raw: true,
  });

  return row;
}
