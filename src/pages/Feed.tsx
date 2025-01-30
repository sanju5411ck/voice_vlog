import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import VoiceRecorder from '../components/VoiceRecorder';
import { Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VoicePost {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function Feed() {
  const [posts, setPosts] = useState<VoicePost[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('voice_posts')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data || []);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePlay = async (postId: string, audioUrl: string) => {
    if (currentlyPlaying === postId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const { data } = await supabase.storage
        .from('voice-recordings')
        .getPublicUrl(audioUrl);

      audioRef.current = new Audio(data.publicUrl);
      audioRef.current.play();
      setCurrentlyPlaying(postId);

      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  return (
    <div className="space-y-6">
      <VoiceRecorder onRecordingComplete={fetchPosts} />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {post.profiles.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold">{post.profiles.username}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            {post.description && (
              <p className="text-gray-600 mb-4">{post.description}</p>
            )}
            
            <button
              onClick={() => togglePlay(post.id, post.audio_url)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
            >
              {currentlyPlaying === post.id ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>{currentlyPlaying === post.id ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}