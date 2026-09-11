import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalStringify, computeCanonicalHash, generateTaskId } from '../canonical.js';

describe('RFC 8785 Canonical JSON Serialization & Hashing', () => {
  it('serializes objects with permuted keys to the exact same string', () => {
    const objA = { z: 1, a: 2, m: { nested_b: true, nested_a: 'test' } };
    const objB = { a: 2, m: { nested_a: 'test', nested_b: true }, z: 1 };

    const strA = canonicalStringify(objA);
    const strB = canonicalStringify(objB);

    assert.equal(strA, strB);
    assert.equal(strA, '{"a":2,"m":{"nested_a":"test","nested_b":true},"z":1}');
  });

  it('produces identical SHA-256 hashes for equivalent objects with different key order', () => {
    const taskInput1 = {
      text: 'Stellar Soroban escrow verification test',
      algorithm: 'sentiment-v1',
      options: { normalize: true, maxTokens: 100 },
    };

    const taskInput2 = {
      options: { maxTokens: 100, normalize: true },
      algorithm: 'sentiment-v1',
      text: 'Stellar Soroban escrow verification test',
    };

    const hash1 = computeCanonicalHash(taskInput1);
    const hash2 = computeCanonicalHash(taskInput2);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64, 'SHA-256 hex string should be 64 characters (32 bytes)');
  });

  it('generates consistent, deterministic Task IDs', () => {
    const buyer = 'GBUYER12345678901234567890123456789012345678901234567890';
    const provider = 'GPROVIDER1234567890123456789012345678901234567890123456789';
    const nonce = '1001';
    const inputHash = computeCanonicalHash({ data: 'canonical-check' });

    const taskId1 = generateTaskId(buyer, provider, nonce, inputHash);
    const taskId2 = generateTaskId(buyer, provider, nonce, inputHash);

    assert.equal(taskId1, taskId2);
    assert.equal(taskId1.length, 64);
  });
});
