import { esc, fmtDate, addDaysIso, todayIso, modeForDow } from '../lib/helpers.mjs';

export function calendarView({ plan, queue, uploaded }) {
  const today = todayIso();
  const days = [];
  for (let i = -2; i < 14; i++) {
    days.push(addDaysIso(today, i));
  }

  const scheduleByDate = Object.fromEntries((plan.schedule || []).map((s) => [s.date, s]));
  const uploadedTopics = new Set(uploaded.map((u) => u.topic));

  const cells = days
    .map((iso) => {
      const f = fmtDate(iso);
      const m = modeForDow(f.dowIndex);
      const sch = scheduleByDate[iso];
      const isToday = iso === today;
      const isPast = iso < today;
      const wasUploaded = sch && uploadedTopics.has(sch.topic);

      let topicHtml = '';
      if (sch) {
        topicHtml = `
          <div class="cal-day-topic">${esc(sch.topic)}</div>
          <div class="cal-day-topic-type">${esc(sch.topicType || 'untyped')}${wasUploaded ? ' · posted ✓' : ''}</div>
        `;
      }

      return `
        <div class="cal-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}">
          <div class="cal-day-date">${esc(f.dow.toUpperCase())} · ${esc(f.monthDay)}</div>
          ${topicHtml}
          <span class="cal-day-mode ${m.mode}">${esc(m.label)}</span>
        </div>
      `;
    })
    .join('');

  // Schedule editor
  const editorRows = (plan.schedule || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s, idx) => {
      return `
        <tr>
          <td>${esc(s.date)}</td>
          <td>${esc(s.topic)}</td>
          <td>${esc(s.topicType || '—')}</td>
          <td><em style="color:#6b7480">${esc(s.rationale || '')}</em></td>
          <td>
            <form method="POST" action="/calendar/remove" class="inline-form">
              <input type="hidden" name="index" value="${idx}" />
              <button type="submit" class="btn-danger btn btn-sm">Remove</button>
            </form>
          </td>
        </tr>
      `;
    })
    .join('');

  // Topics available to schedule
  const availableTopics = queue.map((q) => q.topic);
  const topicOptions = availableTopics
    .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`)
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Calendar</div>
        <div class="view-subtitle">${esc(plan.cadenceLabel || 'Mon / Wed / Fri post days. Tue / Thu engage. Sat rest. Sun plan.')}</div>
      </div>
    </div>

    <div class="calendar-grid">${cells}</div>

    <div class="card-row" style="margin-top:32px;">
      <div class="card" style="flex:2;">
        <div class="card-title">Add to schedule</div>
        <form method="POST" action="/calendar/add" class="schedule-form">
          <div class="form-grid">
            <div>
              <label>Date</label>
              <input type="date" name="date" required value="${esc(addDaysIso(today, 1))}" />
            </div>
            <div>
              <label>Topic</label>
              <select name="topic" required>
                <option value="">— pick from queue —</option>
                ${topicOptions}
              </select>
            </div>
            <div>
              <label>Type</label>
              <select name="topicType">
                <option value="news">news</option>
                <option value="tutorial">tutorial</option>
                <option value="opinion">opinion</option>
                <option value="data">data</option>
              </select>
            </div>
          </div>
          <label>Rationale (why this video, this day)</label>
          <textarea name="rationale" placeholder="e.g. Mid-week tutorial — devs are deep in their problem"></textarea>
          <button type="submit" class="btn">Add to schedule</button>
        </form>
      </div>

      <div class="card" style="flex:1;">
        <div class="card-title">Posting windows (IST)</div>
        <ul class="windows-list">
          <li><strong>LinkedIn</strong> — ${esc(plan.postWindows?.linkedin?.start)}–${esc(plan.postWindows?.linkedin?.end)}<br><span class="hint">${esc(plan.postWindows?.linkedin?.note || '')}</span></li>
          <li><strong>X (Twitter)</strong> — ${esc(plan.postWindows?.x?.start)}–${esc(plan.postWindows?.x?.end)}<br><span class="hint">${esc(plan.postWindows?.x?.note || '')}</span></li>
          <li><strong>YouTube</strong> — ${esc(plan.postWindows?.youtube?.start)}–${esc(plan.postWindows?.youtube?.end)}<br><span class="hint">${esc(plan.postWindows?.youtube?.note || '')}</span></li>
          <li><strong>Instagram</strong> — ${esc(plan.postWindows?.instagram?.start)}–${esc(plan.postWindows?.instagram?.end)}<br><span class="hint">${esc(plan.postWindows?.instagram?.note || '')}</span></li>
        </ul>
      </div>
    </div>

    ${
      editorRows
        ? `
      <div class="card" style="margin-top:24px;">
        <div class="card-title">Scheduled drops</div>
        <table class="perf-table">
          <thead><tr><th>Date</th><th>Topic</th><th>Type</th><th>Rationale</th><th></th></tr></thead>
          <tbody>${editorRows}</tbody>
        </table>
      </div>
    `
        : ''
    }
  `;
}
