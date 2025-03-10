import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { verificationCodes } from '../send-code/route';

const DEVOPS = process.env.DEVOPS || '';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    // 获取允许的邮箱列表
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];

    // 检查邮箱是否在允许列表中
    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { success: false, message: `该邮箱不在允许列表中，请联系${DEVOPS}添加` },
        { status: 403 }
      );
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

    // 生成JWT令牌 - 使用jose替代jsonwebtoken
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const token = await new jose.SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // 返回令牌
    return NextResponse.json(
      {
        success: true,
        message: '登录成功',
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, message: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
