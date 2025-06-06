import React from 'react';
import Image from 'next/image';
import { FiCreditCard, FiDollarSign, FiSmartphone } from 'react-icons/fi';

export type PaymentMethod = 'credit_card' | 'momo' | 'zalopay' | 'bank_transfer' | 'cod' | 'stripe';

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ selectedMethod, onSelectMethod }) => {
  const handleMethodChange = (method: PaymentMethod) => {
    onSelectMethod(method);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>

      {/* Thanh toán khi nhận hàng */}
      <div
        className={`border rounded-md p-4 cursor-pointer transition-colors ${
          selectedMethod === 'cod'
            ? 'border-pink-600 bg-pink-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleMethodChange('cod')}
      >
        <div className="flex items-center">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
              selectedMethod === 'cod' ? 'border-pink-600' : 'border-gray-400'
            }`}
          >
            {selectedMethod === 'cod' && (
              <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            )}
          </div>
          <div className="flex items-center">
            <FiDollarSign className="text-gray-600 mr-2" size={20} />
            <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
          </div>
        </div>

        {selectedMethod === 'cod' && (
          <div className="mt-3 pl-8 text-sm text-gray-600">
            <p>Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.</p>
          </div>
        )}
      </div>

      {/* Thanh toán qua thẻ tín dụng/ghi nợ */}
      <div
        className={`border rounded-md p-4 cursor-pointer transition-colors ${
          selectedMethod === 'credit_card'
            ? 'border-pink-600 bg-pink-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleMethodChange('credit_card')}
      >
        <div className="flex items-center">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
              selectedMethod === 'credit_card' ? 'border-pink-600' : 'border-gray-400'
            }`}
          >
            {selectedMethod === 'credit_card' && (
              <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            )}
          </div>
          <div className="flex items-center">
            <FiCreditCard className="text-gray-600 mr-2" size={20} />
            <span className="font-medium">Thẻ tín dụng/ghi nợ</span>
          </div>
          <div className="ml-auto flex space-x-2">
            <div className="w-8 h-5 relative">
              <Image
                src="/images/visa.png"
                alt="Visa"
                fill
                className="object-contain"
              />
            </div>
            <div className="w-8 h-5 relative">
              <Image
                src="/images/mastercard.png"
                alt="Mastercard"
                fill
                className="object-contain"
              />
            </div>
            <div className="w-8 h-5 relative">
              <Image
                src="/images/jcb.png"
                alt="JCB"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {selectedMethod === 'credit_card' && (
          <div className="mt-3 pl-8 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Số thẻ
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ thẻ
                </label>
                <input
                  type="text"
                  id="cardName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]"
                  placeholder="NGUYEN VAN A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày hết hạn
                </label>
                <input
                  type="text"
                  id="expiry"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]"
                  placeholder="123"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thanh toán qua ví điện tử và Stripe */}
      <div className="space-y-3">
        {/* Stripe */}
        <div
          className={`border rounded-md p-4 cursor-pointer transition-colors ${
            selectedMethod === 'stripe'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleMethodChange('stripe')}
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                selectedMethod === 'stripe' ? 'border-pink-600' : 'border-gray-400'
              }`}
            >
              {selectedMethod === 'stripe' && (
                <div className="w-3 h-3 rounded-full bg-pink-600"></div>
              )}
            </div>
            <div className="flex items-center">
              <FiCreditCard className="text-blue-600 mr-2" size={24} />
              <span className="font-medium">Thanh toán với Stripe</span>
            </div>
          </div>

          {selectedMethod === 'stripe' && (
            <div className="mt-3 pl-8 text-sm text-gray-600">
              <p>Bạn sẽ được chuyển đến trang thanh toán an toàn của Stripe.</p>
            </div>
          )}
        </div>

        {/* MoMo */}
        <div
          className={`border rounded-md p-4 cursor-pointer transition-colors ${
            selectedMethod === 'momo'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleMethodChange('momo')}
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                selectedMethod === 'momo' ? 'border-pink-600' : 'border-gray-400'
              }`}
            >
              {selectedMethod === 'momo' && (
                <div className="w-3 h-3 rounded-full bg-pink-600"></div>
              )}
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 relative mr-2">
                <Image
                  src="/images/momo.png"
                  alt="MoMo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-medium">Ví MoMo</span>
            </div>
          </div>

          {selectedMethod === 'momo' && (
            <div className="mt-3 pl-8 text-sm text-gray-600">
              <p>Bạn sẽ được chuyển đến trang thanh toán của MoMo.</p>
            </div>
          )}
        </div>

        {/* ZaloPay */}
        <div
          className={`border rounded-md p-4 cursor-pointer transition-colors ${
            selectedMethod === 'zalopay'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleMethodChange('zalopay')}
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                selectedMethod === 'zalopay' ? 'border-pink-600' : 'border-gray-400'
              }`}
            >
              {selectedMethod === 'zalopay' && (
                <div className="w-3 h-3 rounded-full bg-pink-600"></div>
              )}
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 relative mr-2">
                <Image
                  src="/images/zalopay.png"
                  alt="ZaloPay"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-medium">ZaloPay</span>
            </div>
          </div>

          {selectedMethod === 'zalopay' && (
            <div className="mt-3 pl-8 text-sm text-gray-600">
              <p>Bạn sẽ được chuyển đến trang thanh toán của ZaloPay.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chuyển khoản ngân hàng */}
      <div
        className={`border rounded-md p-4 cursor-pointer transition-colors ${
          selectedMethod === 'bank_transfer'
            ? 'border-pink-600 bg-pink-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleMethodChange('bank_transfer')}
      >
        <div className="flex items-center">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
              selectedMethod === 'bank_transfer' ? 'border-pink-600' : 'border-gray-400'
            }`}
          >
            {selectedMethod === 'bank_transfer' && (
              <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            )}
          </div>
          <div className="flex items-center">
            <FiSmartphone className="text-gray-600 mr-2" size={20} />
            <span className="font-medium">Chuyển khoản ngân hàng</span>
          </div>
        </div>

        {selectedMethod === 'bank_transfer' && (
          <div className="mt-3 pl-8 text-sm text-gray-600 space-y-2">
            <p>Vui lòng chuyển khoản đến tài khoản sau:</p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Ngân hàng:</span> Vietcombank</p>
              <p><span className="font-medium">Số tài khoản:</span> 1234567890</p>
              <p><span className="font-medium">Chủ tài khoản:</span> CÔNG TY TNHH YUMIN</p>
              <p><span className="font-medium">Nội dung:</span> [Mã đơn hàng]</p>
            </div>
            <p className="text-[#306E51]">Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethods;
