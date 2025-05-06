import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/user/cart/CartContext';

// Components
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import VoucherListModal from '@/components/cart/VoucherListModal';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';

// Hooks
import { useBranches } from '@/hooks/useBranches';
import { useUserVoucher } from '@/hooks/useUserVoucher';

import { CartProduct } from '@/contexts/user/cart/CartContext';

// Mở rộng CartProduct để bao gồm branchName
interface ExtendedCartProduct extends CartProduct {
  branchInventory?: Array<{ branchId: string; quantity: number; branchName?: string }>;
}

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý
interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  inStock: boolean;
}

const CartPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cartItems,
    isLoading,
    error,
    subtotal,
    itemCount,
    discount,
    shipping,
    total,
    voucherCode,
    debouncedUpdateCartItem,
    removeCartItem,
    applyVoucher,
    clearVoucher
  } = useCart();

  // Sử dụng hook branches để lấy thông tin chi nhánh
  const { branches, loading: branchesLoading } = useBranches();

  // State for page loading and voucher modal
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Sử dụng hook useUserVoucher để lấy danh sách voucher
  const {
    fetchApplicableVouchers,
    fetchUnavailableVouchers,
    availableVouchers,
    unavailableVouchers
  } = useUserVoucher();

  // Cập nhật trạng thái loading
  useEffect(() => {
    if (!isLoading && !branchesLoading) {
      setIsPageLoading(false);
    }
  }, [isLoading, branchesLoading]);

  // Lấy danh sách voucher khi giỏ hàng thay đổi
  useEffect(() => {
    if (cartItems.length > 0 && !isLoading) {
      const productIds = cartItems.map(item => item.productId);
      // Chỉ cần gọi một hàm này sẽ tự động cập nhật cả availableVouchers và unavailableVouchers
      fetchApplicableVouchers(subtotal, productIds);
    }
  }, [cartItems, subtotal, isLoading, fetchApplicableVouchers]);

  // State for recommended products
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);

  // Fetch recommended products
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/recommended?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setRecommendedProducts(data.data || []);
        }
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm gợi ý:', error);
      }
    };
    fetchRecommended();
  }, []);



  // Xử lý cập nhật số lượng sản phẩm
  const handleUpdateQuantity = (itemId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string) => {
    debouncedUpdateCartItem(itemId, quantity, showToast, selectedBranchId);
  };

  // Xử lý xóa sản phẩm khỏi giỏ hàng - Use context function
  const handleRemoveItem = (itemId: string) => {
    removeCartItem(itemId);
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyVoucher = async (code: string) => {
    const success = await applyVoucher(code);
    if (success) {
      setShowVoucherModal(false); // Đóng modal nếu áp dụng thành công
    } else {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
    }
  };

  // Xử lý hiển thị modal voucher
  const handleShowVoucherModal = () => {
    setShowVoucherModal(true);
  };

  // Xử lý đóng modal voucher
  const handleCloseVoucherModal = () => {
    setShowVoucherModal(false);
  };

  // Xử lý nút thanh toán
  const handleProceedToCheckout = () => {
    if (itemCount === 0) {
        toast.warn('Giỏ hàng của bạn đang trống.');
        return;
    }
    // Check if any item is out of stock
    const outOfStockItems = cartItems.filter(item => !item.inStock);
    if (outOfStockItems.length > 0) {
        toast.error(`Sản phẩm "${outOfStockItems[0].name}" đã hết hàng. Vui lòng xóa khỏi giỏ hàng để tiếp tục.`);
        return;
    }

    // Kiểm tra xem có sản phẩm nào chưa chọn chi nhánh không
    const itemsWithoutBranch = cartItems.filter(item => !item.selectedBranchId);
    if (itemsWithoutBranch.length > 0) {
        toast.error(`Sản phẩm "${itemsWithoutBranch[0].name}" chưa chọn chi nhánh. Vui lòng chọn chi nhánh để tiếp tục.`);
        return;
    }

    // Thêm thông báo thành công khi chuyển trang
    toast.success('Đang chuyển đến trang thanh toán...', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        style: { backgroundColor: '#f0fff4', color: '#22543d', borderLeft: '4px solid #22543d' }
    });

    router.push('/payments'); // Navigate to payments page
  };



  // Define interface for grouped cart items
  interface CartItemGroup {
    branchId: string;
    branchName: string;
    address?: string;
    items: ExtendedCartProduct[];
  }



  // Group cart items by branch
  const groupedCartItems = React.useMemo<CartItemGroup[]>(() => {
    // Create a map to store items by branch
    const branchMap = new Map<string, CartItemGroup>();

    // Add a "No Branch" group for items without a branch
    branchMap.set('no-branch', {
      branchId: 'no-branch',
      branchName: 'Sản phẩm chưa chọn chi nhánh',
      items: []
    });

    // Group items by branch
    cartItems.forEach(item => {
      if (item.selectedBranchId) {
        // Find branch from API data
        const branch = branches.find(b => b._id === item.selectedBranchId);

        // Find branch name from item's branchInventory as fallback
        const branchInfo = item.branchInventory?.find(b => b.branchId === item.selectedBranchId);
        let branchNameStr = `Chi nhánh ${item.selectedBranchId.substring(0, 6)}...`;

        if (branch?.name) {
          branchNameStr = branch.name;
        } else if (branchInfo && 'branchName' in branchInfo && typeof branchInfo.branchName === 'string') {
          branchNameStr = branchInfo.branchName;
        }

        // Check if this branch already exists in the map
        if (!branchMap.has(item.selectedBranchId)) {
          branchMap.set(item.selectedBranchId, {
            branchId: item.selectedBranchId,
            branchName: branch?.name || branchNameStr,
            address: branch?.address || '',
            items: []
          });
        }

        // Add item to the branch group
        branchMap.get(item.selectedBranchId)!.items.push(item);
      } else {
        // Add item to the "No Branch" group
        branchMap.get('no-branch')!.items.push(item);
      }
    });

    // Convert map to array and filter out empty groups
    return Array.from(branchMap.values())
      .filter(group => group.items.length > 0);
  }, [cartItems, branches]);

  // Render UI
  return (
    <DefaultLayout>
      <Head>
        <title>Giỏ hàng | YUMIN Beauty</title>
        <meta name="description" content="Giỏ hàng của bạn tại YUMIN Beauty - Mỹ phẩm chính hãng" />
      </Head>



      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng</h1>

          {/* Display general error message from context */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {isPageLoading ? (
            // Loading state
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : itemCount === 0 ? ( // Use itemCount from context
            // Empty cart
            <EmptyCart />
          ) : (
            // Cart with items
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                {groupedCartItems.map(group => (
                  <div key={group.branchId} className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4">
                    <div className="mb-4 pb-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {group.branchId === 'no-branch' ? (
                            <span className="text-gray-700">Sản phẩm chưa chọn chi nhánh</span>
                          ) : (
                            <div className="flex flex-col">
                              <div className="flex items-center bg-pink-50 px-3 py-1.5 rounded-md">
                                <span className="text-pink-600 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <span className="text-pink-700">{group.branchName}</span>
                              </div>
                              {group.address && (
                                <span className="text-xs text-gray-500 mt-1 ml-7">{group.address}</span>
                              )}
                            </div>
                          )}
                        </h2>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium">
                          {group.items.length} sản phẩm
                        </span>
                      </div>
                    </div>

                    {/* List of cart items in this branch */}
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <CartItem
                          key={item._id} // key vẫn là item._id (unique CartProduct ID)
                          _id={item._id} // Truyền item._id (unique CartProduct ID) cho prop _id của CartItem
                          productId={item.productId}
                          variantId={item.variantId} // Vẫn truyền actual variantId cho prop variantId
                          name={item.name}
                          slug={item.slug}
                          image={item.image}
                          brand={item.brand}
                          price={item.price}
                          originalPrice={item.originalPrice}
                          quantity={item.quantity}
                          selectedOptions={item.selectedOptions}
                          inStock={item.inStock}
                          maxQuantity={item.maxQuantity}
                          branchInventory={item.branchInventory || []}
                          selectedBranchId={item.selectedBranchId}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary Section */}
              <div className="lg:col-span-1">
                <CartSummary
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                  itemCount={itemCount}
                  voucherCode={voucherCode}
                  onApplyVoucher={handleApplyVoucher}
                  onProceedToCheckout={handleProceedToCheckout}
                  onClearVoucher={clearVoucher}
                  onShowVoucherList={handleShowVoucherModal}
                />
              </div>
            </div>
          )}

          {/* Voucher List Modal */}
          <VoucherListModal
            isOpen={showVoucherModal}
            onClose={handleCloseVoucherModal}
            availableVouchers={availableVouchers}
            unavailableVouchers={unavailableVouchers}
            onSelectVoucher={handleApplyVoucher}
            appliedVoucherCode={voucherCode}
            subtotal={subtotal}
            currentUserLevel={user?.customerLevel || ''}
          />

          {/* Recommended Products Section */}

          {!isLoading && recommendedProducts.length > 0 && (
            <div className="mt-16">
              <RecommendedProducts
                products={recommendedProducts as any[]}
              />
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CartPage;
