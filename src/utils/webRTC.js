class WebRTCService {
  constructor() {
    this.peerConnections = new Map(); // Map to store RTCPeerConnection objects
    this.localStream = null;
    this.onTrack = null;
    this.mediaConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
  }

  async initializeMedia(videoEnabled = true, audioEnabled = true) {
    try {
      console.log(
        "Initializing media with video:",
        videoEnabled,
        "audio:",
        audioEnabled
      );

      // Stop any existing tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track:`, track.label);
        });
        this.localStream = null; // Đặt null để đảm bảo tạo mới hoàn toàn
      }

      // Sử dụng constraints đơn giản nhất có thể
      const constraints = {
        video: videoEnabled
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { max: 30 },
            }
          : false,
        audio: audioEnabled,
      };

      try {
        console.log("Requesting media with constraints:", constraints);
        this.localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        console.log("Media stream obtained successfully");
        console.log(
          "Video tracks:",
          this.localStream.getVideoTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          }))
        );
        console.log(
          "Audio tracks:",
          this.localStream.getAudioTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          }))
        );
      } catch (error) {
        console.error("Failed with constraints, trying fallback:", error);

        // Nếu thất bại, thử với audio only
        if (videoEnabled) {
          console.log("Trying audio only");
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } else {
          // Nếu không yêu cầu video, lỗi này là nghiêm trọng
          throw error;
        }
      }

      // Ensure tracks are enabled based on parameters
      this.localStream.getTracks().forEach((track) => {
        if (track.kind === "video") {
          track.enabled = videoEnabled;
          console.log(`Set video track ${track.label} enabled:`, track.enabled);
        } else if (track.kind === "audio") {
          track.enabled = audioEnabled;
          console.log(`Set audio track ${track.label} enabled:`, track.enabled);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error("Failed to initialize media:", error);
      throw new Error(`Could not access media devices: ${error.message}`);
    }
  }

  async createPeerConnection(userId, connection) {
    try {
      console.log("Creating peer connection for user:", userId);
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:numb.viagenie.ca",
            username: "webrtc@live.com",
            credential: "muazkh",
          },
        ],
        iceCandidatePoolSize: 10,
      });

      // Add local tracks to the peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          console.log("Adding track to peer connection:", track.kind);
          peerConnection.addTrack(track, this.localStream);
        });
      } else {
        console.warn("No local stream available when creating peer connection");
        // Try to initialize media if not available
        try {
          await this.initializeMedia();
          this.localStream.getTracks().forEach((track) => {
            console.log(
              "Adding track to peer connection after init:",
              track.kind
            );
            peerConnection.addTrack(track, this.localStream);
          });
        } catch (error) {
          console.error(
            "Failed to initialize media during peer connection creation:",
            error
          );
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE candidate:", event.candidate.type);
          connection
            .invoke("SendIceCandidate", userId, JSON.stringify(event.candidate))
            .catch((error) => {
              console.error("Failed to send ICE candidate:", error);
            });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(
          "Connection state changed:",
          peerConnection.connectionState
        );
        switch (peerConnection.connectionState) {
          case "connected":
            console.log("Successfully connected to peer");
            break;
          case "disconnected":
          case "failed":
            console.log("Connection lost or failed, cleaning up");
            this.closeConnection(userId);
            break;
          case "closed":
            console.log("Connection closed");
            break;
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state changed:",
          peerConnection.iceConnectionState
        );
        if (peerConnection.iceConnectionState === "failed") {
          console.log("ICE connection failed, attempting to restart ICE");
          peerConnection.restartIce();
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (this.onTrack) {
          const stream = event.streams[0];
          if (stream) {
            console.log("Setting up remote stream for user:", userId);
            this.onTrack(userId, stream);
          } else {
            console.warn("Received track without stream");
          }
        }
      };

      this.peerConnections.set(userId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      throw error;
    }
  }

  async handleIncomingCall(userId, offerString, connection) {
    console.log(`Received incoming call from user ${userId}`);

    if (!this.localStream) {
      console.error("Cannot handle incoming call: No local stream available");
      return;
    }

    try {
      const offer = JSON.parse(offerString);

      // Create a new peer connection if one doesn't exist
      if (!this.peerConnections.has(userId)) {
        console.log(
          `Creating new peer connection for incoming call from user ${userId}`
        );
        const peerConnection = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(userId, peerConnection);

        // Add all local tracks to the peer connection
        this.localStream.getTracks().forEach((track) => {
          console.log(
            `Adding ${track.kind} track to peer connection for incoming call from ${userId}`
          );
          peerConnection.addTrack(track, this.localStream);
        });

        // Set up ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`Sending ICE candidate to user ${userId}`);
            connection
              .invoke(
                "SendIceCandidate",
                userId,
                JSON.stringify(event.candidate)
              )
              .catch((error) =>
                console.error("Error sending ICE candidate:", error)
              );
          }
        };

        // Set up remote track handling
        peerConnection.ontrack = (event) => {
          console.log(
            `Received ${event.streams.length} stream(s) from user ${userId} in incoming call`
          );
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            console.log(
              `Remote stream from user ${userId} has ${
                remoteStream.getTracks().length
              } tracks`
            );

            // Check if tracks are enabled
            remoteStream.getTracks().forEach((track) => {
              console.log(
                `Remote ${track.kind} track from user ${userId}: enabled=${track.enabled}`
              );
            });

            // Notify through the callback
            if (this.onTrack) {
              this.onTrack(userId, remoteStream);
            }
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log(
            `Peer connection state with user ${userId} changed to: ${peerConnection.connectionState}`
          );
        };
      } else {
        console.log(`Using existing peer connection for user ${userId}`);
      }

      const peerConnection = this.peerConnections.get(userId);

      // Set remote description from the received offer
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log(`Set remote description from offer for user ${userId}`);

      // Create an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log(`Created and set answer for user ${userId}`);

      // Send the answer to the remote peer
      await connection.invoke("SendAnswer", userId, JSON.stringify(answer));
      console.log(`Sent answer to user ${userId}`);
    } catch (error) {
      console.error(`Error handling incoming call from user ${userId}:`, error);
    }
  }

  async handleAnswer(userId, answer) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(answer))
      );
    }
  }

  async handleIceCandidate(userId, candidate) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(JSON.parse(candidate))
      );
    }
  }

  async initiateCall(targetUserId, connection) {
    console.log(`Starting call initiation with user ${targetUserId}`);

    if (!this.localStream) {
      console.error("Cannot initiate call: No local stream available");
      return;
    }

    try {
      // Create a new RTCPeerConnection if one doesn't exist for this user
      if (!this.peerConnections.has(targetUserId)) {
        console.log(`Creating new peer connection for user ${targetUserId}`);
        const peerConnection = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(targetUserId, peerConnection);

        // Add all local tracks to the peer connection
        this.localStream.getTracks().forEach((track) => {
          console.log(
            `Adding ${track.kind} track to peer connection for ${targetUserId}`
          );
          peerConnection.addTrack(track, this.localStream);
        });

        // Set up ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`Sending ICE candidate to user ${targetUserId}`);
            connection
              .invoke(
                "SendIceCandidate",
                targetUserId,
                JSON.stringify(event.candidate)
              )
              .catch((error) =>
                console.error("Error sending ICE candidate:", error)
              );
          } else {
            console.log(
              `ICE candidate gathering complete for peer connection with user ${targetUserId}`
            );
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log(
            `Peer connection state with user ${targetUserId} changed to: ${peerConnection.connectionState}`
          );
          if (
            peerConnection.connectionState === "failed" ||
            peerConnection.connectionState === "disconnected"
          ) {
            console.warn(
              `Connection with user ${targetUserId} failed or disconnected`
            );
            // Implement reconnection logic if needed
          }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            `ICE connection state with user ${targetUserId} changed to: ${peerConnection.iceConnectionState}`
          );
          if (
            peerConnection.iceConnectionState === "disconnected" ||
            peerConnection.iceConnectionState === "failed"
          ) {
            console.warn(`ICE connection with user ${targetUserId} is failing`);
          }
        };

        // Set up remote track handling
        peerConnection.ontrack = (event) => {
          console.log(
            `Received ${event.streams.length} stream(s) from user ${targetUserId}`
          );
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            console.log(
              `Remote stream from user ${targetUserId} has ${
                remoteStream.getTracks().length
              } tracks`
            );

            // Check if tracks are enabled
            remoteStream.getTracks().forEach((track) => {
              console.log(
                `Remote ${track.kind} track from user ${targetUserId}: enabled=${track.enabled}`
              );
            });

            // Notify through the callback
            if (this.onTrack) {
              this.onTrack(targetUserId, remoteStream);
            }
          } else {
            console.warn(
              `Received track event without streams from user ${targetUserId}`
            );
          }
        };
      } else {
        console.log(`Using existing peer connection for user ${targetUserId}`);
      }

      const peerConnection = this.peerConnections.get(targetUserId);

      // Create an offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      // Set local description
      await peerConnection.setLocalDescription(offer);
      console.log(`Created and set offer for user ${targetUserId}`);

      // Send the offer to the remote peer
      await connection.invoke("SendOffer", targetUserId, JSON.stringify(offer));
      console.log(`Sent offer to user ${targetUserId}`);
    } catch (error) {
      console.error(`Error initiating call to user ${targetUserId}:`, error);
    }
  }

  toggleAudio(enabled) {
    console.log("Toggling audio:", enabled);
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = enabled;
        console.log(`Audio track ${track.label} enabled:`, enabled);
      });
    } else {
      console.warn("No local stream available for audio toggle");
    }
  }

  async toggleVideo(enabled) {
    console.log("Toggling video:", enabled);
    try {
      if (!this.localStream) {
        console.log("No local stream, initializing media");
        await this.initializeMedia(true, true);
      }

      const videoTracks = this.localStream.getVideoTracks();
      console.log("Current video tracks:", videoTracks);

      if (videoTracks.length === 0 && enabled) {
        // Nếu không có video tracks và muốn bật video, khởi tạo lại media
        console.log("No video tracks available, reinitializing media");
        await this.initializeMedia(
          true,
          this.localStream.getAudioTracks().some((t) => t.enabled)
        );
        return true;
      }

      if (!enabled) {
        // Khi tắt video, dừng hoàn toàn các video tracks
        videoTracks.forEach((track) => {
          console.log(`Stopping video track ${track.label}`);
          track.stop();
        });
      } else {
        // Khi bật video, đảm bảo các tracks được enabled
        videoTracks.forEach((track) => {
          track.enabled = true;
          console.log(`Video track ${track.label} enabled:`, track.enabled);
        });
      }

      return true;
    } catch (error) {
      console.error("Error toggling video:", error);
      throw error;
    }
  }

  closeConnection(userId) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
  }

  cleanup() {
    console.log("Starting WebRTC cleanup");

    // Stop all tracks in the local stream
    if (this.localStream) {
      console.log("Cleaning up local stream tracks");
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
      this.localStream = null;
    }

    // Close all peer connections
    console.log("Cleaning up peer connections");
    this.peerConnections.forEach((connection, userId) => {
      console.log(`Closing connection with user ${userId}`);
      connection.close();
    });
    this.peerConnections.clear();

    console.log("WebRTC cleanup completed");
  }

  // Add a new method to set the local stream
  async setLocalStream(stream) {
    console.log("Setting local stream in WebRTC service");
    this.localStream = stream;

    // Update all existing peer connections with the new stream
    for (const [userId, peerConnection] of this.peerConnections.entries()) {
      try {
        // Remove all existing senders first
        const senders = peerConnection.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            peerConnection.removeTrack(sender);
          }
        });

        // Add the new tracks
        stream.getTracks().forEach((track) => {
          console.log(
            `Adding ${track.kind} track to peer connection for user ${userId}`
          );
          peerConnection.addTrack(track, stream);
        });

        // Renegotiate the connection if needed
        if (peerConnection.signalingState !== "closed") {
          console.log(`Renegotiating connection with user ${userId}`);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          // The ICE candidate event will take care of sending this offer
        }
      } catch (error) {
        console.error(`Error updating stream for peer ${userId}:`, error);
      }
    }

    return stream;
  }
}

export default new WebRTCService();
