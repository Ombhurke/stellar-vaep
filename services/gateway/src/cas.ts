import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeCanonicalHash } from '@vaep/shared';

const STORAGE_DIR = path.resolve(process.env.EVIDENCE_STORAGE_PATH || './storage/artifacts');

export class ContentAddressedStorage {
  constructor() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Saves an artifact payload, verifying that its filename matches its canonical SHA-256 hash
   */
  async saveArtifact(payload: unknown): Promise<{ hash: string; uri: string; filePath: string }> {
    const hash = computeCanonicalHash(payload);
    const fileName = `${hash}.json`;
    const filePath = path.join(STORAGE_DIR, fileName);

    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return {
      hash,
      uri: `cas://${hash}`,
      filePath,
    };
  }

  /**
   * Retrieves an artifact by its SHA-256 hash and validates byte integrity
   */
  async getArtifact(hash: string): Promise<unknown | null> {
    const filePath = path.join(STORAGE_DIR, `${hash}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    const computedHash = computeCanonicalHash(parsed);

    if (computedHash !== hash) {
      throw new Error(`Integrity error: Expected hash ${hash}, but found ${computedHash}`);
    }

    return parsed;
  }
}

export const cas = new ContentAddressedStorage();
