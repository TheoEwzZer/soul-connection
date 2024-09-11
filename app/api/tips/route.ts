import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Tip } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface TipResponseString {
  id: string;
  title: string;
  tip: string;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<TipResponseString[]>
> {
  const groupToken: string | null = req.headers.get("X-Group-Authorization");

  if (groupToken !== NEXT_PUBLIC_GROUP_TOKEN) {
    return NextResponse.json(
      { detail: "Invalid group token" },
      { status: 401 }
    );
  }

  const cookie: string | undefined = req.cookies.get("access_token")?.value;
  const session: JWTPayload | undefined = await decrypt(cookie);

  if (!session?.email) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const tips: Tip[] | null = await db.tip.findMany({
    select: {
      id: true,
      title: true,
      tip: true,
    },
  });

  if (!tips) {
    return NextResponse.json(
      { detail: "Tip requested doesn't exist" },
      { status: 404 }
    );
  }

  const tipsResponse: TipResponseString[] = tips.map(
    (tip: Tip): TipResponseString => ({
      ...tip,
      id: tip.id.toString(),
    })
  );

  return NextResponse.json(tipsResponse, { status: 200 });
}
