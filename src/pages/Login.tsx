import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Layout } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Content } = Layout;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", values.email);
      formData.append("password", values.password);

      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      message.success("Login successful!");
      navigate("/chat");
    } catch (error) {
      message.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          style={{
            width: 400,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                background: "#1890ff",
                width: 48,
                height: 48,
                borderRadius: "50%",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LoginOutlined style={{ fontSize: 24, color: "white" }} />
            </div>
            <Title level={3}>Welcome Back</Title>
            <Text type="secondary">
              Enter your credentials to access the Secure Chat
            </Text>
          </div>

          <Form
            name="login_form"
            initialValues={{
              remember: true,
              email: "ceo@example.com",
              password: "password123",
            }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please input your Email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email (e.g., ceo@example.com)"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Log in
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Default User: ceo@example.com / password123
              </Text>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Login;
