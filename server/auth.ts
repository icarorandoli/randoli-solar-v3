import { Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hash, salt] = stored.split(".");
  const hashBuf = Buffer.from(hash, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, suppliedBuf);
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// In-memory token store for mobile app sessions
// Format: token -> userId
export const mobileTokens = new Map<string, string>();

export function generateMobileToken(): string {
  return randomBytes(32).toString("hex");
}

function getUserIdFromRequest(req: Request): string | undefined {
  // 1. Session-based auth (web)
  if (req.session?.userId) return req.session.userId;
  // 2. Bearer token auth (mobile)
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    return mobileTokens.get(token);
  }
  return undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  (req as any)._resolvedUserId = userId;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  (req as any)._resolvedUserId = userId;
  (req as any).isAdminCheck = true;
  next();
}

export async function getCurrentUser(req: Request): Promise<User | undefined> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return undefined;
  return storage.getUser(userId);
}
