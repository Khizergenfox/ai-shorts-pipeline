import { esc, fmtDate } from '../lib/helpers.mjs';
import { X_FREE_CHAR_LIMIT } from '../lib/store.mjs';

const PLATFORM_LABELS = {
  youtube: 'YT',
  instagram: 'IG',
  linkedin: 'LI',
  x: 'X',
};

export function queueListView({ orderedQueue, plan }) {
  if (orderedQueue.length === 0) {
    return `
      <div class="view-header">
        <div>
          <div class="view-title">Queue</div>
          <div class="view-subtitle">Videos rendered + approved, waiting to upload.</div>
        </div>
      </div>
      <div class="empty">
        <div class="empty-headline">Queue is empty.</div>
        <p>Render a new video and copy it to <code>out/final/queue/&lt;topic&gt;-final.mp4</code> with its publishing kit.</p>
      </div>
    `;
  }

  const cadenceNote = `${esc(plan.cadence || 'MWF')} cadence — drag rows to reorder. Top = next drop.`;

  const rows = orderedQueue
    .map((q) => {
      const platforms = ['youtube', 'instagram', 'linkedin', 'x']
        .map((p) => {
          const posted = q.posted?.[p];
          return `<span class="platform-pill ${posted ? 'posted' : ''}" title="${esc(p)}${posted ? ' — posted' : ''}">${PLATFORM_LABELS[p]}${posted ? ' ✓' : ''}</span>`;
        })
        .join('');

      const dateLabel = q.scheduledDate
        ? fmtDate(q.scheduledDate).label
        : 'unscheduled';
      const dateClass = q.scheduledDate ? 'scheduled' : 'unscheduled';

      return `
        <div class="queue-row" data-topic="${esc(q.topic)}">
          <div class="queue-row-handle" aria-label="Drag to reorder">≡</div>
          <video class="queue-row-thumb" src="${esc(q.videoUrl)}" preload="metadata" muted></video>
          <div class="queue-row-main">
            <div class="queue-row-title">${esc(q.topic)}</div>
            <div class="queue-row-meta">
              <span class="queue-row-date ${dateClass}">${esc(dateLabel)}</span>
              ${q.topicType ? `<span class="queue-row-type">${esc(q.topicType)}</span>` : ''}
              <span class="queue-row-size">${q.sizeMB} MB</span>
            </div>
          </div>
          <div class="queue-row-platforms">${platforms}</div>
          <a class="btn btn-sm" href="/queue/${esc(q.topic)}">Open →</a>
        </div>
      `;
    })
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Queue</div>
        <div class="view-subtitle">${cadenceNote}</div>
      </div>
    </div>
    <div class="queue-list" id="queue-sortable">${rows}</div>
    <p class="hint" style="margin-top:16px">Drag handle (≡) to reorder. Top of list drops first; calendar dates auto-recompute on the cadence.</p>
  `;
}

export function queueDetailView({ item, plan }) {
  if (!item) {
    return `<div class="empty"><div class="empty-headline">Not found.</div></div>`;
  }

  const kit = item.kit || {};
  const yt = kit.youtube || {};
  const ig = kit.instagram || {};
  const li = kit.linkedin || {};
  const x = kit.x || {};
  const scheduled = (plan.schedule || []).find((s) => s.topic === item.topic);

  const platformBlock = (label, platformId, content, posted) => {
    const isPosted = !!posted;
    return `
      <section class="platform-section ${isPosted ? 'is-posted' : ''}" id="section-${platformId}">
        <div class="platform-section-head">
          <h2>${esc(label)}</h2>
          ${
            isPosted
              ? `<span class="status-pill status-pill-done">Posted ✓ ${posted.url ? `<a href="${esc(posted.url)}" target="_blank" rel="noopener">view</a>` : ''}</span>`
              : `<span class="status-pill">Not yet posted</span>`
          }
        </div>
        ${content}
        <div class="mark-form-wrapper">
          ${
            isPosted
              ? `
                <form method="POST" action="/queue/${esc(item.topic)}/unmark" class="inline-form">
                  <input type="hidden" name="platform" value="${platformId}" />
                  <button type="submit" class="btn-ghost btn btn-sm">Undo posted</button>
                </form>
              `
              : `
                <form method="POST" action="/queue/${esc(item.topic)}/mark" class="mark-form">
                  <div class="form-label">Mark as posted on ${esc(label)}</div>
                  <div class="mark-form-row">
                    <input type="hidden" name="platform" value="${platformId}" />
                    <input name="url" placeholder="Paste the post URL after uploading" required />
                    <button type="submit" class="btn btn-sm">Mark posted</button>
                  </div>
                </form>
              `
          }
        </div>
      </section>
    `;
  };

  const ytContent = `
    ${captionBlock('Title', yt.title)}
    ${captionBlock('Description', yt.description)}
    ${yt.tags ? captionBlock('Tags', yt.tags) : ''}
    ${yt.pinnedComment ? captionBlock('Pinned comment (post immediately after upload)', yt.pinnedComment) : ''}
    <div class="caption-meta">Window: ${esc(plan.postWindows?.youtube?.start || '19:30')}–${esc(plan.postWindows?.youtube?.end || '21:30')} ${esc(plan.postWindows?.youtube?.tz || 'IST')}</div>
  `;

  const igContent = `
    ${captionBlock('Caption', ig.caption)}
    ${ig.firstComment ? captionBlock('First comment (post within 30 sec of publishing)', ig.firstComment) : ''}
    <div class="caption-meta">Window: ${esc(plan.postWindows?.instagram?.start || '20:00')}–${esc(plan.postWindows?.instagram?.end || '22:00')} ${esc(plan.postWindows?.instagram?.tz || 'IST')}</div>
  `;

  const liContent = `
    ${captionBlock('Caption', li.caption)}
    <div class="caption-meta">Window: ${esc(plan.postWindows?.linkedin?.start || '08:30')}–${esc(plan.postWindows?.linkedin?.end || '10:30')} ${esc(plan.postWindows?.linkedin?.tz || 'IST')} · upload as <strong>native video</strong>, never link to YT</div>
  `;

  // X section: tweet (with char counter) + optional thread followups
  const xTweetBlock = x.tweet
    ? captionBlockWithCounter('Tweet', x.tweet, X_FREE_CHAR_LIMIT)
    : `<div class="caption-block caption-block-empty"><div class="caption-block-label">Tweet</div><div class="caption-block-text" style="color:#6b7480">— add a "## X (Twitter)" section with "### Tweet" to your kit —</div></div>`;
  const xThreadBlocks = (x.threadFollowups || [])
    .map((t, i) => captionBlockWithCounter(`Thread reply ${i + 1}`, t, X_FREE_CHAR_LIMIT))
    .join('');
  const xContent = `
    ${xTweetBlock}
    ${xThreadBlocks}
    <div class="caption-meta">Window: ${esc(plan.postWindows?.x?.start || '09:00')}–${esc(plan.postWindows?.x?.end || '11:00')} ${esc(plan.postWindows?.x?.tz || 'IST')} · free account = ${X_FREE_CHAR_LIMIT} chars/tweet</div>
  `;

  return `
    <div class="view-header">
      <div>
        <div class="view-title">${esc(item.topic)}</div>
        <div class="view-subtitle">
          ${item.sizeMB} MB · queued ${esc(new Date(item.mtime).toLocaleString())}
          ${scheduled ? ` · scheduled ${esc(scheduled.date)} (${esc(scheduled.topicType || 'untyped')})` : ''}
        </div>
      </div>
      <div>
        <a class="btn-ghost btn btn-sm" href="/queue">← all queued</a>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-video">
        <video src="${esc(item.videoUrl)}" controls preload="metadata"></video>
        ${filePathBlock(item)}
      </div>
      <div class="detail-platforms">
        ${platformBlock('YouTube Shorts', 'youtube', ytContent, item.posted?.youtube)}
        ${platformBlock('Instagram Reels', 'instagram', igContent, item.posted?.instagram)}
        ${platformBlock('LinkedIn', 'linkedin', liContent, item.posted?.linkedin)}
        ${platformBlock('X (Twitter)', 'x', xContent, item.posted?.x)}
      </div>
    </div>
  `;
}

/**
 * File-path panel under the video preview. Shows the absolute paths of the
 * .mp4 + publishing-kit and gives one-click "show in Explorer" buttons.
 * Local-only — only meaningful because the server runs on the user's machine.
 */
function filePathBlock(item) {
  const topic = esc(item.topic);
  const videoPath = item.videoPath || '';
  const kitPath = item.kitPath || '';
  const folderPath = item.folderPath || '';

  const pathRow = (label, fullPath, type) => {
    if (!fullPath) {
      return `
        <div class="path-row path-row-empty">
          <span class="path-row-label">${esc(label)}</span>
          <span class="path-row-text">— missing —</span>
        </div>
      `;
    }
    return `
      <div class="path-row">
        <span class="path-row-label">${esc(label)}</span>
        <code class="path-row-text" title="${esc(fullPath)}">${esc(fullPath)}</code>
        <button type="button" class="btn-tiny copy-path-btn" data-copy-path="${esc(fullPath)}" title="Copy path to clipboard">Copy</button>
        <button type="button" class="btn-tiny reveal-btn" data-reveal-topic="${topic}" data-reveal-type="${type}" title="Show in Explorer">Reveal</button>
      </div>
    `;
  };

  return `
    <div class="file-paths">
      <div class="file-paths-head">
        <span class="file-paths-title">On disk</span>
        <button type="button" class="btn-tiny reveal-btn" data-reveal-topic="${topic}" data-reveal-type="folder" title="Open the queue folder">Open folder ↗</button>
      </div>
      ${pathRow('Video', videoPath, 'video')}
      ${pathRow('Kit', kitPath, 'kit')}
      <div class="path-hint">Folder: <code>${esc(folderPath)}</code></div>
    </div>
  `;
}

function captionBlock(label, text) {
  if (!text) {
    return `<div class="caption-block caption-block-empty"><div class="caption-block-label">${esc(label)}</div><div class="caption-block-text" style="color:#6b7480">— not in kit —</div></div>`;
  }
  return `
    <div class="caption-block">
      <div class="caption-block-label">${esc(label)}</div>
      <button type="button" class="copy-btn" data-copy>Copy</button>
      <pre class="caption-block-text">${esc(text)}</pre>
    </div>
  `;
}

function captionBlockWithCounter(label, text, limit) {
  const len = text.length;
  const over = len > limit;
  const counterClass = over ? 'over' : len > limit * 0.9 ? 'warn' : 'ok';
  return `
    <div class="caption-block">
      <div class="caption-block-label">
        ${esc(label)}
        <span class="char-counter ${counterClass}">${len} / ${limit}${over ? ` · ${len - limit} over` : ''}</span>
      </div>
      <button type="button" class="copy-btn" data-copy>Copy</button>
      <pre class="caption-block-text">${esc(text)}</pre>
    </div>
  `;
}
