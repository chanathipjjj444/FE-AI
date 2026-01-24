import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Typography,
  Tag,
  Alert,
  Divider,
  Flex,
  Button,
  Menu,
  message,
} from "antd";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  RobotOutlined,
  ReadOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  ShopOutlined,
  TeamOutlined,
  LaptopOutlined,
  BankOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { Actions, Bubble, Sender, ThoughtChain } from "@ant-design/x";
import type { ThoughtChainItemType } from "@ant-design/x";
import XStream from "@ant-design/x-markdown";
import { useNavigate } from "react-router-dom";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const actionItems = (content: string) => [
  {
    key: "copy",
    label: "copy",
    actionRender: () => {
      return <Actions.Copy text={content} />;
    },
  },
];

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  status?: "success" | "error";
  role?: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
}

const CATEGORIES = [
  { key: "General", label: "General Chat", icon: <RobotOutlined /> },
  { key: "Sales", label: "Sales", icon: <ShopOutlined /> },
  { key: "HR", label: "HR", icon: <TeamOutlined /> },
  { key: "Technology", label: "Technology", icon: <LaptopOutlined /> },
  { key: "Finance", label: "Finance", icon: <BankOutlined /> },
];

const SecureChatDemo: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "สวัสดีครับ! ผมคือ **Corporate AI** มีอะไรให้ผมช่วยวันนี้ครับ?",
      sender: "ai",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thoughtChainItems, setThoughtChainItems] = useState<
    ThoughtChainItemType[]
  >([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("General");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, thoughtChainItems]);

  // Load User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        } else {
          // Token expired or invalid
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSend = async (value: string) => {
    if (!value.trim()) return;

    // 1. User Message
    const userMsg: Message = {
      id: Date.now(),
      content: value,
      sender: "user",
      role: userProfile?.position || "Staff",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);
    setThoughtChainItems([]); // Reset steps

    // 2. Start Real API Workflow
    await executeAIWorkflow(value);
  };

  const executeAIWorkflow = async (query: string) => {
    const token = localStorage.getItem("token");

    // Step 1: Sending Request
    setThoughtChainItems([
      {
        title: "โจทย์: ความต้องการและสิทธิ์", // Adapted slightly for UX
        status: "loading",
        icon: <SafetyCertificateOutlined />,
      },
    ]);

    try {
      const res = await fetch("http://localhost:8080/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, category: selectedCategory }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Access Denied or Error
        const errorMsg = data.detail || "Unknown Error";

        setThoughtChainItems(() => [
          {
            title: "การตรวจสอบสิทธิ์ล้มเหลว",
            status: "error",
            description: errorMsg,
            icon: <LockOutlined />,
          },
        ]);

        addAIMessage(`**Error**: ${errorMsg}`, "error");
        return;
      }

      // Success
      if (data.message) {
        setThoughtChainItems([
          {
            title: "สร้างคำตอบเรียบร้อยแล้ว",
            status: "success",
            icon: <RobotOutlined />,
          },
        ]);
        addAIMessage(data.message, "success");
        return;
      }

      setThoughtChainItems([
        {
          title: "ผ่านการตรวจสอบความปลอดภัย",
          status: "success",
          icon: <SafetyCertificateOutlined />,
        },
        {
          title: "สร้างคำสั่ง SQL",
          status: "success",
          description: `\`\`\`sql\n${data.sql}\n\`\`\``,
          icon: <DatabaseOutlined />,
        },
        {
          title: "ดึงข้อมูลเรียบร้อย",
          status: "success",
          icon: <ReadOutlined />,
        },
      ]);

      // Format Result as Table or JSON
      let content = "พบข้อมูลดังนี้:\n\n";
      if (data.result && data.result.length > 0) {
        // Simple markdown table generation
        const keys = Object.keys(data.result[0]);
        content += `| ${keys.join(" | ")} |\n`;
        content += `| ${keys.map(() => "---").join(" | ")} |\n`;

        data.result.forEach((row: any) => {
          content += `| ${keys.map((k) => row[k]).join(" | ")} |\n`;
        });
      } else {
        content += "ไม่พบข้อมูลที่ตรงกับคำค้นหา";
      }

      addAIMessage(content, "success");
    } catch (err) {
      setThoughtChainItems((prev) => [
        ...prev,
        {
          title: "ข้อผิดพลาดเครือข่าย",
          status: "error",
          icon: <DatabaseOutlined />,
        },
      ]);
      addAIMessage(
        "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ AI",
        "error",
      );
    }
  };

  const addAIMessage = (text: string, status?: "success" | "error") => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), content: text, sender: "ai", status },
    ]);
    setIsProcessing(false);
  };

  const renderMessageContent = (msg: string) => {
    // AI messages use XStream to render Markdown
    return <XStream content={msg} />;
  };

  const handleCategoryChange = (e: any) => {
    setSelectedCategory(e.key);
    message.info(`Switched to ${e.key} Knowledge Base`);
    // Optionally clear messages or add a separator
    setMessages([]);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={"15%"} theme="dark">
        <div
          style={{ padding: "16px 0", textAlign: "center", marginBottom: 16 }}
        >
          <CommentOutlined
            style={{ fontSize: "24px", color: "#fff", marginRight: 10 }}
          />
          <Text strong style={{ color: "#fff", fontSize: 16 }}>
            Forniture's Chat
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedCategory]}
          onClick={handleCategoryChange}
          items={CATEGORIES}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            textAlign: "center",
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ color: "white" }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              {selectedCategory} Assistant
            </Title>
          </div>
        </Header>
        <Layout>
          {/* Right Profile Sider - kept as original but moved inside */}
          <Content
            style={{
              padding: "20px",
              background: "#fff",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Flex vertical style={{ height: "100%" }} gap="middle">
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {messages.length === 0 && (
                  <Alert
                    message={`Welcome to ${selectedCategory} Learning Hub`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: 20,
                      display: "flex",
                      justifyContent:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Bubble
                      placement={msg.sender === "user" ? "end" : "start"}
                      content={renderMessageContent(msg.content)}
                      footer={() => (
                        <Actions
                          items={actionItems(msg.content)}
                          onClick={() => console.log("handle Click")}
                        />
                      )}
                      avatar={
                        msg.sender === "user" ? (
                          <UserOutlined />
                        ) : (
                          <RobotOutlined />
                        )
                      }
                      variant={msg.status === "error" ? "filled" : "outlined"}
                    />
                  </div>
                ))}

                {/* Visual Reasoning Trace (The Ant Design X Magic) */}
                {isProcessing && thoughtChainItems.length > 0 && (
                  <div
                    style={{
                      margin: "20px 0",
                      padding: 20,
                      background: "#fafafa",
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      strong
                      type="secondary"
                      style={{ marginBottom: 10, display: "block" }}
                    >
                      กำลังประมวลผลคำสั่ง...
                    </Text>
                    <ThoughtChain items={thoughtChainItems} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: "0 50px" }}>
                <Sender
                  loading={isProcessing}
                  value={input}
                  onChange={setInput}
                  onSubmit={() => {
                    handleSend(input);
                  }}
                  placeholder={`Ask regarding ${selectedCategory}...`}
                />
              </div>
            </Flex>
          </Content>

          <Sider
            width="20%"
            theme="light"
            style={{
              padding: "20px",
              borderLeft: "1px solid #f0f0f0",
            }}
          >
            <Title level={5}>
              <UserOutlined /> User Profile
            </Title>
            {userProfile ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <Text strong>
                    {userProfile.first_name} {userProfile.last_name}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {userProfile.email}
                  </Text>
                </div>

                <Tag color="geekblue">{userProfile.position}</Tag>
                <Tag color="purple" style={{ marginTop: 5 }}>
                  {userProfile.department}
                </Tag>
              </>
            ) : (
              <Text>Loading...</Text>
            )}

            <Divider />
            <Alert
              message="Secure Session"
              description="Access limited by category."
              type="success"
              showIcon
              style={{ fontSize: 12 }}
            />
          </Sider>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default SecureChatDemo;
