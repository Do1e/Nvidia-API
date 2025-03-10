import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const DEVOPS = process.env.DEVOPS || '';

// 生成随机6位数字验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 用于储存验证码，实际应用中可以使用Redis等
const verificationCodes: Record<string, { code: string; expires: number }> = {};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 获取允许的邮箱列表
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];

    // 检查邮箱是否在允许列表中
    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { success: false, message: `该邮箱不在允许列表中，请联系${DEVOPS}添加` },
        { status: 403 }
      );
    }

    if (email in verificationCodes) {
      const { expires } = verificationCodes[email];
      if (Date.now() < expires - 9 * 60 * 1000) {
        return NextResponse.json(
          { success: false, message: '请勿重复请求' },
          { status: 429 }
        );
      }
    }

    // 生成验证码
    const code = generateVerificationCode();

    // 保存验证码，设置10分钟有效期
    verificationCodes[email] = {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    };

    // 配置邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 发送邮件
    await transporter.sendMail({
      from: `"CITE Lab GPU监控系统" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `您的登录验证码是：${code}`,
      text: `您的登录验证码是：${code}，有效期为10分钟。`,
      html: `
        <h2>GPU监控系统登录验证</h2>
        <p>您好，您的登录验证码是：${code}</p>
        <p>此验证码有效期为10分钟。如非本人操作，请忽略此邮件。</p>
      `,
    });

    return NextResponse.json(
      { success: true, message: '验证码已发送' },
      { status: 200 }
    );
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { success: false, message: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 导出验证码存储，供登录接口使用
export { verificationCodes };
