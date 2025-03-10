import { cookies } from "next/headers";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
// 验证认证状态
export async function verifyAuth() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jose.jwtVerify(token, secret);
    return true;
  } catch (err) {
    (await cookies()).delete("auth_token");
    return false;
  }
}
