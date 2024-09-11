import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Document } from "@prisma/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_GROUP_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} = process.env;

const supabaseClient: SupabaseClient = createClient(
  NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{ detail: string }>
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

  try {
    const document: Document | null = await db.document.findUnique({
      where: { id: Number(params.documentId) },
    });

    if (!document) {
      return NextResponse.json(
        { detail: "Document requested doesn't exist" },
        { status: 404 }
      );
    }

    const { error: storageError } = await supabaseClient.storage
      .from("documents")
      .remove([document.file_name]);

    if (storageError) {
      return NextResponse.json(
        { detail: `Error deleting document: ${storageError.message}` },
        { status: 500 }
      );
    }

    await db.document.delete({
      where: { id: Number(params.documentId) },
    });

    return NextResponse.json(
      { detail: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { detail: "Failed to delete document", error },
      { status: 500 }
    );
  }
}
