import { readJson, writeJson } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { ideasView } from '../views/ideas.mjs';
import { sidebarCounts } from './_counts.mjs';

export function ideasRoutes(app) {
  app.get('/ideas', async (_req, res) => {
    const data = await readJson('ideas.json', { ideas: [] });
    res.send(
      layout({
        active: 'ideas',
        title: 'Ideas',
        body: ideasView({ ideas: data.ideas }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.post('/ideas/add', async (req, res) => {
    const { title, notes, theme, priority } = req.body || {};
    if (!title) return res.redirect(302, '/ideas');
    const data = await readJson('ideas.json', { ideas: [] });
    data.ideas.unshift({
      id: 'idea_' + Date.now().toString(36),
      title,
      notes: notes || '',
      theme: theme || '',
      priority: priority || 'medium',
      status: 'open',
      addedAt: new Date().toISOString(),
    });
    await writeJson('ideas.json', data);
    res.redirect(302, '/ideas');
  });

  app.post('/ideas/toggle', async (req, res) => {
    const data = await readJson('ideas.json', { ideas: [] });
    const idea = data.ideas.find((i) => i.id === req.body?.id);
    if (idea) {
      idea.status = idea.status === 'done' ? 'open' : 'done';
      await writeJson('ideas.json', data);
    }
    res.redirect(302, '/ideas');
  });

  app.post('/ideas/delete', async (req, res) => {
    const data = await readJson('ideas.json', { ideas: [] });
    data.ideas = data.ideas.filter((i) => i.id !== req.body?.id);
    await writeJson('ideas.json', data);
    res.redirect(302, '/ideas');
  });
}
