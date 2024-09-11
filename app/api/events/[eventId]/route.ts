import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

import { db } from "@/lib/db";
import { JWTPayload } from "jose";
import { Event } from "@prisma/client";

const { NEXT_PUBLIC_GROUP_TOKEN } = process.env;

interface EventResponseString {
  id: string;
  name: string;
  date: Date;
  duration: number;
  max_participants: number;
  location_x: string;
  location_y: string;
  type: string;
  employee_id: string;
  location_name: string;
  registered_participants: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EventResponseString>
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

  const event: Event | null = await db.event.findUnique({
    where: { id: Number(params.eventId) },
    select: {
      id: true,
      name: true,
      date: true,
      duration: true,
      max_participants: true,
      location_x: true,
      location_y: true,
      type: true,
      employee_id: true,
      location_name: true,
      registered_participants: true,
    },
  });

  if (!event) {
    return NextResponse.json(
      { detail: "Event requested doesn't exist" },
      { status: 404 }
    );
  }

  const eventResponse = {
    ...event,
    id: event.id.toString(),
    employee_id: event.employee_id ? event.employee_id.toString() : "",
  };

  return NextResponse.json(eventResponse, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
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

  try {
    const event: Event | null = await db.event.findUnique({
      where: { id: Number(params.eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { detail: "Event requested doesn't exist" },
        { status: 404 }
      );
    }

    await db.event.delete({
      where: { id: Number(params.eventId) },
    });

    return NextResponse.json(
      { detail: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { detail: "Failed to delete event", error },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
): Promise<
  | NextResponse<{
      detail: string;
    }>
  | NextResponse<EventResponseString>
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
    date,
    duration,
    max_participants,
    location_x,
    location_y,
    type,
    employee_id,
    location_name,
    registered_participants,
  } = body;

  try {
    const event: Event | null = await db.event.findUnique({
      where: { id: Number(params.eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { detail: "Event requested doesn't exist" },
        { status: 404 }
      );
    }

    const updatedEvent = await db.event.update({
      where: { id: Number(params.eventId) },
      data: {
        name,
        date: new Date(date),
        duration,
        max_participants,
        location_x,
        location_y,
        type,
        employee_id,
        location_name,
        registered_participants,
      },
    });

    const eventResponse = {
      ...updatedEvent,
      id: updatedEvent.id.toString(),
      employee_id: updatedEvent.employee_id
        ? updatedEvent.employee_id.toString()
        : "",
    };

    return NextResponse.json(eventResponse, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { detail: "Failed to update event", error },
      { status: 500 }
    );
  }
}
