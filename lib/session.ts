import "server-only";
import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { Employee } from "@prisma/client";
import { db } from "./db";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

const secretKey: string | undefined = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

const encodedKey: Uint8Array = new TextEncoder().encode(secretKey);

export async function encrypt(payload: { email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<JWTPayload | undefined> {
  if (!session) {
    console.error("No session token provided");
    return undefined;
  }

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to verify session:", error);
    return undefined;
  }
}

export async function isAdmin(req: NextRequest): Promise<boolean> {
  const groupToken: string | null = req.headers.get("X-Group-Authorization");

  if (groupToken !== NEXT_PUBLIC_GROUP_TOKEN) {
    return false;
  }

  const cookie: string | undefined = req.cookies.get("access_token")?.value;
  const session: JWTPayload | undefined = await decrypt(cookie);

  if (!session?.email || typeof session.email !== "string") {
    return false;
  }

  const employee: Partial<Employee> | null = await db.employee.findUnique({
    where: { email: session.email },
    select: { work: true },
  });

  if (!employee || employee.work === "Coach") {
    return false;
  }

  return true;
}
