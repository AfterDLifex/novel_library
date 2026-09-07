/**
 * Simple string hash function (djb2 variant).
 * Used for generating consistent hash keys from strings.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Generates a stable hash from a complex object.
 * Serializes the object in a deterministic order before hashing.
 */
export function hashObject(obj: unknown): number {
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return hashString(json);
}

/**
 * Generates a SHA-256 hash of the given string.
 * Returns a hex string.
 */
export async function sha256(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a content fingerprint for caching purposes.
 * Returns the first 16 characters of the SHA-256 hash.
 */
export async function contentFingerprint(str: string): Promise<string> {
  const hash = await sha256(str);
  return hash.slice(0, 16);
}
