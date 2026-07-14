import type { VercelRequest, VercelResponse } from "@vercel/node";
import sodium from "libsodium-wrappers";

const KEY_STRING = "komikverse-super-secure-key-32ch";
const apiTarget = process.env.VITE_API_TARGET || "https://api.shngm.io";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const urlObj = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const pathname = urlObj.pathname;
    const search = urlObj.search;
    
    const targetPath = pathname.replace(/^\/api\/v1\//, "");
    const targetUrl = `${apiTarget}/v1/${targetPath}${search}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText });
    }
    
    const rawData = await response.text();
    const encrypted = await encryptResponse(rawData);
    
    return res.status(200).json({ data: encrypted });
  } catch (err) {
    console.error("Vercel proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
