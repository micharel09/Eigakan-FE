import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { notification, Avatar, Tooltip, Button, Input, List, Grid } from "antd";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  X,
  Settings,
  ScreenShare,
} from "lucide-react";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import roomService from "../../apis/Room/room";
import ChatBox from "../ChatBox/ChatBox.jsx";
import { HubConnectionBuilder } from "@microsoft/signalr";
import webRTCService from "../../utils/webRTC";

const WatchTogether = () => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const [connection, setConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const isLeavingRoom = useRef(false);
  const [lastReadTime, setLastReadTime] = useState(new Date());
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);    
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [participantStreams, setParticipantStreams] = useState({});
  const [movieUrl, setMovieUrl] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const audioAnalyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoElementRef = useRef(null);
  // Thêm state để theo dõi người đang nói chuyện
  const [activeSpeaker, setActiveSpeaker] = useState(null);

  // Thêm các ref để theo dõi trạng thái
  const isVideoOffRef = useRef(false);
  const isMutedRef = useRef(false);
  const localStreamRef = useRef(null);

  //=======================AUDIO & CAMERA HERE=======================
  
  // Cập nhật hàm setupAudioAnalyser để phân tích âm thanh và ghi log vào console
  const setupAudioAnalyser = (stream) => {
    console.log("Setting up audio analyser for console logging only");

    try {
      // Hủy bỏ analyser cũ nếu có
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (!stream || !stream.getAudioTracks().length) {
        console.log("No audio tracks available for analysis");
        return;
      }

      // Tạo audio context mới
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      // Kết nối microphone với analyser
      microphone.connect(analyser);

      // Cấu hình analyser
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Lưu trữ tham chiếu
      audioAnalyserRef.current = analyser;
      audioDataRef.current = dataArray;

      // Biến để theo dõi tiếng ồn nền
      let backgroundNoiseLevel = 0;
      let sampleCount = 0;
      const CALIBRATION_SAMPLES = 20; // Số mẫu để xác định tiếng ồn nền
      const NOISE_THRESHOLD_MULTIPLIER = 1.5; // Hệ số nhân để xác định ngưỡng

      // Hàm phân tích âm thanh
      const analyzeAudio = () => {
        if (!audioAnalyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        // Tính toán mức âm thanh trung bình
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Trong giai đoạn hiệu chuẩn, tính toán mức tiếng ồn nền
        if (sampleCount < CALIBRATION_SAMPLES) {
          backgroundNoiseLevel += average;
          sampleCount++;

          if (sampleCount === CALIBRATION_SAMPLES) {
            backgroundNoiseLevel = backgroundNoiseLevel / CALIBRATION_SAMPLES;
            console.log(
              `Đã xác định mức tiếng ồn nền: ${backgroundNoiseLevel.toFixed(2)}`
            );
            console.log(
              `Ngưỡng phát hiện tiếng nói: ${(
                backgroundNoiseLevel * NOISE_THRESHOLD_MULTIPLIER
              ).toFixed(2)}`
            );
          }

          // Hiển thị mức âm thanh trong giai đoạn hiệu chuẩn
          console.log(`[Hiệu chuẩn] Audio level: ${average.toFixed(2)}`);
        } else {
          // Sau khi hiệu chuẩn, chỉ hiển thị khi vượt ngưỡng
          const threshold = backgroundNoiseLevel * NOISE_THRESHOLD_MULTIPLIER;

          if (average > threshold) {
            console.log(
              `Audio level: ${average.toFixed(
                2
              )} (Vượt ngưỡng ${threshold.toFixed(2)})`
            );
          }
        }

        // Tiếp tục vòng lặp
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };

      // Bắt đầu phân tích
      analyzeAudio();
    } catch (error) {
      console.error("Error setting up audio analyser:", error);
    }
  };

  // Cập nhật hàm handleToggleAudio để thêm phân tích âm thanh
  const handleToggleAudio = async () => {
    try {
      console.log("Toggling audio state");
      const newMutedState = !isMuted;

      // Cập nhật state trước
      setIsMuted(newMutedState);
      // Cập nhật ref ngay lập tức để tránh race condition
      isMutedRef.current = newMutedState;

      if (!newMutedState) {
        // Bật micro: Tạo một stream audio riêng biệt
        try {
          // Tạo stream mới chỉ với audio
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });

          // Lấy audio track từ stream mới
          const newAudioTrack = audioStream.getAudioTracks()[0];

          if (newAudioTrack) {
            console.log(`Adding new audio track: ${newAudioTrack.label}`);

            // Dừng các audio tracks hiện tại nếu có
            if (localStreamRef.current) {
              const existingAudioTracks =
                localStreamRef.current.getAudioTracks();
              existingAudioTracks.forEach((track) => {
                track.stop();
                console.log(`Stopped existing audio track: ${track.label}`);
              });
            }

            // Tạo một stream mới hoàn toàn
            const newStream = new MediaStream();

            // Thêm lại các video tracks hiện có nếu có
            if (localStreamRef.current) {
              const videoTracks = localStreamRef.current.getVideoTracks();
              videoTracks.forEach((track) => {
                newStream.addTrack(track);
                console.log(`Re-added video track: ${track.label}`);
              });
            }

            // Thêm audio track mới
            newStream.addTrack(newAudioTrack);

            // Cập nhật stream
            setLocalStream(newStream);
            localStreamRef.current = newStream;

            // Cập nhật video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream;
            }

            // Cập nhật WebRTC
            webRTCService.toggleAudio(true);

            // Thiết lập audio analyser để ghi log mức âm thanh vào console
            // Sử dụng một bản sao của stream để tránh ảnh hưởng đến stream chính
            const analyserStream = new MediaStream();
            analyserStream.addTrack(newAudioTrack.clone());
            setupAudioAnalyser(analyserStream);
          }
        } catch (error) {
          console.error("Error adding audio track:", error);
          notification.error({
            message: "Microphone Error",
            description: "Could not access your microphone: " + error.message,
          });

          // Đặt lại trạng thái muted nếu có lỗi
          setIsMuted(true);
          isMutedRef.current = true;
          return;
        }
      } else {
        // Tắt micro: Dừng tất cả các audio tracks
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          if (audioTracks.length > 0) {
            console.log(
              `Stopping ${audioTracks.length} audio tracks completely`
            );
            audioTracks.forEach((track) => {
              console.log(`Stopping audio track: ${track.label}`);
              track.enabled = false; // Tắt track trước
              track.stop(); // Dừng hoàn toàn track
            });

            // Tạo stream mới chỉ với video tracks
            const videoTracks = localStreamRef.current.getVideoTracks();
            const newStream = new MediaStream();

            // Chỉ giữ lại video tracks
            videoTracks.forEach((track) => newStream.addTrack(track));

            // Cập nhật stream
            setLocalStream(newStream);
            localStreamRef.current = newStream;

            // Cập nhật video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream;
            }

            console.log("Audio is now OFF, microphone completely stopped");

            // Cập nhật WebRTC
            webRTCService.toggleAudio(false);

            // Hủy bỏ audio analyser
            if (audioAnalyserRef.current) {
              audioAnalyserRef.current = null;
            }
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
          } else {
            console.log("No audio tracks to stop");
          }
        }
      }

      // Thông báo cho server về trạng thái micro
      if (connection && connection.state === "Connected") {
        try {
          await connection.invoke("ToggleAudio", roomId, newMutedState);
          console.log("Server notified of audio state change");
        } catch (error) {
          console.error("Error notifying server of audio state:", error);
        }
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  // Cập nhật hàm initCamera để chỉ xử lý video, không xử lý audio
  const initCamera = useCallback(async () => {
    console.log("Initializing camera with webRTCService");
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      // Dừng tất cả các video tracks hiện tại nếu có
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          console.log(`Stopped existing video track: ${track.label}`);
        });
      }

      // Đợi một chút để đảm bảo các tracks cũ đã được dọn dẹp
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Chỉ yêu cầu video, không yêu cầu audio
      const constraints = {
        video: true,
        audio: false,
      };

      console.log("Getting user media with constraints:", constraints);

      // Chỉ yêu cầu video
      const videoStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      console.log("New video stream obtained:", videoStream);
      console.log("Video tracks:", videoStream.getVideoTracks());

      // Tạo một MediaStream mới
      const newStream = new MediaStream();

      // Thêm video tracks từ stream mới
      videoStream.getVideoTracks().forEach((track) => {
        newStream.addTrack(track);
        console.log(`Added video track: ${track.label}`);
      });

      // Thêm lại các audio tracks hiện có nếu có và không bị muted
      if (localStreamRef.current && !isMutedRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          newStream.addTrack(track);
          console.log(`Re-added existing audio track: ${track.label}`);
        });
      }

      // Lưu stream vào state và ref
      setLocalStream(newStream);
      localStreamRef.current = newStream;

      // Nếu trạng thái hiện tại là video off, disable các video tracks
      if (isVideoOffRef.current) {
        console.log("Video is off, disabling video tracks");
        newStream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      setCameraReady(true);
      return newStream;
    } catch (error) {
      console.error("Error initializing camera:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please allow camera access and refresh the page."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "No camera found. Please connect a camera and refresh the page."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Camera is in use by another application. Please close other applications using the camera."
        );
      } else {
        setCameraError(`Could not initialize camera: ${error.message}`);
      }

      setIsVideoOff(true);
      isVideoOffRef.current = true;
      return null;
    } finally {
      setIsCameraLoading(false);
    }
  }, []); 

  // Thêm hàm sendMessage nếu chưa có
  const sendMessage = async (text) => {
    if (!connection || !text.trim()) return;

    try {
      await connection.invoke(
        "SendMessage",
        roomId,
        user.fullName,
        text,
        user.picture || "/default-avatar.png"
      );
    } catch (error) {
      console.error("Error sending message:", error);
      notification.error({
        message: "Error",
        description: "Failed to send message: " + error.message,
      });
    }
  };

  // Thêm hàm renderParticipantVideos nếu chưa có
  const renderParticipantVideos = () => {
    return (
      <div className="space-y-4">
        {roomUsers
          .filter((participant) => participant.id !== user?.id) // Chỉ hiển thị người dùng khác
          .map((participant) => (
            <div key={participant.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                <img
                  src={participant.avatar || "/default-avatar.png"}
                  alt={participant.userName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">
                  {participant.userName}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {participant.isMuted && (
                    <span className="text-red-500">
                      <MicOff size={12} />
                    </span>
                  )}
                  {participant.isVideoOff && (
                    <span className="text-red-500">
                      <VideoOff size={12} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  // Thêm component ParticipantVideo nếu chưa có
  const ParticipantVideo = ({ participant, participantStream }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (participantStream && videoRef.current) {
        videoRef.current.srcObject = participantStream;

        const playVideo = async () => {
          try {
            await videoRef.current.play();
          } catch (error) {
            console.error("Error playing participant video:", error);
            setTimeout(playVideo, 1000);
          }
        };

        playVideo();
      }

      return () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }, [participantStream]);

    // Nếu người dùng tắt camera hoặc không có stream
    if (participant.isVideoOff || !participantStream) {
      return (
        <div className="relative h-full w-32 bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={participant.avatar || "/default-avatar.png"}
              alt={participant.userName}
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
            <div className="flex items-center justify-between">
              <span className="text-white text-xs truncate max-w-[80px]">
                {participant.userName}
              </span>
              <div className="flex items-center gap-1">
                {participant.isMuted && (
                  <span className="text-red-500">
                    <MicOff size={10} />
                  </span>
                )}
                {participant.isVideoOff && (
                  <span className="text-red-500">
                    <VideoOff size={10} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Nếu người dùng bật camera
    return (
      <div className="relative h-full w-32 bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs truncate max-w-[80px]">
              {participant.userName}
            </span>
            <div className="flex items-center gap-1">
              {participant.isMuted && (
                <span className="text-red-500">
                  <MicOff size={10} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Thêm component CameraVideo để không hiển thị chỉ báo âm thanh
  const CameraVideo = ({
    videoRef,
    isVideoOff,
    localStream,
    user,
    isCameraLoading,
    cameraError,
    setCameraError,
    initCamera,
  }) => {
    // Kiểm tra xem có video tracks không
    const hasVideoTracks =
      localStream && localStream.getVideoTracks().length > 0;
      console.log("Has video tracks:", hasVideoTracks);

    if (isCameraLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      );
    }

    // Nếu video tắt hoặc không có video tracks, hiển thị avatar
    if (isVideoOff || !hasVideoTracks) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <img
            src={user?.picture || "/default-avatar.png"}
            alt="User Avatar"
            className="w-16 h-16 rounded-full"
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)",
          }}
        />

        {/* Hiển thị lỗi camera nếu có */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
            <div className="text-center p-2">
              <div className="text-red-500 text-sm mb-1">Camera Error</div>
              <p className="text-white text-xs mb-2">{cameraError}</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                onClick={() => {
                  setCameraError(null);
                  initCamera();
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Thêm component ActiveSpeakerVideo để không sử dụng activeSpeaker
  const ActiveSpeakerVideo = () => {
    // Luôn trả về null để vô hiệu hóa tính năng này
    return null;
  };

  // Cập nhật hàm handleToggleVideo để tách biệt hoàn toàn với audio
  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoOff;
      console.log("Toggling video state to:", newVideoState ? "OFF" : "ON");

      // Cập nhật state và ref ngay lập tức
      setIsVideoOff(newVideoState);
      isVideoOffRef.current = newVideoState;

      if (newVideoState) {
        // Tắt camera: Dừng hoàn toàn các video tracks
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          if (videoTracks.length > 0) {
            console.log(
              `Stopping ${videoTracks.length} video tracks completely`
            );
            videoTracks.forEach((track) => {
              console.log(`Stopping video track: ${track.label}`);
              track.enabled = false; // Tắt track trước
              track.stop(); // Dừng hoàn toàn track
            });

            // Tạo stream mới chỉ với audio tracks
            const audioTracks = localStreamRef.current.getAudioTracks();
            const newStream = new MediaStream();

            // Chỉ giữ lại audio tracks
            audioTracks.forEach((track) => newStream.addTrack(track));

            // Cập nhật stream
            setLocalStream(newStream);
            localStreamRef.current = newStream;

            // Cập nhật video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream;
            }

            console.log("Video is now OFF, camera completely stopped");
          } else {
            console.log("No video tracks to stop");
          }
        }
      } else {
        // Bật camera: Tạo một stream video riêng biệt
        try {
          // Khởi tạo lại camera với video
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false, // Không yêu cầu audio khi bật camera
          });

          console.log("New camera stream obtained:", videoStream);

          // Lấy video track từ stream mới
          const newVideoTrack = videoStream.getVideoTracks()[0];

          if (newVideoTrack) {
            console.log(`Adding new video track: ${newVideoTrack.label}`);

            // Dừng các video tracks hiện tại nếu có
            if (localStreamRef.current) {
              const existingVideoTracks =
                localStreamRef.current.getVideoTracks();
              existingVideoTracks.forEach((track) => {
                track.stop();
                console.log(`Stopped existing video track: ${track.label}`);
              });
            }

            // Tạo một stream mới hoàn toàn
            const newStream = new MediaStream();

            // Thêm lại các audio tracks hiện có nếu có
            if (localStreamRef.current) {
              const audioTracks = localStreamRef.current.getAudioTracks();
              audioTracks.forEach((track) => {
                newStream.addTrack(track);
                console.log(`Re-added audio track: ${track.label}`);
              });
            }

            // Thêm video track mới
            newStream.addTrack(newVideoTrack);

            // Cập nhật stream
            setLocalStream(newStream);
            localStreamRef.current = newStream;

            // Cập nhật video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream;
            }

            console.log(
              "Video is now ON with tracks:",
              newStream.getVideoTracks().length
            );
            setCameraReady(true);
          }
        } catch (error) {
          console.error("Error reinitializing camera:", error);
          notification.error({
            message: "Camera Error",
            description: "Could not turn on camera: " + error.message,
          });

          // Đặt lại trạng thái video nếu có lỗi
          setIsVideoOff(true);
          isVideoOffRef.current = true;
        }
      }

      // Thông báo cho server
      if (connection && connection.state === "Connected") {
        try {
          await connection.invoke("ToggleVideo", roomId, newVideoState);
          console.log("Server notified of video state change");

          // Cập nhật lại kết nối WebRTC với tất cả người dùng khác
          if (!newVideoState) {
            // Nếu bật camera
            setTimeout(() => {
              console.log("Updating WebRTC connections after video toggle");
              connection
                .invoke("RequestPeerConnections", roomId)
                .catch((error) =>
                  console.error("Error updating peer connections:", error)
                );
            }, 1500);
          }
        } catch (error) {
          console.error("Error notifying server of video state:", error);
        }
      }
    } catch (error) {
      console.error("Error in handleToggleVideo:", error);
    }
  };

  //============USE EFFECT WEBRTC=======================  
  
  // Thêm useEffect để lắng nghe sự kiện UserToggleAudio từ server
   useEffect(() => {
    if (!connection) return;

    // Lắng nghe sự kiện UserToggleAudio
    connection.on("UserToggleAudio", (userId, isMuted) => {
      console.log(
        `User ${userId} toggled audio: ${isMuted ? "muted" : "unmuted"}`
      );

      // Nếu người dùng bật micro và không có người đang nói chuyện, đặt người này là người đang nói chuyện
      if (!isMuted && (!activeSpeaker || activeSpeaker.id === user?.id)) {
        const speaker = roomUsers.find((u) => u.id === userId);
        if (speaker && speaker.id !== user?.id) {
          setActiveSpeaker(speaker);
        }
      }

      // Nếu người dùng tắt micro và là người đang nói chuyện, đặt lại active speaker
      if (isMuted && activeSpeaker && activeSpeaker.id === userId) {
        setActiveSpeaker(null);
      }
    });

    return () => {
      connection.off("UserToggleAudio");
    };
  }, [connection, activeSpeaker, roomUsers, user]);

  // Thêm useEffect để gắn stream vào video element khi stream thay đổi
  useEffect(() => {
    if (!localStream || !videoElementRef.current) return;

    console.log("Setting srcObject for video element");
    try {
      // Gắn stream vào video element
      videoElementRef.current.srcObject = localStream;

      // Đảm bảo video element được phát
      const playVideo = () => {
        console.log("Attempting to play video");
        const playPromise = videoElementRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing video:", error);
            // Nếu lỗi là do người dùng chưa tương tác với trang, thử lại sau 1 giây
            if (error.name === "NotAllowedError") {
              console.log(
                "Play not allowed, will retry after user interaction"
              );
            } else {
              // Đối với các lỗi khác, thử lại sau 1 giây
              setTimeout(playVideo, 1000);
            }
          });
        }
      };

      playVideo();
    } catch (error) {
      console.error("Error setting srcObject:", error);
    }

    // Cleanup function
    return () => {
      if (videoElementRef.current && videoElementRef.current.srcObject) {
        videoElementRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Thêm useEffect để tự động khởi tạo camera khi component được tải
  useEffect(() => {
    // Chỉ khởi tạo camera khi đã tải xong movie và có roomId
    if (!loading && roomId) {
      console.log("Auto initializing camera on component mount");
      // Đặt timeout để đảm bảo component đã render hoàn toàn
      const timer = setTimeout(() => {
        initCamera().catch((error) => {
          console.error("Failed to initialize camera on mount:", error);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading, roomId, initCamera]);

  // Thêm useEffect để thiết lập callback onTrack cho WebRTC service
  useEffect(() => {
    if (!roomId || !user) return;

    // Thiết lập callback onTrack để xử lý các stream video từ người dùng khác
    webRTCService.onTrack = (userId, stream) => {
      console.log(`Received stream from user ${userId}`, stream);

      // Cập nhật participantStreams với stream mới nhận được
      setParticipantStreams((prev) => {
        // Kiểm tra xem stream đã tồn tại chưa
        if (prev[userId] && prev[userId].id === stream.id) {
          return prev; // Không thay đổi nếu stream đã tồn tại
        }

        console.log(`Adding new stream for user ${userId}`);
        return {
          ...prev,
          [userId]: stream,
        };
      });

      // Cập nhật trạng thái người dùng trong roomUsers
      setRoomUsers((prev) => {
        return prev.map((user) => {
          if (user.id === userId) {
            // Kiểm tra xem stream có video tracks không
            const hasVideoTracks = stream.getVideoTracks().length > 0;
            const isVideoEnabled =
              hasVideoTracks && stream.getVideoTracks()[0].enabled;

            return {
              ...user,
              isVideoOff: !isVideoEnabled,
            };
          }
          return user;
        });
      });
    };

    return () => {
      // Xóa callback khi component unmount
      webRTCService.onTrack = null;
    };
  }, [roomId, user]);

  // Thêm useEffect để thiết lập kết nối WebRTC khi localStream thay đổi
  useEffect(() => {
    if (
      !localStream ||
      !connection ||
      !roomId ||
      connection.state !== "Connected"
    )
      return;

    console.log("Local stream changed, requesting peer connections");

    // Đợi một chút để đảm bảo stream đã được thiết lập đầy đủ
    const timer = setTimeout(() => {
      connection
        .invoke("RequestPeerConnections", roomId)
        .catch((error) =>
          console.error("Error requesting peer connections:", error)
        );
    }, 1000);

    return () => clearTimeout(timer);
  }, [localStream, connection, roomId]);

  //=======================END AUDIO & CAMERA=======================

    
 
 
  //=======================SIGNALR HERE======================= 
  
  const handleLeaveRoom = async () => {
    if (isLeavingRoom.current) return;
    isLeavingRoom.current = true;

    try {
      // Cleanup local media streams
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Leave room via API
      await roomService.leaveRoom(roomId);

      // Leave SignalR room and stop connection
      if (connection) {
        try {
          await connection.invoke("LeaveRoom", roomId);
          await connection.stop();
        } catch (error) {
          console.error("Error leaving SignalR room:", error);
        }
      }

      // Cleanup WebRTC
      webRTCService.cleanup();

      notification.success({
        message: "Success",
        description: "You have left the room",
      });

      // Navigate back to movie page
      navigate(`/movie/${movieId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
      notification.error({
        message: "Error",
        description: "Failed to leave room: " + error.message,
      });
    } finally {
      isLeavingRoom.current = false;
    }
  };
  // Khi bấm "Go Live"
  const goLive = async () => {
    if (connection) {
      await connection.invoke("GoLive", roomId);
    }
  };

  //==========USE EFFECT SIGNALR=======================

  // Cập nhật các ref khi state thay đổi
  useEffect(() => {
    isVideoOffRef.current = isVideoOff;
  }, [isVideoOff]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
          // Set the movie URL
          const mediaUrl =
            response.data.medias?.find((m) => m.type === "FILMVIP")?.url ||
            response.data.medias?.find((m) => m.type === "FILM")?.url ||
            response.data.medias?.find((m) => m.type === "VIDEO")?.url;
          if (mediaUrl) {
            setMovieUrl(mediaUrl);
          } else {
            console.error("No valid media URL found for this movie");
            notification.error({
              message: "Media Error",
              description: "No valid media URL found for this movie",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  useEffect(() => {
    if (!roomId || !user) return;

    const handleBeforeUnload = (e) => {
      if (!isLeavingRoom.current) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave the room?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl(
        `https://eigakan2222-001-site1.jtempurl.com/roomHub?roomId=${roomId}`
      )
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    newConnection
      .start()
      .then(() => {
        console.log("Connected to SignalR");

        newConnection
          .invoke(
            "JoinRoom",
            roomId,
            user.fullName,
            user.picture || "/default-avatar.png",
            user.id
          )
          .then(() => {
            console.log("Joined SignalR room:", roomId);

            // Request peer connections after a successful join
            setTimeout(() => {
              if (newConnection.state === "Connected") {
                console.log("Requesting peer connections after joining room");
                newConnection
                  .invoke("RequestPeerConnections", roomId)
                  .catch((error) =>
                    console.error(
                      "Error requesting initial peer connections:",
                      error
                    )
                  );
              }
            }, 2000);
          })
          .catch((error) => {
            console.error("Error joining room:", error);
            notification.error({
              message: "Error",
              description: "Failed to join room: " + error.message,
            });
          });


        //=================================================================
        // Lắng nghe sự kiện UserLeft
        newConnection.on("UserLeft", (data) => {
          console.log("User left event received:", data);

          // Update room users list using user id
          setRoomUsers((prev) => {
            const updatedUsers = prev.filter((u) => u.id !== data.id);
            console.log("Updated room users after left:", updatedUsers);
            return updatedUsers;
          });

          // Also clean up any streams for this user
          setParticipantStreams((prev) => {
            const newStreams = { ...prev };
            if (newStreams[data.id]) {
              console.log(`Removing stream for departed user: ${data.id}`);
              delete newStreams[data.id];
            }
            return newStreams;
          });

          // Remove video element and container for this user
          try {
            const videoElement = document.getElementById(`video-${data.id}`);
            if (videoElement) {
              videoElement.srcObject = null;
            }

            const container = document.getElementById(
              `video-container-${data.id}`
            );
            if (container) {
              container.remove();
            }
          } catch (error) {
            console.error("Error removing video elements:", error);
          }

          // Add system message for user leaving
          const leaveMessage = {
            id: `leave-${Date.now()}`,
            text: `${data.userName} left the room`,
            sender: { userName: "System" },
            timestamp: new Date(),
            type: "system",
          };

          setMessages((prev) => [...prev, leaveMessage]);
        });

        //=================================================================
        // Thêm sự kiện cập nhật danh sách người dùng từ server
        newConnection.on("UpdateParticipants", (participants) => {
          console.log("Received participant update:", participants);

          // Remove duplicates based on user id or connectionId
          const uniqueParticipants = [];
          const addedIds = new Set();
          const addedNames = new Set();

          participants.forEach((participant) => {
            // Skip if undefined or null
            if (!participant) return;

            // Try to get a stable ID (either userId or connection Id)
            const stableId = participant.userId || participant.id;
            const userName = participant.userName;

            // Skip if we've already added this user by ID or name
            if (!stableId || addedIds.has(stableId) || addedNames.has(userName))
              return;

            addedIds.add(stableId);
            addedNames.add(userName);
            uniqueParticipants.push(participant);
          });

          console.log("Filtered to unique participants:", uniqueParticipants);
          setRoomUsers(uniqueParticipants);

          // Check if there are new participants we need to connect with
          if (localStream) {
            const previousUserIds = new Set(roomUsers.map((u) => u.id));
            const newUsers = uniqueParticipants.filter(
              (u) => !previousUserIds.has(u.id) && u.id !== user?.id
            );

            if (newUsers.length > 0) {
              console.log(
                "Detected new users, will request connections:",
                newUsers.map((u) => u.userName)
              );

              // Set a small delay to ensure participants are stored first
              setTimeout(() => {
                if (connection.state === "Connected") {
                  console.log("Requesting peer connections with new users");
                  connection
                    .invoke("RequestPeerConnections", roomId)
                    .catch((error) =>
                      console.error(
                        "Error requesting peer connections with new users:",
                        error
                      )
                    );
                }
              }, 1000);
            }
          }
        });

         //=================================================================
        // Lắng nghe sự kiện UserJoined
        newConnection.on("UserJoined", (joinedUser) => {
          // Only add if not the current user
          if (joinedUser.id === user.id) return;

          console.log("User joined event received:", joinedUser);

          // Kiểm tra xem user đã tồn tại trong roomUsers chưa
          setRoomUsers((prev) => {
            if (prev.some((u) => u.id === joinedUser.id)) {
              return prev;
            }
            console.log("Adding new user to room:", joinedUser);

            // Attempt to initiate a connection with this new user
            if (localStream && newConnection.state === "Connected") {
              setTimeout(() => {
                console.log(
                  `Attempting to connect with new user: ${joinedUser.userName}`
                );
                newConnection
                  .invoke("RequestPeerConnections", roomId)
                  .catch((error) =>
                    console.error(
                      `Error requesting connections with new users:`,
                      error
                    )
                  );
              }, 1500);
            }

            return [...prev, joinedUser];
          });

          // Kiểm tra trùng lặp tin nhắn
          setMessages((prev) => {
            const joinMessage = {
              id: `join-${joinedUser.id}-${Date.now()}`,
              text: `${joinedUser.userName} joined the room`,
              sender: { userName: "System" },
              timestamp: new Date(),
              type: "system",
            };

            // Kiểm tra xem tin nhắn tương tự đã tồn tại trong 5 giây gần đây chưa
            const recentDuplicate = prev.some(
              (msg) =>
                msg.type === "system" &&
                msg.text === joinMessage.text &&
                new Date(msg.timestamp).getTime() > Date.now() - 5000
            );

            if (recentDuplicate) {
              return prev;
            }
            return [...prev, joinMessage];
          });
        });

        // Lắng nghe sự kiện đồng bộ video
        newConnection.on("SyncVideo", (elapsedTime, isPlaying) => {
          console.log("📺 Received SyncVideo:", { elapsedTime, isPlaying });

          if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
              { command: "seek", time: elapsedTime },
              "*"
            );
            if (isPlaying) {
              iframeRef.current.contentWindow.postMessage({ command: "play" }, "*");
            } else {
              iframeRef.current.contentWindow.postMessage({ command: "pause" }, "*");
            }
          }
        });

         //=================================================================
        // Lắng nghe sự kiện nhận tin nhắn
        newConnection.on("ReceiveMessage", (message) => {
          console.log("Received message:", message);
          const messageTime = new Date(message.timestamp);
          const formattedMessage = {
            id: message.id || Date.now().toString(),
            text: message.text,
            sender: message.sender,
            timestamp: messageTime,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === formattedMessage.id)) {
              return prev;
            }
            return [...prev, formattedMessage];
          });

          // Kiểm tra điều kiện để hiển thị notification:
          // 1. Chat đang đóng
          // 2. Tin nhắn mới hơn lần đọc cuối cùng
          // 3. Người gửi không phải là người dùng hiện tại
          if (
            !showChat &&
            messageTime > lastReadTime &&
            message.sender.userName !== user.fullName
          ) {
            setUnreadMessages((prev) => prev + 1);
          }
        });

         //=================================================================
        // Lắng nghe sự kiện WebRTC từ server
        newConnection.on("ReceiveOffer", async (fromUserId, offerString) => {
          console.log(`Received offer from user ${fromUserId}`);
          try {
            await webRTCService.handleIncomingCall(
              fromUserId,
              offerString,
              newConnection
            );
          } catch (error) {
            console.error("Error handling incoming call:", error);
          }
        });

         //=================================================================
        newConnection.on("ReceiveAnswer", async (fromUserId, answerString) => {
          console.log(`Received answer from user ${fromUserId}`);
          try {
            await webRTCService.handleAnswer(fromUserId, answerString);
          } catch (error) {
            console.error("Error handling answer:", error);
          }
        });

         //=================================================================
        newConnection.on(
          "ReceiveIceCandidate",
          async (fromUserId, candidateString) => {
            console.log(`Received ICE candidate from user ${fromUserId}`);
            try {
              await webRTCService.handleIceCandidate(
                fromUserId,
                candidateString
              );
            } catch (error) {
              console.error("Error handling ICE candidate:", error);
            }
          }
        );

         //=================================================================
        newConnection.on("InitiatePeerConnection", async (targetUserId) => {
          console.log(
            `Server requested to initiate connection with user ${targetUserId}`
          );

          // Đảm bảo chúng ta có localStream trước khi tạo kết nối
          if (!localStreamRef.current) {
            console.log("No local stream available, initializing camera first");
            try {
              await initCamera();
              // Đợi một chút để đảm bảo stream đã được khởi tạo
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              console.error(
                "Failed to initialize camera for peer connection:",
                error
              );
              return;
            }
          }

          try {
            await webRTCService.initiateCall(targetUserId, newConnection);
          } catch (error) {
            console.error(
              `Error initiating call with user ${targetUserId}:`,
              error
            );
          }
        });
    
      })
    .catch((error) => console.error("SignalR Connection Error:", error));

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [roomId, user]);

  // Add debug logging to see participant data
  useEffect(() => {
    console.log("Current room users:", roomUsers);
    console.log("Current participant streams:", participantStreams);
  }, [roomUsers, participantStreams]);


  //=======================END SIGNALR==========================================

  // Cập nhật phần render camera trong UI
  return (
    <div className="fixed inset-0 bg-black flex pt-16">
      {/* Main Content - Movie and Participants */}
      <div className="flex-1 flex">
        
        {/* Movie Section */}
        <div className="flex-1 flex flex-col">
          
          {/* Video Container */}
          <div className="flex-1 relative">
            <iframe
              id="video-iframe"
              src={movieUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              style={{ border: "none" }}
              ref={iframeRef}
            ></iframe>

            {/* Hiển thị video của người đang nói chuyện */}
            <ActiveSpeakerVideo />

            {/* Hiển thị video của tất cả người dùng khác */}
            <div className="absolute bottom-4 right-4 flex gap-2 z-10">
              {roomUsers
                .filter(
                  (participant) =>
                    participant.id !== user?.id &&
                    participant.userName !== user?.fullName
                )
                .map((participant) => (
                  <div
                    key={participant.id}
                    className="w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                  >
                    {participantStreams[participant.id] ? (
                      <ParticipantVideo
                        participant={participant}
                        participantStream={participantStreams[participant.id]}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="flex flex-col items-center">
                          <img
                            src={participant.avatar || "/default-avatar.png"}
                            alt={participant.userName}
                            className="w-12 h-12 rounded-full"
                          />
                          <span className="text-white text-xs mt-1 truncate max-w-[80px]">
                            {participant.userName}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {participant.isMuted && (
                              <span className="text-red-500">
                                <MicOff size={10} />
                              </span>
                            )}
                            {participant.isVideoOff && (
                              <span className="text-red-500">
                                <VideoOff size={10} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          
          </div>

          {/* Camera Section - Cải thiện layout */}
          <div className="h-36 bg-gray-800 border-t border-gray-700 p-2">
            <div className="flex items-center h-full">
              {/* Camera Preview - Chỉ hiển thị camera của bản thân */}
              <div
                className="relative w-44 h-full bg-gray-900 rounded-lg overflow-hidden"
                id="camera-container"
              >
                <CameraVideo
                  videoRef={videoElementRef}
                  isVideoOff={isVideoOff}
                  localStream={localStream}
                  user={user}
                  isCameraLoading={isCameraLoading}
                  cameraError={cameraError}
                  setCameraError={setCameraError}
                  initCamera={initCamera}
                />

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs truncate max-w-[100px]">
                      {user?.fullName || "You"}
                    </span>
                    <div className="flex items-center gap-1">
                      {isMuted && (
                        <span className="text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 1l22 22"></path>
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                            <path d="M12 19v4"></path>
                            <path d="M8 23h8"></path>
                          </svg>
                        </span>
                      )}
                      {isVideoOff && (
                        <span className="text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                            <path d="M1 1l22 22"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls - Di chuyển gần camera hơn */}
              <div className="flex items-center gap-3 ml-6">
                <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                  <button
                    onClick={handleToggleAudio}
                    className={`p-3 rounded-full ${
                      isMuted
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5 text-white" />
                    ) : (
                      <Mic className="h-5 w-5 text-white" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  <button
                    onClick={handleToggleVideo}
                    className={`p-3 rounded-full ${
                      isVideoOff
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-5 w-5 text-white" />
                    ) : (
                      <Video className="h-5 w-5 text-white" />
                    )}
                  </button>
                </Tooltip>

                {/* Nút khởi động lại camera */}
                <Tooltip title="Restart Camera">
                  <button
                    onClick={() => {
                      setCameraError(null);
                      initCamera();
                    }}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>
              </div>
              <button onClick={goLive} className="p-2 bg-blue-500 text-white rounded">
        Go Live
      </button>
              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Biểu tượng người dùng - Thêm số người tham gia */}
                <Tooltip
                  title={
                    showParticipants ? "Hide Participants" : "Show Participants"
                  }
                >
                  <button
                    onClick={() => {
                      setShowParticipants(!showParticipants);
                      setShowChat(false);
                    }}
                    className={`p-3 rounded-full ${
                      showParticipants
                        ? "bg-gray-600 hover:bg-gray-500"
                        : "bg-gray-700 hover:bg-gray-600"
                    } relative`}
                  >
                    <Users className="h-5 w-5 text-white" />
                    {/* Hiển thị số người tham gia trên nút */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {roomUsers.length}
                      </span>
                    </div>
                  </button>
                </Tooltip>

                {/* Biểu tượng chat */}
                <Tooltip title={showChat ? "Hide Chat" : "Show Chat"}>
                  <button
                    onClick={() => {
                      setShowChat(!showChat);
                      setShowParticipants(false);
                      if (!showChat) {
                        setUnreadMessages(0);
                        setLastReadTime(new Date());
                      }
                    }}
                    className={`p-3 rounded-full ${
                      showChat
                        ? "bg-gray-600 hover:bg-gray-500"
                        : "bg-gray-700 hover:bg-gray-600"
                    } relative`}
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                    {!showChat && unreadMessages > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      </div>
                    )}
                  </button>
                </Tooltip>

                {/* Nút Leave Room */}
                <Tooltip title="Leave Room">
                  <button
                    onClick={handleLeaveRoom}
                    className="p-3 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Participants and Chat Section - Chỉ hiển thị khi được bật */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            {/* Tiêu đề */}
            <div className="py-3 px-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {showChat ? "Chat" : "Participants"}
              </h3>
              <button
                onClick={() => {
                  setShowChat(false);
                  setShowParticipants(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showChat ? (
                <ChatBox
                  messages={messages}
                  onSendMessage={sendMessage}
                  currentUser={user}
                />
              ) : (
                <div className="p-4">
                  {/* Cập nhật số lượng người tham gia, bao gồm cả bản thân */}
                  <div className="mb-4 text-white">
                    <h3 className="text-lg font-medium mb-2">
                      Participants ({roomUsers.length})
                    </h3>
                  </div>
                  {renderParticipantVideos()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTogether;
