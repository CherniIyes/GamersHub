// server.js

const express = require('express');
const http = require('http');
const ChatEngine = require('chat-engine');
const admin = require('firebase-admin');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peerServer);

const serviceAccount = require('./path-to-your-firebase-service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const chatEngine = ChatEngine.create({
  publishKey: 'YOUR_PUBLISH_KEY',
  subscribeKey: 'YOUR_SUBSCRIBE_KEY'
});

app.get('/token/:username', async (req, res) => {
  const { username } = req.params;

  const tokenSnapshot = await db.collection('tokens').doc(username).get();
  const tokenData = tokenSnapshot.data();

  if (!tokenData) {
    return res.status(404).send('User not found');
  }

  res.send({ token: tokenData.token });
});

chatEngine.connect('username', { signedOnTime: Date.now() }, 'auth-key');

chatEngine.on('$.ready', () => {
  console.log('ChatEngine is ready');

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
