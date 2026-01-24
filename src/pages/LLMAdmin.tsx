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
  Upload,
  Form,
  Select,
  message,
} from "antd";
import {
  RocketOutlined,
  DatabaseOutlined,
  FilterOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  UploadOutlined,
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
  const [dqReport, setDqReport] = useState<any[]>([]);
  const [classificationData, setClassificationData] = useState<any[]>([]);
  const [completedVectors, setCompletedVectors] = useState<string[]>([]);
  const [activeStageTab, setActiveStageTab] = useState("0");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [form] = Form.useForm();

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
    setDqReport([]);
    setClassificationData([]);
    setCompletedVectors([]);
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
            if (data.report_data) {
              setDqReport(data.report_data);
            }
            if (data.classification_data) {
              setClassificationData(data.classification_data);
            }
            if (data.completed_vectors) {
              setCompletedVectors(data.completed_vectors);
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
                              <Card
                                title={
                                  <>
                                    <FilterOutlined /> Data Cleaning Log
                                  </>
                                }
                              >
                                <div
                                  style={{
                                    height: "600px",
                                    overflow: "auto",
                                    padding: "10px",
                                  }}
                                >
                                  <XStream
                                    content={
                                      logs
                                        .find((l) => l.includes("CLEANING"))
                                        ?.replace("[CLEANING] ", "") ||
                                      "Waiting for cleaning step..."
                                    }
                                  />
                                  {dqReport && dqReport.length > 0 && (
                                    <Table
                                      style={{ marginTop: 20 }}
                                      dataSource={dqReport}
                                      pagination={false}
                                      rowKey={(record) =>
                                        record.scope + record.target
                                      }
                                      columns={[
                                        {
                                          title: "Scope",
                                          dataIndex: "scope",
                                          key: "scope",
                                          width: "15%",
                                          render: (text) => <b>{text}</b>,
                                        },
                                        {
                                          title: "Target",
                                          dataIndex: "target",
                                          key: "target",
                                          render: (text) => <code>{text}</code>,
                                        },
                                        {
                                          title: "Issue Detected",
                                          dataIndex: "issue",
                                          key: "issue",
                                        },
                                        {
                                          title: "Severity",
                                          dataIndex: "severity",
                                          key: "severity",
                                          render: (sev) => {
                                            let color = "blue";
                                            if (sev === "Critical")
                                              color = "red";
                                            if (sev === "Error")
                                              color = "volcano";
                                            if (sev === "Warning")
                                              color = "orange";
                                            return (
                                              <Tag color={color}>
                                                {sev.toUpperCase()}
                                              </Tag>
                                            );
                                          },
                                        },
                                        {
                                          title: "Action Taken",
                                          dataIndex: "action",
                                          key: "action",
                                          render: (action) => (
                                            <Tag
                                              color={
                                                action.includes("DROPPED") ||
                                                action === "Dropped"
                                                  ? "magenta"
                                                  : "gold"
                                              }
                                            >
                                              {action}
                                            </Tag>
                                          ),
                                        },
                                      ]}
                                    />
                                  )}
                                </div>
                              </Card>
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
                                <div
                                  style={{
                                    height: "600px",
                                    overflow: "auto",
                                    padding: "10px",
                                  }}
                                >
                                  <XStream
                                    content={
                                      logs
                                        .find((l) => l.includes("CLASSIFYING"))
                                        ?.replace("[CLASSIFYING] ", "") ||
                                      "Waiting for classification..."
                                    }
                                  />
                                  {classificationData &&
                                    classificationData.length > 0 && (
                                      <div style={{ marginTop: 20 }}>
                                        {classificationData.map(
                                          (group: any) => (
                                            <Card
                                              key={group.group}
                                              type="inner"
                                              title={group.group}
                                              size="small"
                                              style={{ marginBottom: 16 }}
                                            >
                                              {group.tables.map(
                                                (table: string) => (
                                                  <Tag
                                                    key={table}
                                                    color="geekblue"
                                                    style={{ marginBottom: 8 }}
                                                  >
                                                    {table}
                                                  </Tag>
                                                ),
                                              )}
                                            </Card>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
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
                                    height: "600px",
                                    overflow: "auto",
                                    padding: "10px",
                                  }}
                                >
                                  {classificationData &&
                                  classificationData.length > 0 ? (
                                    <div style={{ marginTop: 20 }}>
                                      {classificationData.map((group: any) => {
                                        const isDone =
                                          completedVectors.includes(
                                            group.group,
                                          );
                                        return (
                                          <Card
                                            key={group.group}
                                            type="inner"
                                            size="small"
                                            style={{ marginBottom: 16 }}
                                            title={group.group}
                                            extra={
                                              isDone ? (
                                                <Tag color="success">
                                                  <CheckCircleOutlined />{" "}
                                                  Indexed
                                                </Tag>
                                              ) : (
                                                <Tag color="processing">
                                                  <Spin size="small" />{" "}
                                                  Indexing...
                                                </Tag>
                                              )
                                            }
                                          >
                                            <Text type="secondary">
                                              Generating embeddings for{" "}
                                              {group.tables.length} tables:{" "}
                                              {group.tables.join(", ")}
                                            </Text>
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <XStream
                                      content={
                                        logs
                                          .filter((l) =>
                                            l.includes("VECTORIZING"),
                                          )
                                          .map((l) =>
                                            l.replace("[VECTORIZING] ", ""),
                                          )
                                          .join("\n\n") ||
                                        "Waiting for vectorization..."
                                      }
                                    />
                                  )}
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
              label: "Knowledge Upload",
              children: (
                <Card
                  title="Upload Knowledge Base"
                  style={{ borderRadius: 12 }}
                >
                  <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
                    <Alert
                      message="Upload PDF Documents"
                      description="Select a category and upload PDF files to update the RAG knowledge base."
                      type="info"
                      showIcon
                      style={{ marginBottom: 30 }}
                    />

                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={async (values) => {
                        const formData = new FormData();

                        // Handle multiple files
                        if (values.files && values.files.length > 0) {
                          values.files.forEach((file: any) => {
                            formData.append("files", file.originFileObj);
                          });
                        }

                        formData.append("category", values.category);

                        setUploadLoading(true);
                        try {
                          // message.loading({ content: "Uploading...", key: "upload" });
                          const res = await fetch(
                            "http://localhost:8080/admin/knowledge/upload",
                            {
                              method: "POST",
                              body: formData,
                            },
                          );

                          if (res.ok) {
                            const data = await res.json();
                            message.success({
                              content: data.message || "Upload Successful!",
                              key: "upload",
                            });
                          } else {
                            const err = await res.json();
                            message.error({
                              content: `Upload Failed: ${err.detail}`,
                              key: "upload",
                            });
                          }
                        } catch (e) {
                          message.error({
                            content: "Upload Error",
                            key: "upload",
                          });
                        } finally {
                          setUploadLoading(false);
                          form.resetFields(["files"]);
                        }
                      }}
                    >
                      <Form.Item
                        label="Category"
                        name="category"
                        rules={[
                          {
                            required: true,
                            message: "Please select a category!",
                          },
                        ]}
                        initialValue="Sales"
                      >
                        <Select>
                          <Select.Option value="Sales">Sales</Select.Option>
                          <Select.Option value="HR">HR</Select.Option>
                          <Select.Option value="Technology">
                            Technology
                          </Select.Option>
                          <Select.Option value="Finance">Finance</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="PDF Documents"
                        name="files"
                        valuePropName="fileList"
                        getValueFromEvent={(e: any) => {
                          if (Array.isArray(e)) return e;
                          return e?.fileList;
                        }}
                        rules={[
                          {
                            required: true,
                            message: "Please upload at least one file!",
                          },
                        ]}
                      >
                        <Upload.Dragger
                          name="files"
                          multiple={true}
                          accept=".pdf"
                          beforeUpload={() => false} // Prevent auto upload
                        >
                          <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                          </p>
                          <p className="ant-upload-text">
                            Click or drag files to this area to upload
                          </p>
                        </Upload.Dragger>
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<UploadOutlined />}
                          block
                          size="large"
                          loading={uploadLoading}
                        >
                          Upload to Knowledge Base
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </Card>
              ),
            },
            {
              key: "4",
              label: "System Health",
              disabled: true,
            },
            {
              key: "5",
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
