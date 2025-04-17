import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube, FiShoppingBag, FiTag, FiInfo, FiHelpCircle } from 'react-icons/fi'

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
    return <div className="bg-gradient-to-b from-[#f8f6fb] to-[#fef1f7] py-10"></div>;
  }
  return (
    <footer className="bg-gradient-to-b from-[#f8f6fb] to-[#fef1f7]">
      {/* Top Footer with Gradient Border */}
      <div className="h-1 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400"></div>

      <div className="container mx-auto px-4 py-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-pink-600">YUMIN</h3>
              <div className="h-1 w-10 bg-pink-600 ml-3 rounded-full"></div>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-medium">{companyInfo.name}</p>
              <div className="flex items-start gap-2">
                <FiMapPin className="w-5 h-5 mt-0.5 text-pink-500" />
                <p>{companyInfo.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="w-5 h-5 text-pink-500" />
                <p>{companyInfo.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="w-5 h-5 text-pink-500" />
                <p>{companyInfo.email}</p>
              </div>
              <p className="text-xs">{companyInfo.businessLicense}</p>
            </div>

            {/* Chi nhánh */}
            <div className="mt-6">
              <h4 className="text-sm font-bold mb-3 text-pink-600">Hệ thống cửa hàng</h4>
              <div className="space-y-3">
                {branches.map((branch, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-xs">{branch.address}</p>
                    <p className="text-xs">Liên hệ: {branch.contact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-pink-600">Mua sắm</h3>
              <div className="h-1 w-10 bg-pink-600 ml-3 rounded-full"></div>
            </div>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name} className="group">
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-500">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-pink-600">Về chúng tôi</h3>
              <div className="h-1 w-10 bg-pink-600 ml-3 rounded-full"></div>
            </div>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name} className="group">
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-500">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Policy */}
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-pink-600">Hỗ trợ</h3>
              <div className="h-1 w-10 bg-pink-600 ml-3 rounded-full"></div>
            </div>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name} className="group">
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-500">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center mt-6 mb-4">
              <h3 className="text-lg font-bold text-pink-600">Chính sách</h3>
              <div className="h-1 w-10 bg-pink-600 ml-3 rounded-full"></div>
            </div>
            <ul className="space-y-2">
              {footerLinks.policy.map((link) => (
                <li key={link.name} className="group">
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2 text-pink-500">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-10 pt-8 border-t border-pink-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-pink-600">Phương thức thanh toán</h4>
              <div className="flex items-center gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.name}
                    className="w-12 h-8 bg-white rounded-md shadow-sm flex items-center justify-center border border-pink-100"
                  >
                    <Image
                      src={method.image}
                      alt={method.name}
                      width={32}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="md:text-right">
              <h4 className="text-sm font-bold mb-4 text-pink-600">Kết nối với chúng tôi</h4>
              <div className="flex items-center gap-4 md:justify-end">
                <a
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors duration-300 shadow-sm border border-pink-100"
                >
                  <FiFacebook className="w-5 h-5" />
                </a>
                <a
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white transition-colors duration-300 shadow-sm border border-pink-100"
                >
                  <FiInstagram className="w-5 h-5" />
                </a>
                <a
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors duration-300 shadow-sm border border-pink-100"
                >
                  <FiYoutube className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-pink-100 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} YUMIN. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>

      {/* Bottom Footer with Dark Background */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-white/80 mb-2 md:mb-0">
              Công ty TNHH YUMIN Việt Nam | Mã số thuế: {companyInfo.taxCode}
            </p>
            <p className="text-xs text-white/80">
              Địa chỉ: {companyInfo.address}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
