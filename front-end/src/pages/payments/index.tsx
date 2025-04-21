import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiAlertCircle, FiPlus, FiCheck } from 'react-icons/fi';

// Components
import ShippingForm from '@/components/payments/ShippingForm';
import PaymentMethods, { PaymentMethod } from '@/components/payments/PaymentMethods';
import OrderSummary from '@/components/payments/OrderSummary';
import Breadcrum from '@/components/common/Breadcrum';
import DefaultLayout from '@/layout/DefaultLayout';

// Context
import { useCart } from '@/contexts/user/cart/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrder, ShippingAddress, CreateOrderDto } from '@/contexts/user/UserOrderContext';
import { useUserPayment } from '@/contexts/user/UserPaymentContext';

// API
import { UserApiService } from '@/contexts/user/UserApiService';

// Định nghĩa kiểu dữ liệu User rõ ràng hơn
interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string; // Thêm trường phone vì có thể API trả về cả hai trường
  addresses?: UserAddress[];
  customerLevel?: string;
  role: string;
}

// Định nghĩa kiểu dữ liệu
interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes?: string;
}

interface OrderItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: {
    url: string;
    alt: string;
  };
}

// Loại địa chỉ từ profile user
interface UserAddress {
  _id: string;
  addressLine: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
  // Thêm các mã địa chỉ cần thiết cho ViettelPost
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  // Thêm các trường tên địa chỉ
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

const PaymentsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Lấy dữ liệu giỏ hàng từ CartContext
  const {
    cartItems,
    subtotal,
    discount,
    shipping,
    total,
    voucherCode,
    isLoading: cartLoading,
    itemCount,
    clearCart
  } = useCart();

  // State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State cho thông tin giao hàng và phương thức thanh toán
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // State cho địa chỉ người dùng
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Chuyển đổi từ CartItems sang OrderItems
  useEffect(() => {
    if (!cartLoading) {
      if (itemCount === 0) {
        // Nếu giỏ hàng trống, chuyển hướng về trang giỏ hàng
        toast.info('Giỏ hàng của bạn đang trống.', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });
        router.push('/cart');
        return;
      }

      // Convert cartItems to orderItems format
      const items: OrderItem[] = cartItems.map(item => ({
        _id: item.variantId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));

      setOrderItems(items);
      setIsLoading(false);
    }
  }, [cartItems, cartLoading, router, itemCount]);

