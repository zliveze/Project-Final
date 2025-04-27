import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiAlertCircle, FiPlus, FiCheck, FiEdit } from 'react-icons/fi';

// Components
import ShippingForm, { ShippingInfo } from '@/components/payments/ShippingForm';
import PaymentMethods, { PaymentMethod } from '@/components/payments/PaymentMethods';
import OrderSummary from '@/components/payments/OrderSummary';
// import Breadcrum from '@/components/common/Breadcrum';
import DefaultLayout from '@/layout/DefaultLayout';

// Context
import { useCart } from '@/contexts/user/cart/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrder, ShippingAddress, CreateOrderDto, ShippingService } from '@/contexts/user/UserOrderContext';
import { useUserPayment } from '@/contexts/user/UserPaymentContext';

// API
import { UserApiService } from '@/contexts/user/UserApiService';

// Định nghĩa kiểu dữ liệu User rõ ràng hơn
type UserProfile = {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string; // Thêm trường phone vì có thể API trả về cả hai trường
  addresses?: UserAddress[];
  customerLevel?: string;
  role: string;
  [key: string]: any; // Cho phép các trường khác
}

// Thêm lại OrderItem interface đã bị mất
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
    total: cartTotal,
    voucherCode,
    voucherId,
    isLoading: cartLoading,
    itemCount,
    clearCart
  } = useCart();

  // Tính tổng chi phí bao gồm cả phí vận chuyển
  const [total, setTotal] = useState<number>(cartTotal + shipping);

  // Cập nhật tổng chi phí khi phí vận chuyển hoặc giá trị giỏ hàng thay đổi
  useEffect(() => {
    const newTotal = cartTotal + shipping;
    setTotal(newTotal);


  }, [cartTotal, shipping, subtotal, discount]);

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

  // Thêm state mới để quản lý việc sửa địa chỉ
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Chuyển đổi từ CartItems sang OrderItems và tính phí vận chuyển
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

      // Tính phí vận chuyển nếu đã có địa chỉ giao hàng
      if (shippingInfo && shippingInfo.provinceCode && shippingInfo.districtCode && shippingInfo.wardCode) {
        calculateShippingFeeForAddress(shippingInfo);
      }
    }
  }, [cartItems, cartLoading, router, itemCount, shippingInfo]);

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
                phone: user.phoneNumber || (user as any).phone || '', // Đảm bảo số điện thoại được lấy từ profile
                email: user.email || '',
                address: addressParts[0] || '',
                city: defaultAddress.city || '',
                district: addressParts.length > 2 ? addressParts[2] : '',
                ward: addressParts.length > 1 ? addressParts[1] : '',
                notes: '',
                // Thêm các trường mới cho ViettelPost
                provinceId: defaultAddress.provinceCode,
                districtId: defaultAddress.districtCode,
                wardId: defaultAddress.wardCode,
                // Thêm các thông tin tên cần thiết
                provinceName: defaultAddress.city,
                districtName: defaultAddress.district,
                wardName: defaultAddress.ward,
                // Thêm mã code nếu có
                provinceCode: defaultAddress.provinceCode,
                districtCode: defaultAddress.districtCode,
                wardCode: defaultAddress.wardCode
              };



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
                phone: user.phoneNumber || (user as any).phone || ''
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

  // Hàm tính tổng trọng lượng của các sản phẩm trong giỏ hàng
  const calculateTotalWeight = (): number => {
    // Khởi tạo trọng lượng
    let totalWeight = 0;

    // Lấy trọng lượng thực tế từ cosmetic_info
    cartItems.forEach(item => {
      // Truy cập cosmetic_info.volume.value, không sử dụng giá trị mặc định
      const itemWeight = item.cosmetic_info?.volume?.value || 0;
      totalWeight += itemWeight * item.quantity;

    });



    // Trả về trọng lượng thực tế, không áp dụng giá trị mặc định
    return totalWeight;
  };

  // Hàm tính phí vận chuyển dựa trên địa chỉ và trọng lượng
  const calculateShippingFeeForAddress = async (address: ShippingInfo) => {
    if (!address.provinceCode || !address.districtCode || !address.wardCode) {
      setShippingError('Không thể tính phí vận chuyển do thiếu thông tin địa chỉ');
      setCalculatedShipping(32000); // Sử dụng phí mặc định
      updateShipping(32000);
      return;
    }

    try {
      // Tính tổng trọng lượng
      const totalWeight = calculateTotalWeight();

      // Chuyển đổi mã tỉnh/huyện sang số nguyên nếu cần
      let provinceCode = address.provinceCode;
      let districtCode = address.districtCode;
      let wardCode = address.wardCode;

      // Đảm bảo mã tỉnh/thành phố đúng định dạng
      if (provinceCode === 'HCM') provinceCode = '2';
      else if (provinceCode === 'HNI') provinceCode = '1';

      // Đảm bảo mã quận/huyện và phường/xã là số nguyên
      // Nếu là chuỗi, chuyển đổi sang số
      if (districtCode && isNaN(Number(districtCode))) {
        // Nếu là chuỗi không phải số, sử dụng một giá trị mặc định
        if (provinceCode === '2') { // HCM
          districtCode = '43'; // Quận 1
        } else {
          districtCode = '14'; // Quận Hoàng Mai
        }
      }

      if (wardCode && isNaN(Number(wardCode))) {
        // Sử dụng một giá trị mặc định cho phường/xã
        wardCode = '0';
      }

      // Sử dụng mã địa chỉ cố định cho chi nhánh

      // Sử dụng mã địa chỉ cố định cho chi nhánh (người gửi)
      const senderProvinceCode = 1; // Hà Nội - Mã tỉnh của chi nhánh
      const senderDistrictCode = 4; // Quận Hoàng Mai - Mã quận của chi nhánh

      // Sử dụng mã địa chỉ đã chuẩn hóa của người dùng (người nhận)
      const receiverProvinceCode = Number(provinceCode) || 2; // Mặc định là Hồ Chí Minh nếu không có
      const receiverDistrictCode = Number(districtCode) || 35; // Mặc định là Quận Tân Bình nếu không có



      // Chuẩn bị dữ liệu cho API tính phí vận chuyển theo đúng cấu trúc API getPriceAll của Viettel Post
      // Sử dụng trọng lượng thực tế của sản phẩm và địa chỉ thực tế của chi nhánh và người dùng
      const shippingFeeData = {
        PRODUCT_WEIGHT: totalWeight, // Sử dụng trọng lượng thực tế từ cartItems
        PRODUCT_PRICE: Math.max(subtotal - discount, 10000),
        MONEY_COLLECTION: Math.max(subtotal - discount, 10000),
        SENDER_PROVINCE: senderProvinceCode, // Sử dụng mã tỉnh của chi nhánh
        SENDER_DISTRICT: senderDistrictCode, // Sử dụng mã quận của chi nhánh
        RECEIVER_PROVINCE: receiverProvinceCode, // Sử dụng mã tỉnh của người dùng
        RECEIVER_DISTRICT: receiverDistrictCode, // Sử dụng mã quận của người dùng
        PRODUCT_TYPE: 'HH',
        TYPE: 1
      };



      // Gọi API tính phí vận chuyển cho tất cả dịch vụ
      const result = await calculateShippingFeeAll(shippingFeeData);

      if (result.success) {


        // Lấy phí vận chuyển từ dịch vụ được chọn
        const shippingFee = result.fee;

        // Lưu mã dịch vụ được chọn
        if (result.selectedServiceCode) {
          setSelectedServiceCode(result.selectedServiceCode);

        }

        // Lưu các dịch vụ vận chuyển khả dụng
        if (result.availableServices && result.availableServices.length > 0) {
          setAvailableServices(result.availableServices);
        }

        setCalculatedShipping(shippingFee);
        updateShipping(shippingFee);
        setShippingError(null);



        // Cập nhật tổng chi phí (useEffect sẽ tự động cập nhật khi shipping thay đổi)
      } else {
        setShippingError(result.error || 'Không thể tính phí vận chuyển');
        setCalculatedShipping(32000); // Sử dụng phí mặc định
        updateShipping(32000);
        setAvailableServices([]); // Xóa các dịch vụ vận chuyển khả dụng
      }
    } catch (error) {
      setShippingError('Có lỗi xảy ra khi tính phí vận chuyển');
      setCalculatedShipping(32000); // Sử dụng phí mặc định
      updateShipping(32000);
      setAvailableServices([]); // Xóa các dịch vụ vận chuyển khả dụng
    }
  };

  // Xử lý khi chọn địa chỉ
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);

    // Tìm địa chỉ được chọn
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      // Chuyển đổi dữ liệu địa chỉ sang định dạng ShippingInfo
      const addressParts: string[] = selectedAddress.addressLine.split(',').map((part: string) => part.trim());

      // Chuẩn hóa mã tỉnh/thành phố
      let provinceCode = selectedAddress.provinceCode;
      if (provinceCode === 'HCM') provinceCode = '2';
      else if (provinceCode === 'HNI') provinceCode = '1';

      // Chuẩn hóa mã quận/huyện
      let districtCode = selectedAddress.districtCode;
      if (districtCode && isNaN(Number(districtCode))) {
        if (provinceCode === '2') { // HCM
          districtCode = '43'; // Quận 1
        } else {
          districtCode = '14'; // Quận Hoàng Mai
        }
      }

      // Chuẩn hóa mã phường/xã
      let wardCode = selectedAddress.wardCode;
      if (wardCode && isNaN(Number(wardCode))) {
        wardCode = '0';
      }

      const addressData: ShippingInfo = {
        fullName: user?.name || '',
        phone: user?.phoneNumber || (user as any)?.phone || '', // Đảm bảo số điện thoại được lấy từ profile
        email: user?.email || '',
        address: addressParts[0] || '',
        city: selectedAddress.city || '',
        district: addressParts.length > 2 ? addressParts[2] : '',
        ward: addressParts.length > 1 ? addressParts[1] : '',
        notes: '',
        // Thêm các trường mới cho ViettelPost
        provinceId: selectedAddress.provinceCode,
        districtId: selectedAddress.districtCode,
        wardId: selectedAddress.wardCode,
        // Thêm các thông tin tên cần thiết
        provinceName: selectedAddress.provinceName || selectedAddress.city,
        districtName: selectedAddress.districtName || selectedAddress.state,
        wardName: selectedAddress.wardName,
        // Thêm mã code đã chuẩn hóa
        provinceCode: provinceCode,
        districtCode: districtCode,
        wardCode: wardCode
      };



      setShippingInfo(addressData);
      localStorage.setItem('shippingInfo', JSON.stringify(addressData));

      // Xóa thông báo lỗi khi người dùng chọn địa chỉ
      setErrorMessage(null);

      // Tính phí vận chuyển cho địa chỉ đã chọn
      calculateShippingFeeForAddress(addressData);
    }
  };

  // Xử lý khi muốn thêm địa chỉ mới
  const handleAddNewAddress = () => {
    if (selectedAddressId) setSelectedAddressId(null);
    setShowAddressForm(true);
    setEditingAddressId(null); // Reset trạng thái sửa địa chỉ khi thêm địa chỉ mới
  };

  // Thêm hàm mới để bắt đầu sửa địa chỉ
  const handleEditAddress = (addressId: string) => {
    setEditingAddressId(addressId);
    setShowAddressForm(true); // Hiển thị form
    setSelectedAddressId(null); // Bỏ chọn địa chỉ hiện tại

    // Tìm địa chỉ cần sửa
    const addressToEdit = userAddresses.find(addr => addr._id === addressId);
    if (addressToEdit) {
      // Chuyển đổi thành dữ liệu ShippingInfo
      const convertedAddress = convertAddressToShippingInfo(addressToEdit);

      // Cập nhật state với dữ liệu địa chỉ đã chọn
      setShippingInfo(convertedAddress);



      // Cuộn đến vị trí form để người dùng dễ nhìn thấy
      setTimeout(() => {
        const formElement = document.querySelector('.shipping-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Xử lý cập nhật thông tin giao hàng
  const handleShippingInfoSubmit = (values: ShippingInfo) => {
    setShippingInfo(values);

    // Lưu địa chỉ nếu người dùng đã đăng nhập
    if (user && user._id) {
      saveAddressToAccount(values);
    }

    setShowAddressForm(false);
    setEditingAddressId(null); // Reset trạng thái sửa sau khi lưu
  };

  // Lưu địa chỉ vào tài khoản người dùng
  const saveAddressToAccount = async (addressData: ShippingInfo) => {
    try {
      // Tạo đối tượng địa chỉ từ dữ liệu form
      const formattedAddress: any = {
        addressLine: `${addressData.address}, ${addressData.ward}, ${addressData.district}`,
        city: addressData.city,
        state: addressData.district,
        country: 'Việt Nam',
        postalCode: '',
        isDefault: userAddresses.length === 0, // Đặt làm mặc định nếu là địa chỉ đầu tiên
        // Thêm các mã địa chỉ cần thiết cho ViettelPost
        provinceCode: addressData.provinceCode || '1',
        districtCode: addressData.districtCode || '4',
        wardCode: addressData.wardCode || '0',
        // Thêm các trường tên địa chỉ
        provinceName: addressData.city,
        districtName: addressData.district,
        wardName: addressData.ward
      };



      let updatedUser;

      // Kiểm tra xem đang cập nhật địa chỉ hay tạo mới
      if (editingAddressId) {
        // Đang sửa địa chỉ hiện có
        formattedAddress._id = editingAddressId; // Thêm ID địa chỉ đang sửa


        // Gọi API để cập nhật địa chỉ
        updatedUser = await UserApiService.updateAddress(editingAddressId, formattedAddress);

        toast.success('Đã cập nhật địa chỉ thành công', {
          position: "bottom-right",
          autoClose: 2000,
          theme: "light",
          style: { backgroundColor: '#f0fff4', color: '#22543d', borderLeft: '4px solid #22543d' }
        });
      } else {
        // Đang thêm địa chỉ mới


        // Gọi API để thêm địa chỉ mới
        updatedUser = await UserApiService.addAddress(formattedAddress);

        toast.success('Đã thêm địa chỉ mới vào tài khoản của bạn', {
          position: "bottom-right",
          autoClose: 2000,
          theme: "light",
          style: { backgroundColor: '#f0fff4', color: '#22543d', borderLeft: '4px solid #22543d' }
        });
      }

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

        if (editingAddressId) {
          // Nếu đang sửa, chọn lại địa chỉ đó
          setSelectedAddressId(editingAddressId);
        } else {
          // Nếu đang thêm mới, chọn địa chỉ vừa thêm
          const newAddress = convertedAddresses[convertedAddresses.length - 1];
          if (newAddress) {
            setSelectedAddressId(newAddress._id);
          }
        }

        setShowAddressForm(false);
      }
    } catch (error) {
      console.error('Error saving address to account:', error);
      toast.error('Không thể lưu địa chỉ vào tài khoản. Vui lòng thử lại sau.');
    }
  };

  // Sử dụng UserOrderContext và UserPaymentContext
  const { calculateShippingFeeAll } = useUserOrder();
  const { createOrderWithCOD, createOrderWithStripe, createOrderWithMomo } = useUserPayment();

  // State cho phí vận chuyển và lỗi
  const [calculatedShipping, setCalculatedShipping] = useState<number>(0); // Lưu trạng thái phí vận chuyển đã tính
  const [shippingError, setShippingError] = useState<string | null>(null); // Lưu lỗi khi tính phí vận chuyển
  const [availableServices, setAvailableServices] = useState<ShippingService[]>([]); // Lưu các dịch vụ vận chuyển khả dụng
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('LCOD'); // Lưu mã dịch vụ đã chọn, mặc định là LCOD
  const { updateShipping } = useCart(); // Lấy hàm cập nhật phí vận chuyển từ CartContext

  // Xử lý khi người dùng chọn dịch vụ vận chuyển
  const handleSelectShippingService = (serviceCode: string, fee: number) => {

    setSelectedServiceCode(serviceCode);
    setCalculatedShipping(fee);
    updateShipping(fee);

    // Hiển thị thông báo đã chọn dịch vụ vận chuyển
    const selectedService = availableServices.find(service => service.serviceCode === serviceCode);
    if (selectedService) {
      toast.success(`Đã chọn dịch vụ vận chuyển: ${selectedService.serviceName}`, {
        position: "bottom-right",
        autoClose: 2000,
        theme: "light"
      });
    }
  };

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



      // Kiểm tra và chuyển đổi mã địa chỉ cho ViettelPost
      if (!shippingAddress.provinceCode || !shippingAddress.districtCode || !shippingAddress.wardCode) {
        // Sử dụng mã địa chỉ mặc định cho ViettelPost
        shippingAddress.provinceCode = '1'; // Hà Nội
        shippingAddress.districtCode = '14'; // Quận Hoàng Mai
        shippingAddress.wardCode = '0'; // Mã mặc định cho phường/xã
      }

      // Đảm bảo mã địa chỉ đúng định dạng cho ViettelPost
      // Chuyển đổi mã tỉnh/thành phố sang định dạng số nếu cần
      if (shippingAddress.provinceCode === 'HCM') {
        // Hồ Chí Minh
        shippingAddress.provinceCode = '2';
      } else if (shippingAddress.provinceCode === 'HNI') {
        // Hà Nội
        shippingAddress.provinceCode = '1';
      }

      // Đảm bảo mã quận/huyện và phường/xã là số nguyên
      if (shippingAddress.districtCode && isNaN(Number(shippingAddress.districtCode))) {
        // Nếu là chuỗi không phải số, sử dụng một giá trị mặc định
        if (shippingAddress.provinceCode === '2') { // HCM
          shippingAddress.districtCode = '43'; // Quận 1
        } else {
          shippingAddress.districtCode = '14'; // Quận Hoàng Mai
        }
      }

      if (shippingAddress.wardCode && isNaN(Number(shippingAddress.wardCode))) {
        // Sử dụng một giá trị mặc định cho phường/xã
        shippingAddress.wardCode = '0';
      }



      // Lấy branchId từ sản phẩm đầu tiên trong giỏ hàng
      // Ưu tiên sản phẩm có selectedBranchId
      let selectedBranchId: string | undefined = undefined;

      // Tìm sản phẩm đầu tiên có selectedBranchId
      const itemWithBranch = cartItems.find(item => item.selectedBranchId);
      if (itemWithBranch && itemWithBranch.selectedBranchId) {
        selectedBranchId = itemWithBranch.selectedBranchId;

      }

      // Nếu không tìm thấy, kiểm tra xem có sản phẩm nào không có selectedBranchId không
      if (!selectedBranchId) {
        const itemsWithoutBranch = cartItems.filter(item => !item.selectedBranchId);
        if (itemsWithoutBranch.length > 0) {

          toast.error(`Sản phẩm "${itemsWithoutBranch[0].name}" chưa chọn chi nhánh. Vui lòng quay lại giỏ hàng để chọn chi nhánh.`);
          setIsProcessing(false);
          return;
        }
      }

      // Sử dụng một branchId mặc định nếu không tìm thấy
      if (!selectedBranchId) {
        selectedBranchId = '67f4e29303d581f233241b76'; // Sử dụng ID chi nhánh mặc định

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
        paymentMethod: paymentMethod as 'cod' | 'bank_transfer' | 'credit_card' | 'stripe' | 'momo',
        notes: shippingInfo.notes,
        shippingServiceCode: selectedServiceCode // Thêm mã dịch vụ vận chuyển đã chọn
      };

      // Nếu có voucher, thêm vào đơn hàng
      if (voucherCode && discount > 0) {
        orderData.voucher = {
          voucherId: voucherId,
          code: voucherCode,
          discountAmount: discount
        };
        console.log(`Adding voucher to order - code: ${voucherCode}, id: ${voucherId}, discount: ${discount}`);
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
      } else if (paymentMethod === 'credit_card' || paymentMethod === 'stripe') {
        // Tạo đơn hàng với Stripe
        result = await createOrderWithStripe(orderData);

        if (result && result.checkoutUrl) {
          // Lưu thông tin đơn hàng tạm thời vào localStorage để sử dụng ở trang success
          if (orderData.orderNumber) {
            localStorage.setItem('orderNumber', orderData.orderNumber);
          }
          localStorage.setItem('orderCreatedAt', new Date().toISOString());

          // Chuyển đến trang thanh toán Stripe Checkout
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error('Không thể tạo phiên thanh toán Stripe');
        }
      } else if (paymentMethod === 'momo') {
        // Tạo đơn hàng với MoMo
        result = await createOrderWithMomo(orderData);

        if (result && result.payUrl) {
          // Chuyển đến trang thanh toán MoMo
          router.push(`/payments/momo?payUrl=${encodeURIComponent(result.payUrl)}`);
        } else {
          throw new Error('Không thể tạo đơn hàng với MoMo');
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

  // Tìm địa chỉ đang được sửa để truyền vào form
  const addressBeingEdited = editingAddressId
    ? userAddresses.find(addr => addr._id === editingAddressId)
    : null;

  // Chuyển đổi từ UserAddress sang ShippingInfo
  const convertAddressToShippingInfo = (address: UserAddress): ShippingInfo => {
    return {
      fullName: user?.name || '',
      phone: user?.phoneNumber || (user as any)?.phone || '',
      email: user?.email || '',
      address: address.addressLine,
      city: address.provinceName || address.city || '',
      district: address.districtName || address.state || '',
      ward: address.wardName || '',
      notes: '',
      // Thêm các ID cần thiết cho form ViettelPost
      provinceId: address.provinceCode,
      districtId: address.districtCode,
      wardId: address.wardCode,
      // Thêm các thông tin tên cần thiết
      provinceName: address.provinceName || address.city,
      districtName: address.districtName || address.state,
      wardName: address.wardName,
      // Thêm mã code nếu có
      provinceCode: address.provinceCode,
      districtCode: address.districtCode,
      wardCode: address.wardCode
    };
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
                              <div className="flex items-center">
                                {selectedAddressId === address._id && (
                                  <div className="flex-shrink-0 h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center mr-2">
                                    <FiCheck className="text-white" />
                                  </div>
                                )}
                                {address.isDefault && selectedAddressId !== address._id && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mr-2">Mặc định</span>
                                )}
                                <button
                                  type="button"
                                  className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Ngăn chặn sự kiện click lan tỏa lên phần tử cha
                                    handleEditAddress(address._id);
                                  }}
                                >
                                  <FiEdit className="mr-1 inline-block" />
                                  Sửa
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hiển thị form nhập địa chỉ mới nếu không có địa chỉ hoặc chọn thêm địa chỉ mới */}
                  {(userAddresses.length === 0 || showAddressForm) && (
                    <div className={`${editingAddressId ? 'border-2 border-blue-500 p-4 rounded-lg bg-blue-50 transition-all animate-pulse' : ''}`}
                         ref={(el) => {
                           // Tự động cuộn đến vị trí form khi nó xuất hiện
                           if (el && editingAddressId) {
                             setTimeout(() => {
                               el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                               // Dừng animation sau 1 giây để không làm rối mắt người dùng
                               setTimeout(() => {
                                 el.classList.remove('animate-pulse');
                               }, 1000);
                             }, 100);
                           }
                         }}>
                      {editingAddressId && (
                        <div className="mb-4 bg-blue-100 p-3 rounded text-blue-700 font-medium flex items-center">
                          <FiEdit className="mr-2" />
                          Đang chỉnh sửa địa chỉ. Vui lòng cập nhật thông tin bên dưới.
                        </div>
                      )}
                      <ShippingForm
                        initialValues={editingAddressId && addressBeingEdited
                          ? convertAddressToShippingInfo(addressBeingEdited)
                          : (shippingInfo || undefined)}
                        onSubmit={handleShippingInfoSubmit}
                        showSubmitButton={true}
                      />
                    </div>
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
                            : 'bg-pink-600 text-white hover:bg-pink-700 transition-colors'
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
                  shippingError={shippingError}
                  calculatedShipping={calculatedShipping}
                  availableServices={availableServices}
                  selectedServiceCode={selectedServiceCode}
                  onSelectShippingService={handleSelectShippingService}
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
