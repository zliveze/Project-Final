import { useState, useCallback } from 'react'; // Thêm useCallback
import { ProductFormData, InventoryItem, BranchItem, VariantInventoryItem, ProductVariant } from '../types';

// Helper function to calculate total inventory based on provided form data
const calculateTotalInventory = (data: ProductFormData): number => {
  const hasVariants = Array.isArray(data.variants) && data.variants.length > 0;

  if (hasVariants) {
    if (data.variantInventory && Array.isArray(data.variantInventory) && data.variantInventory.length > 0) {
      return data.variantInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    return 0;
  } else {
    if (!data.inventory || !Array.isArray(data.inventory)) {
      return 0;
    }
    return data.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
};


/**
 * Hook quản lý tồn kho sản phẩm
 */
export const useProductInventory = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>,
  branches: BranchItem[] = [] // Thêm tham số branches với giá trị mặc định là mảng rỗng
) => {
  // State hiển thị modal chọn chi nhánh
  const [showBranchModal, setShowBranchModal] = useState(false);

  // State danh sách chi nhánh có thể thêm vào
  const [availableBranches, setAvailableBranches] = useState<BranchItem[]>([]);

  // State cho chi nhánh đang được chọn để quản lý tồn kho biến thể
  const [selectedBranchForVariants, setSelectedBranchForVariants] = useState<string | null>(null);

  // State cho danh sách biến thể của chi nhánh đang chọn
  const [branchVariants, setBranchVariants] = useState<(ProductVariant & {quantity: number})[]>([]);

  /**
   * Kiểm tra xem sản phẩm có biến thể hay không
   */
  const hasVariants = (): boolean => {
    return Array.isArray(formData.variants) && formData.variants.length > 0;
  };

  /**
   * Cập nhật thông tin tồn kho (cho phép cập nhật số lượng trực tiếp nếu không có biến thể)
   */
  const handleInventoryChange = (index: number, field: string, value: any) => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) return;

    // Nếu là trường quantity và sản phẩm có biến thể, không cho phép cập nhật trực tiếp
    if (field === 'quantity' && hasVariants()) {
      console.warn('Không thể cập nhật trực tiếp số lượng tồn kho chi nhánh. Số lượng được tính từ tổng các biến thể.');
      return;
    }

    const updatedInventory = [...formData.inventory];
    updatedInventory[index] = {
      ...updatedInventory[index],
      [field]: field === 'lowStockThreshold' || field === 'quantity' ? parseInt(value) : value
    };

    setFormData(prev => {
      const nextFormData = { ...prev, inventory: updatedInventory };
      const totalInventory = calculateTotalInventory(nextFormData);
      // Sử dụng 'active' thay vì 'selling' cho trạng thái còn hàng
      const newStatus = totalInventory > 0 ? 'active' : 'out_of_stock';
      console.log(`[handleInventoryChange] Total Inventory: ${totalInventory}, New Status: ${newStatus}`);
      // Đảm bảo kiểu trả về khớp với ProductFormData
      return { ...nextFormData, status: newStatus as ProductFormData['status'] };
    });
  };

  /**
   * Xóa một mục tồn kho
   */
  const handleRemoveInventory = (index: number) => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) return;

    const updatedInventory = [...formData.inventory];
    updatedInventory.splice(index, 1);

    setFormData(prev => {
      const nextFormData = { ...prev, inventory: updatedInventory };
      const totalInventory = calculateTotalInventory(nextFormData);
      const newStatus = totalInventory > 0 ? 'active' : 'out_of_stock';
      console.log(`[handleRemoveInventory] Total Inventory: ${totalInventory}, New Status: ${newStatus}`);
      return { ...nextFormData, status: newStatus as ProductFormData['status'] };
    });
  };

  /**
   * Tính toán số lượng tồn kho cho chi nhánh dựa trên các biến thể
   */
  const calculateBranchInventory = (branchId: string): number => {
    // Nếu sản phẩm không có biến thể, trả về 0 để cho phép nhập trực tiếp
    if (!hasVariants()) {
      return 0;
    }

    // Nếu không có dữ liệu tồn kho biến thể, trả về 0
    if (!formData.variantInventory || !Array.isArray(formData.variantInventory)) {
      return 0;
    }

    // Lọc các mục tồn kho biến thể thuộc chi nhánh này
    const branchVariantInventory = formData.variantInventory.filter(
      item => item.branchId === branchId
    );

    // Tổng hợp số lượng
    return branchVariantInventory.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  /**
   * Thêm chi nhánh mới vào danh sách tồn kho
   */
  const handleAddBranch = (branchId: string, branchName: string) => {
    // Đảm bảo branchName không rỗng
    const validBranchName = branchName || 'Chi nhánh không xác định';
    console.log(`Thêm chi nhánh: ID=${branchId}, Tên=${validBranchName}`);

    // Nếu danh sách tồn kho chưa tồn tại, tạo mới
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      const newInventoryItem: InventoryItem = {
        branchId,
        branchName: validBranchName,
        quantity: calculateBranchInventory(branchId), // Tính tồn kho từ biến thể
        lowStockThreshold: 5
      };
      setFormData(prev => {
        const nextFormData = { ...prev, inventory: [newInventoryItem] };
        const totalInventory = calculateTotalInventory(nextFormData);
        const newStatus = totalInventory > 0 ? 'active' : 'out_of_stock';
        console.log(`[handleAddBranch - new] Total Inventory: ${totalInventory}, New Status: ${newStatus}`);
        return { ...nextFormData, status: newStatus as ProductFormData['status'] };
      });
      return;
    }

    const updatedInventory = [...formData.inventory];

    // Kiểm tra xem chi nhánh đã tồn tại trong danh sách chưa
    const existingIndex = updatedInventory.findIndex(item => item.branchId === branchId);
    if (existingIndex >= 0) {
      // Nếu đã tồn tại, thông báo và không thêm
      alert(`Chi nhánh "${validBranchName}" đã tồn tại trong danh sách!`);
      return;
    }

    // Tính toán số lượng tồn kho ban đầu dựa trên các biến thể đã có
    const initialQuantity = calculateBranchInventory(branchId);

    // Thêm chi nhánh mới vào danh sách
    updatedInventory.push({
      branchId,
      branchName: validBranchName,
      quantity: initialQuantity,
      lowStockThreshold: 5
    });

    setFormData(prev => {
      const nextFormData = { ...prev, inventory: updatedInventory };
      const totalInventory = calculateTotalInventory(nextFormData);
      const newStatus = totalInventory > 0 ? 'active' : 'out_of_stock';
      console.log(`[handleAddBranch - existing] Total Inventory: ${totalInventory}, New Status: ${newStatus}`);
      return { ...nextFormData, status: newStatus as ProductFormData['status'] };
    });
  };

  /**
   * Mở modal chọn chi nhánh để thêm
   */
  const handleShowBranchModal = (branches: BranchItem[]) => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      setAvailableBranches(branches);
    } else {
      // Lọc ra các chi nhánh chưa có trong danh sách tồn kho
      const existingBranchIds = formData.inventory.map(item => item.branchId);
      const filteredBranches = branches.filter(branch => !existingBranchIds.includes(branch.id));
      setAvailableBranches(filteredBranches);
    }

    setShowBranchModal(true);
  };

  /**
   * Đóng modal chi nhánh
   */
  const handleCloseBranchModal = () => {
    setShowBranchModal(false);
  };

  /**
   * Tính tổng tồn kho dựa trên tổng số lượng của tất cả biến thể trong tất cả chi nhánh
   */
  const getTotalInventory = (): number => {
    // Kiểm tra xem sản phẩm có biến thể hay không
    if (hasVariants()) {
      // Nếu có biến thể, tính tổng từ tồn kho biến thể
      if (formData.variantInventory && Array.isArray(formData.variantInventory) && formData.variantInventory.length > 0) {
        return formData.variantInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      return 0; // Có biến thể nhưng chưa có tồn kho biến thể
    } else {
      // Nếu không có biến thể, sử dụng tồn kho chi nhánh
      if (!formData.inventory || !Array.isArray(formData.inventory)) {
        return 0;
      }
      return formData.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
  };

  /**
   * Đếm số chi nhánh còn hàng dựa trên tồn kho biến thể hoặc tồn kho chi nhánh
   */
  const getInStockBranchesCount = (): number => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return 0;
    }

    // Kiểm tra xem sản phẩm có biến thể hay không
    if (hasVariants()) {
      // Tạo một map để tính tổng số lượng cho mỗi chi nhánh
      const branchQuantities = new Map<string, number>();

      // Nếu có biến thể, tính tồn kho từ biến thể
      if (formData.variantInventory && Array.isArray(formData.variantInventory) && formData.variantInventory.length > 0) {
        formData.variantInventory.forEach(item => {
          const branchId = item.branchId;
          const currentQuantity = branchQuantities.get(branchId) || 0;
          branchQuantities.set(branchId, currentQuantity + (item.quantity || 0));
        });

        // Đếm số chi nhánh có tồn kho > 0
        let count = 0;
        formData.inventory.forEach(item => {
          const quantity = branchQuantities.get(item.branchId) || 0;
          if (quantity > 0) count++;
        });

        return count;
      }
      return 0; // Có biến thể nhưng chưa có tồn kho biến thể
    } else {
      // Nếu không có biến thể, sử dụng tồn kho chi nhánh
      return formData.inventory.filter(item => item.quantity > 0).length;
    }
  };

  /**
   * Đếm số chi nhánh sắp hết hàng dựa trên tồn kho biến thể hoặc tồn kho chi nhánh
   */
  const getLowStockBranchesCount = (): number => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return 0;
    }

    // Kiểm tra xem sản phẩm có biến thể hay không
    if (hasVariants()) {
      // Tạo một map để tính tổng số lượng cho mỗi chi nhánh
      const branchQuantities = new Map<string, number>();

      // Nếu có biến thể, tính tồn kho từ biến thể
      if (formData.variantInventory && Array.isArray(formData.variantInventory) && formData.variantInventory.length > 0) {
        formData.variantInventory.forEach(item => {
          const branchId = item.branchId;
          const currentQuantity = branchQuantities.get(branchId) || 0;
          branchQuantities.set(branchId, currentQuantity + (item.quantity || 0));
        });

        // Đếm số chi nhánh có tồn kho > 0 và <= ngưỡng cảnh báo
        let count = 0;
        formData.inventory.forEach(item => {
          const quantity = branchQuantities.get(item.branchId) || 0;
          // Thêm ?? 0 để xử lý trường hợp lowStockThreshold là undefined
          if (quantity > 0 && quantity <= (item.lowStockThreshold ?? 0)) count++;
        });

        return count;
      }
      return 0; // Có biến thể nhưng chưa có tồn kho biến thể
    } else {
      // Nếu không có biến thể, sử dụng tồn kho chi nhánh
      return formData.inventory.filter(item =>
        // Thêm ?? 0 để xử lý trường hợp lowStockThreshold là undefined
        item.quantity > 0 && item.quantity <= (item.lowStockThreshold ?? 0)
      ).length;
    }
  };

  /**
   * Chọn chi nhánh để quản lý tồn kho biến thể
   */
  const handleSelectBranchForVariants = (branchId: string) => {
    setSelectedBranchForVariants(branchId);

    // Tìm chi nhánh được chọn
    const selectedBranch = formData.inventory?.find(item => item.branchId === branchId);
    if (!selectedBranch) return;

    // Lấy danh sách biến thể và số lượng hiện tại của chúng
    // Thêm ?? [] để xử lý trường hợp formData.variants là undefined
    const variants = (formData.variants ?? []).map(variant => {
      // Tìm số lượng hiện tại của biến thể trong chi nhánh này
      const variantInventory = formData.variantInventory?.find(
        item => item.branchId === branchId && item.variantId === variant.variantId
      );

      // Tạo một bản sao của biến thể và thêm trường quantity
      // Sử dụng optional chaining (?.) cho variant.name và variant.options
      return {
        ...variant,
        variantId: variant.variantId || '',
        // Loại bỏ truy cập variant.name vì nó không tồn tại trong kiểu ProductVariant
        name: `Biến thể ${variant?.options?.color || ''} ${variant?.options?.sizes?.[0] || ''}`.trim(),
        quantity: variantInventory?.quantity || 0
      };
    });

    setBranchVariants(variants);

    // Cập nhật tồn kho chi nhánh dựa trên tổng số lượng biến thể
    const totalVariantQuantity = calculateBranchInventory(branchId);

    // Cập nhật số lượng tồn kho của chi nhánh
    const updatedInventory = [...(formData.inventory || [])];
    const branchIndex = updatedInventory.findIndex(item => item.branchId === branchId);

    if (branchIndex >= 0) {
      updatedInventory[branchIndex].quantity = totalVariantQuantity;

      setFormData(prev => ({
        ...prev,
        inventory: updatedInventory
      }));
    }
  };

  /**
   * Hủy chọn chi nhánh để quản lý tồn kho biến thể
   */
  const handleClearBranchSelection = () => {
    setSelectedBranchForVariants(null);
    setBranchVariants([]);
  };

  /**
   * Cập nhật số lượng tồn kho cho biến thể
   */
  const handleVariantInventoryChange = (variantId: string, quantity: number) => {
    if (!selectedBranchForVariants) return;

    // Get the old quantity for this variant
    const oldVariant = branchVariants.find(v => v.variantId === variantId);
    const oldQuantity = oldVariant ? oldVariant.quantity : 0;
    const quantityDifference = quantity - oldQuantity;

    // Cập nhật state branchVariants
    const updatedBranchVariants = branchVariants.map(variant => {
      if (variant.variantId === variantId) {
        // Chỉ cập nhật trường quantity, giữ nguyên các thuộc tính khác
        return { ...variant, quantity };
      }
      return variant;
    });
    setBranchVariants(updatedBranchVariants);

    // Cập nhật formData.variantInventory
    const updatedVariantInventory = [...(formData.variantInventory || [])];

    // Tìm xem đã có mục tồn kho cho biến thể này chưa
    const existingIndex = updatedVariantInventory.findIndex(
      item => item.branchId === selectedBranchForVariants && item.variantId === variantId
    );

    // Lấy tên chi nhánh
    let branchName = formData.inventory?.find(item => item.branchId === selectedBranchForVariants)?.branchName || '';

    // Nếu không tìm thấy tên chi nhánh trong inventory, tìm trong danh sách chi nhánh
    if (!branchName) {
      const branch = branches.find(b => b.id === selectedBranchForVariants);
      branchName = branch ? branch.name : 'Chi nhánh không xác định';
    }

    if (existingIndex >= 0) {
      // Cập nhật mục đã tồn tại
      updatedVariantInventory[existingIndex].quantity = quantity;
    } else {
      // Thêm mục mới
      updatedVariantInventory.push({
        branchId: selectedBranchForVariants,
        branchName,
        variantId,
        quantity,
        lowStockThreshold: 5
      });
    }

    // Tính toán lại tổng số lượng từ tất cả các biến thể trong chi nhánh
    const updatedInventory = [...(formData.inventory || [])];
    const branchIndex = updatedInventory.findIndex(item => item.branchId === selectedBranchForVariants);

    // Tính tổng số lượng mới của chi nhánh dựa trên tất cả các biến thể
    // Sử dụng updatedVariantInventory đã được cập nhật ở trên
    const branchVariantInventory = updatedVariantInventory.filter(
      item => item.branchId === selectedBranchForVariants
    );

    const newBranchTotal = branchVariantInventory.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    if (branchIndex >= 0) {
      // Cập nhật số lượng mới cho chi nhánh
      updatedInventory[branchIndex].quantity = newBranchTotal;
      console.log(`Cập nhật tồn kho chi nhánh: ${branchName}, Tổng số lượng mới: ${newBranchTotal}`);
    }

    setFormData(prev => {
      const nextFormData = {
        ...prev,
        variantInventory: updatedVariantInventory,
        inventory: updatedInventory
      };
      const totalInventory = calculateTotalInventory(nextFormData);
      const newStatus = totalInventory > 0 ? 'active' : 'out_of_stock';
      console.log(`[handleVariantInventoryChange] Total Inventory: ${totalInventory}, New Status: ${newStatus}`);
      return { ...nextFormData, status: newStatus as ProductFormData['status'] };
    });
  };

  return {
    showBranchModal,
    availableBranches,
    handleInventoryChange,
    handleRemoveInventory,
    handleAddBranch,
    handleShowBranchModal,
    handleCloseBranchModal,
    getTotalInventory,
    getInStockBranchesCount,
    getLowStockBranchesCount,
    hasVariants,
    // Variant inventory methods
    selectedBranchForVariants,
    branchVariants,
    handleSelectBranchForVariants,
    handleClearBranchSelection,
    handleVariantInventoryChange
  };
};

export default useProductInventory;
