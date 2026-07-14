import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import sodium from "libsodium-wrappers"

const KEY_STRING = "komikverse-super-secure-key-32ch";
async function encryptResponse(plaintext: string): Promise<string> {
  await sodium.ready;
  const key = sodium.from_string(KEY_STRING);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || "https://api.shngm.io";

  return {
    base: '/',
    plugins: [
      inspectAttr(),
      react(),
      {
        name: "api-encryption-proxy",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            console.log(`[Vite Middleware] Intercepted: ${req.url}`);
            if (req.url && req.url.startsWith("/api/v1")) {
              try {
                const targetPath = req.url.replace(/^\/api\/v1\//, "");
                const targetUrl = `${apiTarget}/v1/${targetPath}`;
                
                const response = await fetch(targetUrl, {
                  method: req.method,
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
                
                if (!response.ok) {
                  res.statusCode = response.status;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: response.statusText }));
                  return;
                }
                
                const rawData = await response.text();
                const encrypted = await encryptResponse(rawData);
                
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ data: encrypted }));
              } catch (err) {
                console.error("Vite proxy error:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Internal server error" }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
