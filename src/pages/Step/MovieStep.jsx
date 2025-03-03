"use client";

import { useState } from "react";
import { Steps, Button, notification } from "antd";
import { useUserRole } from "../../hooks/useUserRole"; // Giả sử em có hook kiểm tra role
import PublisherSidebar from "../../components/PublisherSidebar";
import AdminSidebar from "../../components/AdminSidebar";
import CreateMoviePublisher from "./CreateMoviePublisher";
import CreateContractAdmin from "./CreateContractAdmin";
import SignContractPublisher from "./SignContractPublisher";
import UploadVideoPublisher from "./UploadVideoPublisher";
import ChangeActiveAdmin from "./ChangeActiveAdmin";

const { Step } = Steps;

const MovieProcess = () => {
  const { isPublisher, isAdmin } = useUserRole(); // Giả sử em có logic để kiểm tra role
  const [current, setCurrent] = useState(0);

  // Các bước cho từng role
  const publisherSteps = [
    { title: "Create Movie", content: <CreateMoviePublisher /> },
    { title: "Sign Contract", content: <SignContractPublisher /> },
    { title: "Upload Video", content: <UploadVideoPublisher /> },
  ];

  const adminSteps = [
    { title: "Create Contract", content: <CreateContractAdmin /> },
    { title: "Change Active", content: <ChangeActiveAdmin /> },
  ];

  // Chọn danh sách step dựa vào role
  const steps = isPublisher ? publisherSteps : isAdmin ? adminSteps : [];

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  return (
    <div className="flex">
      {/* Sidebar theo role */}
      <div className="w-1/4 min-h-screen bg-gray-100 p-4">
        {isPublisher && <PublisherSidebar />}
        {isAdmin && <AdminSidebar />}
      </div>

      {/* Nội dung chính */}
      <div className="w-3/4 p-6 bg-white rounded-lg shadow-lg">
        {/* Steps luôn hiển thị */}
        <Steps current={current} className="mb-6">
          {steps.map((step) => (
            <Step key={step.title} title={step.title} />
          ))}
        </Steps>

        {/* Nội dung của từng bước */}
        <div className="mt-6">{steps[current]?.content}</div>

        {/* Nút điều hướng */}
        <div className="flex justify-between mt-6">
          {current > 0 && <Button onClick={prev}>Previous</Button>}
          {current < steps.length - 1 && <Button type="primary" onClick={next}>Next</Button>}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => notification.success({ message: "Process completed!" })}>
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieProcess;
