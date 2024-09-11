import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface EmployeeResponse {
  id: bigint;
  email: string;
  name: string;
  surname: string;
  birth_date: Date;
  gender: "Male" | "Female";
  work: string;
}

interface EmployeeResponseString {
  id: string;
  email: string;
  name: string;
  surname: string;
  birth_date: Date;
  gender: "Male" | "Female";
  work: string;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EmployeeResponseString>
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

  const employee: EmployeeResponse | null = await db.employee.findUnique({
    where: { email: String(session.email) },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      work: true,
    },
  });

  if (!employee) {
    return NextResponse.json(
      { detail: "Employee requested doesn't exist" },
      { status: 404 }
    );
  }

  const employeeResponse = {
    ...employee,
    id: employee.id.toString(),
  };

  return NextResponse.json(employeeResponse, { status: 200 });
}
