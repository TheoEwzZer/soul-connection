import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Encounter } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface EncounterResponseString {
  id: string;
  customer_id: string;
  date: Date;
  rating: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EncounterResponseString[]>
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

  const customerId: bigint = BigInt(params.customerId);

  const encounters: Encounter[] | null = await db.encounter.findMany({
    where: {
      customer_id: customerId,
    },
    select: {
      id: true,
      customer_id: true,
      date: true,
      rating: true,
      comment: true,
      source: true,
    },
  });

  if (!encounters) {
    return NextResponse.json(
      { detail: "Encounter requested doesn't exist" },
      { status: 404 }
    );
  }

  const encountersResponse: EncounterResponseString[] = encounters.map(
    (encounter: Encounter): EncounterResponseString => ({
      ...encounter,
      id: encounter.id.toString(),
      customer_id: encounter.customer_id.toString(),
    })
  );

  return NextResponse.json(encountersResponse, { status: 200 });
}
