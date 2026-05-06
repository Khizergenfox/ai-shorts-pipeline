// Tiny progressive enhancement.
// Server-rendered pages are fully functional without this file.

// ─── clipboard ───
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const block = btn.closest('.caption-block') || btn.closest('.hook-item');
  if (!block) return;
  const textEl = block.querySelector('.caption-block-text, .hook-text');
  if (!textEl) return;
  const text = textEl.textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  } catch (err) {
    btn.textContent = 'Copy failed';
    setTimeout(() => (btn.textContent = 'Copy'), 1500);
  }
});

// ─── copy file path ───
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy-path]');
  if (!btn) return;
  const text = btn.dataset.copyPath;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  } catch {
    btn.textContent = 'Copy failed';
    setTimeout(() => (btn.textContent = 'Copy'), 1500);
  }
});

// ─── reveal file in Windows Explorer ───
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-reveal-topic]');
  if (!btn) return;
  const topic = btn.dataset.revealTopic;
  const type = btn.dataset.revealType || 'video';
  if (!topic) return;
  const original = btn.textContent;
  btn.textContent = 'Opening…';
  btn.disabled = true;
  try {
    const res = await fetch(`/queue/${encodeURIComponent(topic)}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'failed');
    }
    btn.textContent = 'Opened ✓';
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  } catch (err) {
    btn.textContent = 'Failed';
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  }
});

// ─── keyboard 'r' to reload ───
document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if (e.key === 'r' || e.key === 'R') {
    location.reload();
  }
});

// ─── drag-and-drop queue reorder ───
(function setupSortable() {
  const list = document.getElementById('queue-sortable');
  if (!list || typeof Sortable === 'undefined') return;

  const sortable = Sortable.create(list, {
    animation: 180,
    handle: '.queue-row-handle',
    ghostClass: 'queue-row-ghost',
    chosenClass: 'queue-row-chosen',
    dragClass: 'queue-row-drag',
    onEnd: async () => {
      const order = Array.from(list.querySelectorAll('.queue-row')).map((el) => el.dataset.topic);
      // optimistic UI: show a tiny saving indicator
      const indicator = ensureIndicator();
      indicator.textContent = 'Saving order…';
      indicator.classList.remove('ok', 'err');
      try {
        const res = await fetch('/queue/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) throw new Error('save failed');
        const data = await res.json();
        indicator.textContent = 'Order saved · calendar updated ✓';
        indicator.classList.add('ok');
        // Re-render dates inline from the new schedule
        if (data.schedule) {
          const byTopic = Object.fromEntries(data.schedule.map((s) => [s.topic, s.date]));
          list.querySelectorAll('.queue-row').forEach((row) => {
            const dateEl = row.querySelector('.queue-row-date');
            const newDate = byTopic[row.dataset.topic];
            if (dateEl && newDate) {
              dateEl.textContent = formatDate(newDate);
              dateEl.classList.remove('unscheduled');
              dateEl.classList.add('scheduled');
            }
          });
        }
        setTimeout(() => indicator.classList.add('fade'), 1800);
      } catch (e) {
        indicator.textContent = 'Save failed — refresh to recover';
        indicator.classList.add('err');
      }
    },
  });
})();

function ensureIndicator() {
  let el = document.getElementById('reorder-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'reorder-indicator';
    el.className = 'reorder-indicator';
    document.body.appendChild(el);
  }
  el.classList.remove('fade');
  return el;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
