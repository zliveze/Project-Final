import React, { useEffect, useState } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button, Table, Space, Tag, Input, Select, Pagination, Modal, message, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;
const { confirm } = Modal;

const ProductManagement: React.FC = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const { 
    products, 
    loading, 
    totalProducts, 
    currentPage, 
    totalPages, 
    itemsPerPage,
    statistics,
    fetchProducts,
    deleteProduct,
    fetchStatistics,
    error,
    apiHealthStatus,
    checkApiHealth
  } = useProduct();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPageSize, setCurrentPageSize] = useState(10);

  // Load products and statistics on component mount
  useEffect(() => {
    fetchProducts(1, currentPageSize).catch(err => {
      console.error("Lỗi khi tải sản phẩm:", err);
      message.error("Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối API.");
    });
    
    fetchStatistics().catch(err => {
      console.error("Lỗi khi tải thống kê:", err);
    });
  }, [fetchProducts, fetchStatistics, currentPageSize]);

  // Handle search
  const handleSearch = () => {
    fetchProducts(1, currentPageSize, searchText, '', '', statusFilter);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    fetchProducts(1, currentPageSize, searchText, '', '', value);
  };

  // Handle pagination change
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || currentPageSize;
    setCurrentPageSize(newPageSize);
    fetchProducts(page, newPageSize, searchText, '', '', statusFilter);
  };

  // Handle product deletion
  const showDeleteConfirm = (id: string, name: string) => {
    // Only superadmin can delete products
    if (admin?.role !== 'superadmin') {
      message.error('Chỉ Superadmin mới có quyền xóa sản phẩm');
      return;
    }

    confirm({
      title: `Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          await deleteProduct(id);
          message.success('Xóa sản phẩm thành công');
        } catch (error: any) {
          message.error(`Lỗi khi xóa sản phẩm: ${error.message}`);
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'image',
      render: (images: any[]) => {
        const primaryImage = images?.find(img => img.isPrimary) || images?.[0];
        return primaryImage ? (
          <img 
            src={primaryImage.url} 
            alt={primaryImage.alt || 'Product image'} 
            style={{ width: 50, height: 50, objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No image
          </div>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => router.push(`/admin/products/edit/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) => {
        const currentPrice = record.currentPrice || price;
        const hasDiscount = record.currentPrice && record.currentPrice < price;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ textDecoration: 'line-through', color: '#999' }}>
                {price.toLocaleString('vi-VN')}đ
              </div>
            )}
            <div style={{ color: hasDiscount ? '#f5222d' : 'inherit', fontWeight: hasDiscount ? 'bold' : 'normal' }}>
              {currentPrice.toLocaleString('vi-VN')}đ
            </div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        let text = 'Đang bán';
        
        if (status === 'out_of_stock') {
          color = 'orange';
          text = 'Hết hàng';
        } else if (status === 'discontinued') {
          color = 'red';
          text = 'Ngừng kinh doanh';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Đặc điểm',
      key: 'flags',
      dataIndex: 'flags',
      render: (flags: any) => (
        <Space size={[0, 4]} wrap>
          {flags?.isBestSeller && <Tag color="gold">Bán chạy</Tag>}
          {flags?.isNew && <Tag color="blue">Mới</Tag>}
          {flags?.isOnSale && <Tag color="red">Giảm giá</Tag>}
          {flags?.hasGifts && <Tag color="purple">Có quà tặng</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (text: string, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => router.push(`/admin/products/edit/${record._id}`)}
          >
            Sửa
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => showDeleteConfirm(record._id, record.name)}
            disabled={admin?.role !== 'superadmin'} // Only superadmin can delete
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Quản lý sản phẩm</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => router.push('/admin/products/create')}
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      {error && (
        <Alert
          message={`Lỗi kết nối - Trạng thái API: ${apiHealthStatus}`}
          description={
            <>
              <p>{error}</p>
              <p>Vui lòng kiểm tra:</p>
              <ul>
                <li>Server API đã được khởi động (chạy npm run start:dev trong thư mục back-end)</li>
                <li>Cấu hình API URL đúng trong file .env (NEXT_PUBLIC_API_URL)</li>
                <li>Không có lỗi CORS hoặc firewall chặn kết nối</li>
              </ul>
              <div style={{ marginTop: 10 }}>
                <Button 
                  type="primary" 
                  onClick={async () => {
                    const isHealthy = await checkApiHealth();
                    if (isHealthy) {
                      fetchProducts(1, currentPageSize);
                    } else {
                      message.error("API vẫn không hoạt động. Vui lòng kiểm tra lại server backend.");
                    }
                  }}
                  style={{ marginRight: 10 }}
                >
                  Kiểm tra kết nối API
                </Button>
                <Button 
                  onClick={() => {
                    fetchProducts(1, currentPageSize).catch(err => {
                      message.error("Vẫn không thể kết nối đến API.");
                    });
                  }}
                >
                  Thử lại tải dữ liệu
                </Button>
              </div>
            </>
          }
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Statistics cards */}
      {statistics && (
        <div className="statistics-cards">
          <div className="stat-card">
            <h3>Tổng sản phẩm</h3>
            <p>{statistics.total}</p>
          </div>
          <div className="stat-card">
            <h3>Đang bán</h3>
            <p>{statistics.active}</p>
          </div>
          <div className="stat-card">
            <h3>Hết hàng</h3>
            <p>{statistics.outOfStock}</p>
          </div>
          <div className="stat-card">
            <h3>Ngừng kinh doanh</h3>
            <p>{statistics.discontinued}</p>
          </div>
          <div className="stat-card">
            <h3>Sản phẩm bán chạy</h3>
            <p>{statistics.bestSellers}</p>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="filters-container">
        <Input
          placeholder="Tìm kiếm sản phẩm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          onChange={handleStatusChange}
          value={statusFilter || undefined}
          allowClear
        >
          <Option value="active">Đang bán</Option>
          <Option value="out_of_stock">Hết hàng</Option>
          <Option value="discontinued">Ngừng kinh doanh</Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </div>

      {/* Products table */}
      <Table
        columns={columns}
        dataSource={products.map(product => ({ ...product, key: product._id }))}
        loading={loading}
        pagination={false}
        rowKey="_id"
      />

      {/* Pagination */}
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalProducts}
          pageSize={currentPageSize}
          onChange={handlePageChange}
          showSizeChanger
          showTotal={(total) => `Tổng cộng ${total} sản phẩm`}
        />
      </div>

      <style jsx>{`
        .product-management {
          padding: 20px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .statistics-cards {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-width: 150px;
          flex: 1;
        }
        .stat-card h3 {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        .stat-card p {
          margin: 10px 0 0;
          font-size: 24px;
          font-weight: bold;
          color: #1890ff;
        }
        .filters-container {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .pagination-container {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

export default ProductManagement;
