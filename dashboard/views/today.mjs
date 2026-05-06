import { esc, fmtDate, modeForDow, todayIso, daysBetween, computeMilestoneDate } from '../lib/helpers.mjs';

export function todayView({ today, queue, plan, openIdeasCount, roadmap }) {
  const todayStr = todayIso();
  const d = new Date();
  const mode = modeForDow(d.getDay());
  const dateLabel = fmtDate(todayStr).label;

  const scheduledToday = (plan.schedule || []).find((s) => s.date === todayStr);
  const yIso = (() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().slice(0, 10);
  })();
  const scheduledYesterday = (plan.schedule || []).find((s) => s.date === yIso);

  const queuePending = queue.filter((q) =>
    ['youtube', 'instagram', 'linkedin', 'x'].some((p) => !q.posted?.[p]),
  );

  // ───────── primary CTA card ─────────
  let primaryCard;
  if (mode.mode === 'post' && scheduledToday) {
    const item = queue.find((q) => q.topic === scheduledToday.topic);
    if (item) {
      const remaining = ['youtube', 'instagram', 'linkedin', 'x'].filter(
        (p) => !item.posted?.[p],
      );
      primaryCard = `
        <div class="today-banner">
          <div class="today-mode-tag">DROP DAY · ${esc(scheduledToday.topicType || 'video').toUpperCase()}</div>
          <div class="today-headline">Today's drop: ${esc(item.topic)}</div>
          <div class="today-note">${esc(scheduledToday.rationale || mode.tagline)}</div>
          <div style="margin-top: 18px; display: flex; gap: 10px;">
            <a href="/queue/${esc(item.topic)}" class="btn">Open captions →</a>
            ${
              remaining.length > 0
                ? `<span class="hint" style="align-self:center">${remaining.length} platform${remaining.length > 1 ? 's' : ''} pending</span>`
                : `<span class="hint" style="align-self:center; color:#4cd97b;">All platforms posted ✓</span>`
            }
          </div>
        </div>
      `;
    } else {
      primaryCard = `
        <div class="today-banner">
          <div class="today-mode-tag">POST DAY · NO VIDEO READY</div>
          <div class="today-headline">${esc(mode.label)}</div>
          <div class="today-note">Today is a post day, but the scheduled video <code>${esc(scheduledToday.topic)}</code> isn't in the queue. Render it or move the schedule.</div>
          <div style="margin-top: 18px;">
            <a href="/calendar" class="btn-ghost btn">Edit calendar</a>
          </div>
        </div>
      `;
    }
  } else if (mode.mode === 'post') {
    primaryCard = `
      <div class="today-banner">
        <div class="today-mode-tag">POST DAY · UNPLANNED</div>
        <div class="today-headline">${esc(mode.label)}</div>
        <div class="today-note">${esc(mode.tagline)} Nothing scheduled. Pick from queue or skip.</div>
        <div style="margin-top: 18px;">
          <a href="/queue" class="btn">Browse queue →</a>
        </div>
      </div>
    `;
  } else if (mode.mode === 'engage') {
    primaryCard = `
      <div class="today-banner">
        <div class="today-mode-tag">ENGAGE DAY</div>
        <div class="today-headline">${esc(mode.label)}</div>
        <div class="today-note">${esc(mode.tagline)} ${
          scheduledYesterday
            ? `Yesterday's drop was <strong>${esc(scheduledYesterday.topic)}</strong> — go reply to comments on YT/IG/LinkedIn.`
            : 'Spend 20 min replying to comments on your last 3 posts.'
        }</div>
        <div style="margin-top: 18px;">
          <a href="/uploaded" class="btn-ghost btn">Open uploaded posts →</a>
        </div>
      </div>
    `;
  } else if (mode.mode === 'ideate') {
    primaryCard = `
      <div class="today-banner">
        <div class="today-mode-tag">PLAN DAY</div>
        <div class="today-headline">${esc(mode.label)}</div>
        <div class="today-note">${esc(mode.tagline)}</div>
        <div style="margin-top: 18px; display:flex; gap: 10px;">
          <a href="/ideas" class="btn">Capture ideas →</a>
          <a href="/calendar" class="btn-ghost btn">Plan next week</a>
        </div>
      </div>
    `;
  } else {
    primaryCard = `
      <div class="today-banner">
        <div class="today-mode-tag">REST</div>
        <div class="today-headline">${esc(mode.label)}</div>
        <div class="today-note">${esc(mode.tagline)}</div>
      </div>
    `;
  }

  // ───────── stat cards ─────────
  const statCards = `
    <div class="card-row" style="margin-bottom: 28px;">
      <a class="card stat-card" href="/queue">
        <div class="stat-label">In queue</div>
        <div class="stat-value">${queue.length}</div>
        <div class="stat-sub">${queuePending.length} with pending platforms</div>
      </a>
      <a class="card stat-card" href="/calendar">
        <div class="stat-label">Next drop</div>
        <div class="stat-value">${nextDropLabel(plan, todayStr)}</div>
        <div class="stat-sub">per the strategy</div>
      </a>
      <a class="card stat-card" href="/ideas">
        <div class="stat-label">Open ideas</div>
        <div class="stat-value">${openIdeasCount}</div>
        <div class="stat-sub">in the backlog</div>
      </a>
    </div>
  `;

  // ───────── due milestones from roadmap ─────────
  const milestoneCard = renderDueMilestones(roadmap || { items: [], launchDate: '' });

  // ───────── playbook for today ─────────
  const playbook = renderPlaybookForToday(mode.mode, plan);

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Today</div>
        <div class="view-subtitle">${esc(dateLabel)}</div>
      </div>
    </div>
    ${primaryCard}
    ${statCards}
    ${milestoneCard}
    ${playbook}
  `;
}

