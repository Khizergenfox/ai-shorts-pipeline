import { esc } from '../lib/helpers.mjs';

export function hooksView({ hooks }) {
  const items = hooks
    .map(
      (h) => `
        <div class="hook-item">
          <button type="button" class="copy-btn" data-copy>Copy</button>
          <pre class="hook-text caption-block-text">${esc(h.text)}</pre>
          ${h.tag ? `<span class="hook-tag">${esc(h.tag)}</span>` : ''}
          <form method="POST" action="/hooks/delete" class="inline-form" onsubmit="return confirm('Remove this hook?')">
            <input type="hidden" name="id" value="${esc(h.id)}" />
            <button type="submit" class="btn-danger btn btn-sm">×</button>
          </form>
        </div>
      `,
    )
    .join('');

  return `
    <div class="view-header">
      <div>
        <div class="view-title">Hooks</div>
        <div class="view-subtitle">Reusable opening line templates. Replace [bracketed] parts per video.</div>
      </div>
    </div>

    <form method="POST" action="/hooks/add" class="idea-form">
      <textarea name="text" placeholder="Hook template — use [brackets] for placeholders" required></textarea>
      <div class="idea-form-row">
        <input name="tag" placeholder="Tag (optional, e.g. 'contrarian')" />
        <div></div>
        <div></div>
        <button type="submit" class="btn">Add hook</button>
      </div>
    </form>

    <div class="hooks-list">${items}</div>
  `;
}
