import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';

async function me(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) {
    return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auth.principal),
  };
}

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'me',
  handler: me,
});
