import React, { useState } from 'react'
import Link from 'next/link'
import { FiChevronRight, FiChevronDown } from 'react-icons/fi'

const categories = [
  {
    title: 'Chăm Sóc Da Mặt',
    href: '/cham-soc-da-mat',
    subcategories: [
      { name: 'Kem Chống Nắng', href: '/kem-chong-nang' },
      { name: 'Sữa Rửa Mặt', href: '/sua-rua-mat' },
      { name: 'Nước Tẩy Trang', href: '/nuoc-tay-trang' },
      { name: 'Mặt Nạ', href: '/mat-na' },
    ]
  },
  {
    title: 'Trang Điểm',
    href: '/trang-diem',
    subcategories: [
      { name: 'Son Môi', href: '/son-moi' },
      { name: 'Kem Nền - Cushion', href: '/kem-nen-cushion' },
      { name: 'Mascara', href: '/mascara' },
      { name: 'Phấn Phủ', href: '/phan-phu' },
    ]
  },
  {
    title: 'Chăm Sóc Cơ Thể',
    href: '/cham-soc-co-the',
    subcategories: [
      { name: 'Sữa Tắm', href: '/sua-tam' },
      { name: 'Dưỡng Thể', href: '/duong-the' },
      { name: 'Kem Chống Nắng Body', href: '/kem-chong-nang-body' },
      { name: 'Tẩy Tế Bào Chết', href: '/tay-te-bao-chet' },
    ]
  },
  {
    title: 'Chăm Sóc Tóc',
    href: '/cham-soc-toc',
    subcategories: [
      { name: 'Dầu Gội', href: '/dau-goi' },
      { name: 'Dầu Xả', href: '/dau-xa' },
      { name: 'Kem Ủ Tóc', href: '/kem-u-toc' },
      { name: 'Dưỡng Tóc', href: '/duong-toc' },
    ]
  },
]

export default function CategoryMenu({ isMobile = false }) {
  const [openCategory, setOpenCategory] = useState<number | null>(null)

  if (isMobile) {
    return (
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={index}>
            <button
              className="w-full flex items-center justify-between py-2 text-sm"
              onClick={() => setOpenCategory(openCategory === index ? null : index)}
            >
              <span>{category.title}</span>
              <FiChevronDown 
                className={`w-4 h-4 transform transition-transform ${
                  openCategory === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {openCategory === index && (
              <div className="pl-4 py-2 space-y-2 bg-gray-50">
                {category.subcategories.map((sub, subIndex) => (
                  <Link
                    key={subIndex}
                    href={sub.href}
                    className="block py-1.5 text-sm text-gray-600 hover:text-pink-600"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 w-[240px] bg-white shadow-lg rounded-b-md z-50">
      {categories.map((category, index) => (
        <div key={index} className="group relative">
          <Link 
            href={category.href}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 hover:text-pink-600"
          >
            <span className="text-sm">{category.title}</span>
            <FiChevronRight className="w-4 h-4" />
          </Link>
          
          {/* Submenu */}
          <div className="hidden group-hover:block absolute left-full top-0 w-[240px] bg-white shadow-lg">
            <div className="py-2">
              {category.subcategories.map((sub, subIndex) => (
                <Link
                  key={subIndex}
                  href={sub.href}
                  className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-pink-600"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 