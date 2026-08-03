import "server-only";

import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { SessionUser } from "@/lib/types";

const cookieName = "dds_demo_session";
const maxAgeSeconds = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("SESSION_SECRET must be set to a long random value.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(payload: SessionUser) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getSecret(), iv);
  const json = JSON.stringify(payload);
  const ciphertext = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

function decrypt(value: string): SessionUser | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getSecret(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as SessionUser;
    if (!parsed.dbUser || !parsed.displayName || !parsed.personaId || !parsed.loginAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const value = store.get(cookieName)?.value;
  return value ? decrypt(value) : null;
}

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(cookieName, encrypt(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}
