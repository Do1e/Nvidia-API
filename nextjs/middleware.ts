import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const publicPaths = ['/login', '/api', '/_next/static', '/_next/image', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = request.cookies.get('auth_token')?.value;
  // 登录界面特殊处理
  if (path === '/login' && token) {
    try {
      await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // token无效，继续处理
    }
  }

  // 检查是否是公共路径
  if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
    return NextResponse.next();
  }

  // 如果没有token，重定向到登录页
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 验证token
    await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

// 修改matcher配置，确保静态资源不被拦截，且明确指定要拦截的路径
export const config = {
  matcher: [
    /*
     * 匹配所有除静态资源外的路径:
     * - 不匹配 _next/static、_next/image、favicon.ico 等静态资源
     * - 匹配 /、/login 和 /api/ 开头的所有路径
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'
  ],
};
