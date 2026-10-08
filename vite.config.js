import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function devApiPlugin() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { message, detectedItems = [], frontendReport = '' } = JSON.parse(body || '{}');
              const msgLower = (message || '').toLowerCase();
              let reply = '';
              if (msgLower.includes('cap') || msgLower.includes('lid')) {
                reply = 'Plastic caps should generally be screwed tightly back onto plastic bottles before placing them in the Blue Recycling Bin. Empty all liquid completely first so the bottle can be compacted properly!';
              } else if (msgLower.includes('battery') || msgLower.includes('lithium') || msgLower.includes('hazard') || msgLower.includes('e-waste')) {
                reply = 'Lithium-ion and rechargeable batteries must NEVER be placed in curbside recycling or trash—they cause severe facility fires. Please tape the terminals with clear tape and drop them off at a local municipal e-waste depot or participating retail store (e.g. Best Buy, Home Depot).';
              } else if (msgLower.includes('pizza') || msgLower.includes('grease') || msgLower.includes('food')) {
                reply = 'Grease-soaked paper or pizza boxes cannot be recycled into new paper pulp. Tear off the clean top lid for the Blue Recycling Bin, and place the greasy bottom box into the Green Compost Bin or Landfill!';
              } else if (msgLower.includes('bag') || msgLower.includes('film') || msgLower.includes('soft plastic')) {
                reply = 'Plastic grocery bags and plastic wrap tangle sorting machinery at MRF facilities. Do NOT put them in curbside bins. Collect clean dry bags and drop them in grocery store plastic film collection bins.';
              } else if (detectedItems.length > 0) {
                const itemNames = detectedItems.map(i => i.item_name).join(', ');
                reply = `Based on your scanned scene (${itemNames}): Ensure all recyclable containers are rinsed and dry. Place items into their color-coded bins according to the table summary.`;
              } else {
                reply = 'Keep recyclables clean, dry, and empty! Blue is for Recyclables, Green for Compost, Gray for Landfill, and Orange for Hazardous materials. Let me know if you need specific advice for any material.';
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply, source: 'vite_dev_ai' }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    devApiPlugin()
  ],
  server: {
    port: 3000,
    host: true
  }
})

