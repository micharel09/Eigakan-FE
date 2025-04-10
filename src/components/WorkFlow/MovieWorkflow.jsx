import { Steps, Tooltip } from "antd";
import { 
  FileDoneOutlined, 
  FileSearchOutlined, 
  UploadOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined, 
  CloseCircleOutlined 
} from "@ant-design/icons";

const { Step } = Steps;

const ProcessStatus = ({ movieStatus, contractStatus, isFilmVipOrTrailer }) => {
  let currentStep = 0;
  let deniedStep = null;

  if (movieStatus === "WAITING_FOR_REVIEWING") currentStep = 1;
  if (movieStatus === "ACCEPTED_NEGOTIATING" || contractStatus === "WAITING_FOR_REVIEWING") currentStep = 2;
  if (contractStatus === "SIGNED" || movieStatus === "WAITING_FOR_UPLOADING") currentStep = 3;
  if (isFilmVipOrTrailer) currentStep = 4;
  if (movieStatus === "ACTIVE") currentStep = 5; // Step 5 chỉ active nếu movieStatus là ACTIVE

  // Nếu có trạng thái từ chối
  if (movieStatus === "REJECTED" || contractStatus === "DENIED") {
    deniedStep = currentStep;
  }

  const isArchived = movieStatus === "ARCHIVED";
  const isActive = movieStatus === "ACTIVE";

  const steps = [
    { title: "Create Movie", description: "Movie is created and waiting for review.", icon: <FileSearchOutlined /> },
    { title: "Review movie & Create contract", description: "Admin reviews movie and creates contract.", icon: <FileDoneOutlined /> },
    { title: "Sign", description: "Publisher signs contract and uploads video.", icon: <UploadOutlined /> },
    { title: "Upload", description: "Publisher uploads the video.", icon: <UploadOutlined /> },
    { title: "Active", description: "Movie is approved and published.", icon: <CheckCircleOutlined /> },
  ];

  return (
    <Steps current={deniedStep !== null ? deniedStep : currentStep} className="px-4 py-10">
      {steps.map((step, index) => (
        <Step
          key={index}
          title={
            <Tooltip title={step.description}>
              <span className="text-sm font-medium">{step.title}</span>
            </Tooltip>
          }
          icon={
            isArchived
              ? // Nếu ARCHIVED thì Step 1-4 xanh lá, Step 5 đỏ
                index < 4
                ? <CheckCircleOutlined style={{ color: "green" }} />
                : <CloseCircleOutlined style={{ color: "red" }} />

              : isActive && index <= 4
              ? // Nếu ACTIVE thì Step 1-4 xanh lá, Step 5 xanh khi đến
                <CheckCircleOutlined style={{ color: "green" }} />

              : index === deniedStep
              ? <CloseCircleOutlined style={{ color: "red" }} />

              : index < currentStep
              ? <CheckCircleOutlined style={{ color: "green" }} />

              : index === currentStep
              ? <LoadingOutlined style={{ color: "blue" }} />

              : step.icon
          }
        />
      ))}
    </Steps>
  );
};


export default ProcessStatus;
