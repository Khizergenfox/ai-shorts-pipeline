import { readJson, writeJson, listUploaded } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { performanceView } from '../views/performance.mjs';
import { sidebarCounts } from './_counts.mjs';

export function performanceRoutes(app) {
  app.get('/performance', async (req, res) => {
    const data = await readJson('performance.json', { entries: [] });
    const uploaded = await listUploaded();
    res.send(
      layout({
        active: 'performance',
        title: 'Performance',
        body: performanceView({
          entries: data.entries,
          uploaded,
          prefill: { topic: req.query.topic, platform: req.query.platform },
        }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.post('/performance/add', async (req, res) => {
    const { topic_platform, checkpoint, views, likes, comments, saves, shares, notes } =
      req.body || {};
    if (!topic_platform || !checkpoint) return res.redirect(302, '/performance');
    const [topic, platform] = topic_platform.split('|');
    const data = await readJson('performance.json', { entries: [] });
    data.entries.push({
      id: 'perf_' + Date.now().toString(36),
      topic,
      platform,
      checkpoint,
      views: Number(views) || 0,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      saves: Number(saves) || 0,
      shares: Number(shares) || 0,
      notes: notes || '',
      recordedAt: new Date().toISOString(),
    });
    await writeJson('performance.json', data);
    res.redirect(302, '/performance');
  });
}
