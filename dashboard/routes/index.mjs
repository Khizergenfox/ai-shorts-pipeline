/**
 * Mounts all routes onto the Express app.
 * Adding a new section = create routes/foo.mjs + views/foo.mjs and register here.
 */

import { todayRoute } from './today.mjs';
import { queueRoutes } from './queue.mjs';
import { uploadedRoutes } from './uploaded.mjs';
import { calendarRoutes } from './calendar.mjs';
import { ideasRoutes } from './ideas.mjs';
import { hooksRoutes } from './hooks.mjs';
import { performanceRoutes } from './performance.mjs';
import { roadmapRoutes } from './roadmap.mjs';
import { playbookRoutes } from './playbook.mjs';
import { mediaRoutes } from './media.mjs';

export function mountRoutes(app) {
  // Home → today
  app.get('/', (_req, res) => res.redirect(302, '/today'));

  todayRoute(app);
  queueRoutes(app);
  uploadedRoutes(app);
  calendarRoutes(app);
  ideasRoutes(app);
  hooksRoutes(app);
  performanceRoutes(app);
  roadmapRoutes(app);
  playbookRoutes(app);
  mediaRoutes(app);

  // 404
  app.use((req, res) => {
    res.status(404).send('Not found');
  });
}
