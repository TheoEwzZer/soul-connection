import { NextRequest, NextResponse } from "next/server";
import { decrypt, isAdmin } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { PaymentHistory } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface PaymentsHistoryResponseString {
  id: string;
  date: Date;
  payment_method: string;
  amount: number;
  comment: string | null;
  customer_id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
): Promise<
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

  const customerId: bigint = BigInt(params.customerId);

  const paymentsHistory: PaymentHistory[] | null =
    await db.paymentHistory.findMany({
      where: {
        customer_id: customerId,
      },
      select: {
        id: true,
        date: true,
        payment_method: true,
        amount: true,
        comment: true,
        customer_id: true,
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
      (payment: PaymentHistory): PaymentsHistoryResponseString => ({
        id: payment.id.toString(),
        date: payment.date,
        payment_method: payment.payment_method,
        amount: payment.amount,
        comment: payment.comment,
        customer_id: payment.customer_id.toString(),
      })
    );

  return NextResponse.json(paymentsHistoryResponse, { status: 200 });
}
