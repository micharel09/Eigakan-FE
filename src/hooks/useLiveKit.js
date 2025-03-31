import { useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  Participant,
  Track,
  ConnectionState,
  ConnectionQuality,
} from "livekit-client";

const useLiveKit = (roomId, userName) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId || !userName) return;

    const connectToRoom = async () => {
      try {
        console.log("Connecting to LiveKit room:", roomId);

        // Tạo token từ server của bạn
        const response = await fetch(
          `/api/get-livekit-token?room=${roomId}&username=${userName}`
        );
        const { token } = await response.json();

        if (!token) {
          throw new Error("Không thể lấy token LiveKit");
        }

        // Tạo và kết nối room
        const livekitUrl = "wss://eigakan-fo8a7l78.livekit.cloud";
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 640, height: 480 },
          },
        });

        // Lắng nghe các sự kiện
        newRoom.on(RoomEvent.ParticipantConnected, () => {
          console.log("Participant connected");
          updateParticipants(newRoom);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, () => {
          console.log("Participant disconnected");
          updateParticipants(newRoom);
        });

        newRoom.on(
          RoomEvent.TrackSubscribed,
          (track, publication, participant) => {
            console.log("Track subscribed:", track.kind);
            updateParticipants(newRoom);
          }
        );

        newRoom.on(RoomEvent.TrackUnsubscribed, () => {
          updateParticipants(newRoom);
        });

        newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          console.log("Connection state:", state);
          setIsConnected(state === ConnectionState.Connected);

          if (state === ConnectionState.Disconnected) {
            console.log("Disconnected from room");
          }
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          console.log("Disconnected from room");
          setIsConnected(false);
        });

        newRoom.on(RoomEvent.MediaDevicesError, (e) => {
          console.error("Media device error:", e);
          setError(e);
        });

        // Kết nối đến room
        await newRoom.connect(livekitUrl, token);
        console.log("Connected to room:", newRoom.name);

        // Bật camera và mic
        await newRoom.localParticipant.enableCameraAndMicrophone();
        console.log("Camera and microphone enabled");

        setRoom(newRoom);
        updateParticipants(newRoom);
      } catch (err) {
        console.error("Error connecting to LiveKit:", err);
        setError(err);
      }
    };

    const updateParticipants = (room) => {
      if (!room) return;

      const allParticipants = [
        room.localParticipant,
        ...Array.from(room.participants.values()),
      ];

      setParticipants(allParticipants);
    };

    connectToRoom();

    return () => {
      if (room) {
        console.log("Disconnecting from LiveKit room");
        room.disconnect();
      }
    };
  }, [roomId, userName]);

  // Các hàm điều khiển
  const toggleMicrophone = async (enabled) => {
    if (!room) return;
    try {
      if (enabled) {
        await room.localParticipant.setMicrophoneEnabled(true);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    } catch (err) {
      console.error("Error toggling microphone:", err);
    }
  };

  const toggleCamera = async (enabled) => {
    if (!room) return;
    try {
      if (enabled) {
        await room.localParticipant.setCameraEnabled(true);
      } else {
        await room.localParticipant.setCameraEnabled(false);
      }
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };

  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setParticipants([]);
      setIsConnected(false);
    }
  };

  return {
    room,
    participants,
    isConnected,
    error,
    toggleMicrophone,
    toggleCamera,
    leaveRoom,
  };
};

export default useLiveKit;
