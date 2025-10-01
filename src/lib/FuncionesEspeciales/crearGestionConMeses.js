import dayjs from 'dayjs';
import { sequelize } from '../../config/database.js';
import { Gestion } from '../../models/gestion.js';
import { Mes } from '../../models/mes.js';

export async function crearGestionConMeses(startYear) {
  const endYear = startYear + 1;
  const label = `${startYear}-${endYear}`;

  return sequelize.transaction(async (t) => {
    // Idempotencia: si ya existe, no la recrees
    const exists = await Gestion.findOne({ where: { label }, transaction: t });
    if (exists) return exists;

    const g = await Gestion.create(
      {
        startYear,
        endYear,
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`,
        label,
        is_archived: false,
      },
      { transaction: t }
    );

    const rows = [];
    // abril..diciembre del startYear (mes lógico 1..9)
    for (let m = 4, i = 1; m <= 12; m++, i++) {
      rows.push({
        fk_gestion_mes: g.id_gestion,
        numero: i,
        periodo: `${startYear}-${String(m).padStart(2, '0')}-01`,
      });
    }
    // enero..marzo del endYear (mes lógico 10..12)
    for (let m = 1, i = 10; m <= 3; m++, i++) {
      rows.push({
        fk_gestion_mes: g.id_gestion,
        numero: i,
        periodo: `${endYear}-${String(m).padStart(2, '0')}-01`,
      });
    }
    await Mes.bulkCreate(rows, { transaction: t });

    return g;
  });
}
