import React, { useState, useEffect, useCallback } from 'react';
import { FiEye, FiMapPin, FiEdit, FiTrash } from 'react-icons/fi';
import { format } from 'date-fns';
import { useBranches } from '@/contexts/BranchContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/admin/common/Pagination';

interface BranchListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BranchList: React.FC<BranchListProps> = ({ onView, onEdit, onDelete }) => {
  const {
    branches,
    loading,
    pagination,
    fetchBranches
  } = useBranches();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      const filters: any = {};
      if (term.trim()) {
        filters.search = term.trim();
      }
      if (sortField && sortOrder) {
        filters.sort = `${sortField},${sortOrder}`;
      }
      fetchBranches(1, pagination.limit, filters);
      setIsSearching(false);
    }, 500),
    [sortField, sortOrder, pagination.limit, fetchBranches]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    const filters: any = {};
    if (sortField && sortOrder) {
      filters.sort = `${sortField},${sortOrder}`;
    }
    fetchBranches(1, pagination.limit, filters);
  };

  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  const handleSort = (field: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';
    if (field === sortField) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    setSortField(field);
    setSortOrder(newSortOrder);

    // Apply search and sort immediately
    const filters: any = {};
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    filters.sort = `${field},${newSortOrder}`;
    fetchBranches(1, pagination.limit, filters);
  };

  const handlePageChange = (page: number) => {
    const filters: any = {};
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    if (sortField && sortOrder) {
      filters.sort = `${sortField},${sortOrder}`;
    }
    fetchBranches(page, pagination.limit, filters);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      return String(date);
    }
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Load initial data and reset search when component mounts
  useEffect(() => {
    const filters: any = {};
    if (sortField && sortOrder) {
      filters.sort = `${sortField},${sortOrder}`;
    }
    fetchBranches(1, pagination.limit, filters);
  }, []); // Only run on mount

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh (tên, địa chỉ, liên hệ)..."
              className="w-full md:w-80 pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {isSearching ? (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
              </div>
            ) : searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Xóa tìm kiếm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  sortField === 'name' && sortOrder === 'asc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('name'); setSortOrder('asc'); }}
              >
                Tên (A-Z)
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  sortField === 'name' && sortOrder === 'desc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('name'); setSortOrder('desc'); }}
              >
                Tên (Z-A)
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  sortField === 'createdAt' && sortOrder === 'desc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('createdAt'); setSortOrder('desc'); }}
              >
                Mới nhất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search results info */}
      {searchTerm && !loading && (
        <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
          {branches.length > 0 ? (
            <>
              Tìm thấy <strong>{pagination.total}</strong> kết quả cho "<strong>{searchTerm}</strong>"
              {pagination.totalPages > 1 && (
                <span> - Trang {pagination.page}/{pagination.totalPages}</span>
              )}
            </>
          ) : (
            <>Không tìm thấy kết quả nào cho "<strong>{searchTerm}</strong>"</>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                  Tên chi nhánh {getSortIcon('name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Ngày tạo {getSortIcon('createdAt')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" size={14} />
                        {branch.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {branch.contact}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.createdAt && formatDate(branch.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <div className="relative group">
                          <button
                            onClick={() => onView(branch.id)}
                            className="p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md transition-all relative z-40"
                          >
                            <FiEye className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                            Xem chi tiết
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => onEdit(branch.id)}
                            className="p-2 rounded bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-md transition-all relative z-40"
                          >
                            <FiEdit className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                            Chỉnh sửa
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => onDelete(branch.id)}
                            className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md transition-all relative z-40"
                          >
                            <FiTrash className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-16 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                            Xóa
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có chi nhánh nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          showItemsInfo={true}
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default BranchList;
