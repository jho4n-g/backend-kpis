import { sequelize } from '../config/database.js';

import { User } from './User.js';
import { Person } from './Person.js';
import { Rol } from './Rol.js';
import { Permisos } from './Permisos.js';
import { Seccion } from './Seccion.js';
import { Area } from './Area.js';
import { Utilidades } from './Utilidades.js';
import { Gestion } from './gestion.js';
import { Mes } from './mes.js';
import { IngresoVentasTotales } from './IngresoVentasTotales.js';
import { VentasTotales } from './ventasTotales.js';
import { PrecioUnitario } from './precioUnitario.js';
import { Produccion } from './produccion.js';
import { Calidad } from './calidad.js';

//review
import { Disponibilidad } from './disponibilidaLinea.js';
import { ReciboItem } from './GeneracionResiduoSolidos/ReciboItem.js';
import { Producto } from './GeneracionResiduoSolidos/producto.js';
import { Recibo } from './GeneracionResiduoSolidos/recibo.js';
import { GeneracionResiduosSolidos } from './generacionResiduosSolidos.js';
import { IndicePolvoAtomizado } from './indicePolvoAtomizado.js';

// 🔹 Relación User ↔ Person (1:1)
User.hasOne(Person, { foreignKey: 'fk_user_person', as: 'person' });
Person.belongsTo(User, { foreignKey: 'fk_user_person', as: 'user' });

// 🔹 Relación Rol ↔ Person (1:N)
Rol.hasMany(Person, { foreignKey: 'fk_rol_person', as: 'persons' });
Person.belongsTo(Rol, { foreignKey: 'fk_rol_person', as: 'rol' });

// 🔹 Relación Permisos ↔ Rol (1:N)
Permisos.hasMany(Rol, { foreignKey: 'fk_permisos_rol', as: 'roles' });
Rol.belongsTo(Permisos, { foreignKey: 'fk_permisos_rol', as: 'permisos' });

// 🔹 Relación Seccion ↔ Person (1:N)
Seccion.hasMany(Person, { foreignKey: 'fk_seccion_person', as: 'persons' });
Person.belongsTo(Seccion, { foreignKey: 'fk_seccion_person', as: 'seccion' });

// 🔹 Relación Area ↔ Seccion (1:N)
Area.hasMany(Seccion, { foreignKey: 'fk_area', as: 'secciones' });
Seccion.belongsTo(Area, { foreignKey: 'fk_area', as: 'area' });

// --- Gestion ↔ Mes (1:N)  (USA alias únicos)
Gestion.hasMany(Mes, {
  as: 'mesesGestion',
  foreignKey: 'fk_gestion_mes',
  sourceKey: 'id_gestion',
  onDelete: 'CASCADE',
});
Mes.belongsTo(Gestion, {
  as: 'gestion',
  foreignKey: 'fk_gestion_mes',
  targetKey: 'id_gestion',
});

Mes.hasOne(IngresoVentasTotales, {
  as: 'ingresoVentas',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

IngresoVentasTotales.belongsTo(Mes, {
  as: 'mes',
  foreignKey: 'mes_id',
});

//ventas_totales
Mes.hasOne(VentasTotales, {
  as: 'ventasTotalesMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

VentasTotales.belongsTo(Mes, {
  as: 'mesVentasTotales',
  foreignKey: 'mes_id',
});

Mes.hasOne(PrecioUnitario, {
  as: 'precioUnitarioMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

PrecioUnitario.belongsTo(Mes, {
  as: 'mesPrecioUnitarios',
  foreignKey: 'mes_id',
});

Mes.hasOne(Produccion, {
  as: 'produccionMes',
  foreignKey: 'mes_id',
  onDelete: 'CACADE',
});
Produccion.belongsTo(Mes, {
  as: 'mesProduccion',
  foreignKey: 'mes_id',
});

Mes.hasOne(Calidad, {
  as: 'calidadMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

Calidad.belongsTo(Mes, {
  as: 'mesCalidad',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});
Mes.hasOne(Disponibilidad, {
  as: 'disponibilidadMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});
Disponibilidad.belongsTo(Mes, {
  as: 'mesDisponibilidad',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});
//reviw
// 1:N  Recibo -> ReciboItem
Recibo.hasMany(ReciboItem, {
  as: 'items',
  foreignKey: 'recibo_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ReciboItem.belongsTo(Recibo, { as: 'recibo', foreignKey: 'recibo_id' });

// 1:N  Producto -> ReciboItem
Producto.hasMany(ReciboItem, {
  as: 'detalles',
  foreignKey: 'producto_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ReciboItem.belongsTo(Producto, { as: 'producto', foreignKey: 'producto_id' });

//sh

Mes.hasOne(GeneracionResiduosSolidos, {
  as: 'generacionResiduosSolidosMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});
GeneracionResiduosSolidos.belongsTo(Mes, {
  as: 'mesGeneracionResiduosSolidos',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

Mes.hasOne(IndicePolvoAtomizado, {
  as: 'indicePolvoAtomizadoMes',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

IndicePolvoAtomizado.belongsTo(Mes, {
  as: 'mesIndicePolvoAtomizado',
  foreignKey: 'mes_id',
  onDelete: 'CASCADE',
});

export {
  sequelize,
  User,
  Person,
  Rol,
  Permisos,
  Seccion,
  Area,
  Utilidades,
  IngresoVentasTotales,
  Gestion,
  Mes,
  VentasTotales,
  PrecioUnitario,
  Produccion,
  Calidad,
  Disponibilidad,
  GeneracionResiduosSolidos,
  IndicePolvoAtomizado,
  Producto,
  Recibo,
  ReciboItem,
};
