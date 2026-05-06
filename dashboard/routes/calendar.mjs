import { readJson, writeJson, listQueue, listUploaded } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { calendarView } from '../views/calendar.mjs';
import { sidebarCounts } from './_counts.mjs';

export function calendarRoutes(app) {
  app.get('/calendar', async (_req, res) => {
    const plan = await readJson('plan.json', { schedule: [], postWindows: {} });
    const queue = await listQueue();
    const uploaded = await listUploaded();
    res.send(
      layout({
        active: 'calendar',
        title: 'Calendar',
        body: calendarView({ plan, queue, uploaded }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.post('/calendar/add', async (req, res) => {
    const { date, topic, topicType, rationale } = req.body || {};
    if (!date || !topic) return res.status(400).send('date + topic required');
    const plan = await readJson('plan.json', { schedule: [] });
    plan.schedule = (plan.schedule || []).filter((s) => !(s.date === date && s.topic === topic));
    plan.schedule.push({
      date,
      topic,
      topicType: topicType || '',
      rationale: rationale || '',
      platforms: ['youtube', 'instagram', 'linkedin'],
    });
    await writeJson('plan.json', plan);
    res.redirect(302, '/calendar');
  });

  app.post('/calendar/remove', async (req, res) => {
    const idx = parseInt(req.body?.index, 10);
    const plan = await readJson('plan.json', { schedule: [] });
    plan.schedule = (plan.schedule || []).sort((a, b) => a.date.localeCompare(b.date));
    if (!Number.isNaN(idx) && idx >= 0 && idx < plan.schedule.length) {
      plan.schedule.splice(idx, 1);
      await writeJson('plan.json', plan);
    }
    res.redirect(302, '/calendar');
  });
}
