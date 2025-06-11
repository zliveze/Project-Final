import React from 'react';
import Image from 'next/image';
import { FiCreditCard, FiDollarSign } from 'react-icons/fi';

export type PaymentMethod = 'momo' | 'cod' | 'stripe';

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
      </div>
    </div>
  );
};

export default PaymentMethods;
