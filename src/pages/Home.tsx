import React, { useContext, useEffect, useRef } from "react";
import FirestoreContext from "contexts/firestore";
import RTCContext from "contexts/rtc";

export const HomePage = () => {
  const { firestore } = useContext(FirestoreContext);
  const { peerConnection } = useContext(RTCContext);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startCall = async () => {
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    peerConnection.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
      }
    });
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };

  const joinCall = async () => {
    const callId = inputRef?.current?.value;
    const callDoc = firestore.collection("calls").doc(callId);
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    peerConnection.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData!.offer;

    console.log(offerDescription);

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  useEffect(() => {
    const initCall = async () => {
      const { current: localVideo } = localVideoRef;
      const { current: remoteVideo } = remoteVideoRef;

      const remoteStream = new MediaStream();

      // get local stream
      if (localVideo) {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // send
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        // show
        localVideo.srcObject = localStream;
      }
      // get remote stream
      peerConnection.ontrack = (event) => {
        console.log("happens?", event);
        event.streams[0].getTracks().forEach((track) => {
          console.log("beep!", track);
          remoteStream.addTrack(track);
        });
      };
      // show
      if (remoteVideo) {
        console.log("happens?");
        remoteVideo.srcObject = remoteStream;
      }
    };

    initCall();
  }, [localVideoRef, remoteVideoRef, peerConnection]);

  return (
    <main>
      <h1>Lard -- Current Call</h1>
      <ul>
        <li>
          <figcaption>local</figcaption>
          <video autoPlay playsInline ref={localVideoRef} />
          <button onClick={startCall}>start Call</button>
        </li>
        <li>
          <figcaption>remote</figcaption>
          <video autoPlay playsInline ref={remoteVideoRef} />
        </li>
      </ul>
      <div>
        <label htmlFor="callId">Call Id</label>
        <input name="callId" id="callId" type="text" ref={inputRef} />
        <button onClick={joinCall}>Join call!</button>
      </div>
    </main>
  );
};
