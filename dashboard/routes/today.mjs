import { listQueue, readJson } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { todayView } from '../views/today.mjs';
import { sidebarCounts } from './_counts.mjs';

export function todayRoute(app) {
  app.get('/today', async (_req, res) => {
    const queue = await listQueue();
    const plan = await readJson('plan.json', { schedule: [], postWindows: {} });
    const ideas = await readJson('ideas.json', { ideas: [] });
    const roadmap = await readJson('roadmap.json', { launchDate: '', items: [] });
    const openIdeasCount = ideas.ideas.filter((i) => i.status !== 'done').length;

    const body = todayView({
      today: new Date().toISOString().slice(0, 10),
      queue,
      plan,
      openIdeasCount,
      roadmap,
    });
    res.send(
      layout({
        active: 'today',
        title: 'Today',
        body,
        counts: await sidebarCounts(),
      }),
    );
  });
}
