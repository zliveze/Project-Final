'use client';

import React from 'react';
import Avatar from './Avatar';

const ColorShowcase: React.FC = () => {
  const sampleNames = [
    'Nguyễn Thị Hương',
    'Trần Minh Đức', 
    'Phạm Thu Trang',
    'Lê Văn An',
    'Vũ Quỳnh Anh',
    'Hoàng Mai Linh'
  ];

  return (
    <div className="p-8 bg-gray-50 rounded-xl">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🌸 Color Palette cho Website Mỹ Phẩm
      </h3>
      
      {/* Avatar samples */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Avatar với màu sắc solid</h4>
        <div className="flex flex-wrap gap-6 justify-center">
          {sampleNames.map((name, index) => (
            <div key={index} className="text-center">
              <Avatar name={name} size="lg" />
              <p className="text-xs mt-2 text-gray-600 max-w-20 truncate">{name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Color palette demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="font-semibold text-gray-700 mb-3">Primary Colors</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-500"></div>
              <span className="text-sm text-gray-600">Pink 500 - Main Brand</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-500"></div>
              <span className="text-sm text-gray-600">Rose 500 - Secondary</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100"></div>
              <span className="text-sm text-gray-600">Pink 100 - Light</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="font-semibold text-gray-700 mb-3">Neutral Colors</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-800"></div>
              <span className="text-sm text-gray-600">Gray 800 - Headings</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-600"></div>
              <span className="text-sm text-gray-600">Gray 600 - Body Text</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100"></div>
              <span className="text-sm text-gray-600">Gray 100 - Borders</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="font-semibold text-gray-700 mb-3">Action Colors</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-500"></div>
              <span className="text-sm text-gray-600">Pink 500 - CTA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Emerald - Success</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400"></div>
              <span className="text-sm text-gray-600">Amber - Stars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sample buttons */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button className="px-6 py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors">
          Mua ngay
        </button>
        <button className="px-6 py-3 bg-white text-pink-600 rounded-lg font-medium border-2 border-pink-200 hover:border-pink-300 transition-all">
          Thêm vào giỏ
        </button>
        <button className="px-6 py-3 bg-pink-100 text-pink-600 rounded-lg font-medium hover:bg-pink-200 transition-colors">
          Yêu thích
        </button>
      </div>
    </div>
  );
};

export default ColorShowcase; 