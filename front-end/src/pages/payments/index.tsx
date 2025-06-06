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
  gifts?: Array<{
    giftId: string;
    name: string;
    description?: string;
    value: number;
    image: { 
      url: string;
      alt: string;
    };
  }>;
}

interface UserAddress {
  _id: string;
  addressLine: string;
  city?: string; 
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  district?: string;
  ward?: string;
}

interface AddressApiResponse {
  _id: string;
  addressLine: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

interface UserApiResponse {
  addresses?: AddressApiResponse[];
}

const PaymentsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const {
    cartItems,
    selectedItems,
    selectedSubtotal,
    selectedItemCount,
    discount,
    shipping,
    selectedTotal,
    voucherCode,
    voucherId,
    isLoading: cartLoading,
    itemCount,
    clearCart,
    updateShipping
  } = useCart();

  const [total, setTotal] = useState<number>(selectedTotal + shipping);

  useEffect(() => {
    const newTotal = selectedTotal + shipping;
    setTotal(newTotal);
  }, [selectedTotal, shipping, selectedSubtotal, discount]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const { calculateShippingFeeAll } = useUserOrder();
  const { createOrderWithCOD, createOrderWithStripe, createOrderWithMomo } = useUserPayment();
  
  const [calculatedShipping, setCalculatedShipping] = useState<number>(0);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<ShippingService[]>([]);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('LCOD');

  const calculateTotalWeight = React.useCallback((): number => {
    let totalWeight = 0;
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
    selectedCartItems.forEach(item => {
      const itemWeight = item.cosmetic_info?.volume?.value || 0;
      totalWeight += itemWeight * item.quantity;
    });
    return totalWeight;
  }, [cartItems, selectedItems]);

  const calculateShippingFeeForAddress = React.useCallback(async (address: ShippingInfo) => {
    if (!address.provinceCode || !address.districtCode || !address.wardCode) {
      setShippingError('Không thể tính phí vận chuyển do thiếu thông tin địa chỉ');
      setCalculatedShipping(32000);
      updateShipping(32000);
      return;
    }
    try {
      const totalWeight = calculateTotalWeight();
      let provinceCode = address.provinceCode;
      let districtCode = address.districtCode;
      let wardCode = address.wardCode;

      if (provinceCode === 'HCM') provinceCode = '2';
      else if (provinceCode === 'HNI') provinceCode = '1';

      if (districtCode && isNaN(Number(districtCode))) {
        if (provinceCode === '2') districtCode = '43';
        else districtCode = '14';
      }
      if (wardCode && isNaN(Number(wardCode))) wardCode = '0';

      let senderProvinceCode: number | null = null;
      let senderDistrictCode: number | null = null;
      const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
      const itemWithBranchId = selectedCartItems.find(item => item.selectedBranchId);

      if (itemWithBranchId && itemWithBranchId.selectedBranchId) {
        try {
          const response = await fetch(`/api/branches/${itemWithBranchId.selectedBranchId}`);
          if (response.ok) {
            const branchData = await response.json();
            if (branchData && branchData.provinceCode && branchData.districtCode) {
              if (branchData.provinceCode === 'HCM') senderProvinceCode = 2;
              else if (branchData.provinceCode === 'HNI') senderProvinceCode = 1;
              else senderProvinceCode = Number(branchData.provinceCode);
              senderDistrictCode = Number(branchData.districtCode);
            } else throw new Error('Thông tin chi nhánh không đầy đủ');
          } else throw new Error('Không thể lấy thông tin chi nhánh từ API');
        } catch (error) {
          console.error('Lỗi khi lấy thông tin chi nhánh:', error);
        }
      }

      const receiverProvinceCode = Number(provinceCode) || 2;
      const receiverDistrictCode = Number(districtCode) || 35;

      if (senderProvinceCode === null || senderDistrictCode === null) {
        toast.error('Không thể lấy thông tin chi nhánh. Vui lòng quay lại giỏ hàng và chọn chi nhánh khác.');
        setShippingError('Không thể tính phí vận chuyển do thiếu thông tin chi nhánh');
        setCalculatedShipping(32000);
        updateShipping(32000);
        return;
      }

      const shippingFeeData = {
        PRODUCT_WEIGHT: totalWeight,
        PRODUCT_PRICE: Math.max(selectedSubtotal - discount, 10000),
        MONEY_COLLECTION: Math.max(selectedSubtotal - discount, 10000),
        SENDER_PROVINCE: senderProvinceCode,
        SENDER_DISTRICT: senderDistrictCode,
        RECEIVER_PROVINCE: receiverProvinceCode,
        RECEIVER_DISTRICT: receiverDistrictCode,
        PRODUCT_TYPE: 'HH',
        TYPE: 1
      };

      const result = await calculateShippingFeeAll(shippingFeeData);
      if (result.success) {
        const shippingFee = typeof result.fee === 'number' ? result.fee : 32000; // Default if fee is not a number
        if (result.selectedServiceCode) setSelectedServiceCode(result.selectedServiceCode);
        
        // Ensure availableServices is an array before setting
        if (Array.isArray(result.availableServices) && result.availableServices.length > 0) {
          setAvailableServices(result.availableServices);
        } else {
          setAvailableServices([]); // Default to empty array if not valid
        }

        setCalculatedShipping(shippingFee);
        updateShipping(shippingFee);
        setShippingError(null);
      } else {
        setShippingError(result.error || 'Không thể tính phí vận chuyển');
        setCalculatedShipping(32000);
        updateShipping(32000);
        setAvailableServices([]);
      }
    } catch { // Remove unused error parameter
      console.error('Error calculating shipping fee');
      setShippingError('Có lỗi xảy ra khi tính phí vận chuyển');
      setCalculatedShipping(32000);
      updateShipping(32000);
      setAvailableServices([]);
    }
  }, [cartItems, selectedItems, selectedSubtotal, discount, calculateShippingFeeAll, updateShipping, calculateTotalWeight]);

  useEffect(() => {
    if (!cartLoading) {
      if (selectedItemCount === 0) {
        toast.info('Vui lòng chọn sản phẩm để thanh toán.');
        router.push('/cart');
        return;
      }
      const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
      const items: OrderItem[] = selectedCartItems.map(item => ({
        _id: item.variantId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        gifts: (item.availableGifts || [])
          .filter(gift => gift.image && gift.image.url && gift.image.alt)
          .map(gift => ({ ...gift, image: gift.image! }))
      }));
      setOrderItems(items);
      setIsLoading(false);
      if (shippingInfo && shippingInfo.provinceCode && shippingInfo.districtCode && shippingInfo.wardCode) {
        calculateShippingFeeForAddress(shippingInfo);
      }
    }
  }, [cartItems, selectedItems, selectedItemCount, cartLoading, router, itemCount, shippingInfo, calculateShippingFeeForAddress]);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (user && user._id) {
        try {
          if (user.addresses && user.addresses.length > 0) {
            const validAddresses = user.addresses.filter(addr => typeof addr._id === 'string') as UserAddress[];
            setUserAddresses(validAddresses);
            const defaultAddress = validAddresses.find(addr => addr.isDefault);
            if (defaultAddress && defaultAddress._id) {
                setSelectedAddressId(defaultAddress._id);
              const addressParts: string[] = defaultAddress.addressLine.split(',').map((part: string) => part.trim());
              const addressData: ShippingInfo = {
                fullName: user.name || '',
                phone: user?.phone || '',
                email: user.email || '',
                address: addressParts[0] || '',
                city: (defaultAddress as unknown as Record<string, unknown>)?.city as string || defaultAddress?.provinceName || '',
                district: addressParts.length > 2 ? addressParts[2] : (defaultAddress as unknown as Record<string, unknown>)?.districtName as string || (defaultAddress as unknown as Record<string, unknown>)?.district as string || '',
                ward: addressParts.length > 1 ? addressParts[1] : (defaultAddress as unknown as Record<string, unknown>)?.wardName as string || (defaultAddress as unknown as Record<string, unknown>)?.ward as string || '',
                notes: '',
                provinceId: defaultAddress.provinceCode,
                districtId: defaultAddress.districtCode,
                wardId: defaultAddress.wardCode,
                provinceName: defaultAddress?.provinceName || (defaultAddress as unknown as Record<string, unknown>)?.city as string || '',
                districtName: (defaultAddress as unknown as Record<string, unknown>)?.districtName as string || (defaultAddress as unknown as Record<string, unknown>)?.district as string || (defaultAddress as unknown as Record<string, unknown>)?.state as string || '',
                wardName: (defaultAddress as unknown as Record<string, unknown>)?.wardName as string || (defaultAddress as unknown as Record<string, unknown>)?.ward as string || '',
                provinceCode: defaultAddress.provinceCode,
                districtCode: defaultAddress.districtCode,
                wardCode: defaultAddress.wardCode
              };
              setShippingInfo(addressData);
              localStorage.setItem('shippingInfo', JSON.stringify(addressData));
            }
          } else {
            const savedShippingInfo = localStorage.getItem('shippingInfo');
            if (savedShippingInfo) {
              setShippingInfo(JSON.parse(savedShippingInfo));
            } else {
              setShowAddressForm(true);
              const initialShippingInfo: Partial<ShippingInfo> = {
                fullName: user.name || '',
                email: user.email || '',
                phone: user?.phone || ''
              };
              setShippingInfo(initialShippingInfo as ShippingInfo);
            }
          }
        } catch (error) {
          console.error('Error fetching user addresses:', error);
          toast.error('Không thể tải địa chỉ của bạn. Vui lòng thử lại sau.');
        }
      } else {
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

  const getSelectedBranchId = (): string => {
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
    const itemWithBranch = selectedCartItems.find(item => item.selectedBranchId);
    if (itemWithBranch && itemWithBranch.selectedBranchId) return itemWithBranch.selectedBranchId;
    return '67f4e29303d581f233241b76'; // Default branchId
  };
  
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      const addressParts: string[] = selectedAddress.addressLine.split(',').map((part: string) => part.trim());
      let provinceCode = selectedAddress.provinceCode;
      if (provinceCode === 'HCM') provinceCode = '2'; else if (provinceCode === 'HNI') provinceCode = '1';
      let districtCode = selectedAddress.districtCode;
      if (districtCode && isNaN(Number(districtCode))) { if (provinceCode === '2') districtCode = '43'; else districtCode = '14';}
      let wardCode = selectedAddress.wardCode;
      if (wardCode && isNaN(Number(wardCode))) wardCode = '0';
      const addressData: ShippingInfo = {
        fullName: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        address: addressParts[0] || '',
        city: (selectedAddress as unknown as Record<string, unknown>)?.city as string || selectedAddress.provinceName || '',
        district: addressParts.length > 2 ? addressParts[2] : (selectedAddress as unknown as Record<string, unknown>)?.districtName as string || (selectedAddress as unknown as Record<string, unknown>)?.district as string || '',
        ward: addressParts.length > 1 ? addressParts[1] : (selectedAddress as unknown as Record<string, unknown>)?.wardName as string || (selectedAddress as unknown as Record<string, unknown>)?.ward as string || '',
        notes: '',
        provinceId: selectedAddress.provinceCode,
        districtId: selectedAddress.districtCode,
        wardId: selectedAddress.wardCode,
        provinceName: selectedAddress.provinceName || (selectedAddress as unknown as Record<string, unknown>)?.city as string || '',
        districtName: (selectedAddress as unknown as Record<string, unknown>)?.districtName as string || (selectedAddress as unknown as Record<string, unknown>)?.state as string || '',
        wardName: (selectedAddress as unknown as Record<string, unknown>)?.wardName as string || '',
        provinceCode: provinceCode,
        districtCode: districtCode,
        wardCode: wardCode
      };
      setShippingInfo(addressData);
      localStorage.setItem('shippingInfo', JSON.stringify(addressData));
      setErrorMessage(null);
      calculateShippingFeeForAddress(addressData);
    }
  };

