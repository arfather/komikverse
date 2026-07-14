import sodium from "libsodium-wrappers";

export const KEY_STRING = "komikverse-super-secure-key-32ch";

export async function encryptData(plaintext: string): Promise<string> {
  await sodium.ready;
  const key = sodium.from_string(KEY_STRING);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  
  return sodium.to_base64(combined);
}

export async function decryptData(ciphertextBase64: string): Promise<string> {
  await sodium.ready;
  const key = sodium.from_string(KEY_STRING);
  const combined = sodium.from_base64(ciphertextBase64);
  
  const nonceBytes = sodium.crypto_secretbox_NONCEBYTES;
  if (combined.length < nonceBytes) {
    throw new Error("Ciphertext too short");
  }
  
  const nonce = combined.slice(0, nonceBytes);
  const ciphertext = combined.slice(nonceBytes);
  
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_string(decrypted);
}

const pendingFetches = new Map<string, Promise<any>>();

export async function fetchEncrypted(url: string, options?: RequestInit): Promise<any> {
  const isGet = !options || !options.method || options.method.toUpperCase() === "GET";
  
  if (isGet) {
    const pending = pendingFetches.get(url);
    if (pending) return pending;
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const body = await res.json();
      if (!body || typeof body.data !== "string") {
        // If the response is not encrypted (e.g. local mock data or static JSON), return as-is
        return body;
      }
      const decrypted = await decryptData(body.data);
      return JSON.parse(decrypted);
    } finally {
      if (isGet) {
        pendingFetches.delete(url);
      }
    }
  })();

  if (isGet) {
    pendingFetches.set(url, promise);
  }

  return promise;
}
