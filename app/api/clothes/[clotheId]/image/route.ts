import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface ClotheResponseString {
  image_url: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { clotheId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<ClotheResponseString>
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

  const clotheId: bigint = BigInt(params.clotheId);

  const clothes: ClotheResponseString | null = await db.clothe.findUnique({
    where: {
      id: clotheId,
    },
    select: {
      image_url: true,
    },
  });

  if (!clothes) {
    return NextResponse.json(
      { detail: "Clothe requested doesn't exist" },
      { status: 404 }
    );
  }

  return NextResponse.json(clothes, { status: 200 });
}
