import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Customer, Employee } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface CustomerResponseString {
  id: string;
  email: string;
  name: string;
  surname: string;
  created_at: Date;
  phone_number: string;
  gender: "Male" | "Female";
  address: string;
  birth_date: Date;
  employee_id: string | null;
  description: string;
  profil_picture_url: string | null;
}

interface CreateCustomerRequest {
  email: string;
  name: string;
  surname: string;
  phone_number: string;
  gender: "Male" | "Female";
  address: string;
  birth_date: Date;
  employee_id: string | null;
  description: string;
  profil_picture_url: string | null;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{
      customers: CustomerResponseString[];
      totalPages: number;
      totalCustomers: number;
    }>
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

  if (!session?.email || typeof session.email !== "string") {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const employee: Partial<Employee> | null = await db.employee.findUnique({
    where: { email: session.email },
    select: { work: true, id: true },
  });

  if (!employee) {
    return NextResponse.json(
      { detail: "Customer requested doesn't exist" },
      { status: 404 }
    );
  }

  const url = new URL(req.url);
  const pageParam: string | null = url.searchParams.get("page");
  const limitParam: string | null = url.searchParams.get("limit");
  const page: number | null = pageParam ? parseInt(pageParam, 10) : null;
  const limit: number | null = limitParam ? parseInt(limitParam, 10) : null;
  const offset: number | null = page && limit ? (page - 1) * limit : null;

  let customers: Customer[] | null;
  let totalCustomers: number;

  const findManyOptions: any = {
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      created_at: true,
      phone_number: true,
      gender: true,
      address: true,
      birth_date: true,
      employee_id: true,
      description: true,
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

  if (employee.work === "Coach") {
    findManyOptions.where = { employee_id: employee.id };
    customers = await db.customer.findMany(findManyOptions);
    totalCustomers = await db.customer.count({
      where: { employee_id: employee.id },
    });
  } else {
    customers = await db.customer.findMany(findManyOptions);
    totalCustomers = await db.customer.count();
  }

  if (!customers) {
    return NextResponse.json(
      { detail: "Customer requested doesn't exist" },
      { status: 404 }
    );
  }

  const totalPages: number = limit ? Math.ceil(totalCustomers / limit) : 1;

  const customersResponse: CustomerResponseString[] = customers.map(
    (customer: Customer): CustomerResponseString => ({
      ...customer,
      id: customer.id.toString(),
      employee_id: customer.employee_id
        ? customer.employee_id.toString()
        : null,
    })
  );

  return NextResponse.json(
    { customers: customersResponse, totalPages, totalCustomers },
    { status: 200 }
  );
}

export async function POST(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<CustomerResponseString>
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

  const body: CreateCustomerRequest = await req.json();

  const newCustomer = await db.customer.create({
    data: {
      email: body.email,
      name: body.name,
      surname: body.surname,
      phone_number: body.phone_number,
      gender: body.gender,
      address: body.address,
      birth_date: new Date(body.birth_date),
      employee_id: body.employee_id ? BigInt(body.employee_id) : null,
      description: body.description,
      profil_picture_url: body.profil_picture_url,
    },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      created_at: true,
      phone_number: true,
      gender: true,
      address: true,
      birth_date: true,
      employee_id: true,
      description: true,
      profil_picture_url: true,
    },
  });

  const customerResponse: CustomerResponseString = {
    ...newCustomer,
    id: newCustomer.id.toString(),
    employee_id: newCustomer.employee_id
      ? newCustomer.employee_id.toString()
      : null,
  };

  return NextResponse.json(customerResponse, { status: 201 });
}
