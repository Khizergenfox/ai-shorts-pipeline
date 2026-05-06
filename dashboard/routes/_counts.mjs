/**
 * Sidebar badge counts. Computed fresh on every request.
 */

import { listQueue, readJson, PLATFORMS } from '../lib/store.mjs';

export async function sidebarCounts() {
  const queue = await listQueue();
  const ideas = await readJson('ideas.json', { ideas: [] });

  const queuePending = queue.filter((q) =>
    PLATFORMS.some((p) => !q.posted?.[p]),
  ).length;
  // (PLATFORMS already includes 'x')
  const ideasOpen = (ideas.ideas || []).filter((i) => i.status !== 'done').length;

  return {
    queue: queuePending || queue.length,
    ideas: ideasOpen,
    today: queuePending,
  };
}
