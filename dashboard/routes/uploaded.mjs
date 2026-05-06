import { listUploaded, getUploadedItem } from '../lib/store.mjs';
import { layout } from '../views/_layout.mjs';
import { uploadedListView, uploadedDetailView } from '../views/uploaded.mjs';
import { sidebarCounts } from './_counts.mjs';

export function uploadedRoutes(app) {
  app.get('/uploaded', async (_req, res) => {
    const items = await listUploaded();
    res.send(
      layout({
        active: 'uploaded',
        title: 'Uploaded',
        body: uploadedListView({ items }),
        counts: await sidebarCounts(),
      }),
    );
  });

  app.get('/uploaded/:topic', async (req, res) => {
    const item = await getUploadedItem(req.params.topic);
    if (!item) return res.status(404).send('Not found');
    res.send(
      layout({
        active: 'uploaded',
        title: item.topic,
        body: uploadedDetailView({ item }),
        counts: await sidebarCounts(),
      }),
    );
  });
}
