import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

interface CreatePostModalProps {
  onClose: () => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export default function CreatePostModal({ onClose, onRecordingStateChange }: CreatePostModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
    onRecordingStateChange(recording);
  }, [onRecordingStateChange]);

  const handleClose = useCallback(() => {
    if (!isRecording) {
      onClose();
    }
  }, [isRecording, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    handleRecordingStateChange(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create New Post</h2>
          <button 
            onClick={handleClose}
            disabled={isRecording}
            className={`text-gray-500 hover:text-gray-700 ${isRecording ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter post title"
                disabled={isRecording}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Enter post description"
                disabled={isRecording}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={isRecording}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record Voice
              </label>
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onRecordingStateChange={handleRecordingStateChange}
                selectedImage={selectedImage}
                title={title}
                description={description}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 