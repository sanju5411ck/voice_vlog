import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import BottomNav from './BottomNav';
import CreatePostModal from './CreatePostModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleCloseModal = () => {
    if (!isRecording) {
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Voice Vlog" className="w-20 h-20" />
            <span className="text-xl font-semibold">Voice Vlog</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">{children}</main>

      <footer className="bg-white shadow-inner mt-6 py-4">
        <div className="max-w-4xl mx-auto text-center text-gray-600">
          <p className="text-sm">Design & Developed by Sanju © {new Date().getFullYear()}</p>
        </div>
      </footer>

      <BottomNav
        onCreatePost={() => setIsCreateModalOpen(true)}
        isRecording={isRecording}
      />

      {isCreateModalOpen && (
        <CreatePostModal
          onClose={handleCloseModal}
          onRecordingStateChange={setIsRecording}
        />
      )}
    </div>
  );
}