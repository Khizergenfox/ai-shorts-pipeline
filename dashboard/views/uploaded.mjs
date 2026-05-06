import { esc } from '../lib/helpers.mjs';

export function uploadedListView({ items }) {
  if (items.length === 0) {
    return `
      <div class="view-header">
        <div>
          <div class="view-title">Uploaded</div>
          <div class="view-subtitle">Posts that went live on all 3 platforms.</div>
        </div>
      </div>
      <div class="empty">
        <div class="empty-headline">Nothing uploaded yet.</div>
        <p>When you mark a queued video as posted on all 3 platforms, it shows up here.</p>
      </div>
    `;
  }

  const rows = items
    .sort((a, b) => {
      const da = a.posted?.youtube?.uploadedAt || a.posted?.instagram?.uploadedAt || '';
      const db = b.posted?.youtube?.uploadedAt || b.posted?.instagram?.uploadedAt || '';
      return db.localeCompare(da);
    })
    .map((item) => {
      const yt = item.posted?.youtube;
      const ig = item.posted?.instagram;
      const li = item.posted?.linkedin;
      const x = item.posted?.x;
      const dateAny = (yt || ig || li || x)?.uploadedAt;
      return `
        <a class="uploaded-row" href="/uploaded/${esc(item.topic)}">
          <div class="uploaded-row-topic">${esc(item.topic)}</div>
          <div class="uploaded-row-date">${dateAny ? esc(new Date(dateAny).toLocaleDateString()) : '—'}</div>
          <div class="uploaded-row-platforms">
            ${platformLink('YT', yt)}
            ${platformLink('IG', ig)}
            ${platformLink('LI', li)}
            ${platformLink('X', x)}
          </div>
        </a>
      `;
    })
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Uploaded</div>
        <div class="view-subtitle">${items.length} post${items.length > 1 ? 's' : ''} live.</div>
      </div>
    </div>
    <div class="uploaded-list">${rows}</div>
  `;
}

function platformLink(label, posted) {
  if (!posted) return `<span class="platform-pill">${label}</span>`;
  return `<a href="${esc(posted.url || '#')}" target="_blank" rel="noopener" class="platform-pill posted" onclick="event.stopPropagation()">${label} ✓</a>`;
}

export function uploadedDetailView({ item }) {
  if (!item) return `<div class="empty"><div class="empty-headline">Not found</div></div>`;

  const platforms = ['youtube', 'instagram', 'linkedin', 'x'];
  const platformLabels = {
    youtube: 'YouTube Shorts',
    instagram: 'Instagram Reels',
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
  };
  const blocks = platforms
    .map((p) => {
      const data = item.posted?.[p];
      const label = platformLabels[p];
      if (!data) {
        return `
          <section class="platform-section">
            <div class="platform-section-head">
              <h2>${label}</h2>
              <span class="status-pill">Not posted</span>
            </div>
          </section>
        `;
      }
      return `
        <section class="platform-section is-posted">
          <div class="platform-section-head">
            <h2>${label}</h2>
            <span class="status-pill status-pill-done">Posted ✓</span>
          </div>
          <div class="caption-block">
            <div class="caption-block-label">Live URL</div>
            <a href="${esc(data.url)}" target="_blank" rel="noopener" class="caption-block-text" style="color:#ff8c5a">${esc(data.url)}</a>
          </div>
          <div class="caption-meta">Posted ${esc(new Date(data.uploadedAt).toLocaleString())}</div>
          <a class="btn-ghost btn btn-sm" href="/performance?topic=${esc(item.topic)}&platform=${p}">Log performance →</a>
        </section>
      `;
    })
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">${esc(item.topic)}</div>
        <div class="view-subtitle">Uploaded post</div>
      </div>
      <div><a class="btn-ghost btn btn-sm" href="/uploaded">← all uploaded</a></div>
    </div>
    <div class="detail-grid">
      ${item.videoUrl ? `<div class="detail-video"><video src="${esc(item.videoUrl)}" controls preload="metadata"></video></div>` : ''}
      <div class="detail-platforms">${blocks}</div>
    </div>
  `;
}
