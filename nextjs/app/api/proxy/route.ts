import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  // 验证用户是否已登录
  const isAuthenticated = await verifyAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in proxy API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
