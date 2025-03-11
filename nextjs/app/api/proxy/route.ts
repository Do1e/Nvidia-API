import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/lib/auth";
import servers from "@/app/servers.json";

export async function POST(request: NextRequest) {
  // 验证用户是否已登录
  const isAuthenticated = await verifyAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 });
    }

    // 从配置中获取URL，而不是从前端接收
    const url = servers[serverId as keyof typeof servers];

    if (!url) {
      return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
    }

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in proxy API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
