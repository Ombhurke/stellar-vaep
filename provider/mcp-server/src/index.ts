import Fastify from 'fastify';
import cors from '@fastify/cors';
import { executeDeterministicTask, setMaliciousMode, getMaliciousMode } from './tool.js';

export * from './tool.js';

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

server.get('/health', async () => {
  return {
    status: 'ok',
    providerId: 'mcp-text-sentiment-analyzer',
    maliciousMode: getMaliciousMode(),
    capabilities: ['sentiment-v1', 'linguistics-metrics'],
  };
});

server.post('/toggle-malicious', async (request) => {
  const body = request.body as { enabled?: boolean } | undefined;
  const current = getMaliciousMode();
  const next = body?.enabled !== undefined ? body.enabled : !current;
  setMaliciousMode(next);
  return { success: true, maliciousMode: next };
});

server.post('/execute', async (request, reply) => {
  const body = request.body as {
    taskId: string;
    input: { text: string; algorithm: string };
  };

  if (!body.taskId || !body.input?.text) {
    return reply.status(400).send({ error: 'Missing taskId or input payload' });
  }

  const execution = executeDeterministicTask(body.taskId, body.input);
  return execution;
});

const PORT = 4001;
server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Deterministic MCP Provider running at ${address}`);
});
