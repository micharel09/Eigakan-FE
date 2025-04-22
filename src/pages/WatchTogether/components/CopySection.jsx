import { CopyToClipboard } from "react-copy-to-clipboard";
import { Copy, CheckCircle } from "lucide-react";
import { notification, Tooltip } from "antd";
import { useState, useEffect } from "react";

const CopySection = ({ roomId, inline = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    notification.success({
      message: "Copied",
      description: "Room ID has been copied to clipboard",
      duration: 2,
    });
  };

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Inline version for bottom control bar
  if (inline) {
    return (
      <CopyToClipboard text={roomId} onCopy={handleCopy}>
        <Tooltip title="Click to copy Room ID">
          <div className="flex items-center cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
            <span className="text-white text-sm mr-2 font-medium">
              Room ID: {roomId.substring(0, 8)}...
            </span>
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-white" />
            )}
          </div>
        </Tooltip>
      </CopyToClipboard>
    );
  }

  // Original floating version
  return (
    <div className="absolute right-8 bottom-24 flex flex-col text-white bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg z-40">
      <div className="text-base font-medium">Room ID:</div>
      <div className="flex items-center mt-2">
        <CopyToClipboard text={roomId} onCopy={handleCopy}>
          <Tooltip title="Click to copy">
            <div className="flex items-center cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors">
              <span className="text-gray-300 mr-2">{roomId}</span>
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-white" />
              )}
            </div>
          </Tooltip>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default CopySection;
