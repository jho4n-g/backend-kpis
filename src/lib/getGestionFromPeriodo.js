import dayjs from 'dayjs';

export function getGestionFromPeriodo(periodo) {
  const d = dayjs(periodo); // admite 'YYYY-MM' o 'YYYY-MM-DD'
  const y = d.year();
  const m = d.month() + 1; // 1..12

  const startYear = m >= 4 ? y : y - 1; // abril o después -> empieza ese año; si no, año anterior
  const endYear = startYear + 1;

  const startDate = dayjs(`${startYear}-04-01`).format('YYYY-MM-DD'); // inclusive
  const endDate = dayjs(`${endYear}-03-31`).format('YYYY-MM-DD'); // inclusive
  const label = `${startYear}-${endYear}`;

  return { startYear, endYear, startDate, endDate, label };
}
