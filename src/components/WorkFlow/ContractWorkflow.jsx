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

const ContractProcessStatus = ({ movieStatus, contractStatus, isFilmVipOrTrailer }) => {
  let currentStep = 0;
  let deniedStep = null; // Nếu có bước bị từ chối, lưu vị trí vào đây

  
  if (movieStatus === "WAITING_FOR_REVIEWING") currentStep = 1;
  if (movieStatus === "ACCEPTED_NEGOTIATING" || contractStatus === "WAITING_FOR_REVIEWING") currentStep = 2;
  if (contractStatus === "SIGNED" || movieStatus === "WAITING_FOR_UPLOADING") currentStep = 3;
  if (isFilmVipOrTrailer === true ) currentStep = 4;
  //
  if (movieStatus === "ACTIVE" || contractStatus === "SIGNED"  ) currentStep = 5;
  // Kiểm tra trạng thái bị từ chối
  if (movieStatus === "REJECTED" || contractStatus === "DENIED") {
    deniedStep = currentStep;
  }

  const steps = [
    {
      title: "Create Movie",
      description: "Movie is created and waiting for review.",
      icon: <FileSearchOutlined />,
    },
    {
      title: "Review movie & Create contract",
      description: "Admin reviews movie and creates contract.",
      icon: <FileDoneOutlined />,
    },
    {
      title: "Sign ",
      description: "Publisher signs contract and uploads video.",
      icon: <UploadOutlined />,
    },
  ];

  return (
    <Steps current={deniedStep !== null ? deniedStep : currentStep} className="px-4 py-6">
      {steps.map((step, index) => (
        <Step
          key={index}
          title={
            <Tooltip title={step.description}>
              <span className="text-sm font-medium">{step.title}</span>
            </Tooltip>
          }
          icon={
            index === deniedStep ? (
              <CloseCircleOutlined className="text-red-500" />
            ) : index < currentStep ? (
              <CheckCircleOutlined className="text-green-500" />
            ) : index === currentStep ? (
              <LoadingOutlined className="text-blue-500" />
            ) : (
              step.icon
            )
          }
          className="custom-step"
        />
      ))}
    </Steps>
  );
};

export default ContractProcessStatus;
