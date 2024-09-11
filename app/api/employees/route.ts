import { NextRequest, NextResponse } from "next/server";
import { decrypt, isAdmin } from "@/lib/session";
import bcrypt from "bcrypt";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface EmployeeResponse {
  id: bigint;
  email: string;
  name: string;
  surname: string;
  work: string;
  phone_number: string;
  birth_date: Date;
  gender: "Male" | "Female";
  profil_picture_url: string | null;
}

interface EmployeeResponseString {
  id: string;
  email: string;
  name: string;
  surname: string;
  work: string;
  phone_number: string;
  customer_count: number;
  birth_date: Date;
  gender: "Male" | "Female";
  profil_picture_url: string | null;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{
      employees: EmployeeResponseString[];
      totalPages: number;
      totalEmployees: number;
    }>
> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
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

  const url = new URL(req.url);
  const pageParam: string | null = url.searchParams.get("page");
  const limitParam: string | null = url.searchParams.get("limit");
  const workParam: string | null = url.searchParams.get("work");
  const page: number | null = pageParam ? parseInt(pageParam, 10) : null;
  const limit: number | null = limitParam ? parseInt(limitParam, 10) : null;
  const offset: number | null = page && limit ? (page - 1) * limit : null;

  const whereClause:
    | {
        work: string;
      }
    | {
        work?: undefined;
      } = workParam === "Coach" ? { work: "Coach" } : {};

  const totalEmployees: number = await db.employee.count({
    where: whereClause,
  });

  const findManyOptions: any = {
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      work: true,
      phone_number: true,
      birth_date: true,
      gender: true,
      profil_picture_url: true,
    },
    orderBy: {
      name: "asc",
    },
  };

  if (offset !== null && limit !== null) {
    findManyOptions.skip = offset;
    findManyOptions.take = limit;
  }

  const employees: EmployeeResponse[] | null = await db.employee.findMany(
    findManyOptions
  );

  if (!employees) {
    return NextResponse.json(
      { detail: "Employee requested doesn't exist" },
      { status: 404 }
    );
  }

  let totalPages: number = 1;
  if (limit) {
    totalPages = Math.ceil(totalEmployees / limit);
  }

  const employeesResponse: EmployeeResponseString[] = await Promise.all(
    employees.map(
      async (employee: EmployeeResponse): Promise<EmployeeResponseString> => {
        const customerCount: number = await db.customer.count({
          where: { employee_id: employee.id },
        });

        return {
          ...employee,
          id: employee.id.toString(),
          customer_count: customerCount,
        };
      }
    )
  );

  return NextResponse.json(
    { employees: employeesResponse, totalPages, totalEmployees },
    { status: 200 }
  );
}

export async function POST(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{
      id: string;
      email: string;
      name: string;
      surname: string;
      work: string;
      phone_number: string;
      birth_date: Date;
      gender: "Male" | "Female";
    }>
> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
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
  const {
    name,
    surname,
    email,
    password,
    birth_date,
    gender,
    work,
    phone_number,
    profil_picture_url,
  } = body;

  if (
    !name ||
    !surname ||
    !email ||
    !password ||
    !birth_date ||
    !gender ||
    !work ||
    !phone_number
  ) {
    return NextResponse.json(
      { detail: "All fields are required" },
      { status: 400 }
    );
  }

  const hashedPassword: string = await bcrypt.hash(password, 10);

  const newEmployee: EmployeeResponse = await db.employee.create({
    data: {
      name,
      surname,
      email,
      password: hashedPassword,
      birth_date: new Date(birth_date),
      gender,
      work,
      phone_number,
      profil_picture_url,
    },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      work: true,
      phone_number: true,
      profil_picture_url: true,
    },
  });

  const employeeResponse = {
    ...newEmployee,
    id: newEmployee.id.toString(),
  };

  return NextResponse.json(employeeResponse, { status: 201 });
}
