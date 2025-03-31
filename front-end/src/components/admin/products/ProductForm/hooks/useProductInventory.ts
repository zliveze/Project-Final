import { useState } from 'react';
import { ProductFormData, InventoryItem, BranchItem } from '../types';

/**
 * Hook quản lý tồn kho sản phẩm
 */
export const useProductInventory = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  // State hiển thị modal chọn chi nhánh
  const [showBranchModal, setShowBranchModal] = useState(false);
  
  // State danh sách chi nhánh có thể thêm vào
  const [availableBranches, setAvailableBranches] = useState<BranchItem[]>([]);

  /**
   * Cập nhật số lượng tồn kho
   */
  const handleInventoryChange = (index: number, field: string, value: any) => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) return;
    
    const updatedInventory = [...formData.inventory];
    updatedInventory[index] = {
      ...updatedInventory[index],
      [field]: field === 'quantity' || field === 'lowStockThreshold' ? parseInt(value) : value
    };
    
    setFormData(prev => ({
      ...prev,
      inventory: updatedInventory
    }));
  };

  /**
   * Xóa một mục tồn kho
   */
  const handleRemoveInventory = (index: number) => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) return;
    
    const updatedInventory = [...formData.inventory];
    updatedInventory.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      inventory: updatedInventory
    }));
  };

  /**
   * Thêm chi nhánh mới vào danh sách tồn kho
   */
  const handleAddBranch = (branchId: string, branchName: string) => {
    // Nếu danh sách tồn kho chưa tồn tại, tạo mới
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      setFormData(prev => ({
        ...prev,
        inventory: [{
          branchId,
          branchName,
          quantity: 0,
          lowStockThreshold: 5
        }]
      }));
      return;
    }
    
    const updatedInventory = [...formData.inventory];
    
    // Kiểm tra xem chi nhánh đã tồn tại trong danh sách chưa
    const existingIndex = updatedInventory.findIndex(item => item.branchId === branchId);
    if (existingIndex >= 0) {
      // Nếu đã tồn tại, thông báo và không thêm
      alert(`Chi nhánh "${branchName}" đã tồn tại trong danh sách!`);
      return;
    }
    
    // Thêm chi nhánh mới vào danh sách
    updatedInventory.push({
      branchId,
      branchName,
      quantity: 0,
      lowStockThreshold: 5
    });
    
    setFormData(prev => ({
      ...prev,
      inventory: updatedInventory
    }));
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
   * Tính tổng tồn kho
   */
  const getTotalInventory = (): number => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return 0;
    }
    
    return formData.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  /**
   * Đếm số chi nhánh còn hàng
   */
  const getInStockBranchesCount = (): number => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return 0;
    }
    
    return formData.inventory.filter(item => item.quantity > 0).length;
  };

  /**
   * Đếm số chi nhánh sắp hết hàng
   */
  const getLowStockBranchesCount = (): number => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return 0;
    }
    
    return formData.inventory.filter(item => 
      item.quantity > 0 && item.quantity <= item.lowStockThreshold
    ).length;
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
    getLowStockBranchesCount
  };
};

export default useProductInventory; 