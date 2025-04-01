import { CopyToClipboard } from "react-copy-to-clipboard";
import { Copy } from "lucide-react";
import { notification } from "antd";

const CopySection = ({ roomId }) => {
  const handleCopy = () => {
    notification.success({
      message: "Đã sao chép",
      description: "ID phòng đã được sao chép vào clipboard",
      duration: 2,
    });
  };

  return (
    <div className="absolute left-8 bottom-24 flex flex-col text-white bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <div className="text-base font-medium">ID Phòng:</div>
      <div className="flex items-center mt-2">
        <span className="text-gray-300">{roomId}</span>
        <CopyToClipboard text={roomId} onCopy={handleCopy}>
          <button className="ml-3 p-1.5 rounded-full bg-gray-700 hover:bg-gray-600">
            <Copy className="h-4 w-4 text-white" />
          </button>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default CopySection;
