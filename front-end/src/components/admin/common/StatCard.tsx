import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  footer?: ReactNode;
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor = 'text-gray-400',
  change,
  footer
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconColor}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-lg font-medium text-gray-900">
                  {value}
                </div>

                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="sr-only">
                      {change.isPositive ? 'Tăng' : 'Giảm'}
                    </span>
                    {change.isPositive ? '↑' : '↓'} {change.value}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {footer && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}