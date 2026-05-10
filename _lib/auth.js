import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Reads and verifies the auth_token cookie.
 *
 * Returns the session payload if valid:
 * {
 *   staff_id: number,
 *   role: string,      // e.g. "Kebele Manager"
 *   username: string,
 * }
 *
 * Returns null if the cookie is missing or the token is invalid/expired.
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    return {
      staff_id: payload.userId,   // matches SignJWT field: userId
      role:     payload.role,     // matches SignJWT field: role
      username: payload.user,     // matches SignJWT field: user
    };
  } catch (err) {
    // Token expired, tampered, or missing secret
    return null;
  }
}