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
        console.log("Stopping existing tracks");
        this.localStream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped existing ${track.kind} track`);
        });
      }

      // Request new media stream with specific constraints
      const constraints = {
        video: videoEnabled ? this.mediaConstraints.video : false,
        audio: audioEnabled ? this.mediaConstraints.audio : false,
      };

      console.log("Requesting media with constraints:", constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Log acquired tracks
      this.localStream.getTracks().forEach((track) => {
        console.log(`Got ${track.kind} track:`, track.label);
        track.enabled = track.kind === "video" ? videoEnabled : audioEnabled;
        console.log(`${track.kind} track enabled:`, track.enabled);
      });

      return this.localStream;
    } catch (error) {
      console.error("Error in initializeMedia:", error);
      throw new Error(`Failed to initialize media: ${error.message}`);
    }
  }

  async createPeerConnection(userId, connection) {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add local tracks to the peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          console.log("Adding track to peer connection:", track.kind);
          peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          connection.invoke(
            "SendIceCandidate",
            userId,
            JSON.stringify(event.candidate)
          );
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (this.onTrack) {
          this.onTrack(userId, event.streams[0]);
        }
      };

      this.peerConnections.set(userId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      throw error;
    }
  }

  async handleIncomingCall(userId, offer, connection) {
    const peerConnection = await this.createPeerConnection(userId, connection);

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(JSON.parse(offer))
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await connection.invoke("SendAnswer", userId, JSON.stringify(answer));
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

  async initiateCall(userId, connection) {
    const peerConnection = await this.createPeerConnection(userId, connection);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await connection.invoke("SendOffer", userId, JSON.stringify(offer));
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

  toggleVideo(enabled) {
    console.log("Toggling video:", enabled);
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = enabled;
        console.log(`Video track ${track.label} enabled:`, enabled);
      });
    } else {
      console.warn("No local stream available for video toggle");
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
}

export default new WebRTCService();
