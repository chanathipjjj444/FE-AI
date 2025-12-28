import React, { useState } from "react";
import {
  Layout,
  Button,
  Card,
  Typography,
  Alert,
  Tabs,
  Table,
  Tag,
  Spin,
} from "antd";
import {
  RocketOutlined,
  DatabaseOutlined,
  FilterOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import XStream from "@ant-design/x-markdown";
import LogsTab from "../components/LogsTab";
import TrainingTimeline from "../components/TrainingTimeline";

const { Content } = Layout;
const { Title, Text } = Typography;

const LLMAdmin: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [activeStageTab, setActiveStageTab] = useState("0");

  // Sync tab with current step
  React.useEffect(() => {
    if (processing && currentStep < 5) {
      setActiveStageTab(String(currentStep));
    } else if (currentStep === 5) {
      setActiveStageTab("4"); // Show Insight when done
    }
  }, [currentStep, processing]);

  // Suppress unused logs warning until we map it to the table
  React.useEffect(() => {
    if (logs.length > 0) console.log("Training logs:", logs);
  }, [logs]);

  const steps = [
    { title: "Fetch Data", icon: <DatabaseOutlined /> },
    { title: "Clean & Aggregate", icon: <FilterOutlined /> },
    { title: "Classify", icon: <AppstoreOutlined /> },
    { title: "Vectorize", icon: <FileTextOutlined /> },
    { title: "Insight Analysis", icon: <RobotOutlined /> },
    { title: "Done", icon: <CheckCircleOutlined /> },
  ];

  const startTraining = async () => {
    setProcessing(true);
    setCurrentStep(0);
    setLogs([]);
    setFinalReport(null);

    try {
      const response = await fetch("http://localhost:8080/admin/train/start", {
        method: "POST",
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            setCurrentStep(data.step + 1); // Move step forward
            setLogs((prev) => [...prev, `[${data.status}] ${data.message}`]);

            if (data.report) {
              setFinalReport(data.report);
            }
          } catch (e) {
            console.error("JSON Parse Error", e);
          }
        }
      }
    } catch (error) {
      setLogs((prev) => [...prev, `[ERROR] Connection failed`]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout
      style={{ padding: "40px", background: "#f0f2f5", minHeight: "100vh" }}
    >
      <Content style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Title level={2}>LLM Knowledge Base Admin</Title>
          <Text type="secondary">
            Manage the continuous learning pipeline for the Corporate AI.
          </Text>
        </div>

        <Tabs
          defaultActiveKey="1"
          tabPosition="left"
          items={[
            {
              key: "1",
              label: "Training Pipeline",
              children: (
                <>
                  <Card style={{ marginBottom: 30, borderRadius: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 30,
                      }}
                    >
                      <div>
                        <Title level={4} style={{ margin: 0 }}>
                          Training Pipeline
                        </Title>
                        <Text type="secondary">
                          Ingest latest sales data to update AI context.
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        icon={<RocketOutlined />}
                        onClick={startTraining}
                        loading={processing}
                      >
                        Start Training
                      </Button>
                    </div>

                    <TrainingTimeline currentStep={currentStep} steps={steps} />

                    <div style={{ marginTop: 40, minHeight: 300 }}>
                      <Tabs
                        activeKey={activeStageTab}
                        onChange={setActiveStageTab}
                        type="card"
                        items={[
                          {
                            key: "0",
                            label: "Fetch Data",
                            children: (
                              <Table
                                dataSource={[
                                  {
                                    key: "1",
                                    file: "cisli245.csv",
                                    size: "450 KB",
                                    rows: 2400,
                                    source: "ERP Connector",
                                    status: "Synced",
                                    updated: "2 mins ago",
                                  },
                                  {
                                    key: "2",
                                    file: "whinh430.csv",
                                    size: "820 KB",
                                    rows: 5120,
                                    source: "WMS Connector",
                                    status: "Synced",
                                    updated: "2 mins ago",
                                  },
                                  {
                                    key: "3",
                                    file: "tcibd001.csv",
                                    size: "120 KB",
                                    rows: 850,
                                    source: "Master Data",
                                    status: "Synced",
                                    updated: "5 mins ago",
                                  },
                                  {
                                    key: "4",
                                    file: "tdsls400.csv",
                                    size: "2.1 MB",
                                    rows: 12500,
                                    source: "Legacy Sales",
                                    status: "Synced",
                                    updated: "10 mins ago",
                                  },
                                ]}
                                columns={[
                                  { title: "File Name", dataIndex: "file" },
                                  { title: "Size", dataIndex: "size" },
                                  { title: "Rows Detected", dataIndex: "rows" },
                                  { title: "Source", dataIndex: "source" },
                                  {
                                    title: "Status",
                                    dataIndex: "status",
                                    render: (status) => (
                                      <Tag color="success">{status}</Tag>
                                    ),
                                  },
                                  {
                                    title: "Last Updated",
                                    dataIndex: "updated",
                                  },
                                ]}
                                pagination={false}
                                title={() => (
                                  <Title level={5}>
                                    <DatabaseOutlined /> Ingested Data Files
                                  </Title>
                                )}
                              />
                            ),
                          },
                          {
                            key: "1",
                            label: "Clean & Aggregate",
                            children: (
                              <Table
                                dataSource={[
                                  {
                                    id: "REC-901",
                                    field: "shipping_date",
                                    reason: "Invalid Date Format",
                                    severity: "Warning",
                                    action: "Dropped",
                                  },
                                  {
                                    id: "REC-1024",
                                    field: "cust_id",
                                    reason: "Null ForeignKey",
                                    severity: "Error",
                                    action: "Dropped",
                                  },
                                  {
                                    id: "REC-332",
                                    field: "amount",
                                    reason: "Negative Value",
                                    severity: "Warning",
                                    action: "Flagged",
                                  },
                                ]}
                                columns={[
                                  {
                                    title: "Record ID",
                                    dataIndex: "id",
                                    render: (text) => <Text code>{text}</Text>,
                                  },
                                  { title: "Field", dataIndex: "field" },
                                  { title: "Issue", dataIndex: "reason" },
                                  {
                                    title: "Severity",
                                    dataIndex: "severity",
                                    render: (sev) => (
                                      <Tag
                                        color={
                                          sev === "Error" ? "red" : "orange"
                                        }
                                      >
                                        {sev}
                                      </Tag>
                                    ),
                                  },
                                  {
                                    title: "Action Taken",
                                    dataIndex: "action",
                                  },
                                ]}
                                title={() => (
                                  <Title level={5}>
                                    <FilterOutlined /> Data Cleaning Log
                                  </Title>
                                )}
                              />
                            ),
                          },
                          {
                            key: "2",
                            label: "Classify",
                            children: (
                              <Card
                                title={
                                  <>
                                    <AppstoreOutlined /> AI Data Classification
                                  </>
                                }
                              >
                                <Table
                                  dataSource={[
                                    {
                                      key: "1",
                                      table: "cisli245",
                                      domain: "Sales & Invoicing",
                                      confidence: "99.8%",
                                      columns: "item, amt, date...",
                                    },
                                    {
                                      key: "2",
                                      table: "whinh430",
                                      domain: "Inventory Management",
                                      confidence: "95.2%",
                                      columns: "warehouse, stock, loc...",
                                    },
                                    {
                                      key: "3",
                                      table: "tcibd001",
                                      domain: "Master Data",
                                      confidence: "98.5%",
                                      columns: "item_desc, group...",
                                    },
                                    {
                                      key: "4",
                                      table: "tdsls400",
                                      domain: "Sales Orders",
                                      confidence: "92.0%",
                                      columns: "order_no, cust, date...",
                                    },
                                  ]}
                                  columns={[
                                    {
                                      title: "Table Name",
                                      dataIndex: "table",
                                      render: (t) => <b>{t}</b>,
                                    },
                                    {
                                      title: "Business Domain",
                                      dataIndex: "domain",
                                      render: (d) => (
                                        <Tag color="geekblue">{d}</Tag>
                                      ),
                                    },
                                    {
                                      title: "AI Confidence",
                                      dataIndex: "confidence",
                                    },
                                    {
                                      title: "Key Columns Mapped",
                                      dataIndex: "columns",
                                      render: (c) => (
                                        <Text type="secondary">{c}</Text>
                                      ),
                                    },
                                  ]}
                                  pagination={false}
                                />
                              </Card>
                            ),
                          },
                          {
                            key: "3",
                            label: "Vectorize",
                            children: (
                              <Card
                                title={
                                  <>
                                    <FileTextOutlined /> Vectorization Status
                                  </>
                                }
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-around",
                                    textAlign: "center",
                                    marginBottom: 30,
                                  }}
                                >
                                  <div>
                                    <Title level={2}>850</Title>
                                    <Text type="secondary">Chunks Created</Text>
                                  </div>
                                  <div>
                                    <Title level={2}>1.2M</Title>
                                    <Text type="secondary">
                                      Tokens Processed
                                    </Text>
                                  </div>
                                  <div>
                                    <Title level={2}>1024</Title>
                                    <Text type="secondary">
                                      Vector Dimensions
                                    </Text>
                                  </div>
                                </div>

                                <Table
                                  size="small"
                                  title={() => <b>Recent Embeddings</b>}
                                  dataSource={[
                                    {
                                      id: "vec_88219",
                                      source: "cisli245.csv",
                                      preview: "Inv#9001 - Widget A - $500...",
                                      tokens: 128,
                                    },
                                    {
                                      id: "vec_88220",
                                      source: "cisli245.csv",
                                      preview: "Inv#9002 - Widget B - $250...",
                                      tokens: 115,
                                    },
                                    {
                                      id: "vec_88221",
                                      source: "whinh430.csv",
                                      preview: "WH-01 Stock: 500u - Loc: A1...",
                                      tokens: 89,
                                    },
                                  ]}
                                  columns={[
                                    {
                                      title: "Chunk ID",
                                      dataIndex: "id",
                                      render: (t) => <Text code>{t}</Text>,
                                    },
                                    {
                                      title: "Source File",
                                      dataIndex: "source",
                                    },
                                    {
                                      title: "Content Preview",
                                      dataIndex: "preview",
                                    },
                                    {
                                      title: "Tokens",
                                      dataIndex: "tokens",
                                      align: "right",
                                    },
                                  ]}
                                  pagination={false}
                                />

                                <div style={{ marginTop: 20 }}>
                                  <Alert
                                    message="Embedding model: text-embedding-ada-002"
                                    type="info"
                                    showIcon
                                  />
                                </div>
                              </Card>
                            ),
                          },
                          {
                            key: "4",
                            label: "Insight Analysis",
                            children: finalReport ? (
                              <Card
                                title={
                                  <>
                                    <RobotOutlined /> Global Strategic Insight
                                  </>
                                }
                                style={{
                                  borderRadius: 12,
                                  border: "1px solid #b7eb8f",
                                }}
                              >
                                <Alert
                                  message="New Knowledge Vectors Embedded Successfully"
                                  type="success"
                                  showIcon
                                  style={{ marginBottom: 20 }}
                                />
                                <XStream content={finalReport} />
                              </Card>
                            ) : (
                              <div style={{ textAlign: "center", padding: 50 }}>
                                <Spin size="large" />
                                <p>Generating Insights...</p>
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </Card>
                </>
              ),
            },
            {
              key: "2",
              label: "Query Logs",
              children: <LogsTab />,
            },
            {
              key: "3",
              label: "System Health",
              disabled: true,
            },
            {
              key: "4",
              label: "Settings",
              disabled: true,
            },
          ]}
        />
      </Content>
    </Layout>
  );
};

export default LLMAdmin;
