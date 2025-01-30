import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Mic } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
          <img src="./logo.png" className="w-20 h-20 text-indigo-600" />
          {/* <Mic className="w-6 h-6 text-indigo-600" /> */}
            <span className="text-xl font-semibold">Voice Vlog </span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    <footer className="bg-white shadow-inner mt-6 py-4">
      <div className="max-w-4xl mx-auto text-center text-gray-600">
        <p className="text-sm">Design & Developed by Sanju © {new Date().getFullYear()}</p>
      </div>
    </footer>
    </div>
  );
}