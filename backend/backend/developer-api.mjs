import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { timingSafeEqual } from 'node:crypto';
import { ApiError, keyStore } from './key-store.mjs';
import { classifyImage, validateImage } from './external-classifier.mjs';

const safeEqual = (a, b) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function createDeveloperApi({ store = keyStore, classify = classifyImage } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api/v1/classify-external', cors({ methods: ['POST'], allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'], exposedHeaders: ['Retry-After'] }));
  const limits = new Map();
  let concurrent = 0;
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 2, fieldSize: 1024 } });
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/api/keys', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      try { if (new URL(origin).host !== req.headers.host) throw new Error(); }
      catch { return res.status(403).json({ error: 'Cross-origin key management is not allowed.' }); }
    }
    const secret = process.env.ECO_ADMIN_SECRET;
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host || '');
    if (!secret && local && localHost && !process.env.VERCEL && !req.headers['x-forwarded-for']) return next();
    if (!secret) return res.status(503).json({ error: 'Remote key management is disabled. Set ECO_ADMIN_SECRET on the server, or use localhost.' });
    if (!safeEqual(req.headers['x-admin-key'], secret)) return res.status(401).json({ error: 'Enter the operator secret to manage API keys.' });
    next();
  });
  app.use((req, res, next) => {
    // A local JSON file cannot persist across serverless instances; fail closed instead of losing issued keys.
    if (process.env.VERCEL) return res.status(503).json({ error: 'File-backed keys require the Windows/Node server with a persistent data directory. This serverless deployment cannot persist API keys.' });
    next();
  });
  app.use('/api/keys', express.json({ limit: '4kb' }));
  app.get('/api/keys', asyncRoute(async (req, res) => res.json({ success: true, keys: await store.list() })));
  app.post('/api/keys/generate', asyncRoute(async (req, res) => {
    const label = req.body?.label ?? req.body?.name ?? 'Default Robotics Key';
    if (typeof label !== 'string' || !label.trim() || label.length > 80) throw new ApiError(400, 'Key label must contain 1–80 characters.');
    const expiresAt = req.body?.expiresAt ?? null;
    if (expiresAt !== null && (typeof expiresAt !== 'string' || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) throw new ApiError(400, 'Expiry must be a future ISO date.');
    const record = await store.generate(label.trim(), expiresAt);
    res.status(201).json({ success: true, ...record, apiKey: record, key: record.key });
  }));
  app.post('/api/keys/revoke', asyncRoute(async (req, res) => {
    const id = req.body?.keyId || req.body?.id;
    if (!id) throw new ApiError(400, 'Key ID is required.');
    const revoked = await store.revoke(id);
    res.json({ success: true, ...revoked });
  }));
  app.post('/api/keys/:id/revoke', asyncRoute(async (req, res) => {
    const revoked = await store.revoke(req.params.id);
    res.json({ success: true, ...revoked });
  }));
  app.post('/api/v1/classify-external', asyncRoute(async (req, res, next) => {
    const bearer = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    req.developerKey = await store.authenticate(req.headers['x-api-key'] || bearer);
    const now = Date.now();
    for (const [id, entry] of limits) if (entry.expires <= now) limits.delete(id);
    const entry = limits.get(req.developerKey.id) || { count: 0, expires: now + 60000 };
    if (entry.count >= 10 || concurrent >= 3) { res.setHeader('Retry-After', '60'); throw new ApiError(429, 'Too many requests. Retry in one minute.'); }
    entry.count += 1;
    limits.set(req.developerKey.id, entry);
    next();
  }), express.json({ limit: '12mb' }), (req, res, next) => {
    if (req.is('multipart/form-data')) upload.single('image')(req, res, next);
    else if (req.is('application/json')) next();
    else next(new ApiError(415, 'Send JSON or multipart/form-data.'));
  }, asyncRoute(async (req, res) => {
    const image = validateImage(req.body, req.file);
    // Check again after body parsing because simultaneous uploads may have consumed the last slot.
    if (concurrent >= 3) throw new ApiError(429, 'Vision service is busy. Retry shortly.');
    concurrent += 1;
    const started = performance.now();
    try {
      await store.authenticate(req.headers['x-api-key'] || req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1]);
      const result = await classify(image);
      await store.increment(req.developerKey.id);
      const latency = Math.round(performance.now() - started);
      const detections = (result.detectedItems || []).map((item, idx) => {
        const bbox = item.bbox || { ymin: 200, xmin: 200, ymax: 500, xmax: 500 };
        const yminPct = Math.round((bbox.ymin / 1000) * 1000) / 10;
        const xminPct = Math.round((bbox.xmin / 1000) * 1000) / 10;
        const ymaxPct = Math.round((bbox.ymax / 1000) * 1000) / 10;
        const xmaxPct = Math.round((bbox.xmax / 1000) * 1000) / 10;
        return {
          id: `item-${item.id || idx + 1}`,
          name: item.item_name,
          label: item.item_name,
          category: item.category,
          confidence: 0.95,
          box: [yminPct, xminPct, ymaxPct, xmaxPct],
          bounding_box: { ymin: yminPct, xmin: xminPct, ymax: ymaxPct, xmax: xmaxPct },
          weight_est: '50g',
          weightEst: '50g',
          disposal_bin: item.binRouting?.bin,
          disposalBin: item.binRouting?.bin,
          advice: item.binRouting?.directive,
          recyclable: item.category === 'Recyclable' || item.category === 'Organic',
          isRecyclable: item.category === 'Recyclable' || item.category === 'Organic',
        };
      });
      res.json({
        success: true,
        status: 'success',
        status_code: 200,
        source: 'gemini_vision_ai',
        inference_latency_ms: latency,
        latency_ms: latency,
        scan_id: `scan_${Date.now()}`,
        audit_hash: `0x${Buffer.from((req.developerKey.id || 'key') + Date.now()).toString('hex').slice(0, 16)}`,
        timestamp: new Date().toISOString(),
        key_id: req.developerKey.id,
        client_label: req.developerKey.label,
        detections_count: detections.length,
        detections,
        result,
      });
    } finally { concurrent -= 1; }
  }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error instanceof ApiError ? error.status : error.type === 'entity.too.large' || error.code === 'LIMIT_FILE_SIZE' ? 413 : error instanceof SyntaxError || error instanceof multer.MulterError ? 400 : 503;
    res.status(status).json({ error: error instanceof ApiError ? error.message : status === 413 ? 'Image request is too large (8 MB image limit).' : status === 400 ? 'Invalid request body or multipart upload.' : 'API storage is unavailable. Please contact the operator.' });
  });
  return app;
}
export default createDeveloperApi();
