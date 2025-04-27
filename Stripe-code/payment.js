import axios from 'axios';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51PZjaJLJSo3FBshINk2IfiUafkAa04Fn9Tjs33YaPYUu8uJ1U2WVTOiCfuHLmyi6G9R5ZjAjeJH9Hrfg54xz4cD000kZ9p8LgS');

const Payment = ({ order, onClose, onPaymentSuccess }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
  };

  const handlePaymentClick = async () => {
    if (!selectedPayment) {
      alert("Vui lòng chọn phương thức thanh toán.");
      return;
    }
  
    try {
      if (selectedPayment === 'Stripe') {
        const items = order.products.map(product => ({
          name: product.title,
          amount: Math.round(product.price * 1000), // Đơn vị: cents, làm tròn để tránh số thập phân
          quantity: product.foodQuantity,
        }));
  
        const response = await axios.post('/api/create-stripe-session', { 
          items, 
          orderId: order._id,
          total: Math.round(order.total * 1000), // Đơn vị: cents, làm tròn để tránh số thập phân
          discountPrice: Math.round((order.discountprice || 0) * 1000), // Đơn vị: cents, làm tròn để tránh số thập phân
        });
        const { url } = response.data;
        window.location.href = url;
      } else if (selectedPayment === 'VNPay' || selectedPayment === 'Momo') {
        setShowPopup(true);
      } else {
        // Các phương thức thanh toán khác
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order._id}`, {
          paymentstatus: 'Đang chờ xác nhận',
        });
  
        toast.success("Đang chờ xác nhận!");
        setTimeout(() => {
          onClose();
        }, 2000); // 2 giây
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error("Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.");
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order._id}`, {
        paymentstatus: 'Đang chờ xác nhận',
      });

      toast.success("Đang chờ xác nhận!");
      setShowPopup(false);
      onPaymentSuccess();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error("Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại.");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };


  const handleVNConfirmPayment = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order._id}`, {
        paymentstatus: 'Đang chờ xác nhận',
      });
      toast.success("Đang chờ xác nhận!");
        setTimeout(() => {
          onClose();
        }, 2000); // 2 giây
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error("Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại.");
    }
  };


  const formatCurrency = (amount) => {
    const parts = parseFloat(amount).toFixed(3).split('.');
    const integerPart = parts[0];
    let decimalPart = parts[1];

    decimalPart = decimalPart.padEnd(3, '0');

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${formattedInteger}.${decimalPart} VNĐ`;
  };

  return (
    <div className="payment-modal">
      <div className="payment-container">
        <div className="payment-title">
          <h4>Vui lòng chọn phương thức <span style={{ color: '#6064b6' }}>thanh toán</span></h4>
        </div>
        <form className="payment-form">
          <input type="radio" name="payment" id="tienmat" onChange={() => handlePaymentSelect('tienmat')} />
          <input type="radio" name="payment" id="VNPay" onChange={() => handlePaymentSelect('VNPay')} />
          <input type="radio" name="payment" id="Momo" onChange={() => handlePaymentSelect('Momo')} />
          <input type="radio" name="payment" id="Stripe" onChange={() => handlePaymentSelect('Stripe')} />

          <div className="payment-category">
            <label htmlFor="tienmat" className={`payment-label tienmatMethod ${selectedPayment === 'tienmat' ? 'selected' : ''}`}>
              <div className="imgContainer tienmat">
                <Image src="https://cdn-icons-png.freepik.com/512/5132/5132194.png" alt="cash" width={50} height={50} />
              </div>
              <div className="imgName">
                <span>Tiền mặt</span>
                <div className="check"><FontAwesomeIcon icon={faCircleCheck} /></div>
              </div>
            </label>
            <label htmlFor="VNPay" className={`payment-label VNPayMethod ${selectedPayment === 'VNPay' ? 'selected' : ''}`}>
              <div className="imgContainer VNPay">
                <Image src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" alt="VNPay" width={50} height={50} />
              </div>
              <div className="imgName">
                <span>VNPay</span>
                <div className="check"><FontAwesomeIcon icon={faCircleCheck} /></div>
              </div>
            </label>
            <label htmlFor="Momo" className={`payment-label MomoMethod ${selectedPayment === 'Momo' ? 'selected' : ''}`}>
              <div className="imgContainer Momo">
                <Image src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="Momo" width={50} height={50} />
              </div>
              <div className="imgName">
                <span>Momo</span>
                <div className="check"><FontAwesomeIcon icon={faCircleCheck} /></div>
              </div>
            </label>
            <label htmlFor="Stripe" className={`payment-label StripeMethod ${selectedPayment === 'Stripe' ? 'selected' : ''}`}>
              <div className="imgContainer Stripe">
                <Image src="https://www.cdnlogo.com/logos/s/83/stripe.svg" alt="Stripe" width={50} height={50} />
              </div>
              <div className="imgName">
                <span>Stripe</span>
                <div className="check"><FontAwesomeIcon icon={faCircleCheck} /></div>
              </div>
            </label>
          </div>
        </form>
        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600" onClick={handlePaymentClick}>Thanh toán</button>
          <button onClick={onClose} className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600">Đóng</button>
        </div>
        <ToastContainer />
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg text-center max-w-md mx-auto">
            <h4 className="mb-4">Số Tiền bạn cần thanh toán là</h4><h4> {formatCurrency(order.total)}</h4>
            <div className="qr-code mb-4">
              {selectedPayment === 'VNPay' && <Image src="https://imgur.com/HQWd6Kn.png" alt="VNPay QR" width={200} height={200} />}
              {selectedPayment === 'Momo' && <Image src="https://imgur.com/TRKh58m.png" alt="Momo QR" width={200} height={200} />}
            </div>
            <div className="flex justify-center gap-4">
              <button className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600" onClick={handleVNConfirmPayment}>Xác nhận thanh toán</button>
              <button className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600" onClick={handleClosePopup}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
