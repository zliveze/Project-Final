import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { useCampaign, Campaign } from '@/contexts/CampaignContext';
import { createPortal } from 'react-dom';

interface VoucherCampaignsPopupProps {
  selectedCampaigns: string[];
  onCampaignsChange: (campaignIds: string[]) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const VoucherCampaignsPopup: React.FC<VoucherCampaignsPopupProps> = ({
  selectedCampaigns,
  onCampaignsChange,
  onClose,
  position
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedCampaigns));
  const [mounted, setMounted] = useState(false);

  // Use CampaignContext
  const { campaigns, isLoading, error, fetchCampaigns } = useCampaign();

  useEffect(() => {
    setMounted(true);
    // Only fetch if campaigns array is empty
    if (!campaigns || campaigns.length === 0) {
      fetchCampaigns(1, 100);
    }
    return () => setMounted(false);
  }, [campaigns, fetchCampaigns]);

  // Memoize transformed campaigns
  const transformedCampaigns = useMemo(() =>
    campaigns.map((campaign: Campaign) => ({
      _id: campaign._id,
      name: campaign.title,
      startDate: campaign.startDate,
      endDate: campaign.endDate
    }))
  , [campaigns]);

  // Memoize filtered campaigns
  const filteredCampaigns = useMemo(() =>
    transformedCampaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [transformedCampaigns, searchTerm]);

  // Memoize toggle handler
  const toggleCampaign = useCallback((campaignId: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(campaignId)) {
        newSelected.delete(campaignId);
      } else {
        newSelected.add(campaignId);
      }
      onCampaignsChange(Array.from(newSelected));
      return newSelected;
    });
  }, [onCampaignsChange]);

  // Memoize save handler
  const handleSave = useCallback(() => {
    onCampaignsChange(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onCampaignsChange, onClose]);

  // Memoize search handler
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.getElementById('voucher-campaigns-popup');
      if (popup && !popup.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const popupContent = (
    <div
      id="voucher-campaigns-popup"
      className="fixed bg-white rounded-lg shadow-xl w-[500px] max-h-[600px] flex flex-col transform transition-all duration-300"
      style={{
        top: position?.y || '50%',
        left: position?.x || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-pink-50 rounded-t-lg">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-2">
            <FiSearch className="text-pink-600 h-4 w-4" />
          </div>
          <h3 className="text-base font-medium text-gray-900">Chọn chiến dịch</h3>
        </div>
        <button
          onClick={onClose}
          className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-1.5 transition-colors"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            placeholder="Tìm kiếm chiến dịch..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Campaign List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Có lỗi xảy ra khi tải danh sách chiến dịch
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy chiến dịch phù hợp' : 'Chưa có chiến dịch nào'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign._id}
                onClick={() => toggleCampaign(campaign._id)}
                className={`flex items-center p-2 rounded-md border cursor-pointer transition-all duration-200 ${
                  selectedIds.has(campaign._id)
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {campaign.name}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {selectedIds.has(campaign._id) && (
                    <FiCheck className="h-4 w-4 text-pink-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        >
          Lưu thay đổi
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;

  // Render using portal
  return createPortal(
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-300" onClick={onClose} />
      {popupContent}
    </>,
    document.body
  );
};