import { esc } from '../lib/helpers.mjs';

export function ideasView({ ideas }) {
  const open = ideas.filter((i) => i.status !== 'done');
  const done = ideas.filter((i) => i.status === 'done');

  const renderIdea = (idea) => `
    <div class="idea-item ${idea.status === 'done' ? 'done' : ''}">
      <span class="idea-priority ${esc(idea.priority || 'medium')}">${esc(idea.priority || 'medium')}</span>
      <div class="idea-title">
        ${esc(idea.title)}
        ${idea.notes ? `<div class="hint" style="margin-top:4px;">${esc(idea.notes)}</div>` : ''}
      </div>
      ${idea.theme ? `<span class="idea-theme">${esc(idea.theme)}</span>` : ''}
      <form method="POST" action="/ideas/toggle" class="inline-form">
        <input type="hidden" name="id" value="${esc(idea.id)}" />
        <button type="submit" class="btn-ghost btn btn-sm">${idea.status === 'done' ? 'Reopen' : 'Mark done'}</button>
      </form>
      <form method="POST" action="/ideas/delete" class="inline-form" onsubmit="return confirm('Delete this idea?')">
        <input type="hidden" name="id" value="${esc(idea.id)}" />
        <button type="submit" class="btn-danger btn btn-sm">×</button>
      </form>
    </div>
  `;

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Ideas</div>
        <div class="view-subtitle">${open.length} open · ${done.length} archived</div>
      </div>
    </div>

    <form method="POST" action="/ideas/add" class="idea-form">
      <input name="title" placeholder="Idea title (e.g. 'Cursor agent mode breakdown')" required />
      <textarea name="notes" placeholder="Notes — angle, hook, references"></textarea>
      <div class="idea-form-row">
        <select name="theme">
          <option value="">Theme (optional)</option>
          <option value="ai-tools">ai-tools</option>
          <option value="cost-savings">cost-savings</option>
          <option value="model-news">model-news</option>
          <option value="infrastructure">infrastructure</option>
          <option value="india-perspective">india-perspective</option>
          <option value="contrarian-take">contrarian-take</option>
        </select>
        <select name="priority">
          <option value="medium" selected>medium priority</option>
          <option value="high">high priority</option>
          <option value="low">low priority</option>
        </select>
        <div></div>
        <button type="submit" class="btn">Capture</button>
      </div>
    </form>

    ${
      open.length === 0
        ? `<div class="empty"><div class="empty-headline">Backlog is empty.</div><p>Capture topics here as they hit you.</p></div>`
        : `<div class="idea-list">${open.map(renderIdea).join('')}</div>`
    }

    ${
      done.length > 0
        ? `
      <h3 style="margin-top:32px; margin-bottom: 12px; color:#6b7480; font-size:13px; text-transform:uppercase; letter-spacing:0.06em;">Archived</h3>
      <div class="idea-list">${done.map(renderIdea).join('')}</div>
    `
        : ''
    }
  `;
}
