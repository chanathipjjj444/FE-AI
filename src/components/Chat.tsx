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
  CommentOutlined,
  ArrowLeftOutlined,
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

interface Category {
  id?: number;
  name: string;
  label?: string; // For compatibility if needed, but we'll use name as key/label
  description?: string;
}

interface ChatProps {
  forcedCategory?: string;
  onBack?: () => void;
}

const SecureChatDemo: React.FC<ChatProps> = ({ forcedCategory, onBack }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: `Hello! I am **Corporate AI**${forcedCategory ? ` specialized in **${forcedCategory}**` : ""}. How can I help you today?`,
      sender: "ai",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thoughtChainItems, setThoughtChainItems] = useState<
    ThoughtChainItemType[]
  >([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    forcedCategory || "General",
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // const location = useLocation(); // Not using location state for now, relying on props or default

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, thoughtChainItems]);

  // Load Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8080/admin/categories");
        if (res.ok) {
          const data = await res.json();
          // Map backend categories to menu format + 'General'
          const cats = [{ name: "General" }, ...data];
          setCategories(cats);
        } else {
          // Fallback
          setCategories([
            { name: "General" },
            { name: "Sales" },
            { name: "HR" },
            { name: "Technology" },
            { name: "Finance" },
          ]);
        }
      } catch (e) {
        console.error("Failed to load categories", e);
        // Fallback
        setCategories([
          { name: "General" },
          { name: "Sales" },
          { name: "HR" },
          { name: "Technology" },
          { name: "Finance" },
        ]);
      }
    };

    // Only fetch if not forced or if we want to validte existing
    if (!forcedCategory) {
      fetchCategories();
    } else {
      // If forced, we effectively have one category
      setCategories([{ name: forcedCategory }]);
      setSelectedCategory(forcedCategory);
      // Update initial message
      setMessages([
        {
          id: 1,
          content: `Hello! I am **Corporate AI** specialized in **${forcedCategory}**. How can I help you?`,
          sender: "ai",
        },
      ]);
    }
  }, [forcedCategory]);

  // Load User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // If we are in admin preview mode (embedded), maybe we don't need auth or use a dummy?
        // For now, assuming admin is logged in or we have a token.
        // If onBack is present, it means we are likely in Admin Preview, so maybe skip redirect
        if (!onBack) navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        } else {
          if (!onBack) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    fetchProfile();
  }, [navigate, onBack]);

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
        title: "Requirement Analysis",
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
            title: "Access Denied",
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
            title: "Response Generated",
            status: "success",
            icon: <RobotOutlined />,
          },
        ]);
        addAIMessage(data.message, "success");
        return;
      }

      setThoughtChainItems([
        {
          title: "Security Check Passed",
          status: "success",
          icon: <SafetyCertificateOutlined />,
        },
        {
          title: "Generatng SQL",
          status: "success",
          description: `\`\`\`sql\n${data.sql}\n\`\`\``,
          icon: <DatabaseOutlined />,
        },
        {
          title: "Data Fetched",
          status: "success",
          icon: <ReadOutlined />,
        },
      ]);

      // Format Result as Table or JSON
      let content = "Here is the data I found:\n\n";
      if (data.result && data.result.length > 0) {
        // Simple markdown table generation
        const keys = Object.keys(data.result[0]);
        content += `| ${keys.join(" | ")} |\n`;
        content += `| ${keys.map(() => "---").join(" | ")} |\n`;

        data.result.forEach((row: any) => {
          content += `| ${keys.map((k) => row[k]).join(" | ")} |\n`;
        });
      } else {
        content += "No matching records found.";
      }

      addAIMessage(content, "success");
    } catch (err) {
      setThoughtChainItems((prev) => [
        ...prev,
        {
          title: "Network Error",
          status: "error",
          icon: <DatabaseOutlined />,
        },
      ]);
      addAIMessage(
        "Sorry, I cannot connect to the AI server right now.",
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
    // Optionally clear messages
    setMessages([]);
  };

  // If forced category, we hide the sider menu or simplify it
  const showSider = !forcedCategory;

  return (
    <Layout style={{ height: "100vh" }}>
      {showSider && (
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
            items={categories.map((c) => ({ key: c.name, label: c.name }))}
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
      )}

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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {onBack && (
              <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
                Back to Admin
              </Button>
            )}
            <Title level={4} style={{ margin: 0 }}>
              {selectedCategory} Assistant
            </Title>
          </div>
        </Header>
        <Layout>
          {/* Main Chat Area */}
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

                {/* Visual Reasoning Trace */}
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
                      AI Thinking...
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
              <Text>Guest / Admin</Text>
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
