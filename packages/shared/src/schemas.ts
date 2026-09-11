import { z } from 'zod';

export const StellarAddressSchema = z
  .string()
  .regex(/^(G[A-Z0-9]{55}|G[A-Za-z0-9_]{10,64})$/, 'Invalid Stellar public key format');


export const Hex32Schema = z
  .string()
  .regex(/^(0x)?[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string');

export const VerificationPolicyIdSchema = z.enum([
  'deterministic-v1',
  'quorum-2-of-3-v1',
  'timeout-refund-v1',
]);

export const CreateTaskSchema = z.object({
  buyer: StellarAddressSchema,
  provider: StellarAddressSchema,
  serviceId: z.string().min(1).max(64),
  inputPayload: z.unknown(),
  outputSchemaHash: Hex32Schema.optional(),
  amount: z.string().regex(/^\d+$/, 'Amount must be an integer string representing base units'),
  asset: z.string().min(1).max(64),
  deadlineSeconds: z.number().int().positive(),
  verificationPolicyId: VerificationPolicyIdSchema.default('deterministic-v1'),
});

export const FundTaskSchema = z.object({
  buyer: StellarAddressSchema,
  secretKey: z.string().optional(), // For automated demo signing
});

export const SubmitEvidenceSchema = z.object({
  providerSignature: z.string(),
  outputHash: Hex32Schema,
  rawPayload: z.unknown(),
  artifactUri: z.string().optional(),
  proofType: z.enum(['hash', 'recompute', 'multisig']).default('recompute'),
});

export const VerifyTaskSchema = z.object({
  customPolicyId: VerificationPolicyIdSchema.optional(),
});

export const OpenDisputeSchema = z.object({
  openedBy: StellarAddressSchema,
  reasonCode: z.string().min(1).max(64),
  evidenceRefs: z.array(z.string()).default([]),
});

export const ResolveDisputeSchema = z.object({
  outcome: z.enum(['RELEASED', 'REFUNDED']),
  verifierQuorum: z.array(
    z.object({
      verifierAddress: StellarAddressSchema,
      decision: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']),
      signature: z.string(),
    })
  ),
});
