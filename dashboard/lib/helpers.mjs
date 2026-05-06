/**
 * Small string + date helpers used across views.
 * Keeping HTML escaping centralized here.
 */

export function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escAttr(s) {
  return esc(s);
}

// All date helpers use UTC under the hood to avoid timezone-shift bugs.
// ISO strings ('YYYY-MM-DD') are treated as calendar days, no time component.

function utcFromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Convert "2026-05-04" → { date, dow, label }
export function fmtDate(iso) {
  const d = utcFromIso(iso);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    date: iso,
    dow: dayNames[d.getUTCDay()],
    label: `${dayNames[d.getUTCDay()]}, ${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`,
    monthDay: `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`,
    dowIndex: d.getUTCDay(),
  };
}

export function todayIso() {
  // Use local-day (not UTC) so "today" matches what the user sees on their wall clock
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(iso, n) {
  const d = utcFromIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Day-of-week strategic mode (the brand cadence)
export function modeForDow(dow) {
  return [
    { mode: 'ideate', label: 'Reset & plan', tagline: 'Review last week. Capture 3 ideas. Outline next.' },        // Sun
    { mode: 'post', label: 'Drop news', tagline: 'Best day for analysis/news posts. Audience is fresh.' },         // Mon
    { mode: 'engage', label: 'Engage only', tagline: "Don't post. Reply to yesterday's comments." },               // Tue
    { mode: 'post', label: 'Drop tutorial', tagline: 'Tools/tutorials hit hardest mid-week.' },                    // Wed
    { mode: 'engage', label: 'Engage + ideate', tagline: 'Reply to yesterday. Capture ideas from comments.' },     // Thu
    { mode: 'post', label: 'Drop opinion', tagline: 'Hot take performs into the weekend.' },                       // Fri
    { mode: 'rest', label: 'Rest', tagline: 'Algorithm is quieter. Live your life.' },                             // Sat
  ][dow];
}

// Topic type → best day guidance
export function bestDayFor(topicType) {
  return {
    news: 'Monday',
    tutorial: 'Wednesday',
    opinion: 'Friday',
    data: 'Tue/Thu (LinkedIn-heavy)',
  }[topicType] || 'Any post day';
}

// Pretty-print MM-DD-HH-mm
export function fmtTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Cadence string ("MWF", "MTWThF", "MWFSu") → set of allowed day-of-week indices.
 * M=1, T=2, W=3, Th=4, F=5, Sa=6, Su=0
 */
export function cadenceToDows(cadence) {
  const out = new Set();
  const s = (cadence || 'MWF').replace(/Su/g, 'U').replace(/Th/g, 'H'); // collapse 2-letter day names
  for (const ch of s) {
    if (ch === 'M') out.add(1);
    else if (ch === 'T') out.add(2);
    else if (ch === 'W') out.add(3);
    else if (ch === 'H') out.add(4);
    else if (ch === 'F') out.add(5);
    else if (ch === 'S') out.add(6);
    else if (ch === 'U') out.add(0);
  }
  if (out.size === 0) {
    [1, 3, 5].forEach((d) => out.add(d));
  }
  return out;
}

/**
 * Days between two ISO dates (positive if to > from).
 */
export function daysBetween(fromIso, toIso) {
  const f = utcFromIso(fromIso);
  const t = utcFromIso(toIso);
  return Math.round((t - f) / (1000 * 60 * 60 * 24));
}

/**
 * Compute target date for a roadmap milestone trigger.
 * Returns ISO string or null if not date-resolvable (manual triggers).
 */
export function computeMilestoneDate(item, launchDate) {
  const t = item.trigger;
  if (!t) return null;
  if (t.kind === 'date') return t.value;
  if (t.kind === 'day-count' && launchDate) return addDaysIso(launchDate, Number(t.value) || 0);
  return null;
}

/**
 * Next N post-dates from `fromIso` (inclusive), filtered to cadence DOWs.
 * Returns array of ISO date strings (YYYY-MM-DD), length === count.
 */
export function nextPostDates(fromIso, count, cadence = 'MWF') {
  const dows = cadenceToDows(cadence);
  const out = [];
  let cursor = fromIso;
  let safety = 0;
  while (out.length < count && safety < 365) {
    const d = utcFromIso(cursor);
    if (dows.has(d.getUTCDay())) out.push(cursor);
    cursor = addDaysIso(cursor, 1);
    safety++;
  }
  return out;
}
