import { exec } from 'child_process';
import path from 'path';
import {
  getQueueItem,
  getOrderedQueue,
  setQueueOrder,
  readJson,
  setPosted,
  unsetPosted,
  getUploadedItem,
} from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { queueListView, queueDetailView } from '../views/queue.mjs';
import { sidebarCounts } from './_counts.mjs';

/**
 * Open Windows Explorer with the given file selected, or open a folder directly.
 * Local-only by design — the dashboard server is bound to localhost.
 */
function revealInExplorer(targetPath, { isFolder = false } = {}) {
  return new Promise((resolve, reject) => {
    const normalized = path.normalize(targetPath);
    // Windows: explorer /select,"path" highlights the file inside its folder.
    // For folders, open them directly. Spawn detached so it doesn't block the
    // server. Note: explorer.exe returns exit code 1 even on success — ignore it.
    const cmd = isFolder
      ? `explorer "${normalized}"`
      : `explorer /select,"${normalized}"`;
    exec(cmd, () => resolve()); // ignore non-zero exit (explorer always returns 1)
  });
}

export function queueRoutes(app) {
  // List
  app.get('/queue', async (_req, res) => {
    const orderedQueue = await getOrderedQueue();
    const plan = await readJson('plan.json', { schedule: [], cadence: 'MWF' });
    res.send(
      layout({
        active: 'queue',
        title: 'Queue',
        body: queueListView({ orderedQueue, plan }),
        counts: await sidebarCounts(),
      }),
    );
  });

  // Detail
  app.get('/queue/:topic', async (req, res) => {
    const item = await getQueueItem(req.params.topic);
    const plan = await readJson('plan.json', { schedule: [], postWindows: {} });

    if (!item) {
      return res.redirect(302, `/uploaded/${encodeURIComponent(req.params.topic)}`);
    }

    res.send(
      layout({
        active: 'queue',
        title: item.topic,
        body: queueDetailView({ item, plan }),
        counts: await sidebarCounts(),
      }),
    );
  });

  // Reorder (called from drag-and-drop)
  app.post('/queue/reorder', async (req, res) => {
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
    try {
      const plan = await setQueueOrder(order);
      res.json({ ok: true, schedule: plan.schedule });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mark posted
  app.post('/queue/:topic/mark', async (req, res) => {
    const { platform, url, notes } = req.body || {};
    if (!platform || !url) return res.status(400).send('platform + url required');
    try {
      await setPosted(req.params.topic, platform, { url, notes: notes || '' });
    } catch (e) {
      return res.status(400).send(e.message);
    }
    res.redirect(302, `/queue/${encodeURIComponent(req.params.topic)}`);
  });

  // Undo posted
  app.post('/queue/:topic/unmark', async (req, res) => {
    const { platform } = req.body || {};
    if (!platform) return res.status(400).send('platform required');
    await unsetPosted(req.params.topic, platform);
    res.redirect(302, `/queue/${encodeURIComponent(req.params.topic)}`);
  });

  // Reveal in Windows Explorer.
  // type=video → opens the queue folder with the .mp4 selected
  // type=kit   → opens the queue folder with the publishing-kit.md selected
  // type=folder → opens the queue folder itself
  // Falls back to uploaded/ if the topic has already been moved.
  app.post('/queue/:topic/reveal', async (req, res) => {
    const { type = 'video' } = req.body || {};
    const item =
      (await getQueueItem(req.params.topic)) ||
      (await getUploadedItem(req.params.topic));
    if (!item) return res.status(404).json({ error: 'topic not found' });

    let target = null;
    let isFolder = false;
    if (type === 'video' && item.videoPath) {
      target = item.videoPath;
    } else if (type === 'kit' && item.kitPath) {
      target = item.kitPath;
    } else if (type === 'folder' && item.folderPath) {
      target = item.folderPath;
      isFolder = true;
    }

    if (!target) return res.status(404).json({ error: `${type} path missing` });
    await revealInExplorer(target, { isFolder });
    res.json({ ok: true, opened: target });
  });
}
