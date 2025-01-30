import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import { Settings } from 'lucide-react';

interface SavedPost {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  audio_url: string;
  created_at: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function SavedPosts() {
  const { session } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          voice_posts (
            id,
            title,
            description,
            image_url,
            audio_url,
            created_at,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data.map(item => ({
        ...item.voice_posts,
        user: {
          username: item.voice_posts.profiles.username,
          avatar_url: item.voice_posts.profiles.avatar_url
        }
      }));

      setSavedPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" text="Loading saved posts..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {savedPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer"
          >
            {post.image_url ? (
              <img
                src={supabase.storage.from('post-images').getPublicUrl(post.image_url).data.publicUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <Settings className="w-8 h-8 text-indigo-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-all text-center p-2">
                <h3 className="font-medium text-sm truncate">{post.title}</h3>
                {post.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">{post.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">By {post.user.username}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {savedPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No saved posts yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Posts you save will appear here
          </p>
        </div>
      )}
    </div>
  );
} 