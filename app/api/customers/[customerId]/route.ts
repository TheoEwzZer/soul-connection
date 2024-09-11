import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Customer } from "@prisma/client";
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

interface CustomerResponseString {
  id: string;
  email: string;
  name: string;
  surname: string;
  birth_date: Date;
  gender: "Male" | "Female";
  description: string;
  phone_number: string;
  address: string;
  employee_id: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
): Promise<
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

  const customer: Customer | null = await db.customer.findUnique({
    where: { id: Number(params.customerId) },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      description: true,
      phone_number: true,
      address: true,
      employee_id: true,
      created_at: true,
      profil_picture_url: true,
    },
  });

  if (!customer) {
    return NextResponse.json(
      { detail: "Customer requested doesn't exist" },
      { status: 404 }
    );
  }

  const customerResponse = {
    ...customer,
    id: customer.id.toString(),
    employee_id: customer.employee_id?.toString() || null,
  };

  return NextResponse.json(customerResponse, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { customerId: string } }
): Promise<
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

  const body = await req.json();
  const {
    name,
    surname,
    email,
    birth_date,
    gender,
    address,
    description,
    phone_number,
    employee_id,
    profil_picture_url,
  } = body;

  const dataToUpdate: Partial<Customer> = {};
  if (name) {
    dataToUpdate.name = name;
  }
  if (surname) {
    dataToUpdate.surname = surname;
  }
  if (email) {
    dataToUpdate.email = email;
  }
  if (birth_date) {
    dataToUpdate.birth_date = new Date(birth_date);
  }
  if (gender) {
    dataToUpdate.gender = gender;
  }
  if (description) {
    dataToUpdate.description = description;
  }
  if (phone_number) {
    dataToUpdate.phone_number = phone_number;
  }
  if (address) {
    dataToUpdate.address = address;
  }
  if (employee_id) {
    dataToUpdate.employee_id = BigInt(employee_id);
  }
  if (profil_picture_url) {
    dataToUpdate.profil_picture_url = profil_picture_url;
  }

  const updatedEmployee: Customer | null = await db.customer.update({
    where: { id: Number(params.customerId) },
    data: dataToUpdate,
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      description: true,
      address: true,
      employee_id: true,
      phone_number: true,
      created_at: true,
      profil_picture_url: true,
    },
  });

  if (!updatedEmployee) {
    return NextResponse.json(
      { detail: "Failed to update employee" },
      { status: 500 }
    );
  }

  const employeeResponse = {
    ...updatedEmployee,
    id: updatedEmployee.id.toString(),
    employee_id: updatedEmployee.employee_id?.toString() || null,
  };

  return NextResponse.json(employeeResponse, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { customerId: string } }
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

  const customer = await db.customer.findUnique({
    where: { id: BigInt(params.customerId) },
  });

  if (!customer) {
    return NextResponse.json(
      { detail: "Customer requested doesn't exist" },
      { status: 404 }
    );
  }

  const { error: storageError } = await supabaseClient.storage
    .from("customerImages")
    .remove([customer.email]);

  if (storageError) {
    return NextResponse.json(
      { detail: `Error deleting customer image: ${storageError.message}` },
      { status: 500 }
    );
  }

  await db.customer.delete({
    where: { id: BigInt(params.customerId) },
  });

  return NextResponse.json(
    { detail: "Customer deleted successfully" },
    { status: 200 }
  );
}
