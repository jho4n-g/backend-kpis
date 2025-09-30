import { User } from './User.js';
import { Person } from './Person.js';
import { Rol } from './Rol.js';
import { Permisos } from './Permisos.js';
import { Seccion } from './Seccion.js';
import { Area } from './Area.js';
import { Utilidades } from './Utilidades.js';

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

export { User, Person, Rol, Permisos, Seccion, Area, Utilidades };
