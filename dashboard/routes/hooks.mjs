import { readJson, writeJson } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { hooksView } from '../views/hooks.mjs';
import { sidebarCounts } from './_counts.mjs';

const SEED_HOOKS = [
  { id: 'h1', text: 'Someone just [did X] for 75% less than everyone else', tag: 'data-shift' },
  { id: 'h2', text: '[Big company] just made [their own product] obsolete', tag: 'irony' },
  { id: 'h3', text: "If you're building with [X], stop what you're doing and read this", tag: 'urgency' },
  { id: 'h4', text: "I was wrong about [X]. Here's what actually works", tag: 'reversal' },
  { id: 'h5', text: '[Tool] just dropped a feature that kills [other tool]', tag: 'comparison' },
  { id: 'h6', text: 'Everyone is reading the [X] headline wrong', tag: 'contrarian' },
  { id: 'h7', text: 'The [X] update nobody is talking about', tag: 'hidden-signal' },
  { id: 'h8', text: 'A redditor on r/[X] just figured out [thing]', tag: 'social-proof' },
];

async function loadHooks() {
  const data = await readJson('hooks.json', null);
  if (!data) {
    const seed = { hooks: SEED_HOOKS };
    await writeJson('hooks.json', seed);
    return seed;
  }
  return data;
}

export function hooksRoutes(app) {
  app.get('/hooks', async (_req, res) => {
    const data = await loadHooks();
    res.send(
      layout({
        active: 'hooks',
        title: 'Hooks',
        body: hooksView({ hooks: data.hooks }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.post('/hooks/add', async (req, res) => {
    const { text, tag } = req.body || {};
    if (!text) return res.redirect(302, '/hooks');
    const data = await loadHooks();
    data.hooks.unshift({
      id: 'h_' + Date.now().toString(36),
      text,
      tag: tag || '',
      addedAt: new Date().toISOString(),
    });
    await writeJson('hooks.json', data);
    res.redirect(302, '/hooks');
  });

  app.post('/hooks/delete', async (req, res) => {
    const data = await loadHooks();
    data.hooks = data.hooks.filter((h) => h.id !== req.body?.id);
    await writeJson('hooks.json', data);
    res.redirect(302, '/hooks');
  });
}
