import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function VoiceRecorder({ onRecordingComplete }: { onRecordingComplete: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { session } = useAuth();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await uploadRecording(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    if (!session?.user) {
      alert('You must be logged in to upload recordings');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a title for your recording');
      return;
    }

    setIsUploading(true);
    try {
      // Check for profile using a more reliable query
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .filter('id', 'eq', session.user.id);

      if (profileError) {
        throw new Error('Failed to verify user profile');
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('User profile not found. Please try logging out and back in.');
      }

      const fileName = `${Date.now()}-${session.user.id}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);

      if (uploadError) {
        throw new Error('Failed to upload audio file. Please try again.');
      }

      const { error: insertError } = await supabase.from('voice_posts').insert([
        {
          user_id: session.user.id,
          title: title.trim(),
          description: description.trim() || null,
          audio_url: uploadData.path,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setTitle('');
      setDescription('');
      onRecordingComplete();
    } catch (error) {
      console.error('Error uploading recording:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to upload recording. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
        />
        <div className="flex justify-center">
          {isUploading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Uploading...</span>
            </div>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}