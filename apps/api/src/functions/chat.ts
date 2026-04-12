import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import { readJson, listBlobPaths } from '../lib/blobStorage';
import type { Spark, Concept } from '../types/models';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

function buildSystemPrompt(sparks: Spark[], concepts: Concept[]): string {
  const conceptIndex = new Map(concepts.map((c) => [c.id, c]));

  const sparkSummaries = sparks
    .filter((s) => !s.deletedAt)
    .map((s) => {
      const linkedConcepts = (s.conceptIds ?? [])
        .map((id) => conceptIndex.get(id)?.name)
        .filter(Boolean);
      return [
        `### ${s.title}`,
        `- ID: ${s.id}`,
        `- Type: ${s.contentType} | Status: ${s.status}`,
        s.summary ? `- Summary: ${s.summary}` : null,
        s.bodyMarkdown?.trim()
          ? `- Content: ${s.bodyMarkdown.slice(0, 400).replace(/\n+/g, ' ')}`
          : null,
        s.tags?.length ? `- Tags: ${s.tags.join(', ')}` : null,
        linkedConcepts.length ? `- Concepts: ${linkedConcepts.join(', ')}` : null,
        s.whyItMatters ? `- Why it matters: ${s.whyItMatters}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const conceptSummaries = concepts
    .map((c) => {
      const linkedSparks = sparks
        .filter((s) => s.conceptIds?.includes(c.id))
        .map((s) => `"${s.title}"`);
      return [
        `### ${c.name} (${c.id})`,
        `- ${c.description}`,
        linkedSparks.length ? `- Connected sparks: ${linkedSparks.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return `You are a personal knowledge coach and reflective thinking partner.

You have access to the user's personal knowledge graph — a collection of sparks (captured ideas, quotes, insights) organised around concepts (themes). Your role is to help them:
- Discover hidden connections between sparks they may not have noticed
- Understand *why* certain ideas resonate deeply with them
- Identify patterns, contradictions, or tensions in their thinking
- Synthesise insights across themes
- Ask good questions to deepen self-understanding

Be warm but concise. When you spot a hidden connection, name it explicitly. When you sense a deep pattern, speculate about what it might mean for them personally. Always refer to sparks and concepts by their actual titles — be specific, not generic.

─── CONCEPTS (themes) ──────────────────────────────────────────────────────────
${conceptSummaries}

─── SPARKS (ideas captured) ────────────────────────────────────────────────────
${sparkSummaries}
`;
}

async function handleChat(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return { status: 400, body: 'Invalid JSON' };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { status: 400, body: 'messages array required' };
  }

  // Validate message roles/content to prevent prompt injection
  const allowedRoles = new Set(['user', 'assistant']);
  const safeMessages = body.messages
    .filter((m) => allowedRoles.has(m.role) && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (safeMessages.length === 0) {
    return { status: 400, body: 'No valid messages' };
  }

  // Load graph data
  const [sparkPaths, conceptPaths] = await Promise.all([
    listBlobPaths('items', 'sparks/'),
    listBlobPaths('items', 'concepts/'),
  ]);

  const [sparks, concepts] = await Promise.all([
    Promise.all(sparkPaths.map((p) => readJson<Spark>('items', p))).then((r) =>
      r.filter((s): s is Spark => Boolean(s)),
    ),
    Promise.all(conceptPaths.map((p) => readJson<Concept>('items', p))).then((r) =>
      r.filter((c): c is Concept => c !== null && !c.deletedAt),
    ),
  ]);

  const systemPrompt = buildSystemPrompt(sparks, concepts);

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o';

  if (!endpoint || !apiKey) {
    return { status: 503, body: 'AI endpoint not configured' };
  }

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model: deployment,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeMessages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return { status: 502, body: `AI error: ${err}` };
  }

  const result = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const reply = result.choices?.[0]?.message?.content ?? '(no response)';

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply }),
  };
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'chat',
  handler: handleChat,
});
