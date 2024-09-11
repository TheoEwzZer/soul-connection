import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { Employee } from "@prisma/client";
import bcrypt from "bcrypt";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

export async function POST(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{
      access_token: string;
    }>
> {
  const { email, password } = await req.json();
  const groupToken: string | null = req.headers.get("X-Group-Authorization");

  if (groupToken !== NEXT_PUBLIC_GROUP_TOKEN) {
    return NextResponse.json(
      { detail: "Invalid group token" },
      { status: 401 }
    );
  }

  const employee: Employee | null = await db.employee.findUnique({
    where: { email },
  });

  if (!employee) {
    return NextResponse.json(
      { detail: "Invalid Email and Password combination." },
      { status: 401 }
    );
  }

  const isPasswordValid: boolean = await bcrypt.compare(
    password,
    employee.password
  );

  if (!isPasswordValid) {
    return NextResponse.json(
      { detail: "Invalid Email and Password combination." },
      { status: 401 }
    );
  }

  const accessToken: string = await encrypt({ email });
  return NextResponse.json({ access_token: accessToken }, { status: 200 });
}

export async function GET(): Promise<
  NextResponse<{
    detail: string;
  }>
> {
  return NextResponse.json(
    { detail: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
