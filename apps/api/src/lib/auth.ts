import type { HttpRequest } from '@azure/functions';

/**
 * Extract and validate the Static Web Apps principal header.
 * SWA injects x-ms-client-principal as a base64-encoded JSON object.
 * In production this is signed; locally the SWA CLI sets it too.
 */
export interface ClientPrincipal {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}

export function getClientPrincipal(
  req: HttpRequest,
): ClientPrincipal | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

/**
 * Returns 401 response payload if the caller is unauthenticated.
 * API routes are also protected at the SWA routing layer, so this is
 * defence in depth rather than the primary gate.
 */
export function requireAuth(
  req: HttpRequest,
): { principal: ClientPrincipal } | { error: Response } {
  const principal = getClientPrincipal(req);
  if (!principal || !principal.userRoles?.includes('authenticated')) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized', status: 401 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }
  return { principal };
}
