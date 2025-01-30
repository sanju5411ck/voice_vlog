import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import VoiceRecorder from '../components/VoiceRecorder';
import { Play, Pause, Heart, MessageCircle, Share2, Bookmark, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import CreatePostModal from '../components/CreatePostModal';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

interface VoicePost {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  comments?: Comment[];
}

export default function Feed() {
  const [posts, setPosts] = useState<VoicePost[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { session } = useAuth();
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('voice_posts')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          ),
          post_likes (
            count
          ),
          post_comments (
            count
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        toast.error('Failed to load posts');
        return;
      }

      // Transform the data to match our interface
      const transformedPosts = postsData.map(post => ({
        ...post,
        likes_count: post.post_likes?.[0]?.count || 0,
        comments_count: post.post_comments?.[0]?.count || 0
      }));

      // Initialize liked and saved posts
      if (session) {
        const [{ data: likedData }, { data: savedData }] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', session.user.id),
          supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', session.user.id)
        ]);

        setLikedPosts(new Set(likedData?.map(like => like.post_id) || []));
        setSavedPosts(new Set(savedData?.map(save => save.post_id) || []));
      }

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      return;
    }

    setComments(prev => ({
      ...prev,
      [postId]: data || []
    }));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      toast.success('Image selected');
    }
  };

  const handleDeletePost = async (postId: string, userId: string) => {
    if (session?.user?.id !== userId) {
      toast.error('You can only delete your own posts');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('voice_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      return;
    }

    toast.success('Post deleted successfully');
    fetchPosts();
  };

  const togglePlay = async (postId: string, audioUrl: string) => {
    try {
      if (currentlyPlaying === postId) {
        audioRef.current?.pause();
        setCurrentlyPlaying(null);
        return;
      }

      setIsLoading(prev => ({ ...prev, [postId]: true }));

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const { data } = await supabase.storage
        .from('voice-recordings')
        .getPublicUrl(audioUrl);

      audioRef.current = new Audio(data.publicUrl);
      
      // Add event listeners
      audioRef.current.addEventListener('canplay', () => {
        audioRef.current?.play();
        setCurrentlyPlaying(postId);
        setIsLoading(prev => ({ ...prev, [postId]: false }));
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        toast.error('Failed to load audio');
        setIsLoading(prev => ({ ...prev, [postId]: false }));
      });

      audioRef.current.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });

      // Start loading the audio
      audioRef.current.load();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
      setIsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to like posts');
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: session.user.id }]);
        
        setLikedPosts(prev => new Set([...prev, postId]));
      }

      // Update likes count in UI
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + (isLiked ? -1 : 1) }
          : post
      ));

    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }

    const comment = newComment[postId]?.trim();
    if (!comment) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: session.user.id,
          comment
        }]);

      if (error) throw error;

      // Clear comment input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      
      // Refresh comments
      await fetchComments(postId);
      
      // Update comment count in UI
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));

      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (post: VoicePost) => {
    try {
      await navigator.share({
        title: post.title,
        text: post.description || 'Check out this voice note!',
        url: window.location.href
      });
      toast.success('Post shared successfully');
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  const handleSave = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to save posts');
      return;
    }

    const isSaved = savedPosts.has(postId);
    
    try {
      if (isSaved) {
        // Unsave
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast.success('Post removed from saved');
      } else {
        // Save
        await supabase
          .from('saved_posts')
          .insert([{ post_id: postId, user_id: session.user.id }]);
        
        setSavedPosts(prev => new Set([...prev, postId]));
        toast.success('Post saved successfully');
      }
    } catch (error) {
      console.error('Error updating saved post:', error);
      toast.error('Failed to update saved post');
    }
  };

  const toggleComments = async (postId: string) => {
    setShowComments(prev => {
      const newState = { ...prev, [postId]: !prev[postId] };
      if (newState[postId]) {
        fetchComments(postId);
      }
      return newState;
    });
  };

  const handleRecordingState = (recording: boolean) => {
    setIsRecording(recording);
  };

  return (
    <div className="relative min-h-screen pb-16">
      {isInitialLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <Toaster position="top-center" />
          
          {/* Posts Feed */}
          <div className="max-w-2xl mx-auto space-y-6 p-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Loader size="medium" text="No posts yet. Be the first to share!" />
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full p-0.5">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-700">
                            {post.profiles.username[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{post.profiles.username}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {session?.user?.id === post.user_id && (
                      <button 
                        onClick={() => handleDeletePost(post.id, post.user_id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-gray-600 mb-4">{post.description}</p>
                    )}
                    
                    {post.image_url && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img 
                          src={supabase.storage.from('post-images').getPublicUrl(post.image_url).data.publicUrl} 
                          alt="Post attachment" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Audio Player */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <button
                        onClick={() => togglePlay(post.id, post.audio_url)}
                        disabled={isLoading[post.id]}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                      >
                        {isLoading[post.id] ? (
                          <div className="w-8 h-8">
                            <Loader size="small" />
                          </div>
                        ) : currentlyPlaying === post.id ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8" />
                        )}
                        <span className="font-medium loading-dots">
                          {isLoading[post.id] 
                            ? 'Loading' 
                            : currentlyPlaying === post.id 
                              ? 'Playing' 
                              : 'Play Voice Note'
                          }
                        </span>
                      </button>
                      <div className="flex-1 mx-4">
                        <div className="h-1 bg-gray-200 rounded-full">
                          <div 
                            className="h-1 bg-indigo-500 rounded-full transition-all duration-200" 
                            style={{ width: currentlyPlaying === post.id ? '50%' : '0%' }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          {post.likes_count > 0 && (
                            <span className="ml-1 text-sm">{post.likes_count}</span>
                          )}
                        </button>
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <MessageCircle className="w-6 h-6" />
                          {post.comments_count > 0 && (
                            <span className="ml-1 text-sm">{post.comments_count}</span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleShare(post)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <Share2 className="w-6 h-6" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleSave(post.id)}
                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                          savedPosts.has(post.id) ? 'text-black' : 'text-gray-600'
                        }`}
                      >
                        <Bookmark className={`w-6 h-6 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="mt-4 space-y-4">
                        <div className="max-h-60 overflow-y-auto space-y-4">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                  {comment.profiles.username[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{comment.profiles.username}</p>
                                <p className="text-sm text-gray-600">{comment.comment}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {session && (
                          <div className="flex items-center space-x-2 mt-4">
                            <input
                              type="text"
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleComment(post.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Post Modal */}
          {/* <CreatePostModal
            onClose={() => setIsCreateModalOpen(false)}
            selectedImage={selectedImage}
            onImageSelect={handleImageSelect}
            onRecordingComplete={fetchPosts}
          /> */}

          {/* Bottom Navigation */}
          {/* <BottomNav
            onCreateClick={() => setIsCreateModalOpen(true)}
            isRecording={isRecording}
          /> */}
        </>
      )}
    </div>
  );
}