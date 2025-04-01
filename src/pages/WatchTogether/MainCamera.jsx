"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { notification, Avatar, Tooltip, Button } from "antd"
import { Mic, MicOff, Video, VideoOff, RefreshCw } from "lucide-react"
import webRTCService from "../../utils/webRTC"

const MainCamera = () => {
  // State for camera and audio
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [activeSpeaker, setActiveSpeaker] = useState(null)
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get("roomId")
  const user = useSelector((state) => state.auth.user)
  const [connection, setConnection] = useState(null)
  const [roomUsers, setRoomUsers] = useState([])


  // Refs for audio analysis and state tracking
  const audioAnalyserRef = useRef(null)
  const audioDataRef = useRef(null)
  const animationFrameRef = useRef(null)
  const videoElementRef = useRef(null)
  const isVideoOffRef = useRef(false)
  const isMutedRef = useRef(false)
  const localStreamRef = useRef(null)

  // Setup audio analyser for detecting active speaker
  const setupAudioAnalyser = (stream) => {
    console.log("Setting up audio analyser for console logging only")

    try {
      // Cancel previous animation frame if exists
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (!stream || !stream.getAudioTracks().length) {
        console.log("No audio tracks available for analysis")
        return
      }

      // Create new audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      // Connect microphone to analyser
      microphone.connect(analyser)

      // Configure analyser
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Store references
      audioAnalyserRef.current = analyser
      audioDataRef.current = dataArray

      // Variables for background noise calibration
      let backgroundNoiseLevel = 0
      let sampleCount = 0
      const CALIBRATION_SAMPLES = 20
      const NOISE_THRESHOLD_MULTIPLIER = 1.5

      // Audio analysis function
      const analyzeAudio = () => {
        if (!audioAnalyserRef.current) return

        analyser.getByteFrequencyData(dataArray)

        // Calculate average audio level
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength

        // During calibration, calculate background noise level
        if (sampleCount < CALIBRATION_SAMPLES) {
          backgroundNoiseLevel += average
          sampleCount++

          if (sampleCount === CALIBRATION_SAMPLES) {
            backgroundNoiseLevel = backgroundNoiseLevel / CALIBRATION_SAMPLES
            console.log(`Background noise level: ${backgroundNoiseLevel.toFixed(2)}`)
            console.log(`Speech detection threshold: ${(backgroundNoiseLevel * NOISE_THRESHOLD_MULTIPLIER).toFixed(2)}`)
          }

          console.log(`[Calibration] Audio level: ${average.toFixed(2)}`)
        } else {
          // After calibration, only log when above threshold
          const threshold = backgroundNoiseLevel * NOISE_THRESHOLD_MULTIPLIER

          if (average > threshold) {
            console.log(`Audio level: ${average.toFixed(2)} (Above threshold ${threshold.toFixed(2)})`)
          }
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }

      // Start analysis
      analyzeAudio()
    } catch (error) {
      console.error("Error setting up audio analyser:", error)
    }
  }

  // Toggle audio (mute/unmute)
  const handleToggleAudio = async () => {
    try {
      console.log("Toggling audio state")
      const newMutedState = !isMuted

      // Update state immediately
      setIsMuted(newMutedState)
      isMutedRef.current = newMutedState

      if (!newMutedState) {
        // Unmute: Create a separate audio stream
        try {
          // Create new stream with only audio
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })

          // Get audio track from new stream
          const newAudioTrack = audioStream.getAudioTracks()[0]

          if (newAudioTrack) {
            console.log(`Adding new audio track: ${newAudioTrack.label}`)

            // Stop existing audio tracks if any
            if (localStreamRef.current) {
              const existingAudioTracks = localStreamRef.current.getAudioTracks()
              existingAudioTracks.forEach((track) => {
                track.stop()
                console.log(`Stopped existing audio track: ${track.label}`)
              })
            }

            // Create a completely new stream
            const newStream = new MediaStream()

            // Add back existing video tracks if any
            if (localStreamRef.current) {
              const videoTracks = localStreamRef.current.getVideoTracks()
              videoTracks.forEach((track) => {
                newStream.addTrack(track)
                console.log(`Re-added video track: ${track.label}`)
              })
            }

            // Add new audio track
            newStream.addTrack(newAudioTrack)

            // Update stream
            setLocalStream(newStream)
            localStreamRef.current = newStream

            // Update video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream
            }

            // Update WebRTC
            webRTCService.toggleAudio(true)

            // Setup audio analyser for console logging only
            const analyserStream = new MediaStream()
            analyserStream.addTrack(newAudioTrack.clone())
            setupAudioAnalyser(analyserStream)
          }
        } catch (error) {
          console.error("Error adding audio track:", error)
          notification.error({
            message: "Microphone Error",
            description: "Could not access your microphone: " + error.message,
          })

          // Reset muted state if error
          setIsMuted(true)
          isMutedRef.current = true
          return
        }
      } else {
        // Mute: Stop all audio tracks
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks()
          if (audioTracks.length > 0) {
            console.log(`Stopping ${audioTracks.length} audio tracks completely`)
            audioTracks.forEach((track) => {
              console.log(`Stopping audio track: ${track.label}`)
              track.enabled = false // Disable track first
              track.stop() // Stop track completely
            })

            // Create new stream with only video tracks
            const videoTracks = localStreamRef.current.getVideoTracks()
            const newStream = new MediaStream()

            // Keep only video tracks
            videoTracks.forEach((track) => newStream.addTrack(track))

            // Update stream
            setLocalStream(newStream)
            localStreamRef.current = newStream

            // Update video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream
            }

            console.log("Audio is now OFF, microphone completely stopped")

            // Update WebRTC
            webRTCService.toggleAudio(false)

            // Cancel audio analyser
            if (audioAnalyserRef.current) {
              audioAnalyserRef.current = null
            }
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
              animationFrameRef.current = null
            }
          } else {
            console.log("No audio tracks to stop")
          }
        }
      }

      // Notify server about microphone state
      if (connection && connection.state === "Connected") {
        try {
          await connection.invoke("ToggleAudio", roomId, newMutedState)
          console.log("Server notified of audio state change")
        } catch (error) {
          console.error("Error notifying server of audio state:", error)
        }
      }
    } catch (error) {
      console.error("Error toggling audio:", error)
    }
  }

  // Initialize camera
  const initCamera = useCallback(async () => {
    console.log("Initializing camera with webRTCService")
    setIsCameraLoading(true)
    setCameraError(null)

    try {
      // Stop all existing video tracks if any
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks()
        videoTracks.forEach((track) => {
          track.stop()
          console.log(`Stopped existing video track: ${track.label}`)
        })
      }

      // Wait a bit to ensure old tracks are cleaned up
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Request only video, no audio
      const constraints = {
        video: true,
        audio: false,
      }

      console.log("Getting user media with constraints:", constraints)

      // Get video stream
      const videoStream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log("New video stream obtained:", videoStream)
      console.log("Video tracks:", videoStream.getVideoTracks())

      // Create a new MediaStream
      const newStream = new MediaStream()

      // Add video tracks from new stream
      videoStream.getVideoTracks().forEach((track) => {
        newStream.addTrack(track)
        console.log(`Added video track: ${track.label}`)
      })

      // Add back existing audio tracks if any and not muted
      if (localStreamRef.current && !isMutedRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks()
        audioTracks.forEach((track) => {
          newStream.addTrack(track)
          console.log(`Re-added existing audio track: ${track.label}`)
        })
      }

      // Save stream to state and ref
      setLocalStream(newStream)
      localStreamRef.current = newStream

      // If current state is video off, disable video tracks
      if (isVideoOffRef.current) {
        console.log("Video is off, disabling video tracks")
        newStream.getVideoTracks().forEach((track) => {
          track.enabled = false
        })
      }

      setCameraReady(true)
      return newStream
    } catch (error) {
      console.error("Error initializing camera:", error)

      if (error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access and refresh the page.")
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera found. Please connect a camera and refresh the page.")
      } else if (error.name === "NotReadableError") {
        setCameraError("Camera is in use by another application. Please close other applications using the camera.")
      } else {
        setCameraError(`Could not initialize camera: ${error.message}`)
      }

      setIsVideoOff(true)
      isVideoOffRef.current = true
      return null
    } finally {
      setIsCameraLoading(false)
    }
  }, [roomId])

  // Toggle video (on/off)
  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoOff
      console.log("Toggling video state to:", newVideoState ? "OFF" : "ON")

      // Update state and ref immediately
      setIsVideoOff(newVideoState)
      isVideoOffRef.current = newVideoState

      if (newVideoState) {
        // Turn off camera: Stop all video tracks completely
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks()
          if (videoTracks.length > 0) {
            console.log(`Stopping ${videoTracks.length} video tracks completely`)
            videoTracks.forEach((track) => {
              console.log(`Stopping video track: ${track.label}`)
              track.enabled = false // Disable track first
              track.stop() // Stop track completely
            })

            // Create new stream with only audio tracks
            const audioTracks = localStreamRef.current.getAudioTracks()
            const newStream = new MediaStream()

            // Keep only audio tracks
            audioTracks.forEach((track) => newStream.addTrack(track))

            // Update stream
            setLocalStream(newStream)
            localStreamRef.current = newStream

            // Update video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream
            }

            console.log("Video is now OFF, camera completely stopped")
          } else {
            console.log("No video tracks to stop")
          }
        }
      } else {
        // Turn on camera: Create a separate video stream
        try {
          // Reinitialize camera with video
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false, // Don't request audio when turning on camera
          })

          console.log("New camera stream obtained:", videoStream)

          // Get video track from new stream
          const newVideoTrack = videoStream.getVideoTracks()[0]

          if (newVideoTrack) {
            console.log(`Adding new video track: ${newVideoTrack.label}`)

            // Stop existing video tracks if any
            if (localStreamRef.current) {
              const existingVideoTracks = localStreamRef.current.getVideoTracks()
              existingVideoTracks.forEach((track) => {
                track.stop()
                console.log(`Stopped existing video track: ${track.label}`)
              })
            }

            // Create a completely new stream
            const newStream = new MediaStream()

            // Add back existing audio tracks if any
            if (localStreamRef.current) {
              const audioTracks = localStreamRef.current.getAudioTracks()
              audioTracks.forEach((track) => {
                newStream.addTrack(track)
                console.log(`Re-added audio track: ${track.label}`)
              })
            }

            // Add new video track
            newStream.addTrack(newVideoTrack)

            // Update stream
            setLocalStream(newStream)
            localStreamRef.current = newStream

            // Update video element
            if (videoElementRef.current) {
              videoElementRef.current.srcObject = newStream
            }

            console.log("Video is now ON with tracks:", newStream.getVideoTracks().length)
            setCameraReady(true)
          }
        } catch (error) {
          console.error("Error reinitializing camera:", error)
          notification.error({
            message: "Camera Error",
            description: "Could not turn on camera: " + error.message,
          })

          // Reset video state if error
          setIsVideoOff(true)
          isVideoOffRef.current = true
        }
      }

      // Notify server
      if (connection && connection.state === "Connected") {
        try {
          await connection.invoke("ToggleVideo", roomId, newVideoState)
          console.log("Server notified of video state change")

          // Update WebRTC connections with all other users
          if (!newVideoState) {
            // If turning on camera
            setTimeout(() => {
              console.log("Updating WebRTC connections after video toggle")
              connection
                .invoke("RequestPeerConnections", roomId)
                .catch((error) => console.error("Error updating peer connections:", error))
            }, 1500)
          }
        } catch (error) {
          console.error("Error notifying server of video state:", error)
        }
      }
    } catch (error) {
      console.error("Error in handleToggleVideo:", error)
    }
  }

  // Camera video component
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
    // Check if there are video tracks
    const hasVideoTracks = localStream && localStream.getVideoTracks().length > 0
    console.log("Has video tracks:", hasVideoTracks)

    if (isCameraLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )
    }

    // If video is off or no video tracks, show avatar
    if (isVideoOff || !hasVideoTracks) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <Avatar
            src={user?.picture || "/placeholder.svg?height=64&width=64"}
            alt="User Avatar"
            size={64}
            className="rounded-full"
          />
        </div>
      )
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

        {/* Camera error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
            <div className="text-center p-2">
              <div className="text-red-500 text-sm mb-1">Camera Error</div>
              <p className="text-white text-xs mb-2">{cameraError}</p>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setCameraError(null)
                  initCamera()
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Listen for UserToggleAudio events from server
  useEffect(() => {
    if (!connection) return

    connection.on("UserToggleAudio", (userId, isMuted) => {
      console.log(`User ${userId} toggled audio: ${isMuted ? "muted" : "unmuted"}`)

      // If user unmutes and no active speaker, set this user as active speaker
      if (!isMuted && (!activeSpeaker || activeSpeaker.id === user?.id)) {
        const speaker = roomUsers?.find((u) => u.id === userId)
        if (speaker && speaker.id !== user?.id) {
          setActiveSpeaker(speaker)
        }
      }

      // If user mutes and is active speaker, reset active speaker
      if (isMuted && activeSpeaker && activeSpeaker.id === userId) {
        setActiveSpeaker(null)
      }
    })

    return () => {
      connection.off("UserToggleAudio")
    }
  }, [connection, activeSpeaker, user])

  // Set srcObject for video element when stream changes
  useEffect(() => {
    if (!localStream || !videoElementRef.current) return

    console.log("Setting srcObject for video element")
    try {
      // Attach stream to video element
      videoElementRef.current.srcObject = localStream

      // Ensure video element plays
      const playVideo = () => {
        console.log("Attempting to play video")
        const playPromise = videoElementRef.current.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing video:", error)
            // If error is due to user not interacting with page, retry after 1 second
            if (error.name === "NotAllowedError") {
              console.log("Play not allowed, will retry after user interaction")
            } else {
              // For other errors, retry after 1 second
              setTimeout(playVideo, 1000)
            }
          })
        }
      }

      playVideo()
    } catch (error) {
      console.error("Error setting srcObject:", error)
    }

    // Cleanup function
    return () => {
      if (videoElementRef.current && videoElementRef.current.srcObject) {
        videoElementRef.current.srcObject = null
      }
    }
  }, [localStream])

  // Auto-initialize camera when component loads
  useEffect(() => {
    if (roomId) {
      console.log("Auto initializing camera on component mount")
      // Set timeout to ensure component has fully rendered
      const timer = setTimeout(() => {
        initCamera().catch((error) => {
          console.error("Failed to initialize camera on mount:", error)
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [roomId, initCamera])

  // Update refs when state changes
  useEffect(() => {
    isVideoOffRef.current = isVideoOff
  }, [isVideoOff])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between">
        {/* Camera Preview */}
        <div className="flex items-center">
          <div className="relative w-44 h-32 bg-gray-800 rounded-lg overflow-hidden shadow-md" id="camera-container">
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
                <span className="text-white text-xs truncate max-w-[100px]">{user?.fullName || "You"}</span>
                <div className="flex items-center gap-1">
                  {isMuted && <MicOff size={12} className="text-red-500" />}
                  {isVideoOff && <VideoOff size={12} className="text-red-500" />}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-4">
            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
              <Button
                type={isMuted ? "primary" : "default"}
                danger={isMuted}
                shape="circle"
                icon={isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                onClick={handleToggleAudio}
                className="flex items-center justify-center"
              />
            </Tooltip>

            <Tooltip title={isVideoOff ? "Turn on camera" : "Turn off camera"}>
              <Button
                type={isVideoOff ? "primary" : "default"}
                danger={isVideoOff}
                shape="circle"
                icon={isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                onClick={handleToggleVideo}
                className="flex items-center justify-center"
              />
            </Tooltip>

            <Tooltip title="Restart Camera">
              <Button
                type="primary"
                shape="circle"
                icon={<RefreshCw size={16} />}
                onClick={() => {
                  setCameraError(null)
                  initCamera()
                }}
                className="flex items-center justify-center"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainCamera

