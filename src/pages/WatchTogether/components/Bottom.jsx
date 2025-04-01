import React from "react";
import {
  Mic,
  Video,
  PhoneOff,
  MicOff,
  VideoOff,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

const Bottom = ({
  muted,
  playing,
  toggleAudio,
  toggleVideo,
  leaveRoom,
  showMyVideo,
  toggleMyVideoVisibility,
  isLeaving = false,
}) => {
  return (
    <div className="bg-gray-800 bg-opacity-80 p-4">
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            muted
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={muted ? "Turn on mic" : "Turn off mic"}
          disabled={isLeaving}
        >
          {muted ? (
            <MicOff className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            !playing
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={!playing ? "Turn on camera" : "Turn off camera"}
          disabled={isLeaving}
        >
          {!playing ? (
            <VideoOff className="h-5 w-5 text-white" />
          ) : (
            <Video className="h-5 w-5 text-white" />
          )}
        </button>
        <button
          onClick={toggleMyVideoVisibility}
          className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600`}
          title={showMyVideo ? "Hide my video" : "Show my video"}
          disabled={isLeaving}
        >
          {showMyVideo ? (
            <Eye className="h-5 w-5 text-white" />
          ) : (
            <EyeOff className="h-5 w-5 text-white" />
          )}
        </button>
        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
          title="Leave room"
          disabled={isLeaving}
        >
          {isLeaving ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <PhoneOff className="h-5 w-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Bottom;
