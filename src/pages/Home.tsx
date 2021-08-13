import React, {
  ChangeEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import FirestoreContext from "contexts/firestore";
import RTCContext from "contexts/rtc";

export const HomePage = () => {
  const { firestore } = useContext(FirestoreContext);
  const { peerConnection } = useContext(RTCContext);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteStream = useRef<MediaStream>(new MediaStream());
  const localStream = useRef<MediaStream>(new MediaStream());
  const [isCameraOn, setCameraOnState] = useState(false);
  const [callId, updateCallId] = useState("");

  const startCall = async () => {
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    updateCallId(callDoc.id);

    peerConnection.onicecandidate = (event) => {
      console.log("candidate", event.candidate);
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

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    updateCallId(e.target.value);
  };

  const joinCall = async () => {
    const callDoc = firestore.collection("calls").doc(callId);
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    peerConnection.onicecandidate = (event) => {
      console.log("candidate", event.candidate);
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData!.offer;
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
        if (change.type === "added") {
          let data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const startCamera = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStream.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream.current);
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream.current;
    }

    setCameraOnState(true);
  };

  const stopCamera = async () => {
    localStream.current.getTracks().forEach((track) => {
      track.stop();
    });
    setCameraOnState(false);
  };

  useEffect(() => {
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };
    setTimeout(() => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
    }, 10000);
  }, [peerConnection]);

  return (
    <main>
      <h1>Call</h1>
      <ul>
        <li>
          <figcaption>local</figcaption>
          <video autoPlay playsInline ref={localVideoRef} />
          {isCameraOn ? (
            <button onClick={stopCamera}>Stop Camera</button>
          ) : (
            <button onClick={startCamera}>Start Camera</button>
          )}
          <button onClick={startCall}>Start Call</button>
        </li>
        <li>
          <figcaption>remote</figcaption>
          <video autoPlay playsInline ref={remoteVideoRef} />
        </li>
      </ul>
      <div>
        <label htmlFor="callId">Call Id</label>
        <input
          name="callId"
          id="callId"
          type="text"
          value={callId}
          onChange={handleOnChange}
        />
        <button onClick={joinCall}>Join call!</button>
      </div>
    </main>
  );
};
