'use client';

import { useState } from 'react';
import IntroScreen from '@/components/IntroScreen';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleStart = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setStarted(true);
    } catch (err) {
      console.error('Failed to create session:', err);
      // Start anyway with auto-created session
      setStarted(true);
    }
  };

  if (!started) {
    return <IntroScreen onStart={handleStart} />;
  }

  return <ChatInterface sessionId={sessionId} />;
}
