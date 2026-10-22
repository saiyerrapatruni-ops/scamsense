import http from 'http';
import { apiMiddleware } from './apiMiddleware.js';
import { isPgConfigured, initPostgresTables } from './db.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  apiMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, async () => {
  const pgActive = isPgConfigured();
  console.log(`=======================================================`);
  console.log(`[ScamSense Backend Server] Running on http://localhost:${PORT}`);
  if (pgActive) {
    console.log(`[Database Engine] PostgreSQL (Connected via DATABASE_URL)`);
    await initPostgresTables();
  } else {
    console.log(`[Database Engine] Local JSON (server/database.json)`);
    console.log(`[Tip] Add DATABASE_URL to your .env to enable PostgreSQL`);
  }
  console.log(`[Storage Structure]`);
  console.log(` - Messages (message) -> stored in 'message' column`);
  console.log(` - Web URLs (url)      -> stored in 'url' column`);
  console.log(` - Images (image)      -> stored in 'image' column`);
  console.log(`API Endpoints:`);
  console.log(` - GET  /api/db-status      : Database status & connection type`);
  console.log(` - POST /api/visitors/enter : Record visitor session`);
  console.log(` - POST /api/visitors/name  : Update visitor display name`);
  console.log(` - GET  /api/visitors       : Fetch all recorded visitors`);
  console.log(` - POST /api/scans          : Store scan in msg, url, or image`);
  console.log(` - GET  /api/scans          : Fetch scan history (?type=msg | url | image)`);
  console.log(` - DELETE /api/scans/:id    : Delete scan by ID`);
  console.log(`=======================================================`);
});
