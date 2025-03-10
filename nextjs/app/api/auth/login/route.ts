import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { verificationCodes } from '../send-code/route';

const DEVOPS = process.env.DEVOPS || '';
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: '无效的邮箱地址' }, { status: 400 });
    }

    // 检查是否是允许的邮箱
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json({ message: `该邮箱不在允许列表中，请联系${DEVOPS}添加` }, { status: 403 });
    }

    // 检查验证码是否存在
    const storedVerification = verificationCodes[email];
    if (!storedVerification) {
      return NextResponse.json(
        { success: false, message: '验证码不存在或已过期，请重新获取' },
        { status: 400 }
      );
    }

    // 检查验证码是否过期
    if (Date.now() > storedVerification.expires) {
      // 删除过期验证码
      delete verificationCodes[email];
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      );
    }

    // 检查验证码是否匹配
    if (storedVerification.code !== code) {
      return NextResponse.json(
        { success: false, message: '验证码不正确' },
        { status: 400 }
      );
    }

    // 验证通过，删除已使用的验证码
    delete verificationCodes[email];

    // 生成JWT令牌，包含用户邮箱信息
    const token = await new jose.SignJWT({
      email: email,
      role: 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    return NextResponse.json({ message: '登录成功', token });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
