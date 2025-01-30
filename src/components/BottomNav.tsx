import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Bookmark, Plus, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  onCreatePost: () => void;
  isRecording: boolean;
}

export default function BottomNav({ onCreatePost, isRecording }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-full ${
              location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigate('/saved')}
            className={`p-2 rounded-full ${
              location.pathname === '/saved' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Bookmark className="w-6 h-6" />
          </button>
          
          <button
            onClick={onCreatePost}
            className={`p-3 bg-indigo-600 rounded-full text-white shadow-lg transform transition-transform hover:scale-105 ${
              isRecording ? 'animate-pulse bg-red-500' : ''
            }`}
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className={`p-2 rounded-full ${
              location.pathname === '/profile' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {session?.user?.user_metadata?.avatar_url ? (
              <img 
                src={session.user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 