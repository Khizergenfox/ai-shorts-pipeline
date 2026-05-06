import { esc } from '../lib/helpers.mjs';

/**
 * Renders the personal-branding skill markdown inside the dashboard.
 * Markdown parsing happens client-side via marked.js (CDN).
 * The "Add lesson" form appends a dated entry to the Lessons-learned section.
 */
export function playbookView({ skillMd, exists, skillPath }) {
  if (!exists) {
    return `
      <div class="view-header">
        <div>
          <div class="view-title">Playbook</div>
          <div class="view-subtitle">Personal branding skill — not found</div>
        </div>
      </div>
      <div class="empty">
        <div class="empty-headline">No skill file yet.</div>
        <p>Expected at <code>${esc(skillPath)}</code>. Ask Claude to build it.</p>
      </div>
    `;
  }

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Playbook</div>
        <div class="view-subtitle">Personal-branding strategy skill — researched + self-updating.</div>
      </div>
      <div>
        <a class="btn-ghost btn btn-sm" href="#add-lesson">+ Add lesson</a>
      </div>
    </div>

    <article class="playbook-article" id="playbook-content">
      <pre style="display:none" id="playbook-md">${esc(skillMd)}</pre>
      <div id="playbook-rendered"><em style="color:#6b7480">Rendering markdown…</em></div>
    </article>

    <section class="card" style="margin-top:32px;" id="add-lesson">
      <div class="card-title">Append a lesson learned</div>
      <p class="hint">Adds a dated entry to the "Lessons learned" section of the skill file. Append-only — never edits or deletes prior entries.</p>
      <form method="POST" action="/playbook/lesson" class="idea-form">
        <textarea name="lesson" placeholder="What you learned (1–3 sentences). e.g. 'codeburn IG Reel got 2x DM-sends vs deepseek-v4 — emotional pain hooks (your bill is leaking) outperform analytical hooks (V4 vs Nvidia) on IG. Likely opposite on LinkedIn.'" required style="min-height:100px"></textarea>
        <input name="topic" placeholder="Topic / video this is from (optional)" />
        <div style="display:flex; justify-content:flex-end;">
          <button type="submit" class="btn">Append to skill</button>
        </div>
      </form>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
    <script>
      (function renderMarkdown() {
        const md = document.getElementById('playbook-md').textContent;
        const target = document.getElementById('playbook-rendered');
        if (typeof marked === 'undefined') {
          target.innerHTML = '<pre style="white-space:pre-wrap">' + md.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</pre>';
          return;
        }
        target.innerHTML = marked.parse(md, { gfm: true, breaks: false });
      })();
    </script>
  `;
}
