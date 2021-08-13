import React from "react";

interface IProp {
  children: React.ReactNode;
}

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const peerConnection = new RTCPeerConnection(servers);

const RTCContext = React.createContext({
  peerConnection,
});

export const RTCProvider = ({ children }: IProp) => {
  return (
    <RTCContext.Provider
      value={{
        peerConnection,
      }}
    >
      {children}
    </RTCContext.Provider>
  );
};

export default RTCContext;
