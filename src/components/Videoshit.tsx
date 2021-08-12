import React, { useState, useRef } from "react";

export const VideoShit = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOn, setVideoOnState] = useState(false);

  const startVideo = async () => {
    const { current: video } = videoRef;
    if (video) {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      video.srcObject = localStream;
      setVideoOnState(true);
    }
  };
  const stopVideo = () => {
    const { current: video } = videoRef;
    if (video && video.srcObject) {
      video.srcObject = null;
      setVideoOnState(false);
    }
  };
  return (
    <section>
      <h1>local stream</h1>
      <div>
        <video autoPlay playsInline ref={videoRef} />
        {videoOn ? (
          <button onClick={stopVideo}>Stop Video</button>
        ) : (
          <button onClick={startVideo}>Start Video</button>
        )}
      </div>
    </section>
  );
};
