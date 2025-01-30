import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  selectedImage: File | null;
  title: string;
  description: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onRecordingStateChange,
  selectedImage,
  title,
  description
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { session } = useAuth();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await handleUpload(audioBlob);
      };

      audioChunks.current = [];
      mediaRecorder.current.start();
      setIsRecording(true);
      onRecordingStateChange(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      onRecordingStateChange(false);
    }
  };

  const handleUpload = async (audioBlob: Blob) => {
    if (!title.trim()) {
      toast.error('Please enter a title for your post');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Creating your post...');

    try {
      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        const imageFileName = `${Date.now()}-${session?.user?.id}-image`;
        const { error: imageUploadError } = await supabase.storage
          .from('post-images')
          .upload(imageFileName, selectedImage);

        if (imageUploadError) throw imageUploadError;
        imageUrl = imageFileName;
      }

      // Upload audio
      const audioFileName = `${Date.now()}-${session?.user?.id}-audio.webm`;
      const { error: audioUploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/webm'
        });

      if (audioUploadError) throw audioUploadError;

      // Create post record
      const { error: postError } = await supabase
        .from('voice_posts')
        .insert({
          title,
          description: description.trim() || null,
          image_url: imageUrl,
          audio_url: audioFileName,
          user_id: session?.user?.id
        });

      if (postError) throw postError;

      toast.success('Post created successfully!', { id: loadingToast });
      onRecordingComplete(audioBlob);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to create post', { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex justify-center items-center space-x-4">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isUploading}
          className={`p-4 rounded-full ${
            isUploading
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
          } text-white transition-colors`}
        >
          {isUploading ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-4 rounded-full bg-gray-800 hover:bg-gray-900 text-white transition-colors"
        >
          <Square className="w-6 h-6" />
        </button>
      )}
      
      <div className="text-sm text-gray-500">
        {isRecording ? (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Recording...</span>
          </div>
        ) : isUploading ? (
          <span>Creating post...</span>
        ) : (
          <span>Click to start recording</span>
        )}
      </div>
    </div>
  );
}