// server.js

const express = require('express');
const http = require('http');
const ChatEngine = require('chat-engine');
const admin = require('firebase-admin');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peerServer);

const serviceAccount = require('../gamershubtn-d9e43-firebase-adminsdk-be9cu-bf55f265b4.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const chatEngine = ChatEngine.create({
  publishKey: '44bafdc2-0343-4c57-b416-b7b38d470b20',
  subscribeKey: '6284f0d3-eeb4-4a22-9a8a-dfdf36118f9f'
});

// Remove the incorrect call to connect() method

app.get('/token/:username', async (req, res) => {
  const { username } = req.params;

  const tokenSnapshot = await db.collection('tokens').doc(username).get();
  const tokenData = tokenSnapshot.data();

  if (!tokenData) {
    return res.status(404).send('User not found');
  }

  res.send({ token: tokenData.token });
});

// Instead, handle authentication after ChatEngine is ready
chatEngine.on('$.ready', () => {
  console.log('ChatEngine is ready');

  // Connect user after ChatEngine is ready
  const me = chatEngine.connect('username', {
    signedOnTime: Date.now(),
    authKey: 'auth-key'
  });

  me.on('$.online', () => {
    console.log('You are online');
  });

  me.on('$.offline', () => {
    console.log('You are offline');
  });

  chatEngine.global.on('voice-chat-offer', (payload) => {
    // Broadcast voice chat offer
    chatEngine.global.emit('voice-chat-offer', payload);
  });

  chatEngine.global.on('voice-chat-answer', (payload) => {
    // Broadcast voice chat answer
    chatEngine.global.emit('voice-chat-answer', payload);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
