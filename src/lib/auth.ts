import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jellywatch_super_secret_jwt_key_2026_marine_gis_monitoring_key"
)

export const COOKIE_NAME = process.env.COOKIE_NAME || "jellywatch_session"

export interface UserSessionPayload {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string | null
  status: string
}

/**
 * Encrypt payload into a signed JWT token
 */
export async function createJWT(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

/**
 * Verify JWT token and return session payload
 */
export async function verifyJWT(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as UserSessionPayload
  } catch (error) {
    return null
  }
}

/**
 * Get current session from HTTP-only cookie
 */
export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

/**
 * Set HTTP-only session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  })
}

/**
 * Remove session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
