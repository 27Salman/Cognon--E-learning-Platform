import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

export default function AdminNavbar({ adminInfo }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);  

  const displayName = user?.name || adminInfo?.name || 'Admin';
  const profileImage = adminInfo?.profileImage || null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-bold text-purple-600 cursor-pointer"
            onClick={() => navigate('/admin/dashboard')}
          >
            Cognon
          </h1>
          <span className="text-sm text-gray-500 font-medium">Admin</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button
            onClick={() => navigate('/admin/profile')}
            className="focus:outline-none"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Admin"
                className="w-9 h-9 rounded-full object-cover border-2 border-purple-400"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center border-2 border-purple-400">
                <span className="text-white font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
