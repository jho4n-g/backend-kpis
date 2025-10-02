import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const IngresoVentasTotales = sequelize.define(
  'ingreso_ventas_totales',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mes_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    periodo: { type: DataTypes.DATEONLY },
    PresMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto_mensual',
    },
    VentMenOtrIng: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'ventas_mensuales_otros_ingresos',
    },
    venMenCer: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'venta_mensual_cerramica',
    },
    otrIngr: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'otros_ingresos',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
    venAcuOtros: {
      type: DataTypes.DECIMAL(18, 2),
      field: 'venta_acumulada_otros',
    },
    venAcuCer: {
      type: DataTypes.DECIMAL(18, 2),
      field: 'venta_acumulada_ceramica',
    },
    acuPres: {
      type: DataTypes.DECIMAL(18, 2),
      field: 'acumulado_presupuesto',
    },
    diffVe_OtrosvsPres: {
      type: DataTypes.DECIMAL(18, 4),
      field: 'diferencia_ventas_otros_vs_presupuesto',
    },
    diffVen_CervsPres: {
      type: DataTypes.DECIMAL(18, 4),
      field: 'diferencia_entre_ventas_ceramica_vs_presupuesto',
    },
    cumplMenCeramica: {
      type: DataTypes.DECIMAL(18, 4),
      field: 'cumplimiento_mensual_ceramica',
    },
    cumplOtrosIngrAcuvsAcumPres: {
      type: DataTypes.DECIMAL(18, 4),
      field: 'cumplimiento_otros_ingresos_acumulados_vs_acumulado_presupuesto',
    },
  },
  {
    tableName: 'ingreso_ventas_totales',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] }, // un registro por mes
      { fields: ['created_at'] },
    ],
  }
);
