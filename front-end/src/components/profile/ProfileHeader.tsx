import React from 'react';
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

interface ProfileHeaderProps {
  title: string;
  onBack: () => void;
  onLogout: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ title, onBack, onLogout }) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 mb-4 shadow-md rounded">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-700 hover:text-pink-600 transition-colors border border-gray-300 px-3 py-2 rounded"
        >
          <FaArrowLeft className="mr-2" /> Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
      >
        <FaSignOutAlt className="mr-2" /> Đăng xuất
      </button>
    </div>
  );
};

export default ProfileHeader; 