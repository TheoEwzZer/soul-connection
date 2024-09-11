import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Event } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

export interface EventString {
  id: string;
  name: string;
  date: Date;
  max_participants: number;
  location_x: string;
  location_y: string;
  type: string;
  employee_id: string;
  location_name: string;
  duration: number;
  registered_participants: number;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EventString[]>
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

  const events: Event[] | null = await db.event.findMany({
    select: {
      id: true,
      name: true,
      date: true,
      max_participants: true,
      location_x: true,
      location_y: true,
      type: true,
      employee_id: true,
      location_name: true,
      duration: true,
      registered_participants: true,
    },
  });

  if (!events) {
    return NextResponse.json(
      { detail: "Event requested doesn't exist" },
      { status: 404 }
    );
  }

  const eventsResponse: EventString[] = events.map(
    (event: Event): EventString => ({
      ...event,
      id: event.id.toString(),
      employee_id: event.employee_id ? event.employee_id.toString() : "",
    })
  );

  return NextResponse.json(eventsResponse, { status: 200 });
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
  const {
    name,
    date,
    max_participants,
    location_x,
    location_y,
    type,
    employee_id,
    location_name,
    duration,
  } = body;

  if (
    !name ||
    !date ||
    !max_participants ||
    !location_x ||
    !location_y ||
    !type ||
    !employee_id ||
    !location_name ||
    !duration
  ) {
    return NextResponse.json(
      { detail: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const newEvent: Event = await db.event.create({
      data: {
        name,
        date: new Date(date),
        max_participants,
        location_x,
        location_y,
        type,
        employee_id: BigInt(employee_id),
        location_name,
        duration,
        registered_participants: 0,
      },
      select: {
        id: true,
        name: true,
        date: true,
        max_participants: true,
        location_x: true,
        location_y: true,
        type: true,
        employee_id: true,
        location_name: true,
        duration: true,
        registered_participants: true,
      },
    });

    const responseEvent = {
      ...newEvent,
      id: newEvent.id.toString(),
      employee_id: newEvent.employee_id ? newEvent.employee_id.toString() : "",
    };
    return NextResponse.json(responseEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { detail: "Failed to create event", error: error },
      { status: 500 }
    );
  }
}
