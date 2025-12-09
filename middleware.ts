import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const pathname = req.nextUrl.pathname;

  // Rutas para agentes
  if (pathname.startsWith("/agentdash")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role !== "agent") return NextResponse.redirect(new URL("/", req.url));
  }

  // Rutas para clientes
  if (pathname.startsWith("/clientdash")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role !== "client") return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/agentdash/:path*", "/clientdash/:path*"],
};