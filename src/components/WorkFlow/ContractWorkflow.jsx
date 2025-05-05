import { Steps, Tooltip } from "antd";
import {
  FileDoneOutlined,
  FileSearchOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Step } = Steps;

/**
 * Contract workflow process status component
 * Displays the current status of a contract in the workflow process
 *
 * @param {string} movieStatus - Current status of the movie
 * @param {string} contractStatus - Current status of the contract
 * @param {boolean} isFilmVipOrTrailer - Whether the movie has film vip or trailer media
 */
const ContractProcessStatus = ({
  movieStatus,
  contractStatus,
  isFilmVipOrTrailer,
}) => {
  // Define all possible workflow steps
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
      title: "Sign",
      description: "Publisher signs contract and uploads video.",
      icon: <UploadOutlined />,
    },
  ];

  // Update steps title and description based on movie status and contract status
  if (contractStatus === "DENIED") {
    steps[1].title = "Contract Denied";
    steps[1].description =
      "Contract has been denied. Please review and resubmit.";
  } else if (contractStatus === "WAITING_FOR_REVIEWING") {
    steps[1].title = "Contract Under Review";
    steps[1].description = "Contract is being reviewed by admin.";
  } else if (movieStatus === "ACCEPTED_NEGOTIATING") {
    steps[1].title = "Contract Negotiation";
    steps[1].description = "Movie accepted, contract negotiation in progress.";
  }

  // Update step 3 title and description
  if (movieStatus === "WAITING_FOR_UPLOADING") {
    steps[2].title = "Upload Media";
    steps[2].description = "Movie is waiting for media upload.";
  }

  // Determine the current workflow state
  const getWorkflowState = () => {
    // Initialize state
    const state = {
      currentStep: 0,
      stoppedAtStep: null,
      isActive: movieStatus === "ACTIVE",
      isArchived: movieStatus === "ARCHIVED",
    };

    // Special cases
    if (movieStatus === "REJECTED") {
      state.stoppedAtStep = 0; // Movie rejected at step 1
      return state;
    }

    if (contractStatus === "DENIED") {
      state.stoppedAtStep = 1; // Contract denied at step 2
      return state;
    }

    // Normal flow
    if (movieStatus === "WAITING_FOR_REVIEWING") {
      state.currentStep = 1; // At step 2 (index 1) - movie created, waiting for review
    } else if (movieStatus === "WAITING_FOR_UPLOADING") {
      if (contractStatus === "SIGNED") {
        state.currentStep = 2; // At step 3 (index 2) - waiting for upload
      }
    } else if (movieStatus === "ACCEPTED_NEGOTIATING") {
      if (contractStatus === "WAITING_FOR_REVIEWING") {
        state.currentStep = 1; // At step 2 (index 1) - contract is waiting for review
      } else if (contractStatus === "SIGNED") {
        state.currentStep = 2; // At step 3 (index 2) - contract is signed
      } else {
        state.currentStep = 1; // Default to step 2 if no specific contract status
      }
    }

    if (state.isActive) {
      state.currentStep = 2; // At step 3 (index 2) - the last step
    }

    return state;
  };

  const workflowState = getWorkflowState();

  /**
   * Custom render function for each step
   * @param {number} index - The step index (0-based)
   * @returns {Object} - The step props
   */
  const renderStep = (index) => {
    const { currentStep, stoppedAtStep, isActive } = workflowState;

    // Default props
    const stepProps = {
      title: (
        <Tooltip title={steps[index].description}>
          <span className="text-sm font-medium">{steps[index].title}</span>
        </Tooltip>
      ),
      icon: steps[index].icon,
      status: "wait", // Default status
    };

    // Special case: Contract denied
    if (contractStatus === "DENIED") {
      if (index === 0) {
        // Step 1: Completed
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 1) {
        // Step 2: Denied
        stepProps.icon = <CloseCircleOutlined style={{ color: "red" }} />;
        stepProps.status = "error";
      }
      // Step 3+ remains in wait state
      return stepProps;
    }

    // Special case: Movie rejected
    if (movieStatus === "REJECTED") {
      if (index === 0) {
        // Step 1: Rejected
        stepProps.icon = <CloseCircleOutlined style={{ color: "red" }} />;
        stepProps.status = "error";
      }
      // Step 2+ remain in wait state
      return stepProps;
    }

    // Special case: Contract signed
    if (contractStatus === "SIGNED" && !isActive) {
      if (index <= 1) {
        // Step 1-2: Completed
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 2) {
        // Step 3: Completed (contract signed)
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      }
      return stepProps;
    }

    // Special case: Contract is waiting for review
    if (contractStatus === "WAITING_FOR_REVIEWING") {
      if (index === 0) {
        // Step 1: Completed (movie created)
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 1) {
        // Step 2: In progress (waiting for review)
        stepProps.icon = <LoadingOutlined style={{ color: "blue" }} />;
        stepProps.status = "process";
      }
      // Step 3 remains in wait state
      return stepProps;
    }

    // Special case: Movie is waiting for review
    if (movieStatus === "WAITING_FOR_REVIEWING") {
      if (index === 0) {
        // Step 1: Completed (movie created)
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 1) {
        // Step 2: In progress (waiting for review)
        stepProps.icon = <LoadingOutlined style={{ color: "blue" }} />;
        stepProps.status = "process";
      }
      // Step 3 remains in wait state
      return stepProps;
    }

    // Special case: Movie is in negotiation
    if (
      movieStatus === "ACCEPTED_NEGOTIATING" &&
      contractStatus === "WAITING_FOR_REVIEWING"
    ) {
      if (index === 0) {
        // Step 1: Completed
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 1) {
        // Step 2: In progress (contract under review)
        stepProps.icon = <LoadingOutlined style={{ color: "blue" }} />;
        stepProps.status = "process";
      }
      return stepProps;
    }

    // Special case: Movie is waiting for uploading
    if (movieStatus === "WAITING_FOR_UPLOADING") {
      if (index <= 1) {
        // Step 1-2: Completed
        stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
        stepProps.status = "finish";
      } else if (index === 2) {
        // Step 3: In progress (waiting for upload)
        stepProps.icon = <LoadingOutlined style={{ color: "blue" }} />;
        stepProps.status = "process";
      }
      return stepProps;
    }

    // Special case: Active movie
    if (isActive) {
      // All steps are completed
      stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
      stepProps.status = "finish";
      return stepProps;
    }

    // Normal flow
    if (stoppedAtStep !== null && index === stoppedAtStep) {
      // Stopped step
      stepProps.icon = <CloseCircleOutlined style={{ color: "red" }} />;
      stepProps.status = "error";
    } else if (index < currentStep) {
      // Completed steps
      stepProps.icon = <CheckCircleOutlined style={{ color: "green" }} />;
      stepProps.status = "finish";
    } else if (index === currentStep) {
      // Current step
      stepProps.icon = <LoadingOutlined style={{ color: "blue" }} />;
      stepProps.status = "process";
    }
    // Future steps remain in wait state

    return stepProps;
  };

  return (
    <Steps current={workflowState.currentStep} className="px-4 py-6">
      {steps.map((_, index) => {
        const stepProps = renderStep(index);
        return (
          <Step
            key={index}
            title={stepProps.title}
            icon={stepProps.icon}
            status={stepProps.status}
            className="custom-step"
          />
        );
      })}
    </Steps>
  );
};

export default ContractProcessStatus;
