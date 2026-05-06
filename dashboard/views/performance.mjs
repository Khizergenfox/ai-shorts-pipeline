import { esc } from '../lib/helpers.mjs';

export function performanceView({ entries, uploaded, prefill = {} }) {
  // Build a topic + platform options list from uploaded
  const options = [];
  for (const u of uploaded) {
    for (const p of ['youtube', 'instagram', 'linkedin', 'x']) {
      if (u.posted?.[p]) options.push({ topic: u.topic, platform: p });
    }
  }

  const optionsHtml = options
    .map(
      (o) =>
        `<option value="${esc(o.topic)}|${esc(o.platform)}" ${prefill.topic === o.topic && prefill.platform === o.platform ? 'selected' : ''}>${esc(o.topic)} — ${esc(o.platform)}</option>`,
    )
    .join('');

  // Sort entries newest first
  const rows = entries
    .slice()
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .map(
      (e) => `
        <tr>
          <td>${esc(e.topic)}</td>
          <td>${esc(e.platform)}</td>
          <td>${esc(e.checkpoint)}</td>
          <td class="num">${formatNum(e.views)}</td>
          <td class="num">${formatNum(e.likes)}</td>
          <td class="num">${formatNum(e.comments)}</td>
          <td class="num">${formatNum(e.saves)}</td>
          <td class="num">${formatNum(e.shares)}</td>
          <td>${esc(e.notes)}</td>
          <td>${esc(new Date(e.recordedAt).toLocaleDateString())}</td>
        </tr>
      `,
    )
    .join('');

  // Top 3 performers (by views)
  const topPerformers = entries
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);
  const topHtml = topPerformers
    .map(
      (e) => `
        <li><strong>${esc(e.topic)}</strong> on ${esc(e.platform)} — ${formatNum(e.views)} views <span class="hint">(${esc(e.checkpoint)})</span></li>
      `,
    )
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Performance</div>
        <div class="view-subtitle">Track what's working. Log at 24h, 7d, 30d after posting.</div>
      </div>
    </div>

    <form method="POST" action="/performance/add" class="perf-form">
      <div>
        <label>Topic / platform</label>
        <select name="topic_platform" required>
          <option value="">— pick —</option>
          ${optionsHtml}
        </select>
      </div>
      <div>
        <label>Checkpoint</label>
        <select name="checkpoint" required>
          <option value="24h">24 hours</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
        </select>
      </div>
      <div>
        <label>Views</label>
        <input name="views" type="number" min="0" value="0" />
      </div>
      <div>
        <label>Likes</label>
        <input name="likes" type="number" min="0" value="0" />
      </div>
      <div>
        <label>Comments</label>
        <input name="comments" type="number" min="0" value="0" />
      </div>
      <div>
        <label>Saves</label>
        <input name="saves" type="number" min="0" value="0" />
      </div>
      <div>
        <label>Shares</label>
        <input name="shares" type="number" min="0" value="0" />
      </div>
      <button type="submit" class="btn">Log</button>
    </form>

    ${
      topPerformers.length > 0
        ? `<div class="card" style="margin-bottom:24px"><div class="card-title">Top performers</div><ol style="padding-left: 20px;">${topHtml}</ol></div>`
        : ''
    }

    ${
      rows
        ? `
      <div class="card" style="padding:0; overflow:hidden;">
        <table class="perf-table">
          <thead>
            <tr>
              <th>Topic</th><th>Platform</th><th>Checkpoint</th>
              <th class="num">Views</th><th class="num">Likes</th><th class="num">Comments</th>
              <th class="num">Saves</th><th class="num">Shares</th>
              <th>Notes</th><th>Logged</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
        : `<div class="empty"><div class="empty-headline">No data yet.</div><p>After 24h on each post, come back and log the numbers.</p></div>`
    }
  `;
}

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
