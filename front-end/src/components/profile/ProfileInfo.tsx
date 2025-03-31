import { useState } from 'react';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Address } from './AddressList';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  role: string;
  createdAt: string;
  wishlist?: Array<{ productId: string; variantId: string | null }>;
  updatedAt?: string;
}

interface ProfileInfoProps {
  user: User;
  onUpdate?: (updatedUser: Partial<User>) => void;
}

const ProfileInfo = ({ user, onUpdate }: ProfileInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Giả lập cập nhật thông tin
    setTimeout(() => {
      if (onUpdate) {
        onUpdate(formData);
      }
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
    }, 500);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      phone: user.phone,
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center text-pink-600 hover:text-pink-800 transition-colors"
          >
            <FaEdit className="mr-1" /> Chỉnh sửa
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              <FaCheck className="mr-1" /> Lưu
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <FaTimes className="mr-1" /> Hủy
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <p className="text-sm font-medium text-pink-600 mb-1">Họ và tên</p>
              <p className="text-md text-gray-900 font-medium">{user.name}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-purple-600 mb-1">Email</p>
              <p className="text-md text-gray-900 font-medium">{user.email}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <p className="text-sm font-medium text-pink-600 mb-1">Số điện thoại</p>
              <p className="text-md text-gray-900 font-medium">{user.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-purple-600 mb-1">Ngày tham gia</p>
              <p className="text-md text-gray-900 font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo; 