  const handleAddNewAddress = () => {
    if (selectedAddressId) setSelectedAddressId(null);
    setShowAddressForm(true);
    setEditingAddressId(null);
  };

  const handleEditAddress = (addressId: string) => {
    setEditingAddressId(addressId);
    setShowAddressForm(true);
    setSelectedAddressId(null);
    const addressToEdit = userAddresses.find(addr => addr._id === addressId);
    if (addressToEdit) {
      const convertedAddress = convertAddressToShippingInfo(addressToEdit);
      setShippingInfo(convertedAddress);
      setTimeout(() => {
        const formElement = document.querySelector('.shipping-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleShippingInfoSubmit = (values: ShippingInfo) => {
    setShippingInfo(values);
    if (user && user._id) saveAddressToAccount(values);
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const saveAddressToAccount = async (addressData: ShippingInfo) => {
    try {
      const formattedAddress: Partial<AddressApiResponse> = {
        addressLine: `${addressData.address}, ${addressData.ward}, ${addressData.district}`,
        city: addressData.city || addressData.provinceName || '',
        state: addressData.district || addressData.districtName || '',
        country: 'Việt Nam',
        postalCode: '',
        isDefault: userAddresses.length === 0,
        provinceCode: addressData.provinceCode || '1',
        districtCode: addressData.districtCode || '4',
        wardCode: addressData.wardCode || '0',
        provinceName: addressData.provinceName || addressData.city || '',
        districtName: addressData.districtName || addressData.district || '',
        wardName: addressData.wardName || addressData.ward || ''
      };
      let updatedUser: UserApiResponse | undefined;
      if (editingAddressId) {
        formattedAddress._id = editingAddressId;
        updatedUser = await UserApiService.updateAddress(editingAddressId, formattedAddress as unknown as Parameters<typeof UserApiService.updateAddress>[1]) as unknown as UserApiResponse;
        toast.success('Đã cập nhật địa chỉ thành công');
      } else {
        updatedUser = await UserApiService.addAddress(formattedAddress as unknown as Parameters<typeof UserApiService.addAddress>[0]) as unknown as UserApiResponse;
        toast.success('Đã thêm địa chỉ mới vào tài khoản của bạn');
      }
      if (updatedUser && updatedUser.addresses) {
        const convertedAddresses: UserAddress[] = updatedUser.addresses.map((addr: AddressApiResponse) => ({
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
          setSelectedAddressId(editingAddressId);
        } else {
          const newAddress = convertedAddresses[convertedAddresses.length - 1];
          if (newAddress) setSelectedAddressId(newAddress._id);
        }
        setShowAddressForm(false);
      }
    } catch (error) {
      console.error('Error saving address to account:', error);
      toast.error('Không thể lưu địa chỉ vào tài khoản. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    if (shippingInfo && shippingInfo.provinceCode && shippingInfo.districtCode && shippingInfo.wardCode) {
      calculateShippingFeeForAddress(shippingInfo);
    }
  }, [shippingInfo, calculateShippingFeeForAddress]);

  const handleSelectShippingService = (serviceCode: string, fee: number) => {
    setSelectedServiceCode(serviceCode);
    setCalculatedShipping(fee);
    updateShipping(fee);
    const selectedService = availableServices.find(service => service.serviceCode === serviceCode);
    if (selectedService) toast.success(`Đã chọn dịch vụ vận chuyển: ${selectedService.serviceName}`);
  };

  const handlePlaceOrder = async () => {
    if (!shippingInfo) {
      setErrorMessage('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng');
      toast.error('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng');
      const shippingFormElement = document.querySelector('.shipping-form');
      if (shippingFormElement) shippingFormElement.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!paymentMethod) {
      setErrorMessage('Vui lòng chọn phương thức thanh toán');
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }
    if (selectedItemCount === 0) {
      toast.error('Vui lòng chọn sản phẩm để thanh toán.');
      router.push('/cart');
      return;
    }
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const selectedUserAddress = selectedAddressId ? userAddresses.find(addr => addr._id === selectedAddressId) : null;
      const shippingAddress: ShippingAddress = {
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        addressLine1: shippingInfo.address,
        province: shippingInfo.city || shippingInfo.provinceName || '',
        district: shippingInfo.district || shippingInfo.districtName || '',
        ward: shippingInfo.ward || shippingInfo.wardName || '',
        provinceCode: selectedUserAddress?.provinceCode || shippingInfo.provinceCode || '',
        districtCode: selectedUserAddress?.districtCode || shippingInfo.districtCode || '',
        wardCode: selectedUserAddress?.wardCode || shippingInfo.wardCode || ''
      };
      if (!shippingAddress.provinceCode || !shippingAddress.districtCode || !shippingAddress.wardCode) {
        shippingAddress.provinceCode = '1'; shippingAddress.districtCode = '14'; shippingAddress.wardCode = '0';
      }
      if (shippingAddress.provinceCode === 'HCM') shippingAddress.provinceCode = '2';
      else if (shippingAddress.provinceCode === 'HNI') shippingAddress.provinceCode = '1';
      if (shippingAddress.districtCode && isNaN(Number(shippingAddress.districtCode))) {
        if (shippingAddress.provinceCode === '2') shippingAddress.districtCode = '43'; else shippingAddress.districtCode = '14';
      }
      if (shippingAddress.wardCode && isNaN(Number(shippingAddress.wardCode))) shippingAddress.wardCode = '0';
      
      const selectedBranchId = getSelectedBranchId();
      const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
      const itemsWithoutBranch = selectedCartItems.filter(item => !item.selectedBranchId);
      if (itemsWithoutBranch.length > 0) {
        toast.error(`Sản phẩm "${itemsWithoutBranch[0].name}" chưa chọn chi nhánh. Vui lòng quay lại giỏ hàng để chọn chi nhánh.`);
        setIsProcessing(false);
        return;
      }
      const orderData: CreateOrderDto = {
        items: selectedCartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId || '',
          name: item.name,
          image: item.image?.url,
          quantity: item.quantity,
          price: item.price,
          options: item.selectedOptions || {}
        })),
        subtotal: selectedSubtotal,
        tax: 0,
        shippingFee: shipping,
        totalPrice: total,
        finalPrice: total,
        shippingAddress,
        branchId: selectedBranchId,
        paymentMethod: paymentMethod as 'cod' | 'bank_transfer' | 'credit_card' | 'stripe' | 'momo',
        notes: shippingInfo.notes,
        shippingServiceCode: selectedServiceCode
      };
      if (voucherCode && discount > 0) {
        orderData.voucher = { voucherId: voucherId, code: voucherCode, discountAmount: discount };
      }
      localStorage.setItem('currentOrder', JSON.stringify(orderData));
      let result;
      if (paymentMethod === 'cod') {
        result = await createOrderWithCOD(orderData);
        if (result) {
          localStorage.setItem('orderNumber', result.orderNumber);
          localStorage.setItem('orderCreatedAt', result.createdAt);
          await clearCart();
          router.push('/payments/success');
        } else throw new Error('Không thể tạo đơn hàng');
      } else if (paymentMethod === 'credit_card' || paymentMethod === 'stripe') {
        result = await createOrderWithStripe(orderData);
        if (result && result.checkoutUrl) {
          // orderNumber is set by backend
          localStorage.setItem('orderCreatedAt', new Date().toISOString());
          window.location.href = result.checkoutUrl;
        } else throw new Error('Không thể tạo phiên thanh toán Stripe');
      } else if (paymentMethod === 'momo') {
        result = await createOrderWithMomo(orderData);
        if (result && result.payUrl) {
          router.push(`/payments/momo?payUrl=${encodeURIComponent(result.payUrl)}`);
        } else throw new Error('Không thể tạo đơn hàng với MoMo');
      } else throw new Error('Phương thức thanh toán chưa được hỗ trợ');
    } catch (error: unknown) {
      console.error('Lỗi khi đặt hàng:', error);
      setIsProcessing(false);
      const errMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.';
      setErrorMessage(errMessage);
      router.push('/payments/fail');
    }
  };

  const addressBeingEdited = editingAddressId ? userAddresses.find(addr => addr._id === editingAddressId) : null;

  const convertAddressToShippingInfo = (address: UserAddress): ShippingInfo => {
    return {
      fullName: user?.name || '',
      phone: user?.phone || '', 
      email: user?.email || '',
      address: address.addressLine,
      city: (address as unknown as Record<string, unknown>)?.city as string || address?.provinceName || '',
      district: (address as unknown as Record<string, unknown>)?.state as string || (address as unknown as Record<string, unknown>)?.districtName as string || '',
      ward: (address as unknown as Record<string, unknown>)?.wardName as string || '',
      notes: '',
      provinceId: address.provinceCode,
      districtId: address.districtCode,
      wardId: address.wardCode,
      provinceName: address.provinceName || (address as unknown as Record<string, unknown>)?.city as string || '',
      districtName: (address as unknown as Record<string, unknown>)?.districtName as string || (address as unknown as Record<string, unknown>)?.state as string || '',
      wardName: address.wardName || '',
      provinceCode: address.provinceCode,
      districtCode: address.districtCode,
      wardCode: address.wardCode
    };
  };

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
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-500" /></div>
                <div className="ml-3"><p className="text-sm text-red-700">{errorMessage}</p></div>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div><div className="space-y-4"><div className="h-10 bg-gray-200 rounded"></div><div className="h-10 bg-gray-200 rounded"></div><div className="h-10 bg-gray-200 rounded"></div></div></div>
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div><div className="space-y-4"><div className="h-16 bg-gray-200 rounded"></div><div className="h-16 bg-gray-200 rounded"></div><div className="h-16 bg-gray-200 rounded"></div></div></div>
              </div>
              <div className="lg:col-span-1"><div className="bg-white rounded-lg shadow-sm p-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div><div className="h-40 bg-gray-200 rounded mb-4"></div><div className="space-y-3 mb-6"><div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-4 bg-gray-200 rounded w-1/4"></div></div><div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-1/4"></div><div className="h-4 bg-gray-200 rounded w-1/5"></div></div><div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-4 bg-gray-200 rounded w-1/4"></div></div><div className="pt-3 flex justify-between"><div className="h-5 bg-gray-200 rounded w-1/4"></div><div className="h-5 bg-gray-200 rounded w-1/3"></div></div></div><div className="h-10 bg-gray-200 rounded"></div></div></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 shipping-form">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>
                  {userAddresses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-medium text-gray-700">Địa chỉ của tôi</h3>
                        <button type="button" onClick={handleAddNewAddress} className="text-sm text-pink-600 hover:text-pink-700 flex items-center"><FiPlus className="mr-1" />Thêm địa chỉ mới</button>
                      </div>
                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <div key={address._id} className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedAddressId === address._id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`} onClick={() => handleSelectAddress(address._id)}>
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{user?.name}</p>
                                <p className="text-sm text-gray-600"><span className="font-medium">Điện thoại:</span> {user?.phone || 'Chưa có số điện thoại'}</p>
                                <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Địa chỉ:</span> {address.addressLine}{address.city && `, ${address.city}`}{address.country && `, ${address.country}`}{address.postalCode && ` - ${address.postalCode}`}</p>
                              </div>
                              <div className="flex items-center">
                                {selectedAddressId === address._id && (<div className="flex-shrink-0 h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center mr-2"><FiCheck className="text-white" /></div>)}
                                {address.isDefault && selectedAddressId !== address._id && (<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mr-2">Mặc định</span>)}
                                <button type="button" className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); handleEditAddress(address._id);}}><FiEdit className="mr-1 inline-block" />Sửa</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(userAddresses.length === 0 || showAddressForm) && (
                    <div className={`${editingAddressId ? 'border-2 border-blue-500 p-4 rounded-lg bg-blue-50 transition-all animate-pulse' : ''}`} ref={(el) => { if (el && editingAddressId) { setTimeout(() => { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => { el.classList.remove('animate-pulse'); }, 1000); }, 100);}}}>
                      {editingAddressId && (<div className="mb-4 bg-blue-100 p-3 rounded text-blue-700 font-medium flex items-center"><FiEdit className="mr-2" />Đang chỉnh sửa địa chỉ. Vui lòng cập nhật thông tin bên dưới.</div>)}
                      <ShippingForm initialValues={editingAddressId && addressBeingEdited ? convertAddressToShippingInfo(addressBeingEdited) : (shippingInfo || undefined)} onSubmit={handleShippingInfoSubmit} showSubmitButton={true} />
                    </div>
                  )}
                  {shippingInfo && selectedAddressId && !showAddressForm && (
                    <div className="mt-4 lg:hidden">
                      <button type="button" onClick={handlePlaceOrder} disabled={isProcessing} className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700 transition-colors'}`}>
                        {isProcessing ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Đang xử lý...</>) : (<>Đặt hàng</>)}
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <PaymentMethods selectedMethod={paymentMethod} onSelectMethod={setPaymentMethod} />
                </div>
              </div>
              <div className="lg:col-span-1">
                <OrderSummary items={orderItems} subtotal={selectedSubtotal} discount={discount} shipping={shipping} total={total} voucherCode={voucherCode} shippingError={shippingError} calculatedShipping={calculatedShipping} availableServices={availableServices} selectedServiceCode={selectedServiceCode} onSelectShippingService={handleSelectShippingService} onPlaceOrder={handlePlaceOrder} isProcessing={isProcessing} />
              </div>
            </div>
          )}
        </div>
      </main>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </DefaultLayout>
  );
};

export default PaymentsPage;
