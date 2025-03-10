import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof createClient> | null = null;

// 懒加载获取 Redis 客户端
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    console.log('Redis client connected');
  }

  return redisClient;
}

// Helper functions for verification codes
export async function setVerificationCode(email: string, code: string) {
  const client = await getRedisClient();
  // Store code with 10 minute expiration
  await client.set(`verification:${email}`, code, { EX: 600 });
}

export async function getVerificationCode(email: string): Promise<string | null> {
  const client = await getRedisClient();
  return await client.get(`verification:${email}`);
}

export async function deleteVerificationCode(email: string) {
  const client = await getRedisClient();
  await client.del(`verification:${email}`);
}

// 存储验证码和时间戳
export interface VerificationRecord {
  code: string;
  expires: number;
}

// 设置带有有效期的验证码记录
export async function setVerificationCodeWithExpiry(email: string, verificationRecord: VerificationRecord) {
  const client = await getRedisClient();
  const ttl = Math.floor((verificationRecord.expires - Date.now()) / 1000);

  if (ttl <= 0) return;

  await client.set(
    `verification:${email}`,
    JSON.stringify(verificationRecord),
    { EX: ttl }
  );
}

// 获取带有有效期的验证码记录
export async function getVerificationRecordWithExpiry(email: string): Promise<VerificationRecord | null> {
  const client = await getRedisClient();
  const result = await client.get(`verification:${email}`);

  if (!result) return null;

  try {
    return JSON.parse(result) as VerificationRecord;
  } catch (e) {
    console.error('Failed to parse verification record:', e);
    return null;
  }
}

// 检查是否可以重新发送验证码(防止频繁请求)
export async function canResendVerificationCode(email: string): Promise<boolean> {
  const record = await getVerificationRecordWithExpiry(email);

  if (!record) return true;

  // 如果距离过期时间还有超过9分钟(即发送后的第1分钟内)，则不允许重新发送
  // 10分钟有效期，只允许每分钟发送一次
  return Date.now() >= record.expires - 9 * 60 * 1000;
}