  // Tải danh sách địa chỉ của người dùng
  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (user && user._id) {
        try {
          // Lấy thông tin user profile từ API hoặc từ user object nếu đã có
          if (user.addresses && user.addresses.length > 0) {
            setUserAddresses(user.addresses);

            // Tìm địa chỉ mặc định
            const defaultAddress = user.addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress._id);

              // Chuyển đổi dữ liệu địa chỉ sang định dạng ShippingInfo
              const addressParts: string[] = defaultAddress.addressLine.split(',').map((part: string) => part.trim());
              const addressData: ShippingInfo = {
                fullName: user.name || '',
                phone: user.phoneNumber || user.phone || '', // Đảm bảo số điện thoại được lấy từ profile
                email: user.email || '',
                address: addressParts[0] || '',
                city: defaultAddress.city || '',
                district: addressParts.length > 2 ? addressParts[2] : '',
                ward: addressParts.length > 1 ? addressParts[1] : '',
                notes: ''
              };

              // Log thông tin để debug
              console.log('User phone from profile:', user.phoneNumber || user.phone);
              console.log('Shipping info with phone:', addressData);

              setShippingInfo(addressData);
              localStorage.setItem('shippingInfo', JSON.stringify(addressData));
            }
          } else {
            // Kiểm tra xem có thông tin giao hàng đã lưu trước đó không
            const savedShippingInfo = localStorage.getItem('shippingInfo');
            if (savedShippingInfo) {
              setShippingInfo(JSON.parse(savedShippingInfo));
            } else {
              // Nếu không có địa chỉ và không có thông tin giao hàng đã lưu, hiển thị form nhập địa chỉ
              setShowAddressForm(true);

              // Điền trước thông tin cơ bản từ user
              const initialShippingInfo: Partial<ShippingInfo> = {
                fullName: user.name || '',
                email: user.email || '',
                phone: user.phoneNumber || user.phone || ''
              };

              setShippingInfo(initialShippingInfo as ShippingInfo);
            }
          }
        } catch (error) {
          console.error('Error fetching user addresses:', error);
          toast.error('Không thể tải địa chỉ của bạn. Vui lòng thử lại sau.');
        }
      } else {
        // Không đăng nhập, kiểm tra thông tin giao hàng đã lưu
        const savedShippingInfo = localStorage.getItem('shippingInfo');
        if (savedShippingInfo) {
          setShippingInfo(JSON.parse(savedShippingInfo));
        } else {
          setShowAddressForm(true);
        }
      }
    };

    fetchUserAddresses();
  }, [user]);

  // Xử lý khi chọn địa chỉ
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);

    // Tìm địa chỉ được chọn
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      // Chuyển đổi dữ liệu địa chỉ sang định dạng ShippingInfo
      const addressParts: string[] = selectedAddress.addressLine.split(',').map((part: string) => part.trim());
      const addressData: ShippingInfo = {
        fullName: user?.name || '',
        phone: user?.phoneNumber || user?.phone || '', // Đảm bảo số điện thoại được lấy từ profile
        email: user?.email || '',
        address: addressParts[0] || '',
        city: selectedAddress.city || '',
        district: addressParts.length > 2 ? addressParts[2] : '',
        ward: addressParts.length > 1 ? addressParts[1] : '',
        notes: ''
      };

      // Log thông tin để debug
      console.log('User phone from selected address:', user?.phoneNumber || user?.phone);
      console.log('Shipping info with phone from selected address:', addressData);

      setShippingInfo(addressData);
      localStorage.setItem('shippingInfo', JSON.stringify(addressData));

      // Xóa thông báo lỗi khi người dùng chọn địa chỉ
      setErrorMessage(null);
    }
  };

  // Xử lý khi muốn thêm địa chỉ mới
  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShowAddressForm(true);

    // Điền trước thông tin cơ bản từ user nếu đã đăng nhập
    if (user) {
      const newShippingInfo = {
        fullName: user.name || '',
        phone: user.phoneNumber || user.phone || '', // Đảm bảo số điện thoại được lấy từ profile
        email: user.email || '',
        address: '',
        city: '',
        district: '',
        ward: '',
        notes: ''
      };

      // Log thông tin để debug
      console.log('User phone for new address:', user.phoneNumber || user.phone);
      console.log('New shipping info with phone:', newShippingInfo);

      setShippingInfo(newShippingInfo);
    } else {
      setShippingInfo(null);
    }
  };

  // Xử lý cập nhật thông tin giao hàng
  const handleShippingInfoSubmit = (values: ShippingInfo) => {
    setShippingInfo(values);
    setErrorMessage(null); // Xóa thông báo lỗi khi lưu thông tin thành công

    // Lưu thông tin giao hàng vào localStorage để sử dụng lần sau
    localStorage.setItem('shippingInfo', JSON.stringify(values));

    toast.success('Đã cập nhật thông tin giao hàng', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });

    // Nếu đã đăng nhập và đang ở chế độ thêm địa chỉ mới, lưu địa chỉ vào tài khoản
    if (user && user._id && values.address && values.city && values.district && values.ward) {
      saveAddressToAccount(values);
    }
  };

  // Lưu địa chỉ vào tài khoản người dùng
  const saveAddressToAccount = async (addressData: ShippingInfo) => {
    try {
      // Tìm các mã địa chỉ từ form
      const formattedAddress: any = {
        addressLine: `${addressData.address}, ${addressData.ward}, ${addressData.district}`,
        city: addressData.city,
        state: addressData.district,
        country: 'Việt Nam',
        postalCode: '',
        isDefault: userAddresses.length === 0, // Đặt làm mặc định nếu là địa chỉ đầu tiên
        // Thêm các mã địa chỉ cần thiết cho ViettelPost
        provinceCode: '2', // Mã mặc định cho Hồ Chí Minh
        districtCode: '51', // Mã mặc định cho Quận Bình Thạnh
        wardCode: '897', // Mã mặc định cho Phường 13
        // Thêm các trường tên địa chỉ
        provinceName: addressData.city,
        districtName: addressData.district,
        wardName: addressData.ward
      };

      console.log('Saving address with ViettelPost codes:', formattedAddress);

      // Gọi API để lưu địa chỉ
      const updatedUser = await UserApiService.addAddress(formattedAddress);

      // Cập nhật danh sách địa chỉ
      if (updatedUser && updatedUser.addresses) {
        // Chuyển đổi địa chỉ từ API sang UserAddress
        const convertedAddresses: UserAddress[] = updatedUser.addresses.map((addr: any) => ({
          _id: addr._id,
          addressLine: addr.addressLine,
          city: addr.city || addr.provinceName || '',
          state: addr.state || addr.districtName || '',
          country: addr.country || 'Việt Nam',
          postalCode: addr.postalCode || '',
          isDefault: addr.isDefault || false,
          provinceCode: addr.provinceCode || '2',
          districtCode: addr.districtCode || '51',
          wardCode: addr.wardCode || '897',
          provinceName: addr.provinceName || addr.city || '',
          districtName: addr.districtName || addr.state || '',
          wardName: addr.wardName || ''
        }));

        setUserAddresses(convertedAddresses);

        // Tìm địa chỉ vừa thêm
        const newAddress = convertedAddresses[convertedAddresses.length - 1];
        if (newAddress) {
          setSelectedAddressId(newAddress._id);
          setShowAddressForm(false);

          toast.success('Đã lưu địa chỉ mới vào tài khoản của bạn', {
            position: "bottom-right",
            autoClose: 2000,
            theme: "light",
            style: { backgroundColor: '#f0fff4', color: '#22543d', borderLeft: '4px solid #22543d' }
          });
        }
      }
    } catch (error) {
      console.error('Error saving address to account:', error);
      toast.error('Không thể lưu địa chỉ vào tài khoản. Địa chỉ chỉ được lưu cho đơn hàng này.');
    }
  };

  // Sử dụng UserOrderContext và UserPaymentContext
  const { createOrder, calculateShippingFee } = useUserOrder();
  const { createOrderWithCOD, createOrderWithStripe } = useUserPayment();

  // Xử lý đặt hàng
  const handlePlaceOrder = async () => {
    // Kiểm tra xem đã có thông tin giao hàng chưa
    if (!shippingInfo) {
      // Hiển thị thông báo lỗi
      setErrorMessage('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng');
      toast.error('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });

      // Cuộn đến form thông tin giao hàng
      const shippingFormElement = document.querySelector('.shipping-form');
      if (shippingFormElement) {
        shippingFormElement.scrollIntoView({ behavior: 'smooth' });
      }

      return;
    }

    // Kiểm tra xem đã chọn phương thức thanh toán chưa
    if (!paymentMethod) {
      setErrorMessage('Vui lòng chọn phương thức thanh toán');
      toast.error('Vui lòng chọn phương thức thanh toán', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return;
    }

    // Kiểm tra xem giỏ hàng có sản phẩm không
    if (itemCount === 0) {
      toast.error('Giỏ hàng của bạn đang trống. Không thể đặt hàng.', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      router.push('/cart');
      return;
    }

    // Xóa thông báo lỗi nếu mọi thứ hợp lệ
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Tìm địa chỉ đã chọn từ danh sách địa chỉ người dùng
      const selectedUserAddress = selectedAddressId ? userAddresses.find(addr => addr._id === selectedAddressId) : null;

      // Chuyển đổi shippingInfo sang định dạng ShippingAddress
      const shippingAddress: ShippingAddress = {
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        addressLine1: shippingInfo.address,
        province: shippingInfo.city || '',
        district: shippingInfo.district || '',
        ward: shippingInfo.ward || '',
        // Thêm các mã địa chỉ cần thiết cho ViettelPost
        provinceCode: selectedUserAddress?.provinceCode || '',
        districtCode: selectedUserAddress?.districtCode || '',
        wardCode: selectedUserAddress?.wardCode || ''
      };

      console.log('Selected address for shipping:', selectedUserAddress);

      // Kiểm tra xem có đầy đủ mã địa chỉ không
      if (!shippingAddress.provinceCode || !shippingAddress.districtCode || !shippingAddress.wardCode) {
        console.error('Thiếu mã địa chỉ cần thiết cho ViettelPost:', {
          provinceCode: shippingAddress.provinceCode,
          districtCode: shippingAddress.districtCode,
          wardCode: shippingAddress.wardCode
        });
        toast.error('Thiếu thông tin địa chỉ. Vui lòng chọn lại địa chỉ giao hàng.');
        setIsProcessing(false);
        return;
      }

      // Lấy branchId từ sản phẩm đầu tiên trong giỏ hàng
      // Ưu tiên sản phẩm có selectedBranchId
      let selectedBranchId: string | undefined = undefined;

      // Tìm sản phẩm đầu tiên có selectedBranchId
      const itemWithBranch = cartItems.find(item => item.selectedBranchId);
      if (itemWithBranch && itemWithBranch.selectedBranchId) {
        selectedBranchId = itemWithBranch.selectedBranchId;
        console.log(`Sử dụng branchId từ sản phẩm ${itemWithBranch.name}: ${selectedBranchId}`);
      }

      // Nếu không tìm thấy, kiểm tra xem có sản phẩm nào không có selectedBranchId không
      if (!selectedBranchId) {
        const itemsWithoutBranch = cartItems.filter(item => !item.selectedBranchId);
        if (itemsWithoutBranch.length > 0) {
          console.warn(`Có ${itemsWithoutBranch.length} sản phẩm chưa chọn chi nhánh`);
          toast.error(`Sản phẩm "${itemsWithoutBranch[0].name}" chưa chọn chi nhánh. Vui lòng quay lại giỏ hàng để chọn chi nhánh.`);
          setIsProcessing(false);
          return;
        }
      }

      // Sử dụng một branchId mặc định nếu không tìm thấy
      if (!selectedBranchId) {
        selectedBranchId = '67f4e29303d581f233241b76'; // Sử dụng ID chi nhánh mặc định
        console.log(`Sử dụng branchId mặc định: ${selectedBranchId}`);
      }

      // Tạo dữ liệu đơn hàng
      const orderData: CreateOrderDto = {
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId || '',
          name: item.name,
          image: item.image?.url,
          quantity: item.quantity,
          price: item.price,
          options: item.selectedOptions || {}
        })),
        subtotal,
        tax: 0,
        shippingFee: shipping,
        totalPrice: total,
        finalPrice: total,
        shippingAddress,
        branchId: selectedBranchId, // Thêm branchId vào đơn hàng
        paymentMethod: paymentMethod as 'cod' | 'bank_transfer' | 'credit_card' | 'stripe',
        notes: shippingInfo.notes
      };

      // Nếu có voucher, thêm vào đơn hàng
      if (voucherCode && discount > 0) {
        orderData.voucher = {
          voucherId: '', // Sẽ được xử lý ở backend
          code: voucherCode,
          discountAmount: discount
        };
      }

      // Lưu thông tin đơn hàng vào localStorage để sử dụng ở trang success
      localStorage.setItem('currentOrder', JSON.stringify(orderData));

      let result;

      // Xử lý theo phương thức thanh toán
      if (paymentMethod === 'cod') {
        // Tạo đơn hàng với COD (sẽ tự động tạo vận đơn Viettel Post)
        result = await createOrderWithCOD(orderData);

        if (result) {
          // Lưu thông tin đơn hàng vào localStorage để sử dụng ở trang success
          localStorage.setItem('orderNumber', result.orderNumber);
          localStorage.setItem('orderCreatedAt', result.createdAt);

          // Xóa giỏ hàng
          await clearCart();

          // Chuyển đến trang thành công
          router.push('/payments/success');
        } else {
          throw new Error('Không thể tạo đơn hàng');
        }
      } else if (paymentMethod === 'credit_card') {
        // Tạo đơn hàng với Stripe
        result = await createOrderWithStripe(orderData);

        if (result) {
          // Lưu thông tin đơn hàng vào localStorage để sử dụng ở trang success
          localStorage.setItem('orderNumber', result.order.orderNumber);
          localStorage.setItem('orderCreatedAt', result.order.createdAt);
          localStorage.setItem('paymentIntentId', result.paymentIntent.id);
          localStorage.setItem('paymentIntentClientSecret', result.paymentIntent.clientSecret);

          // Chuyển đến trang thanh toán Stripe
          router.push(`/payments/stripe?order_id=${result.order._id}`);
        } else {
          throw new Error('Không thể tạo đơn hàng với Stripe');
        }
      } else {
        // Các phương thức thanh toán khác (chưa hỗ trợ)
        throw new Error('Phương thức thanh toán chưa được hỗ trợ');
      }
    } catch (error: any) {
      console.error('Lỗi khi đặt hàng:', error);
      setIsProcessing(false);
      setErrorMessage(error.message || 'Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.');

      // Xử lý lỗi, chuyển đến trang thất bại
      router.push('/payments/fail');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán' }
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Thanh toán | YUMIN</title>
        <meta name="description" content="Thanh toán đơn hàng tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-800 mt-6 mb-8">Thanh toán</h1>

          {/* Hiển thị thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            // Hiển thị skeleton loading
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="pt-3 flex justify-between">
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Form thông tin giao hàng */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 shipping-form">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>

                  {/* Hiển thị danh sách địa chỉ nếu user đã có địa chỉ */}
                  {userAddresses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-medium text-gray-700">Địa chỉ của tôi</h3>
                        <button
                          type="button"
                          onClick={handleAddNewAddress}
                          className="text-sm text-pink-600 hover:text-pink-700 flex items-center"
                        >
                          <FiPlus className="mr-1" />
                          Thêm địa chỉ mới
                        </button>
                      </div>

                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <div
                            key={address._id}
                            className={`border rounded-md p-3 cursor-pointer transition-colors ${
                              selectedAddressId === address._id
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-pink-300'
                            }`}
                            onClick={() => handleSelectAddress(address._id)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{user?.name}</p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Điện thoại:</span> {user?.phoneNumber || (user as any)?.phone || 'Chưa có số điện thoại'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Địa chỉ:</span> {address.addressLine}
                                  {address.city && `, ${address.city}`}
                                  {address.country && `, ${address.country}`}
                                  {address.postalCode && ` - ${address.postalCode}`}
                                </p>
                              </div>
                              {selectedAddressId === address._id && (
                                <div className="flex-shrink-0 h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                                  <FiCheck className="text-white" />
                                </div>
                              )}
                              {address.isDefault && selectedAddressId !== address._id && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Mặc định</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hiển thị form nhập địa chỉ mới nếu không có địa chỉ hoặc chọn thêm địa chỉ mới */}
                  {(userAddresses.length === 0 || showAddressForm) && (
                    <ShippingForm
                      initialValues={shippingInfo || undefined}
                      onSubmit={handleShippingInfoSubmit}
                      showSubmitButton={true}
                    />
                  )}

                  {/* Hiển thị thông tin đã lưu nếu đã chọn địa chỉ nhưng không muốn thêm mới */}
                  {shippingInfo && selectedAddressId && !showAddressForm && (
                    <div className="mt-4 lg:hidden">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
                          isProcessing
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#306E51] text-white hover:bg-[#266246] transition-colors'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            Đặt hàng
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <PaymentMethods
                    selectedMethod={paymentMethod}
                    onSelectMethod={setPaymentMethod}
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                {/* Tóm tắt đơn hàng sử dụng dữ liệu từ CartContext */}
                <OrderSummary
                  items={orderItems}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                  voucherCode={voucherCode}
                  onPlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </DefaultLayout>
  );
};

export default PaymentsPage;