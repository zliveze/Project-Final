import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube, FiShoppingBag, FiTag, FiInfo, FiHelpCircle, FiCreditCard } from 'react-icons/fi'

// Thông tin công ty từ model Branches
const companyInfo = {
  name: 'CÔNG TY TNHH YUMIN VIỆT NAM',
  address: '55 Nguyễn Văn Giai, Phường Đa Kao, Quận 1, TP. HCM',
  phone: '1900 1000',
  email: 'cskh@yumin.vn',
  taxCode: '0316725285',
  businessLicense: 'Số ĐKKD 0316725285 do Sở KHĐT TP.HCM cấp ngày 01/03/2021'
}

// Các chi nhánh từ model Branches
const branches = [
  {
    name: 'Chi nhánh Quận 1',
    address: '55 Nguyễn Văn Giai, Phường Đa Kao, Quận 1, TP. HCM',
    contact: '028 1234 5678'
  },
  {
    name: 'Chi nhánh Quận 3',
    address: '123 Nguyễn Đình Chiểu, Phường 5, Quận 3, TP. HCM',
    contact: '028 2345 6789'
  }
]

// Liên kết footer dựa trên cấu trúc models
const footerLinks = {
  about: [
    { name: 'Giới thiệu', href: '/about', icon: <FiInfo className="w-4 h-4" /> },
    { name: 'Hệ thống cửa hàng', href: '/branches', icon: <FiMapPin className="w-4 h-4" /> },
    { name: 'Tin tức & Sự kiện', href: '/news', icon: <FiTag className="w-4 h-4" /> },
    { name: 'Liên hệ', href: '/contact', icon: <FiPhone className="w-4 h-4" /> }
  ],
  shop: [
    { name: 'Danh mục sản phẩm', href: '/categories', icon: <FiTag className="w-4 h-4" /> },
    { name: 'Thương hiệu', href: '/brands', icon: <FiShoppingBag className="w-4 h-4" /> },
    { name: 'Khuyến mãi', href: '/promotions', icon: <FiTag className="w-4 h-4" /> },
    { name: 'Sản phẩm mới', href: '/new-products', icon: <FiTag className="w-4 h-4" /> }
  ],
  policy: [
    { name: 'Chính sách bảo mật', href: '/privacy-policy', icon: <FiInfo className="w-4 h-4" /> },
    { name: 'Điều khoản sử dụng', href: '/terms', icon: <FiInfo className="w-4 h-4" /> },
    { name: 'Chính sách đổi trả', href: '/return-policy', icon: <FiInfo className="w-4 h-4" /> },
    { name: 'Chính sách vận chuyển', href: '/shipping-policy', icon: <FiInfo className="w-4 h-4" /> }
  ],
  support: [
    { name: 'Hướng dẫn mua hàng', href: '/shopping-guide', icon: <FiHelpCircle className="w-4 h-4" /> },
    { name: 'Câu hỏi thường gặp', href: '/faq', icon: <FiHelpCircle className="w-4 h-4" /> },
    { name: 'Hỗ trợ khách hàng', href: '/support', icon: <FiHelpCircle className="w-4 h-4" /> },
    { name: 'Tra cứu đơn hàng', href: '/order-tracking', icon: <FiHelpCircle className="w-4 h-4" /> }
  ]
}

// Phương thức thanh toán
const paymentMethods = [
  { name: 'Visa', image: 'https://placehold.co/50x30/png' },
  { name: 'MasterCard', image: 'https://placehold.co/50x30/png' },
  { name: 'Momo', image: 'https://placehold.co/50x30/png' },
  { name: 'VNPay', image: 'https://placehold.co/50x30/png' },
  { name: 'ZaloPay', image: 'https://placehold.co/50x30/png' }
]

// Mạng xã hội
const socialMedia = {
  facebook: 'https://facebook.com/yumin',
  instagram: 'https://instagram.com/yumin',
  youtube: 'https://youtube.com/yumin'
}

export default function Footer() {
  const [mounted, setMounted] = React.useState(false);

  // Xử lý hydration mismatch bằng cách chỉ render sau khi component đã được mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Nếu chưa mount, hiển thị một div trống để tránh lỗi hydration
  if (!mounted) {
    return <div className="bg-white py-10"></div>;
  }

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Top Footer with Subtle Pink Border */}
      <div className="h-0.5 bg-pink-300"></div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-pink-600 mb-4">YUMIN</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-medium">{companyInfo.name}</p>
              <div className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 mt-0.5 text-pink-500 flex-shrink-0" />
                <p className="text-gray-500">{companyInfo.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <p className="text-gray-500">{companyInfo.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <p className="text-gray-500">{companyInfo.email}</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <a
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors duration-200"
                >
                  <FiFacebook className="w-4 h-4" />
                </a>
                <a
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors duration-200"
                >
                  <FiInstagram className="w-4 h-4" />
                </a>
                <a
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors duration-200"
                >
                  <FiYoutube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-base font-semibold text-pink-600 mb-4">Mua sắm</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-400 opacity-70">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-pink-600 mb-4">Về chúng tôi</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-400 opacity-70">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Branches - Simplified */}
            <h3 className="text-base font-semibold text-pink-600 mt-6 mb-4">Hệ thống cửa hàng</h3>
            <ul className="space-y-2">
              {branches.map((branch, index) => (
                <li key={index} className="text-sm text-gray-500">
                  <p className="font-medium">{branch.name}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-pink-600 mb-4">Hỗ trợ & Chính sách</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-400 opacity-70">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}

              {footerLinks.policy.slice(0, 2).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-400 opacity-70">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment Methods */}
            <h3 className="text-base font-semibold text-pink-600 mt-6 mb-4">Thanh toán</h3>
            <div className="flex flex-wrap items-center gap-2">
              <FiCreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Hỗ trợ nhiều phương thức thanh toán</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500 mb-2 md:mb-0">
              © {new Date().getFullYear()} YUMIN. Tất cả các quyền được bảo lưu.
            </p>
            <p className="text-xs text-gray-500">
              {companyInfo.businessLicense}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
