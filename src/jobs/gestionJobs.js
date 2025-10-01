import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(tz);

import { archivarGestionActiva } from '../lib/FuncionesEspeciales/archivarGestionActiva.js';
import { crearGestionConMeses } from '../lib/FuncionesEspeciales/crearGestionConMeses.js';

const TZ = 'America/La_Paz';

let task = null;

export function startGestionScheduler() {
  if (task) return task; // evita doble inicio

  // Corre todos los días 00:10 (hora La Paz). Si NO es 1 de abril, no hace nada.
  task = cron.schedule(
    '10 0 * * *',
    async () => {
      const now = dayjs().tz(TZ);
      const isPrimeroAbril = now.month() + 1 === 4 && now.date() === 1;
      if (!isPrimeroAbril) return;

      const startYear = now.year();
      try {
        await archivarGestionActiva();
        await crearGestionConMeses(startYear);
        console.log(
          `[CRON] Gestión ${startYear}-${
            startYear + 1
          } creada y anterior archivada`
        );
      } catch (err) {
        console.error('[CRON] Error creando/archivando gestión:', err);
      }
    },
    { timezone: TZ }
  );

  // “boot check” por si el server estuvo caído el 1 de abril
  (async () => {
    const now = dayjs().tz(TZ);
    const startYear = now.month() + 1 >= 4 ? now.year() : now.year() - 1;
    try {
      await crearGestionConMeses(startYear); // idempotente
      console.log(
        `[BOOT] Verificada/creada gestión vigente ${startYear}-${startYear + 1}`
      );
    } catch (err) {
      console.error('[BOOT] Error verificando gestión vigente:', err);
    }
  })();

  return task;
}

export function stopGestionScheduler() {
  if (task) task.stop();
}
