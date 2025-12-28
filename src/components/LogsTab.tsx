import React, { useEffect, useState } from "react";
import {
  List,
  Card,
  Typography,
  Tag,
  Space,
  Empty,
  Spin,
  Button,
  Drawer,
  Descriptions,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  SyncOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import ReactSyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Dark theme for code

const { Title, Text, Paragraph } = Typography;

interface LogEntry {
  id: number;
  timestamp: string;
  user_email: string;
  user_dept: string;
  user_query: string;
  security_policy: string;
  generated_sql: string;
  status: string;
  execution_time_ms: number;
  full_context: any;
}

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/admin/logs?limit=50");
      const json = await res.json();
      setLogs(json.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const showDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedLog(null);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Success
          </Tag>
        );
      case "BLOCKED":
        return (
          <Tag color="error" icon={<StopOutlined />}>
            Blocked
          </Tag>
        );
      case "NO_SQL":
        return (
          <Tag color="orange" icon={<StopOutlined />}>
            No SQL
          </Tag>
        );
      case "ERROR":
        return (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            Error
          </Tag>
        );
      case "FETCHING":
      case "CLEANING":
      case "CLASSIFYING":
      case "EMBEDDING":
        return (
          <Tag color="blue" icon={<SyncOutlined spin />}>
            {status}
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <div
      style={{ display: "flex", gap: "20px", height: "calc(100vh - 200px)" }}
    >
      {/* Left Sidebar: List of Logs */}
      <Card
        style={{ width: "40%", height: "100%", overflowY: "auto" }}
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Execution Logs</span>
            <Button
              icon={<SyncOutlined />}
              size="small"
              onClick={fetchLogs}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
      >
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={logs}
            locale={{ emptyText: <Empty description="No logs found" /> }}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: "pointer", transition: "all 0.3s" }}
                onClick={() => showDetails(item)}
                actions={[<Button type="text" icon={<EyeOutlined />} />]}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text strong ellipsis style={{ maxWidth: 180 }}>
                        {item.user_query}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                  }
                  description={
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 4,
                        }}
                      >
                        {getStatusTag(item.status)}
                        <Tag icon={<ClockCircleOutlined />}>
                          {item.execution_time_ms.toFixed(0)}ms
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        User: {item.user_email}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Right Listing: Recent / Details Placeholder */}
      <Card
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
        }}
      >
        <Empty
          description="Select a log entry to view details"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>

      {/* Drawer for Details */}
      <Drawer
        title="Execution Trace"
        placement="right"
        width={700}
        onClose={closeDrawer}
        open={drawerVisible}
      >
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header Info */}
            <div>
              <Title level={4}>{selectedLog.user_query}</Title>
              <Space>
                {getStatusTag(selectedLog.status)}
                <Tag>{new Date(selectedLog.timestamp).toLocaleString()}</Tag>
                <Tag>
                  Duration: {selectedLog.execution_time_ms.toFixed(2)}ms
                </Tag>
              </Space>
            </div>

            {/* User Context */}
            <Card size="small" title="User Context">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Email">
                  {selectedLog.user_email}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedLog.user_dept}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Security Policy */}
            <Card
              size="small"
              title="Security & Governance Policy Applied"
              style={{ borderColor: "#ffa940", background: "#fff7e6" }}
            >
              <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                {selectedLog.security_policy}
              </Paragraph>
            </Card>

            {/* Generated SQL */}
            <Card
              size="small"
              title={
                <>
                  <CodeOutlined /> Generated Output
                </>
              }
            >
              {selectedLog.status === "NO_SQL" ? (
                <div
                  style={{
                    padding: 10,
                    background: "#f5f5f5",
                    borderRadius: 4,
                  }}
                >
                  <Text italic>{selectedLog.generated_sql}</Text>
                </div>
              ) : (
                <ReactSyntaxHighlighter
                  language="sql"
                  style={vs2015}
                  customStyle={{ borderRadius: 6, padding: 12 }}
                >
                  {selectedLog.generated_sql}
                </ReactSyntaxHighlighter>
              )}
            </Card>

            {/* Full Context (Prompt) */}
            {selectedLog.full_context &&
              JSON.parse(selectedLog.full_context)?.system_prompt_snapshot && (
                <Card size="small" title="System Prompt Snapshot">
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      fontSize: 12,
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                    }}
                  >
                    {
                      JSON.parse(selectedLog.full_context)
                        .system_prompt_snapshot
                    }
                  </div>
                </Card>
              )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LogsTab;
