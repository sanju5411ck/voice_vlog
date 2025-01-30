import React from 'react';
import Loader from './Loader';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 animate-gradient flex flex-col items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
        <Loader size="large" text="Loading VoiceVlog" />
      </div>
    </div>
  );
} 