import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// This custom plugin creates a server-side proxy to bypass CORS issues.
// It listens for requests to /api/check-status, extracts the target URL,
// and performs a server-to-server fetch to check its status.
function apiProxy(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/check-status', async (req, res) => {
        const urlToProxy = req.url?.split('?url=')[1];

        if (!urlToProxy) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'URL parameter is missing' }));
          return;
        }

        try {
          const decodedUrl = decodeURIComponent(urlToProxy);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

          // Use a HEAD request for efficiency - we only need the status code.
          const response = await fetch(decodedUrl, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow', // Follow redirects to get the final status
          });

          clearTimeout(timeoutId);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: response.status }));
        } catch (error) {
          // Treat any network error (timeout, DNS failure, etc.) as "not found"
          res.statusCode = 200; // Respond to the client successfully
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 404 }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiProxy()],
  server: {
    hmr: {
      // This configuration is essential for HMR to work correctly in a 
      // proxied environment like StackBlitz WebContainers. It tells the
      // Vite client to connect to the public-facing HTTPS port (443).
      clientPort: 443,
    },
  },
});
