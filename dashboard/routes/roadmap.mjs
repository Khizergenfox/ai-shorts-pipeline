import { readJson, writeJson } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { roadmapView } from '../views/roadmap.mjs';
import { sidebarCounts } from './_counts.mjs';

async function loadRoadmap() {
  return readJson('roadmap.json', { launchDate: '', items: [] });
}

export function roadmapRoutes(app) {
  app.get('/roadmap', async (_req, res) => {
    const data = await loadRoadmap();
    res.send(
      layout({
        active: 'roadmap',
        title: 'Roadmap',
        body: roadmapView({ items: data.items || [], launchDate: data.launchDate || '' }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.post('/roadmap/add', async (req, res) => {
    const { title, notes, type, triggerKind, triggerValue, platforms } = req.body || {};
    if (!title) return res.redirect(302, '/roadmap');
    const data = await loadRoadmap();
    data.items.unshift({
      id: 'rm_' + Date.now().toString(36),
      title,
      notes: notes || '',
      type: type || 'other',
      trigger: {
        kind: triggerKind || 'manual',
        value: triggerKind === 'day-count' ? Number(triggerValue) || 0 : triggerValue || '',
      },
      platforms: Array.isArray(platforms) ? platforms : [],
      status: 'planned',
      addedAt: new Date().toISOString(),
    });
    await writeJson('roadmap.json', data);
    res.redirect(302, '/roadmap');
  });

  app.post('/roadmap/toggle', async (req, res) => {
    const data = await loadRoadmap();
    const item = data.items.find((i) => i.id === req.body?.id);
    if (item) {
      item.status = item.status === 'done' ? 'planned' : 'done';
      await writeJson('roadmap.json', data);
    }
    res.redirect(302, '/roadmap');
  });

  app.post('/roadmap/delete', async (req, res) => {
    const data = await loadRoadmap();
    data.items = data.items.filter((i) => i.id !== req.body?.id);
    await writeJson('roadmap.json', data);
    res.redirect(302, '/roadmap');
  });

  app.post('/roadmap/launch-date', async (req, res) => {
    const data = await loadRoadmap();
    data.launchDate = req.body?.launchDate || data.launchDate;
    await writeJson('roadmap.json', data);
    res.redirect(302, '/roadmap');
  });
}
