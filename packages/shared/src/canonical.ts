import { createHash } from 'node:crypto';

/**
 * Deterministic JSON stringifier complying with RFC 8785 (JSON Canonicalization Scheme - JCS).
 * Ensures that identical data structures with varying key order always serialize to the exact same bytes.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const elements: string[] = value.map((element) => canonicalStringify(element));
    return `[${elements.join(',')}]`;
  }

  // Sort object keys lexicographically (code unit order)
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const pairs: string[] = [];

  for (const key of keys) {
    const val = (value as Record<string, unknown>)[key];
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      pairs.push(`${JSON.stringify(key)}:${canonicalStringify(val)}`);
    }
  }

  return `{${pairs.join(',')}}`;
}

/**
 * Computes a SHA-256 hash in hexadecimal format from any serializable object using RFC 8785 rules.
 */
export function computeCanonicalHash(value: unknown): string {
  const canonicalJson = canonicalStringify(value);
  return createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

/**
 * Computes a SHA-256 hash in hexadecimal format from raw bytes or Buffer.
 */
export function computeBytesHash(data: Buffer | Uint8Array | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Deterministically generates a unique 32-byte (64 char hex) Task ID.
 */
export function generateTaskId(
  buyerAddress: string,
  providerAddress: string,
  nonce: string | number,
  inputHash: string
): string {
  const payload = {
    buyer: buyerAddress,
    provider: providerAddress,
    nonce: String(nonce),
    inputHash,
  };
  return computeCanonicalHash(payload);
}

/**
 * Converts a hex string to a Uint8Array byte array (32 bytes for SHA-256).
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Converts a Uint8Array byte array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
