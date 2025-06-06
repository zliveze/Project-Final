import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

export interface AdminUserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
  fetchUsers: (page?: number, limit?: number, term?: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  fetchUserById: (id: string) => Promise<User | null>;
  updateUserStatus: (userId: string, status: string) => Promise<boolean>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
}

const AdminUserContext = createContext<AdminUserContextType | undefined>(undefined);

export const useAdminUserContext = () => {
  const context = useContext(AdminUserContext);
  if (context === undefined) {
    throw new Error('useAdminUserContext must be used within an AdminUserContextProvider');
  }
  return context;
};

export const AdminUserContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchUsers = async (page: number = 1, limit: number = 10, term?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching users with params:', { page, limit, term });
      
      // Tạo query string với đầy đủ tham số
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (term) queryParams.append('search', term);
      
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserById = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/status/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, status } : user
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/role/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error('Cập nhật vai trò người dùng thất bại');
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role } : user
        )
      );

      return true;
    } catch (error) {
      console.error('Lỗi khi cập nhật vai trò người dùng:', error);
      return false;
    }
  };

  return (
    <AdminUserContext.Provider
      value={{
        users,
        loading,
        error,
        totalPages,
        currentPage,
        searchTerm,
        fetchUsers,
        setSearchTerm,
        setCurrentPage,
        fetchUserById,
        updateUserStatus,
        updateUserRole,
      }}
    >
      {children}
    </AdminUserContext.Provider>
  );
}; 