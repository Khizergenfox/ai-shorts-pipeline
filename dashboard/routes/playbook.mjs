import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { layout } from '../views/_layout.mjs';
import { playbookView } from '../views/playbook.mjs';
import { sidebarCounts } from './_counts.mjs';
import { PROJECT_ROOT } from '../lib/store.mjs';

const SKILL_PATH = path.join(PROJECT_ROOT, '.claude/skills/personal-branding/SKILL.md');

export function playbookRoutes(app) {
  app.get('/playbook', async (_req, res) => {
    const exists = fs.existsSync(SKILL_PATH);
    let skillMd = '';
    if (exists) skillMd = await fsp.readFile(SKILL_PATH, 'utf8');
    res.send(
      layout({
        active: 'playbook',
        title: 'Playbook',
        body: playbookView({ skillMd, exists, skillPath: SKILL_PATH }),
        counts: await sidebarCounts(),
      }),
    );
  });

  // Append a dated entry to the "Lessons learned" section.
  app.post('/playbook/lesson', async (req, res) => {
    const { lesson, topic } = req.body || {};
    if (!lesson || !fs.existsSync(SKILL_PATH)) return res.redirect(302, '/playbook');

    const md = await fsp.readFile(SKILL_PATH, 'utf8');

    // Insert before the "<!-- Future Claude" comment marker (or before "## Performance benchmarks" if missing)
    const date = new Date().toISOString().slice(0, 10);
    const entry = `\n### ${date}${topic ? ` — ${topic.trim()}` : ''}\n- ${lesson.trim()}\n`;

    const insertMarker = '<!-- Future Claude: append new lessons below this line, dated, signed -->';
    const fallbackMarker = '## Performance benchmarks';

    let updated;
    if (md.includes(insertMarker)) {
      updated = md.replace(insertMarker, insertMarker + entry);
    } else if (md.includes(fallbackMarker)) {
      updated = md.replace(fallbackMarker, entry + '\n---\n\n' + fallbackMarker);
    } else {
      updated = md + '\n' + entry;
    }

    await fsp.writeFile(SKILL_PATH, updated, 'utf8');
    res.redirect(302, '/playbook#add-lesson');
  });
}
