import { DataTypes, TableHints } from 'sequelize';
import { sequelize } from '../config/database.js';

export const IngresoVentasTotales = sequelize.define(
  'ingreso_ventas_totales',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    periodo: { periodo: { type: DataTypes.DATEONLY } },
    PresMen: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'presupuesto_mensual',
    },
    VentMenOtrIng: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'ventas_mensuales_otros_ingresos',
    },
    venMenCer: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'venta_mensual_cerramica',
    },
    otrIngr: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'otros_ingresos',
    },
    venAcuOtros: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'venta_acumulada_otros',
    },
    venAcuCer: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'venta_acumulada_ceramica',
    },
    acuPres: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'acumulado_presupuesto',
    },
    diffVe_OtrosvsPres: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'diferencia_ventas_otros_vs_presupuesto',
    },
    diffVen_CervsPres: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'diferencia_entre_ventas_ceramica_vs_presupuesto',
    },
    meta: { type: DataTypes.DECIMAL(10, 2) },
    cumplMenCeramica: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'cumplimiento_mensual_ceramica',
    },
    cumplOtrosIngrAcuvsAcumPres: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'cumplimiento_mensual_ceramica',
    },
    Gestion: { type: DataTypes.BOOLEAN },
  },
  {
    tableName: 'ingreso_ventas_totales',
    timestamps: true,
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] }, // un registro por mes
      { fields: ['created_at'] },
    ],
  }
);
