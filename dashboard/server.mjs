#!/usr/bin/env node
/**
 * AI in Business — Marketing HQ
 * Local-only Express server. No auth, no internet exposure.
 *
 * Start: npm run dashboard
 * Open:  http://localhost:5173
 *
 * Architecture:
 *   server.mjs        → bootstrap (this file)
 *   routes/           → one file per section, mounts URLs (GET pages + POST forms)
 *   views/            → one file per page, returns HTML strings
 *   lib/              → store, kit-parser, helpers (no Express knowledge here)
 *   data/             → JSON state on disk
 *   public/           → static CSS + tiny JS
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { mountRoutes } from './routes/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 5173;

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(PUBLIC_DIR));

mountRoutes(app);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🎯 AI in Business — Marketing HQ`);
  console.log(`   ${url}\n`);
  if (process.env.NO_OPEN !== '1') {
    open(url).catch(() => {});
  }
});
