import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const GeneracionResiduosSolidos = sequelize.define(
  'generacion_residuos_solidos',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mes_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'mes', key: 'id_mes' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    periodo: { type: DataTypes.DATEONLY },
    nroTrabajadores: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'nro_trabajadores',
    },
    kgCarton: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_carton',
    },
    pet: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'pet',
    },
    kgSterchfilm: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_strechfilm',
    },
    kgBolsasBigbag: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_bolsas_bigbag',
    },
    kgTurrilesPlasticos: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_turriles_plasticos',
    },
    kgPlasticosColor: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_plasticos_color',
    },
    kgEnvaseMilLts: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_envase_mil_lts',
    },
    sunchuKig: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'sunchu_kg',
    },
    kgMadera: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_madera',
    },
    kgBidonAzul: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_bidon_azul',
    },
    kgAceiteSucio: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_aceite_sucio',
    },
    kgBolsasPlasticasTransparentes: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_bolsas_plasticas_transparentes',
    },
    kgBolsasYute: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'kg_bolsas_yute',
    },
    totalResiduos: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'total_residuos',
    },
    indiceKgSobrePers: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'indice_gk_sobre_pers',
    },
  },
  {
    tableName: 'generacion_residuos_solidos',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
