// pages/index.js

import React, { useState, useEffect } from 'react';
import { ChatEngine } from 'chat-engine';
import firebase from 'firebase/app';
import 'firebase/auth';

const IndexPage = () => {
  const [myStream, setMyStream] = useState(null);
  const [peerStream, setPeerStream] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [myPeer, setMyPeer] = useState(null);

  useEffect(() => {
    const firebaseConfig = {
        apiKey: "AIzaSyDlbPaxkE79_QNQ8_sAO3izNvfYddLBa8Y",
        authDomain: "gamershubtn-d9e43.firebaseapp.com",
        projectId: "gamershubtn-d9e43",
        storageBucket: "gamershubtn-d9e43.appspot.com",
        messagingSenderId: "1076671216519",
        appId: "1:1076671216519:web:3804e80c420d536814f122",
        measurementId: "G-8BHW4H8DQL"
      };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Initialize ChatEngine
    const chatEngine = ChatEngine.create({
      publishKey: 'YOUR_PUBLISH_KEY',
      subscribeKey: 'YOUR_SUBSCRIBE_KEY'
    });

    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
      if (user) {
        user.getIdToken().then(token => {
          fetch(`/token/${user.uid}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            chatEngine.connect(user.uid, { signedOnTime: Date.now() }, data.token);
          });
        });
      }
    });

    chatEngine.on('$.ready', () => {
      console.log('ChatEngine is ready');
      setMyPeer(new Peer(undefined, { host: '/', port: '3001' }));

      // Listen for voice chat offers
      chatEngine.global.on('voice-chat-offer', async (offer) => {
        const answer = await myPeer.createAnswer(offer);
        myPeer.setLocalDescription(new RTCSessionDescription(answer));
        chatEngine.global.emit('voice-chat-answer', answer);
      });

      // Listen for voice chat answers
      chatEngine.global.on('voice-chat-answer', async (answer) => {
        await myPeer.setRemoteDescription(new RTCSessionDescription(answer));
      });
    });

    return () => {
      chatEngine.disconnect();
      myPeer.destroy();
    };
  }, []);

  const startVoiceChat = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setMyStream(stream);

    // Display local audio stream
    const localAudio = document.createElement('audio');
    localAudio.srcObject = stream;
    localAudio.play();

    // Call peer
    const call = myPeer.call(peerId, stream);
    call.on('stream', (remoteStream) => {
      setPeerStream(remoteStream);

      // Display remote audio stream
      const remoteAudio = document.createElement('audio');
      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();
    });
  };

  const endVoiceChat = () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    if (peerStream) {
      peerStream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePeerIdChange = (event) => {
    setPeerId(event.target.value);
  };

  return (
    <div>
      <h1>Welcome to Voice Chat</h1>
      <div>
        <label>Enter Peer ID:</label>
        <input type="text" value={peerId} onChange={handlePeerIdChange} />
      </div>
      <button onClick={startVoiceChat}>Start Voice Chat</button>
      <button onClick={endVoiceChat}>End Voice Chat</button>
    </div>
  );
};

export default IndexPage;
