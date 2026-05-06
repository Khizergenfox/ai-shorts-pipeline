/**
 * Filesystem-backed JSON store + queue/uploaded readers.
 * All persistence goes through here so views/routes never touch fs directly.
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseKit } from './kit-parser.mjs';
import { nextPostDates, todayIso } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const QUEUE_DIR = path.join(PROJECT_ROOT, 'out/final/queue');
export const UPLOADED_DIR = path.join(PROJECT_ROOT, 'out/final/uploaded');
export const DATA_DIR = path.join(__dirname, '..', 'data');

export const PLATFORMS = ['youtube', 'instagram', 'linkedin', 'x'];

/** Free X (Twitter) account: 280-char limit per tweet. */
export const X_FREE_CHAR_LIMIT = 280;

// ---------- generic JSON store ----------

export async function readJson(filename, fallback) {
  try {
    return JSON.parse(await fsp.readFile(path.join(DATA_DIR, filename), 'utf8'));
  } catch {
    return fallback;
  }
}

export async function writeJson(filename, data) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

// ---------- queue (videos waiting to upload) ----------

export async function listQueue() {
  if (!fs.existsSync(QUEUE_DIR)) return [];
  const files = await fsp.readdir(QUEUE_DIR);
  const videos = files.filter((f) => f.endsWith('-final.mp4'));
  const items = [];
  for (const v of videos) {
    const topic = v.replace(/-final\.mp4$/, '');
    const item = await getQueueItem(topic);
    if (item) items.push(item);
  }
  return items;
}

export async function getQueueItem(topic) {
  const videoPath = path.join(QUEUE_DIR, `${topic}-final.mp4`);
  if (!fs.existsSync(videoPath)) {
    // Maybe already moved to uploaded?
    return null;
  }
  const kitPath = path.join(QUEUE_DIR, `${topic}-publishing-kit.md`);
  let kit = null;
  if (fs.existsSync(kitPath)) {
    try {
      kit = parseKit(await fsp.readFile(kitPath, 'utf8'));
    } catch (e) {
      kit = { error: e.message };
    }
  }
  const stat = await fsp.stat(videoPath);
  const posted = await getPostedSidecar(topic);
  return {
    topic,
    videoFile: `${topic}-final.mp4`,
    videoUrl: `/media/queue/${encodeURIComponent(topic)}`,
    videoPath, // absolute path on disk — used by reveal-in-explorer
    kitPath: fs.existsSync(kitPath) ? kitPath : null,
    folderPath: QUEUE_DIR,
    sizeMB: +(stat.size / 1024 / 1024).toFixed(1),
    mtime: stat.mtime,
    kit,
    posted,
    location: 'queue',
  };
}

// ---------- uploaded ----------

export async function listUploaded() {
  if (!fs.existsSync(UPLOADED_DIR)) return [];
  const dirs = await fsp.readdir(UPLOADED_DIR, { withFileTypes: true });
  const items = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const item = await getUploadedItem(d.name);
    if (!item) continue;
    // Only include items where at least one platform actually posted
    const hasAnyPost = Object.values(item.posted || {}).some(Boolean);
    if (!hasAnyPost) continue;
    items.push(item);
  }
  return items;
}

export async function getUploadedItem(topic) {
  const dir = path.join(UPLOADED_DIR, topic);
  if (!fs.existsSync(dir)) return null;
  const posted = await getPostedSidecar(topic);
  const videoPath = path.join(dir, `${topic}-final.mp4`);
  const kitPath = path.join(dir, `${topic}-publishing-kit.md`);
  let kit = null;
  if (fs.existsSync(kitPath)) {
    try {
      kit = parseKit(await fsp.readFile(kitPath, 'utf8'));
    } catch (e) {
      kit = { error: e.message };
    }
  }
  return {
    topic,
    posted,
    kit,
    videoUrl: fs.existsSync(videoPath) ? `/media/uploaded/${encodeURIComponent(topic)}` : null,
    videoPath: fs.existsSync(videoPath) ? videoPath : null,
    kitPath: fs.existsSync(kitPath) ? kitPath : null,
    folderPath: dir,
    location: 'uploaded',
  };
}

// ---------- posted sidecar (per-topic platform tracking) ----------

export async function getPostedSidecar(topic) {
  const path1 = path.join(UPLOADED_DIR, topic, 'posted.json');
  if (fs.existsSync(path1)) {
    try {
      return JSON.parse(await fsp.readFile(path1, 'utf8'));
    } catch {}
  }
  return {};
}

