import { esc, fmtDate, todayIso, daysBetween, computeMilestoneDate } from '../lib/helpers.mjs';

const TYPE_LABELS = {
  launch: 'Launch',
  bts: 'BTS',
  milestone: 'Milestone',
  'open-source': 'Open Source',
  announcement: 'Announcement',
  other: 'Other',
};

export function roadmapView({ items, launchDate }) {
  const today = todayIso();

  // Augment each item with computed targetDate + dueLabel
  const enriched = items.map((it) => {
    const targetDate = computeMilestoneDate(it, launchDate);
    let due = null;
    if (targetDate) {
      const diff = daysBetween(today, targetDate);
      if (diff < 0) due = { kind: 'overdue', value: -diff, label: `${-diff}d overdue` };
      else if (diff === 0) due = { kind: 'today', value: 0, label: 'due today' };
      else if (diff <= 7) due = { kind: 'soon', value: diff, label: `in ${diff}d` };
      else due = { kind: 'later', value: diff, label: `in ${diff}d` };
    } else if (it.trigger?.kind === 'manual') {
      due = { kind: 'manual', value: null, label: `manual: ${it.trigger.value || 'when ready'}` };
    }
    return { ...it, targetDate, due };
  });

  // Sort: open items by date asc (manual at end), then done items
  const open = enriched.filter((i) => i.status !== 'done');
  const done = enriched.filter((i) => i.status === 'done');
  open.sort((a, b) => {
    if (!a.targetDate && !b.targetDate) return a.title.localeCompare(b.title);
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return a.targetDate.localeCompare(b.targetDate);
  });

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Roadmap</div>
        <div class="view-subtitle">Personal-brand milestones. Day counts anchored to launch: ${esc(fmtDate(launchDate).label)}.</div>
      </div>
    </div>

    <form method="POST" action="/roadmap/launch-date" class="card" style="display:flex; gap:12px; align-items:end; margin-bottom:24px;">
      <div style="flex:1">
        <label class="form-label">Launch date (anchor for "Day N" triggers)</label>
        <input type="date" name="launchDate" value="${esc(launchDate)}" />
      </div>
      <button type="submit" class="btn-ghost btn">Update anchor</button>
    </form>

    <form method="POST" action="/roadmap/add" class="idea-form">
      <input name="title" placeholder="Milestone title (e.g. 'Day 50 — go behind the camera once')" required />
      <textarea name="notes" placeholder="Notes — what to actually post, framing, references"></textarea>
      <div class="roadmap-form-row">
        <select name="type">
          ${Object.entries(TYPE_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
        <select name="triggerKind" id="trigger-kind">
          <option value="day-count">Day N from launch</option>
          <option value="date">Specific date</option>
          <option value="manual">Manual trigger</option>
        </select>
        <input name="triggerValue" placeholder="7" />
        <button type="submit" class="btn">Add to roadmap</button>
      </div>
      <p class="hint">Trigger value: number of days for "Day N" (negative = before launch); ISO date for "Specific date"; description string for "Manual" (e.g. "1k YT subs").</p>
    </form>

    ${
      open.length === 0
        ? `<div class="empty"><div class="empty-headline">No milestones yet.</div></div>`
        : `<div class="roadmap-list">${open.map(renderItem).join('')}</div>`
    }

    ${
      done.length > 0
        ? `<h3 style="margin-top:32px; margin-bottom:12px; color:#6b7480; font-size:13px; text-transform:uppercase; letter-spacing:0.06em;">Completed</h3>
           <div class="roadmap-list">${done.map(renderItem).join('')}</div>`
        : ''
    }
  `;
}

function renderItem(item) {
  const dueClass = item.due ? `due-${item.due.kind}` : '';
  const dueLabel = item.due ? `<span class="due-pill ${dueClass}">${esc(item.due.label)}</span>` : '';
  const dateLine = item.targetDate
    ? `<span class="rm-date">${esc(fmtDate(item.targetDate).label)}</span>`
    : '';
  const platformPills = (item.platforms || [])
    .map((p) => `<span class="rm-platform">${esc(p)}</span>`)
    .join('');

  return `
    <div class="roadmap-item ${item.status === 'done' ? 'done' : ''} ${dueClass}">
      <div class="rm-meta">
        <span class="rm-type rm-type-${esc(item.type)}">${esc(TYPE_LABELS[item.type] || item.type)}</span>
        ${dateLine}
        ${dueLabel}
      </div>
      <div class="rm-title">${esc(item.title)}</div>
      ${item.notes ? `<div class="rm-notes">${esc(item.notes)}</div>` : ''}
      <div class="rm-footer">
        <div class="rm-platforms">${platformPills}</div>
        <div class="rm-actions">
          <form method="POST" action="/roadmap/toggle" class="inline-form">
            <input type="hidden" name="id" value="${esc(item.id)}" />
            <button type="submit" class="btn-ghost btn btn-sm">${item.status === 'done' ? 'Reopen' : 'Mark done'}</button>
          </form>
          <form method="POST" action="/roadmap/delete" class="inline-form" onsubmit="return confirm('Delete this milestone?')">
            <input type="hidden" name="id" value="${esc(item.id)}" />
            <button type="submit" class="btn-danger btn btn-sm">×</button>
          </form>
        </div>
      </div>
    </div>
  `;
}
