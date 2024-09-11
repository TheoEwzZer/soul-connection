import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import { JWTPayload } from "jose";

const publicRoutes: string[] = ["/login"];

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const fetchWork: (req: NextRequest) => Promise<string | null> = async (
  req: NextRequest
): Promise<string | null> => {
  try {
    const cookie: string | undefined = req.cookies.get("access_token")?.value;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (cookie && NEXT_PUBLIC_GROUP_TOKEN) {
      headers["Cookie"] = `access_token=${cookie}`;
      headers["X-Group-Authorization"] = NEXT_PUBLIC_GROUP_TOKEN;
    } else {
      throw new Error("Group token is not set.");
    }

    const res: Response = await fetch(
      new URL("/api/employees/me", req.nextUrl.origin),
      {
        method: "GET",
        headers,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch work");
    }

    const data: any = await res.json();
    return data.work;
  } catch (error) {
    console.error("Error fetching work:", error);
    return null;
  }
};

export default async function middleware(
  req: NextRequest
): Promise<NextResponse<unknown>> {
  const path: string = req.nextUrl.pathname;
  const isPublicRoute: boolean = publicRoutes.includes(path);

  const cookie: string | undefined = cookies().get("access_token")?.value;
  const session: JWTPayload | undefined = await decrypt(cookie);

  if (!isPublicRoute && !session?.email) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  let isAdminUser: boolean = false;
  if (session?.email) {
    const work: string | null = await fetchWork(req);
    isAdminUser = work !== "Coach";
  }

  if (isPublicRoute && session?.email) {
    const redirectUrl: "/" | "/customers" = isAdminUser ? "/" : "/customers";
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl));
  }

  if (path === "/coaches" && !isAdminUser) {
    return NextResponse.redirect(new URL("/customers", req.nextUrl));
  }

  if (path === "/" && !isAdminUser) {
    return NextResponse.redirect(new URL("/customers", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
