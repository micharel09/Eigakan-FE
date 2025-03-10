import React, { useEffect, useRef } from "react";
import { Input, Button } from "antd";
import { X } from "lucide-react";
import { Avatar } from "antd";
import moment from "moment";

const ChatBox = ({
  messages,
  messageInput,
  setMessageInput,
  user,
  onClose,
  onSendMessage,
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h3 className="text-white font-medium">Chat</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          <X className="text-white h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === "system"
                ? "justify-center"
                : message.sender.userName === user.fullName
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {message.type !== "system" &&
              message.sender.userName !== user.fullName && (
                <Avatar
                  size={36}
                  src={message.sender.avatar || "/default-avatar.png"}
                  alt={message.sender.userName}
                />
              )}
            <div
              className={`max-w-[70%] ${
                message.type === "system"
                  ? "bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full"
                  : message.sender.userName === user.fullName
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              } rounded-lg px-4 py-2`}
            >
              {message.type !== "system" &&
                message.sender.userName !== user.fullName && (
                  <div className="text-sm text-gray-300 mb-1">
                    {message.sender.userName}
                  </div>
                )}
              <div>{message.text}</div>
              <div className="text-xs text-gray-400 mt-1">
                {moment(message.timestamp).format("HH:mm")}
              </div>
            </div>
            {message.type !== "system" &&
              message.sender.userName === user.fullName && (
                <Avatar
                  size={36}
                  src={user.picture || "/default-avatar.png"}
                  alt={user.fullName}
                />
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input.TextArea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              backgroundColor: "#374151",
              borderColor: "#4B5563",
              color: "#FFFFFF",
              caretColor: "#FFFFFF",
            }}
            className="flex-1 hover:border-gray-500 focus:border-blue-500 placeholder-gray-400"
          />
          <Button
            onClick={handleSend}
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
