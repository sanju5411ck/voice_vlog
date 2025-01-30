import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Key, LogOut, Settings, Grid, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

interface UserProfile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
}

interface SavedPost {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [userPosts, setUserPosts] = useState<SavedPost[]>([]);

  // Form states
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    website: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchUserPosts();
      fetchSavedPosts();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        username: data.username || '',
        bio: data.bio || '',
        website: data.website || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_posts')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('voice_posts(*)')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPosts(data.map((item:any) => item.voice_posts));
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      toast.error('Failed to load saved posts');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Updating profile...');

    try {
      // Upload new avatar if selected
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const fileName = `${Date.now()}-${session?.user?.id}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;
        avatarUrl = fileName;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio,
          website: editForm.website,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully', { id: loadingToast });
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', { id: loadingToast });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const loadingToast = toast.loading('Updating password...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully', { id: loadingToast });
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password', { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-400">
                      {profile?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{profile?.username}</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Key className="w-5 h-5" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
            {profile?.bio && <p className="text-gray-600 mb-2">{profile.bio}</p>}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Change Password Form */}
        {isChangingPassword && (
          <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Posts/Saved Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Grid className="w-5 h-5" />
              <span>Posts</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'saved'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Bookmark className="w-5 h-5" />
              <span>Saved</span>
            </div>
          </button>
        </div>

        {/* Posts Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(activeTab === 'posts' ? userPosts : savedPosts).map((post) => (
              <div
                key={post.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group"
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
                  </div>
                </div>
              </div>
            ))}
          </div>
          {((activeTab === 'posts' && userPosts.length === 0) ||
            (activeTab === 'saved' && savedPosts.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              No {activeTab === 'posts' ? 'posts' : 'saved items'} yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 