export async function setPosted(topic, platform, payload) {
  if (!PLATFORMS.includes(platform)) throw new Error(`unknown platform ${platform}`);
  const dir = path.join(UPLOADED_DIR, topic);
  await fsp.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'posted.json');
  let posted = {};
  try {
    posted = JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {}
  posted[platform] = {
    ...payload,
    uploadedAt: new Date().toISOString(),
  };
  await fsp.writeFile(file, JSON.stringify(posted, null, 2), 'utf8');

  // If all platforms posted, move video + kit out of queue
  const allDone = PLATFORMS.every((p) => posted[p]);
  if (allDone) {
    const videoSrc = path.join(QUEUE_DIR, `${topic}-final.mp4`);
    const kitSrc = path.join(QUEUE_DIR, `${topic}-publishing-kit.md`);
    if (fs.existsSync(videoSrc)) {
      await fsp.rename(videoSrc, path.join(dir, `${topic}-final.mp4`));
    }
    if (fs.existsSync(kitSrc)) {
      await fsp.rename(kitSrc, path.join(dir, `${topic}-publishing-kit.md`));
    }
  }

  return { posted, allDone };
}

export async function unsetPosted(topic, platform) {
  const file = path.join(UPLOADED_DIR, topic, 'posted.json');
  if (!fs.existsSync(file)) return {};
  const posted = JSON.parse(await fsp.readFile(file, 'utf8'));
  delete posted[platform];
  await fsp.writeFile(file, JSON.stringify(posted, null, 2), 'utf8');
  return posted;
}

// ---------- combined view: everything Khizer might want to see ----------

export async function listAllVideos() {
  const queue = await listQueue();
  const uploaded = await listUploaded();
  return { queue, uploaded };
}

// ---------- queue ordering + cadence-driven schedule ----------

/**
 * Given the queue and the current plan, return queue items in their release order.
 *
 * Order rules (in priority):
 *   1. Items present in plan.queueOrder, in that order
 *   2. Items present in plan.schedule (by date asc) but not in queueOrder
 *   3. Items in queue but neither in queueOrder nor schedule (alphabetical), at the end
 *
 * Each returned item is augmented with `scheduledDate` (string|null) — the date
 * computed by pairing position in queueOrder with the next-N post-dates from today.
 */
export async function getOrderedQueue() {
  const queue = await listQueue();
  const plan = await readJson('plan.json', { schedule: [], queueOrder: [], cadence: 'MWF' });

  const cadence = plan.cadence || 'MWF';
  const queueByTopic = Object.fromEntries(queue.map((q) => [q.topic, q]));

  const order = [];
  const seen = new Set();

  // 1. Pinned order
  for (const topic of plan.queueOrder || []) {
    if (queueByTopic[topic] && !seen.has(topic)) {
      order.push(queueByTopic[topic]);
      seen.add(topic);
    }
  }

  // 2. Scheduled but not in queueOrder
  for (const sch of (plan.schedule || []).slice().sort((a, b) => a.date.localeCompare(b.date))) {
    if (queueByTopic[sch.topic] && !seen.has(sch.topic)) {
      order.push(queueByTopic[sch.topic]);
      seen.add(sch.topic);
    }
  }

  // 3. Remaining queue items (alphabetical)
  for (const item of queue.slice().sort((a, b) => a.topic.localeCompare(b.topic))) {
    if (!seen.has(item.topic)) {
      order.push(item);
      seen.add(item.topic);
    }
  }

  // Compute scheduledDate per item from cadence + position
  const today = todayIso();
  const dates = nextPostDates(today, order.length, cadence);
  for (let i = 0; i < order.length; i++) {
    order[i].scheduledDate = dates[i] || null;
    // Also surface the rationale if a manual entry exists for this topic
    const manualSch = (plan.schedule || []).find((s) => s.topic === order[i].topic);
    order[i].topicType = manualSch?.topicType || '';
    order[i].rationale = manualSch?.rationale || '';
  }
  return order;
}

/**
 * Persist a new queue order. Topics not in the queue are filtered out.
 * Also rebuilds plan.schedule from cadence + new order so calendar stays in sync.
 */
export async function setQueueOrder(orderedTopics) {
  const queue = await listQueue();
  const validTopics = new Set(queue.map((q) => q.topic));
  const cleanOrder = orderedTopics.filter((t) => validTopics.has(t));

  const plan = await readJson('plan.json', { schedule: [], queueOrder: [], cadence: 'MWF' });
  plan.queueOrder = cleanOrder;

  // Rebuild schedule entries for these topics, preserving topicType + rationale if set
  const today = todayIso();
  const dates = nextPostDates(today, cleanOrder.length, plan.cadence || 'MWF');

  const oldByTopic = Object.fromEntries((plan.schedule || []).map((s) => [s.topic, s]));
  plan.schedule = cleanOrder.map((topic, i) => {
    const old = oldByTopic[topic] || {};
    return {
      date: dates[i],
      topic,
      topicType: old.topicType || '',
      rationale: old.rationale || '',
      platforms: old.platforms || ['youtube', 'instagram', 'linkedin', 'x'],
    };
  });

  await writeJson('plan.json', plan);
  return plan;
}
