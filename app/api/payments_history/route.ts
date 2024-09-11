import { NextRequest, NextResponse } from "next/server";
import { decrypt, isAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface PaymentsHistoryResponse {
  id: bigint;
  date: Date;
  payment_method: string;
  amount: number;
  comment: string | null;
  customer: {
    id: bigint;
    name: string;
    surname: string;
    email: string;
  };
}

interface PaymentsHistoryResponseString {
  id: string;
  date: Date;
  payment_method: string;
  amount: number;
  comment: string | null;
  customer: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<PaymentsHistoryResponseString[]>
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
  const limit: number = parseInt(url.searchParams.get("limit") || "5", 10);

  const paymentsHistory: PaymentsHistoryResponse[] | null =
    await db.paymentHistory.findMany({
      take: limit,
      orderBy: {
        date: "desc",
      },
      select: {
        id: true,
        date: true,
        payment_method: true,
        amount: true,
        comment: true,
        customer: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });

  if (!paymentsHistory) {
    return NextResponse.json(
      { detail: "Payments history requested doesn't exist" },
      { status: 404 }
    );
  }

  const paymentsHistoryResponse: PaymentsHistoryResponseString[] =
    paymentsHistory.map(
      (payment: PaymentsHistoryResponse): PaymentsHistoryResponseString => ({
        ...payment,
        id: payment.id.toString(),
        customer: {
          ...payment.customer,
          id: payment.customer.id.toString(),
        },
      })
    );

  return NextResponse.json(paymentsHistoryResponse, { status: 200 });
}
