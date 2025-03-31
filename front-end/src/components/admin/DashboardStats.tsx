import { FiUsers, FiShoppingBag, FiShoppingCart, FiDollarSign } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change: number;
  changeType: 'increase' | 'decrease';
  bgColor: string;
}

const StatCard = ({ title, value, icon: Icon, change, changeType, bgColor }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
      <div className={`p-3 rounded-full ${bgColor} mr-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className={`ml-2 text-sm font-medium ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'increase' ? '+' : '-'}{change}%
          </p>
        </div>
        <p className="text-gray-500 text-xs mt-1">So với tháng trước</p>
      </div>
    </div>
  );
};

export default function DashboardStats() {
  const stats = [
    {
      title: 'Tổng người dùng',
      value: '1,234',
      icon: FiUsers,
      change: 12,
      changeType: 'increase' as const,
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Tổng sản phẩm',
      value: '456',
      icon: FiShoppingBag,
      change: 5,
      changeType: 'increase' as const,
      bgColor: 'bg-pink-500'
    },
    {
      title: 'Đơn hàng mới',
      value: '89',
      icon: FiShoppingCart,
      change: 8,
      changeType: 'increase' as const,
      bgColor: 'bg-purple-500'
    },
    {
      title: 'Doanh thu',
      value: '123,456,000đ',
      icon: FiDollarSign,
      change: 3,
      changeType: 'decrease' as const,
      bgColor: 'bg-green-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
} 