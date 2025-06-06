import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFilter, FiX, FiSliders, FiRefreshCw, FiCalendar } from 'react-icons/fi';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface AdvancedSearchProps {
  placeholder?: string;
  filterGroups?: FilterGroup[];
  dateRange?: boolean;
  onSearch?: (values: SearchValues) => void;
  initialValues?: SearchValues;
  className?: string;
}

export interface SearchValues {
  searchTerm: string;
  filters: Record<string, string>;
  dateFrom?: string;
  dateTo?: string;
}

export default function AdvancedSearch({
  placeholder = "Tìm kiếm...",
  filterGroups = [],
  dateRange = false,
  onSearch,
  initialValues,
  className = ""
}: AdvancedSearchProps) {
  // State để quản lý giá trị tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState(initialValues?.searchTerm || '');
  const [filters, setFilters] = useState<Record<string, string>>(initialValues?.filters || {});
  const [dateFrom, setDateFrom] = useState(initialValues?.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialValues?.dateTo || '');
  
  // State để quản lý UI
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const datePopupRef = useRef<HTMLDivElement>(null);
  
  // Thiết lập số lượng bộ lọc đang hoạt động
  useEffect(() => {
    let count = 0;
    
    // Đếm các bộ lọc đã được áp dụng
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') count++;
    });
    
    // Kiểm tra nếu có phạm vi ngày được áp dụng
    if (dateFrom) count++;
    if (dateTo) count++;
    
    setActiveFilterCount(count);
  }, [filters, dateFrom, dateTo]);
  
  // Xử lý sự kiện click bên ngoài để đóng popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setShowFilterPopup(false);
      }
      if (datePopupRef.current && !datePopupRef.current.contains(event.target as Node)) {
        setShowDatePopup(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gửi giá trị tìm kiếm đến component cha
  const handleSubmitSearch = () => {
    if (onSearch) {
      // Loại bỏ khoảng trắng thừa trong từ khóa tìm kiếm
      const trimmedSearchTerm = searchTerm.trim();
      console.log('Submitting search with values:', {
        searchTerm: trimmedSearchTerm,
        filters,
        dateFrom,
        dateTo
      });
      
      // Thêm trạng thái đang tìm kiếm
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 1500); // Tự động tắt sau 1.5 giây
      
      // Thêm alert để debug (có thể bỏ sau khi sửa xong)
      if (trimmedSearchTerm && trimmedSearchTerm.length > 0) {
        alert(`Đang tìm kiếm: "${trimmedSearchTerm}" (đã cải thiện cách tìm kiếm)`);
      }
      
      onSearch({
        searchTerm: trimmedSearchTerm,
        filters,
        dateFrom,
        dateTo
      });
    }
  };
  
  // Xử lý gõ phím Enter để tìm kiếm
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitSearch();
    }
  };
  
  // Xử lý thay đổi giá trị bộ lọc
  const handleFilterChange = (groupId: string, value: string) => {
    const updatedFilters = { 
      ...filters,
      [groupId]: value
    };
    
    setFilters(updatedFilters);
    
    // Tự động gọi tìm kiếm khi thay đổi bộ lọc từ bên ngoài popup
    if (!showFilterPopup) {
      // Chỉ gọi onSearch nếu component đang hiển thị (không trong popup)
      onSearch?.({
        searchTerm,
        filters: updatedFilters,
        dateFrom,
        dateTo
      });
    }
  };
  
  // Xóa tất cả bộ lọc
  const clearAllFilters = () => {
    const emptyFilters: Record<string, string> = {};
    filterGroups.forEach(group => {
      emptyFilters[group.id] = 'all';
    });
    
    setFilters(emptyFilters);
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    
    if (onSearch) {
      onSearch({
        searchTerm: '',
        filters: emptyFilters,
        dateFrom: '',
        dateTo: ''
      });
    }
  };
  
  // Xử lý khi người dùng thay đổi giá trị ô input tìm kiếm
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Nếu xóa trắng ô tìm kiếm, tự động gửi tìm kiếm để reset
    if (value === '' && searchTerm !== '') {
      onSearch?.({
        searchTerm: '',
        filters,
        dateFrom,
        dateTo
      });
    }
  };

  // Xử lý khi người dùng nhấp vào nút tìm kiếm
  const handleSearchClick = () => {
    handleSubmitSearch();
  };

  // Xử lý khi người dùng nhấp vào nút xóa trong ô tìm kiếm
  const handleClearSearch = () => {
    setSearchTerm('');
    // Gửi tìm kiếm ngay khi xóa để reset kết quả
    onSearch?.({
      searchTerm: '',
      filters,
      dateFrom,
      dateTo
    });
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4 space-y-2 md:space-y-0">
        {/* Input tìm kiếm */}
        <div className="relative flex-grow md:max-w-md">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isSearchFocused ? 'text-pink-500' : 'text-gray-400'}`}>
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="pl-9 pr-10 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-9 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              onClick={handleClearSearch}
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-pink-600 transition-colors"
            onClick={handleSearchClick}
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 rounded-full border-t-transparent"></div>
            ) : (
              <FiSearch className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Nút bộ lọc */}
          {filterGroups.length > 0 && (
            <div className="relative">
              <button
                className={`flex items-center px-3 py-2 rounded-md border ${activeFilterCount > 0 ? 'bg-pink-50 border-pink-200 text-pink-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors`}
                onClick={() => setShowFilterPopup(!showFilterPopup)}
              >
                <FiFilter className="mr-1.5 w-3.5 h-3.5" />
                <span className="text-sm">Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 bg-pink-100 text-pink-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              {showFilterPopup && (
                <div
                  ref={filterPopupRef}
                  className="absolute z-10 right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 border border-gray-200"
                >
                  <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-medium text-gray-700 flex items-center text-sm">
                      <FiSliders className="mr-1.5 w-3.5 h-3.5" />
                      Lọc kết quả
                    </div>
                    <button
                      className="text-xs text-gray-500 hover:text-pink-600 transition-colors"
                      onClick={clearAllFilters}
                    >
                      Đặt lại
                    </button>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto pt-2">
                    {filterGroups.map((group) => (
                      <div key={group.id} className="px-3 py-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {group.label}
                        </label>
                        <select
                          className="w-full rounded-md border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                          value={filters[group.id] || 'all'}
                          onChange={(e) => handleFilterChange(group.id, e.target.value)}
                        >
                          {group.options.map((option) => (
                            <option key={option.id} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="px-3 py-2 border-t border-gray-100 mt-2 flex justify-end">
                    <button
                      className="px-3 py-1 bg-pink-600 text-white rounded-md text-xs hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      onClick={() => {
                        setShowFilterPopup(false);
                        handleSubmitSearch();
                      }}
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Nút chọn khoảng thời gian */}
          {dateRange && (
            <div className="relative">
              <button
                className={`flex items-center px-3 py-2 rounded-md border ${dateFrom || dateTo ? 'bg-pink-50 border-pink-200 text-pink-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors`}
                onClick={() => setShowDatePopup(!showDatePopup)}
              >
                <FiCalendar className="mr-1.5 w-3.5 h-3.5" />
                <span className="text-sm">Thời gian</span>
                {(dateFrom || dateTo) && (
                  <span className="ml-1.5 bg-pink-100 text-pink-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {(dateFrom && dateTo) ? '2' : '1'}
                  </span>
                )}
              </button>
              
              {showDatePopup && (
                <div
                  ref={datePopupRef}
                  className="absolute z-10 right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 border border-gray-200"
                >
                  <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-medium text-gray-700 flex items-center text-sm">
                      <FiCalendar className="mr-1.5 w-3.5 h-3.5" />
                      Khoảng thời gian
                    </div>
                    <button
                      className="text-xs text-gray-500 hover:text-pink-600 transition-colors"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                    >
                      Đặt lại
                    </button>
                  </div>
                  
                  <div className="px-3 py-2">
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        value={dateFrom}
                        onChange={(e) => {
                          const newDateFrom = e.target.value;
                          setDateFrom(newDateFrom);
                          
                          // Tự động gửi khi không trong popup
                          if (!showDatePopup) {
                            onSearch?.({
                              searchTerm,
                              filters,
                              dateFrom: newDateFrom,
                              dateTo
                            });
                          }
                        }}
                        max={dateTo || undefined}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        value={dateTo}
                        onChange={(e) => {
                          const newDateTo = e.target.value;
                          setDateTo(newDateTo);
                          
                          // Tự động gửi khi không trong popup
                          if (!showDatePopup) {
                            onSearch?.({
                              searchTerm,
                              filters,
                              dateFrom,
                              dateTo: newDateTo
                            });
                          }
                        }}
                        min={dateFrom || undefined}
                      />
                    </div>
                  </div>
                  
                  <div className="px-3 py-2 border-t border-gray-100 mt-2 flex justify-end">
                    <button
                      className="px-3 py-1 bg-pink-600 text-white rounded-md text-xs hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      onClick={() => {
                        setShowDatePopup(false);
                        handleSubmitSearch();
                      }}
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Nút làm mới */}
          {activeFilterCount > 0 && (
            <button
              className="flex items-center px-2 py-2 rounded-md text-gray-500 hover:text-pink-600 transition-colors"
              onClick={clearAllFilters}
              title="Đặt lại tất cả bộ lọc"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Hiển thị các bộ lọc đang hoạt động */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.keys(filters).map(key => {
            if (!filters[key] || filters[key] === 'all') return null;
            
            // Tìm label hiển thị cho bộ lọc
            const group = filterGroups.find(g => g.id === key);
            if (!group) return null;
            
            const option = group.options.find(o => o.value === filters[key]);
            if (!option) return null;
            
            return (
              <div key={key} className="bg-pink-50 text-pink-700 text-xs rounded-full px-2 py-1 flex items-center">
                <span className="font-medium mr-1">{group.label}:</span>
                <span>{option.label}</span>
                <button
                  className="ml-1 text-pink-600 hover:text-pink-800"
                  onClick={() => handleFilterChange(key, 'all')}
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          
          {dateFrom && (
            <div className="bg-pink-50 text-pink-700 text-xs rounded-full px-2 py-1 flex items-center">
              <span className="font-medium mr-1">Từ:</span>
              <span>{new Date(dateFrom).toLocaleDateString('vi-VN')}</span>
              <button
                className="ml-1 text-pink-600 hover:text-pink-800"
                onClick={() => setDateFrom('')}
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {dateTo && (
            <div className="bg-pink-50 text-pink-700 text-xs rounded-full px-2 py-1 flex items-center">
              <span className="font-medium mr-1">Đến:</span>
              <span>{new Date(dateTo).toLocaleDateString('vi-VN')}</span>
              <button
                className="ml-1 text-pink-600 hover:text-pink-800"
                onClick={() => setDateTo('')}
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {activeFilterCount > 0 && (
            <button
              className="text-xs text-gray-500 hover:text-pink-600 transition-colors underline px-1.5"
              onClick={clearAllFilters}
            >
              Xóa tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
