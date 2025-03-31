import { useEffect, useRef } from "react";

export const VideoRenderer = ({ participant }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!participant) return;

    const attachTrack = (track, element) => {
      if (track && element) {
        track.attach(element);
      }
    };

    const detachTrack = (track, element) => {
      if (track && element) {
        track.detach(element);
      }
    };

    // Tìm và đính kèm video track
    let videoTrack = null;
    let audioTrack = null;

    participant.on("trackSubscribed", (track) => {
      if (track.kind === "video") {
        videoTrack = track;
        attachTrack(track, videoRef.current);
      } else if (track.kind === "audio") {
        audioTrack = track;
        attachTrack(track, audioRef.current);
      }
    });

    participant.on("trackUnsubscribed", (track) => {
      if (track.kind === "video") {
        detachTrack(track, videoRef.current);
        videoTrack = null;
      } else if (track.kind === "audio") {
        detachTrack(track, audioRef.current);
        audioTrack = null;
      }
    });

    // Đính kèm các track hiện có
    participant.trackPublications.forEach((publication) => {
      if (publication.isSubscribed) {
        const track = publication.track;
        if (track.kind === "video") {
          videoTrack = track;
          attachTrack(track, videoRef.current);
        } else if (track.kind === "audio") {
          audioTrack = track;
          attachTrack(track, audioRef.current);
        }
      }
    });

    return () => {
      if (videoTrack) {
        detachTrack(videoTrack, videoRef.current);
      }
      if (audioTrack) {
        detachTrack(audioTrack, audioRef.current);
      }
    };
  }, [participant]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant?.isLocal}
        className="w-full h-full object-cover"
      />
      <audio ref={audioRef} autoPlay />
    </>
  );
};
