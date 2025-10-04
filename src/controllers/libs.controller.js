import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { Gestion } from '../models/gestion.js';

export const ObtenerPeriodo = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });

      if (!gestion) throw new Error('No hay gestión vigente');
      // Antes de ejecutar la query, verifica:

      // 2) Buscar mes libre
      const row = await sequelize.query(
        `
          SELECT m.id_mes, m.numero, m.periodo
          FROM mes m
          LEFT JOIN ingreso_ventas_totales ivt ON ivt.mes_id = m.id_mes
          WHERE m.fk_gestion_mes = :gid
            AND ivt.id IS NULL
          ORDER BY m.numero
          FOR UPDATE OF m SKIP LOCKED
          LIMIT 1;
        `,
        {
          type: QueryTypes.SELECT,
          transaction: t,
          replacements: { gid: gestion.id_gestion },
        }
      );
      return { row, gestion };
    });

    if (!result.row) {
      return res.status(404).json({ message: 'No hay gestión vigente' });
    }
    const date = {
      periodo: result.row[0].periodo,
      NameGestion: result.gestion.label,
    };

    return res.status(200).json(date);
  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ message: e.message });
  }
};

export const ObtenerPeriodoIngreVent = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const gestion = await Gestion.findOne({
        where: { is_archived: false },
        order: [['startYear', 'DESC']],
        transaction: t,
      });

      if (!gestion) throw new Error('No hay gestión vigente');
      // Antes de ejecutar la query, verifica:

      // 2) Buscar mes libre
      const row = await sequelize.query(
        `
            SELECT m.id_mes, m.numero, m.periodo
            FROM mes m
            WHERE m.fk_gestion_mes = :gid
              AND NOT EXISTS (
                SELECT 1
                FROM ventas_totales ivt
                WHERE ivt.mes_id = m.id_mes
              )
            ORDER BY m.numero
            FOR UPDATE SKIP LOCKED
            LIMIT 1;
            `,
        {
          type: QueryTypes.SELECT,
          transaction: t,
          replacements: { gid: gestion.id_gestion },
        }
      );

      return { row, gestion };
    });

    if (!result.row) {
      return res.status(404).json({ message: 'No hay gestión vigente' });
    }
    const date = {
      periodo: result.row[0].periodo,
    };

    return res.status(200).json(date);
  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ message: e.message });
  }
};
