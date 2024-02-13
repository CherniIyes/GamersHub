// pages/index.js

import React from 'react';
import { useClient } from 'next/client'; // Import useClient hook
import VoiceChatPage from '@/app/Pages/VoiceChat/index'; // Correct import path

export default function Home() {
  useClient(); // Mark the component as a Client Component

  return (
    <main>
      <VoiceChatPage />
    </main>
  );
}
