import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiLock, FiLoader } from 'react-icons/fi';
import Pagination from '@/components/admin/common/Pagination';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UserTableProps {
  users?: User[];
  loading?: boolean;
  currentPage?: number;
  totalItems?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResetPassword?: (id: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void; 
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  roleFilter?: string;
  onRoleFilterChange?: (role: string) => void;
}

// Interface cho UserRow
interface UserRowProps {
  user: User;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResetPassword?: (id: string) => void;
}

// Interface cho EmptyStateRow
interface EmptyStateRowProps {
  colSpan?: number;
  message?: string;
  subMessage?: string;
}

// Interface cho LoadingRow
interface LoadingRowProps {
  colSpan?: number;
}

// Dữ liệu mẫu cho người dùng
const sampleUsers = [
  {
    id: 'USR-001',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    role: 'user',
    status: 'active',
    createdAt: '15/03/2025'
  },
  {
    id: 'USR-002',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0912345678',
    role: 'user',
    status: 'active',
    createdAt: '14/03/2025'
  },
  {
    id: 'USR-003',
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    phone: '0923456789',
    role: 'admin',
    status: 'active',
    createdAt: '13/03/2025'
  },
  {
    id: 'USR-004',
    name: 'Phạm Thị D',
    email: 'phamthid@example.com',
    phone: '0934567890',
    role: 'user',
    status: 'inactive',
    createdAt: '12/03/2025'
  },
  {
    id: 'USR-005',
    name: 'Hoàng Văn E',
    email: 'hoangvane@example.com',
    phone: '0945678901',
    role: 'user',
    status: 'active',
    createdAt: '11/03/2025'
  },
  {
    id: 'USR-006',
    name: 'Đỗ Thị F',
    email: 'dothif@example.com',
    phone: '0956789012',
    role: 'user',
    status: 'blocked',
    createdAt: '10/03/2025'
  }
];

// Tách UserRow thành một component riêng để tối ưu render
const UserRow = React.memo(({ 
  user, 
  onView, 
  onEdit, 
  onDelete, 
  onResetPassword 
}: UserRowProps) => {
  // Hàm hỗ trợ định dạng ngày tạo
  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Xác định màu sắc dựa trên trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Xác định tên trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'blocked':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  // Xác định màu sắc dựa trên vai trò
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Xác định tên vai trò
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'user':
        return 'Người dùng';
      default:
        return role;
    }
  };
  
  return (
    <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 mr-3">
            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-pink-600 font-medium">{user.name.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.phone || 'Chưa cập nhật'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getRoleColor(user.role)}`}>
          {getRoleText(user.role)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(user.status)}`}>
          {getStatusText(user.status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {formatCreatedAt(user.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          {onView && (
            <button
              onClick={() => onView(user.id)}
              className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
              title="Xem chi tiết"
            >
              <FiEye className="h-5 w-5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(user.id)}
              className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1"
              title="Chỉnh sửa"
            >
              <FiEdit2 className="h-5 w-5" />
            </button>
          )}
          {onResetPassword && (
            <button
              onClick={() => onResetPassword(user.id)}
              className="text-yellow-600 hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 rounded-full p-1"
              title="Đặt lại mật khẩu"
            >
              <FiLock className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(user.id)}
              className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1"
              title="Xóa"
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

UserRow.displayName = 'UserRow';

// Tách EmptyStateRow thành component riêng
const EmptyStateRow = React.memo(({ colSpan = 6, message = 'Không tìm thấy người dùng', subMessage = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' }: EmptyStateRowProps) => {
  return (
    <tr>
      <td colSpan={colSpan} className="h-52 text-center">
        <div className="flex flex-col items-center justify-center h-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <p className="text-gray-500 font-medium mb-1">{message}</p>
          <p className="text-gray-400 text-sm">{subMessage}</p>
        </div>
      </td>
    </tr>
  );
});

EmptyStateRow.displayName = 'EmptyStateRow';

// Tách LoadingRow thành component riêng
const LoadingRow = React.memo(({ colSpan = 6 }: LoadingRowProps) => {
  return (
    <tr>
      <td colSpan={colSpan} className="h-52 text-center">
        <div className="flex flex-col items-center justify-center h-full">
          <FiLoader className="h-8 w-8 text-pink-500 animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Đang tải dữ liệu người dùng...</p>
        </div>
      </td>
    </tr>
  );
});

LoadingRow.displayName = 'LoadingRow';

// Thêm component SkeletonRow để hiển thị hiệu ứng loading cho từng dòng
const SkeletonRow = React.memo(({ index = 0 }: { index?: number }) => {
  // Tạo độ trễ khác nhau cho mỗi dòng để tạo hiệu ứng sóng
  const delay = `${index * 0.05}s`;
  
  return (
    <tr className="border-b animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 mr-3" style={{ animationDelay: delay }}></div>
          <div className="w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4" style={{ animationDelay: delay }}></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" style={{ animationDelay: delay }}></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20" style={{ animationDelay: delay }}></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-16" style={{ animationDelay: delay }}></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-16" style={{ animationDelay: delay }}></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24" style={{ animationDelay: delay }}></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <div className="h-6 w-6 bg-gray-200 rounded-full" style={{ animationDelay: delay }}></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full" style={{ animationDelay: delay }}></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full" style={{ animationDelay: delay }}></div>
        </div>
      </td>
    </tr>
  );
});

SkeletonRow.displayName = 'SkeletonRow';

// Thêm virtualized pagination cho hiệu suất tốt hơn
const UserTable: React.FC<UserTableProps> = ({ 
  users: externalUsers, 
  loading = false, 
  onView, 
  onEdit, 
  onDelete, 
  onResetPassword,
  searchTerm = '',
  onSearchTermChange,
  statusFilter = 'all',
  onStatusFilterChange,
  roleFilter = 'all',
  onRoleFilterChange,
  onPageChange,
  currentPage: externalPage = 1,
  totalPages: externalTotalPages = 1,
  totalItems = 0,
  itemsPerPage = 10
}) => {
  // Local state for users when externalUsers isn't provided
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  
  // Thêm state để kiểm soát việc hiển thị skeleton loading
  const [showSkeleton, setShowSkeleton] = useState<boolean>(loading);
  
  // Sử dụng useEffect với debounce để kiểm soát việc hiển thị skeleton loading
  useEffect(() => {
    if (loading) {
      // Hiển thị skeleton ngay lập tức khi loading
      setShowSkeleton(true);
    } else if (externalUsers && externalUsers.length > 0) {
      // Nếu có dữ liệu, ẩn skeleton ngay lập tức
      setShowSkeleton(false);
    } else {
      // Giữ skeleton hiển thị thêm một chút trước khi ẩn nếu không có dữ liệu
      // để tránh flickering UI
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, externalUsers]);

  // Handle changes to external users data
  useEffect(() => {
    if (externalUsers) {
      setFilteredUsers(externalUsers);
    }
  }, [externalUsers]);

  // Tối ưu hóa useMemo để cải thiện hiệu suất
  const tableData = useMemo(() => {
    // Phân trang (chỉ khi không có paging từ bên ngoài)
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = !onPageChange ? filteredUsers.slice(indexOfFirstUser, indexOfLastUser) : filteredUsers;
    const totalPages = !onPageChange ? Math.ceil(filteredUsers.length / usersPerPage) : externalTotalPages;
    
    return {
      currentUsers,
      totalPages
    };
  }, [currentPage, filteredUsers, onPageChange, usersPerPage, externalTotalPages]);
  
  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page: number) => {
    if (onPageChange) {
      // Hiển thị skeleton loading khi chuyển đến trang mới
      setShowSkeleton(true);
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  }, [onPageChange]);

  // Tối ưu hóa render table rows để giảm thiểu re-renders
  const renderTableRows = useCallback(() => {
    // Hiển thị skeleton rows khi đang loading
    if (showSkeleton || loading) {
      return Array.from({ length: itemsPerPage || 5 }).map((_, index) => (
        <SkeletonRow key={`skeleton-${index}`} index={index} />
      ));
    }

    // Hiển thị khi không có dữ liệu
    if (tableData.currentUsers.length === 0) {
      return <EmptyStateRow colSpan={6} />;
    }

    // Render dữ liệu bình thường - sử dụng Fragment để tránh re-render không cần thiết
    return (
      <>
        {tableData.currentUsers.map((user: User) => (
          <UserRow 
            key={user.id}
            user={user}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onResetPassword={onResetPassword}
          />
        ))}
      </>
    );
  }, [tableData.currentUsers, showSkeleton, loading, onView, onEdit, onDelete, onResetPassword, itemsPerPage]);

  // Memoized pagination component
  const PaginationComponent = useMemo(() => {
    const activePage = onPageChange ? externalPage : currentPage;
    const totalPages = tableData.totalPages;
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          showItemsInfo={true}
          className="w-full"
        />
      </div>
    );
  }, [currentPage, externalPage, handlePageChange, itemsPerPage, tableData.totalPages, totalItems]);

  // Thêm memo để giảm thiểu re-render không cần thiết cho toàn bộ component
  const TableContent = useMemo(() => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thông tin người dùng
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số điện thoại
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderTableRows()}
          </tbody>
        </table>
      </div>
      
      {/* Phân trang */}
      {PaginationComponent}
    </div>
  ), [PaginationComponent, renderTableRows]);
  
  return TableContent;
};

export default React.memo(UserTable); 