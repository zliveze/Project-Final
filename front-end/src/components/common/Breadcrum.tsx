import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { FiHome, FiChevronRight } from 'react-icons/fi'

export interface BreadcrumItem {
  label: string
  href?: string
}

interface BreadcrumProps {
  items: BreadcrumItem[]
  className?: string
  showHome?: boolean
}

export default function Breadcrum({ items, className = '', showHome = true }: BreadcrumProps) {
  const [mounted, setMounted] = useState(false);

  // Xử lý hydration mismatch bằng cách chỉ render sau khi component đã được mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Kiểm tra xem item đầu tiên có phải là "Trang chủ" không
  const hasHomeItem = items.length > 0 && items[0].label.toLowerCase() === 'trang chủ';

  // Nếu chưa mount, hiển thị một div trống để tránh lỗi hydration
  if (!mounted) {
    return <div className={`breadcrum relative z-30 ${className}`}></div>;
  }

  return (
    <div className={`breadcrum relative z-30 ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center flex-wrap text-xs">
          {/* Chỉ hiển thị link Trang chủ nếu showHome = true và item đầu tiên không phải là Trang chủ */}
          {showHome && !hasHomeItem && (
            <>
              <Link
                href="/"
                className="flex items-center text-gray-500 hover:text-pink-600 transition-colors"
              >
                <FiHome className="w-3.5 h-3.5 mr-1" />
                <span>Trang chủ</span>
              </Link>

              {items.length > 0 && (
                <div className="flex items-center mx-1.5 text-gray-300">
                  <FiChevronRight size={12} />
                </div>
              )}
            </>
          )}

          {items.map((item, index) => (
            <React.Fragment key={index}>
              {/* Hiển thị icon mũi tên chỉ khi không phải là item đầu tiên */}
              {index > 0 && (
                <div className="flex items-center mx-1.5 text-gray-300">
                  <FiChevronRight size={12} />
                </div>
              )}

              {/* Hiển thị icon Home cho item Trang chủ */}
              {index === 0 && item.label.toLowerCase() === 'trang chủ' ? (
                <Link
                  href={item.href || '/'}
                  className="flex items-center text-gray-500 hover:text-pink-600 transition-colors"
                >
                  <FiHome className="w-3.5 h-3.5 mr-1" />
                  <span>{item.label}</span>
                </Link>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-pink-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  )
}
