import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Employee } from "@prisma/client";
import { isAdmin } from "@/lib/session";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface EmployeeResponseString {
  id: string;
  email: string;
  password: string;
  name: string;
  surname: string;
  birth_date: Date;
  gender: "Male" | "Female";
  work: string;
}

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;

const supabaseClient: SupabaseClient = createClient(
  NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EmployeeResponseString>
> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const employee: Employee | null = await db.employee.findUnique({
    where: { id: Number(params.employeeId) },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      work: true,
      phone_number: true,
      image: true,
      profil_picture_url: true,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EmployeeResponseString>
> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, surname, email, birth_date, gender, work, phone_number } = body;

  const dataToUpdate: Partial<Employee> = {
    image: null,
  };
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
  if (work) {
    dataToUpdate.work = work;
  }
  if (phone_number) {
    dataToUpdate.phone_number = phone_number;
  }

  const updatedEmployee: Employee | null = await db.employee.update({
    where: { id: Number(params.employeeId) },
    data: dataToUpdate,
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      surname: true,
      birth_date: true,
      gender: true,
      work: true,
      phone_number: true,
      image: true,
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
  };

  return NextResponse.json(employeeResponse, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<{ detail: string }>
> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const employee: Employee | null = await db.employee.findUnique({
    where: { id: BigInt(params.employeeId) },
  });

  if (!employee) {
    return NextResponse.json(
      { detail: "Customer requested doesn't exist" },
      { status: 404 }
    );
  }

  const { error: storageError } = await supabaseClient.storage
    .from("employeeImages")
    .remove([employee.email]);

  if (storageError) {
    return NextResponse.json(
      { detail: `Error deleting employee image: ${storageError.message}` },
      { status: 500 }
    );
  }

  try {
    await db.employee.delete({
      where: { id: Number(params.employeeId) },
    });
    return NextResponse.json(
      { detail: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
