import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Document } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface EmployeeInfo {
  id: bigint;
  name: string;
  surname: string;
}

interface EmployeeInfoString {
  id: string;
  name: string;
  surname: string;
}

interface DocumentInfo {
  id: bigint;
  name: string;
  type: string;
  size: bigint;
  date: Date;
  employee_id: bigint | null;
  document_url: string;
  employee: EmployeeInfo | null;
}

interface DocumentString {
  id: string;
  name: string;
  type: string;
  size: string;
  date: Date;
  employee_id: string;
  document_url: string;
  employee: EmployeeInfoString | null;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<DocumentString[]>
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

  const documents: DocumentInfo[] | null = await db.document.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      size: true,
      date: true,
      employee_id: true,
      document_url: true,
      employee: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  });

  if (!documents) {
    return NextResponse.json(
      { detail: "Documents requested don't exist" },
      { status: 404 }
    );
  }

  const documentsResponse: DocumentString[] = documents.map(
    (document: DocumentInfo): DocumentString => ({
      ...document,
      id: document.id.toString(),
      size: document.size.toString(),
      employee_id: document.employee_id ? document.employee_id.toString() : "",
      employee: document.employee
        ? {
            id: document.employee.id.toString(),
            name: document.employee.name,
            surname: document.employee.surname,
          }
        : null,
    })
  );

  return NextResponse.json(documentsResponse, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const body = await req.json();
  const { name, type, size, employee_id, document_url, file_name } = body;

  if (!name || !type || !size || !employee_id || !document_url || !file_name) {
    return NextResponse.json(
      { detail: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const newDocument: Document = await db.document.create({
      data: {
        name,
        type,
        size: BigInt(size),
        employee_id: BigInt(employee_id),
        document_url,
        file_name,
      },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        date: true,
        employee_id: true,
        document_url: true,
        file_name: true,
      },
    });

    const responseDocument = {
      ...newDocument,
      id: newDocument.id.toString(),
      size: newDocument.size.toString(),
      employee_id: newDocument.employee_id
        ? newDocument.employee_id.toString()
        : "",
    };
    return NextResponse.json(responseDocument, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { detail: "Failed to create document", error: error },
      { status: 500 }
    );
  }
}
