import fs from 'fs';
import path from 'path';
import { QUEUE_DIR, UPLOADED_DIR } from '../lib/store.mjs';

/**
 * Serve mp4 files from queue/ and uploaded/ for in-page <video> previews.
 */
export function mediaRoutes(app) {
  app.get('/media/queue/:topic', (req, res) => {
    const filePath = path.join(QUEUE_DIR, `${req.params.topic}-final.mp4`);
    if (!filePath.startsWith(QUEUE_DIR) || !fs.existsSync(filePath)) {
      return res.status(404).send('Not found');
    }
    res.sendFile(filePath);
  });

  app.get('/media/uploaded/:topic', (req, res) => {
    const filePath = path.join(UPLOADED_DIR, req.params.topic, `${req.params.topic}-final.mp4`);
    if (!filePath.startsWith(UPLOADED_DIR) || !fs.existsSync(filePath)) {
      return res.status(404).send('Not found');
    }
    res.sendFile(filePath);
  });
}