function renderDueMilestones(roadmap) {
  const launch = roadmap.launchDate;
  if (!launch || !roadmap.items?.length) return '';
  const today = todayIso();
  const due = roadmap.items
    .filter((it) => it.status !== 'done')
    .map((it) => {
      const targetDate = computeMilestoneDate(it, launch);
      if (!targetDate) return null;
      const diff = daysBetween(today, targetDate);
      return { ...it, targetDate, diff };
    })
    .filter((it) => it && it.diff <= 3) // due today, overdue, or in next 3 days
    .sort((a, b) => a.diff - b.diff);

  if (due.length === 0) return '';

  const rows = due
    .map((it) => {
      const label = it.diff < 0 ? `${-it.diff}d overdue` : it.diff === 0 ? 'TODAY' : `in ${it.diff}d`;
      const cls = it.diff < 0 ? 'overdue' : it.diff === 0 ? 'today' : 'soon';
      return `
        <li class="milestone-row ${cls}">
          <span class="milestone-when">${esc(label)}</span>
          <a href="/roadmap" class="milestone-title">${esc(it.title)}</a>
        </li>
      `;
    })
    .join('');

  return `
    <div class="card card-strong" style="margin-bottom: 28px;">
      <div class="card-title">Brand milestones due</div>
      <ul class="milestone-list">${rows}</ul>
      <a href="/roadmap" class="hint" style="display:block; margin-top:10px;">See full roadmap →</a>
    </div>
  `;
}

function nextDropLabel(plan, todayStr) {
  const upcoming = (plan.schedule || []).filter((s) => s.date >= todayStr);
  if (upcoming.length === 0) return '—';
  const next = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];
  return next.date === todayStr ? `Today: ${next.topic}` : `${fmtDate(next.date).monthDay}: ${next.topic}`;
}

function renderPlaybookForToday(modeName, plan) {
  const w = plan.postWindows || {};
  if (modeName === 'post') {
    return `
      <div class="card card-strong">
        <div class="card-title">Posting playbook for today</div>
        <ul class="checklist">
          <li><strong>LinkedIn</strong> — post by ${esc(w.linkedin?.start || '08:30')} ${esc(w.linkedin?.tz || 'IST')} (catches IN morning + EU late evening)</li>
          <li><strong>X (Twitter)</strong> — post by ${esc(w.x?.start || '09:00')}–${esc(w.x?.end || '11:00')} ${esc(w.x?.tz || 'IST')} (tech Twitter active in IN morning)</li>
          <li><strong>YouTube Shorts</strong> — post between ${esc(w.youtube?.start || '19:30')}–${esc(w.youtube?.end || '21:30')} ${esc(w.youtube?.tz || 'IST')}</li>
          <li><strong>Instagram Reels</strong> — post between ${esc(w.instagram?.start || '20:00')}–${esc(w.instagram?.end || '22:00')} ${esc(w.instagram?.tz || 'IST')}</li>
          <li>Reply to first 10 comments on each platform within 30 min — algos weight early engagement heavily</li>
          <li>Pin your YouTube top comment within 5 min of posting</li>
          <li>Cross-share IG Reel to Story with "New ⬇" sticker</li>
        </ul>
      </div>
    `;
  }
  if (modeName === 'engage') {
    return `
      <div class="card card-strong">
        <div class="card-title">Engagement playbook for today</div>
        <ul class="checklist">
          <li>Reply to every comment on yesterday's post (no exceptions — algos see reply rate)</li>
          <li>Comment thoughtfully on 5 creators in your niche (don't spam, real replies)</li>
          <li>Pin a fresh comment on yesterday's YT post if you have a related insight</li>
          <li>Save 3 trending posts in your niche for inspiration / future commentary</li>
        </ul>
      </div>
    `;
  }
  if (modeName === 'ideate') {
    return `
      <div class="card card-strong">
        <div class="card-title">Plan-day playbook</div>
        <ul class="checklist">
          <li>Review last week's posts — note which hooks landed</li>
          <li>Capture 3 new video ideas in <a href="/ideas">Ideas</a></li>
          <li>Outline next week's 3 topics in <a href="/calendar">Calendar</a> (Mon news / Wed tutorial / Fri opinion)</li>
          <li>Update <a href="/performance">Performance</a> with 7-day numbers from last week's posts</li>
        </ul>
      </div>
    `;
  }
  return `
    <div class="card card-strong">
      <div class="card-title">Rest day</div>
      <p style="color: #b3b1ad;">No tasks. The algorithm is quieter on Saturdays. Recharge.</p>
    </div>
  `;
}
