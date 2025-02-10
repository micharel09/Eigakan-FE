import React from "react";
import { Spin } from "antd";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <Spin size="large" />
    </div>
  );
};

export default Loading;
