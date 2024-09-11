import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Clothe } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface ClotheResponseString {
  id: string;
  type: string;
  customer_id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<ClotheResponseString[]>
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

  const clothes: Clothe[] | null = await db.clothe.findMany({
    where: {
      customer_id: customerId,
    },
    select: {
      id: true,
      type: true,
      customer_id: true,
      image_url: true,
    },
  });

  if (!clothes) {
    return NextResponse.json(
      { detail: "Clothes requested doesn't exist" },
      { status: 404 }
    );
  }

  const clothesResponse: ClotheResponseString[] = clothes.map(
    (clothe: Clothe): ClotheResponseString => ({
      id: clothe.id.toString(),
      type: clothe.type,
      customer_id: clothe.customer_id.toString(),
    })
  );

  return NextResponse.json(clothesResponse, { status: 200 });
}
