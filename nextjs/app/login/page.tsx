"use client";

import { useState } from "react";
import { Form, Input, Button, message, Card, Space } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const LoginPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSendCode = async () => {
    try {
      // 验证邮箱格式
      await form.validateFields(['email']);
      const email = form.getFieldValue('email');

      setSendingCode(true);
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success('验证码已发送，请查收邮件');
        // 开始60秒倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        messageApi.error(data.message || '发送验证码失败');
      }
    } catch (error) {
      console.error('Send code error:', error);
      messageApi.error('请输入有效的邮箱地址');
    } finally {
      setSendingCode(false);
    }
  };

  const handleLogin = async (values: { email: string; code: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success('登录成功');
        // 将token存入cookies
        Cookies.set('auth_token', data.token, { expires: 7 });
        // 跳转到主页
        router.push('/');
      } else {
        messageApi.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      messageApi.error('登录发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      {contextHolder}
      <Card title="登录系统" className="w-96">
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码长度为6位' }
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="6位验证码"
                size="large"
              />
              <Button
                type="primary"
                onClick={handleSendCode}
                disabled={countdown > 0 || sendingCode}
                loading={sendingCode}
                size="large"
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              icon={<LoginOutlined />}
              loading={loading}
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
