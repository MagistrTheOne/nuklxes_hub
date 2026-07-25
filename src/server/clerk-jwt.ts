import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type ClerkJwtPayload = JWTPayload & {
  sub: string;
  email?: string;
};

function getJwksUrl() {
  const jwksUrl = process.env.CLERK_JWKS_URL;
  if (!jwksUrl) {
    throw new Error('CLERK_JWKS_URL is missing from the environment');
  }
  return jwksUrl;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(getJwksUrl()));
  }
  return jwks;
}

export async function verifyClerkBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing Bearer token');
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new Error('Empty Bearer token');
  }

  const { payload } = await jwtVerify(token, getJwks());

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Clerk token is missing subject');
  }

  return payload as ClerkJwtPayload;
}
