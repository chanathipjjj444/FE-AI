import React from "react";
import { Steps, ConfigProvider } from "antd";
import { CheckCircleFilled, ThunderboltFilled } from "@ant-design/icons";

interface TrainingTimelineProps {
  currentStep: number;
  steps: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }[];
}

const TrainingTimeline: React.FC<TrainingTimelineProps> = ({
  currentStep,
  steps,
}) => {
  // Custom Icon Rendering based on status
  const customDot = (_: React.ReactNode, { status }: any) => {
    // Completed
    if (status === "finish") {
      return (
        <div
          className="timeline-icon-wrapper finish"
          style={{
            backgroundColor: "#52c41a",
            boxShadow: "0 0 0 4px rgba(82, 196, 26, 0.2)",
          }}
        >
          <CheckCircleFilled style={{ color: "#fff", fontSize: 20 }} />
        </div>
      );
    }

    // In Progress / Process
    if (status === "process") {
      return (
        <div
          className="timeline-icon-wrapper process"
          style={{
            backgroundColor: "#1890ff",
            boxShadow: "0 0 15px rgba(24, 144, 255, 0.6)",
          }}
        >
          <ThunderboltFilled style={{ color: "#fff", fontSize: 20 }} />
        </div>
      );
    }

    // Waiting
    return (
      <div
        className="timeline-icon-wrapper wait"
        style={{
          backgroundColor: "#f0f0f0",
          border: "2px solid #d9d9d9",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#bfbfbf",
          }}
        />
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          .timeline-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
            z-index: 2;
          }

          .timeline-icon-wrapper.process {
             animation: pulse-blue 2s infinite;
          }
          
          @keyframes pulse-blue {
            0% {
              box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
            }
          }

          /* Override AntD Lines */
          .ant-steps-item-tail {
            top: 20px !important;
            padding: 0 20px !important;
          }
          
          .ant-steps-item-tail::after {
            height: 4px !important;
            background-color: #f0f0f0 !important;
            border-radius: 2px;
          }
          
          .ant-steps-item-finish .ant-steps-item-tail::after {
            background-color: #52c41a !important;
          }

           /* Title & Desc adjustments */
           .ant-steps-item-content {
             margin-top: 12px !important;
             text-align: center;
             width: 100%;
           }
           
           .ant-steps-item-title {
             font-weight: 600 !important;
             font-size: 14px !important;
           }

        `}
      </style>

      <ConfigProvider
        theme={{
          components: {
            Steps: {
              iconSize: 40,
              dotSize: 40,
            },
          },
        }}
      >
        <div
          style={{
            padding: "40px 20px",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            marginBottom: 30,
          }}
        >
          <Steps
            current={currentStep}
            labelPlacement="vertical"
            items={steps.map((s, idx) => ({
              title: s.title,
              description:
                currentStep === idx ? (
                  <Tag color="processing" style={{ marginTop: 5 }}>
                    In Progress
                  </Tag>
                ) : currentStep > idx ? (
                  <Tag color="success" style={{ marginTop: 5 }}>
                    Completed
                  </Tag>
                ) : (
                  <span style={{ fontSize: 12, color: "#999", marginTop: 5 }}>
                    Pending
                  </span>
                ),
            }))}
            progressDot={customDot}
          />
        </div>
      </ConfigProvider>
    </>
  );
};
import { Tag } from "antd";

export default TrainingTimeline;
