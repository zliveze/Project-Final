import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiDownload, FiArrowLeft, FiCalendar, FiFileText, FiClock, FiBarChart2, FiMail } from 'react-icons/fi';

export default function OrderExport() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'period' | 'custom' | 'comparison'>('all');
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [comparisonPeriodType, setComparisonPeriodType] = useState<'previous' | 'custom'>('previous');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [comparisonDateRange, setComparisonDateRange] = useState({
    from: '',
    to: ''
  });
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [scheduleExport, setScheduleExport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  // Xử lý khi thay đổi loại báo cáo
  useEffect(() => {
    if (exportType !== 'custom' && exportType !== 'comparison') {
      setDateRange({
        from: '',
        to: ''
      });
    }
    
    if (exportType !== 'comparison') {
      setComparisonDateRange({
        from: '',
        to: ''
      });
    }
  }, [exportType]);

  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      // Giả lập thời gian xử lý xuất báo cáo
      setTimeout(() => {
        setIsLoading(false);
        
        if (scheduleExport) {
          alert(`Đã lên lịch xuất báo cáo ${scheduleFrequency === 'daily' ? 'hàng ngày' : scheduleFrequency === 'weekly' ? 'hàng tuần' : 'hàng tháng'} gửi đến ${emailRecipients}`);
        } else {
          alert(`Đã xuất báo cáo ${exportFormat.toUpperCase()} thành công! (Chức năng này chỉ là giao diện mẫu)`);
        }
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi xuất báo cáo:', error);
      setIsLoading(false);
      alert('Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại sau.');
    }
  };

  const isValidForm = () => {
    if (exportType === 'custom' && (!dateRange.from || !dateRange.to)) {
      return false;
    }
    
    if (exportType === 'comparison' && comparisonPeriodType === 'custom' && 
        (!comparisonDateRange.from || !comparisonDateRange.to || !dateRange.from || !dateRange.to)) {
      return false;
    }
    
    if (scheduleExport && !emailRecipients) {
      return false;
    }
    
    return true;
  };

  return (
    <AdminLayout title="Xuất báo cáo đơn hàng">
      <Head>
        <title>Xuất báo cáo đơn hàng | Yumin Admin</title>
      </Head>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-gray-900">Xuất báo cáo đơn hàng</h1>
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center"
            onClick={() => router.push('/admin/orders')}
          >
            <FiArrowLeft className="mr-2" />
            Quay lại
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Loại báo cáo */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiFileText className="mr-2" />
              Chọn kiểu báo cáo
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="export-all"
                  name="export-type"
                  type="radio"
                  checked={exportType === 'all'}
                  onChange={() => setExportType('all')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="export-all" className="ml-2 text-sm text-gray-700">
                  Tất cả đơn hàng
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="export-period"
                  name="export-type"
                  type="radio"
                  checked={exportType === 'period'}
                  onChange={() => setExportType('period')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="export-period" className="ml-2 text-sm text-gray-700">
                  Theo khoảng thời gian
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="export-custom"
                  name="export-type"
                  type="radio"
                  checked={exportType === 'custom'}
                  onChange={() => setExportType('custom')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="export-custom" className="ml-2 text-sm text-gray-700">
                  Tùy chỉnh thời gian
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="export-comparison"
                  name="export-type"
                  type="radio"
                  checked={exportType === 'comparison'}
                  onChange={() => setExportType('comparison')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="export-comparison" className="ml-2 text-sm text-gray-700">
                  So sánh các giai đoạn
                </label>
              </div>
            </div>
          </div>
          
          {/* Chọn thời kỳ */}
          {exportType === 'period' && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiClock className="mr-2" />
                Chọn thời kỳ
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div
                  className={`border rounded-md p-3 cursor-pointer ${periodType === 'week' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                  onClick={() => setPeriodType('week')}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      checked={periodType === 'week'}
                      onChange={() => {}}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium">Tuần này</span>
                  </div>
                </div>
                
                <div
                  className={`border rounded-md p-3 cursor-pointer ${periodType === 'month' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                  onClick={() => setPeriodType('month')}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      checked={periodType === 'month'}
                      onChange={() => {}}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium">Tháng này</span>
                  </div>
                </div>
                
                <div
                  className={`border rounded-md p-3 cursor-pointer ${periodType === 'quarter' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                  onClick={() => setPeriodType('quarter')}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      checked={periodType === 'quarter'}
                      onChange={() => {}}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium">Quý này</span>
                  </div>
                </div>
                
                <div
                  className={`border rounded-md p-3 cursor-pointer ${periodType === 'year' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                  onClick={() => setPeriodType('year')}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      checked={periodType === 'year'}
                      onChange={() => {}}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium">Năm nay</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Chọn khoảng thời gian tùy chỉnh */}
          {(exportType === 'custom' || exportType === 'comparison') && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiCalendar className="mr-2" />
                {exportType === 'comparison' ? 'Khoảng thời gian hiện tại' : 'Khoảng thời gian'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date-from" className="block text-sm text-gray-500 mb-1">Từ ngày</label>
                  <input
                    id="date-from"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label htmlFor="date-to" className="block text-sm text-gray-500 mb-1">Đến ngày</label>
                  <input
                    id="date-to"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Tùy chọn so sánh */}
          {exportType === 'comparison' && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiBarChart2 className="mr-2" />
                So sánh với
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="comparison-previous"
                    name="comparison-type"
                    type="radio"
                    checked={comparisonPeriodType === 'previous'}
                    onChange={() => setComparisonPeriodType('previous')}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                  />
                  <label htmlFor="comparison-previous" className="ml-2 text-sm text-gray-700">
                    Kỳ trước đó (cùng khoảng thời gian)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="comparison-custom"
                    name="comparison-type"
                    type="radio"
                    checked={comparisonPeriodType === 'custom'}
                    onChange={() => setComparisonPeriodType('custom')}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                  />
                  <label htmlFor="comparison-custom" className="ml-2 text-sm text-gray-700">
                    Khoảng thời gian tùy chỉnh
                  </label>
                </div>
                
                {comparisonPeriodType === 'custom' && (
                  <div className="pl-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="comparison-from" className="block text-sm text-gray-500 mb-1">Từ ngày</label>
                        <input
                          id="comparison-from"
                          type="date"
                          value={comparisonDateRange.from}
                          onChange={(e) => setComparisonDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="comparison-to" className="block text-sm text-gray-500 mb-1">Đến ngày</label>
                        <input
                          id="comparison-to"
                          type="date"
                          value={comparisonDateRange.to}
                          onChange={(e) => setComparisonDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tùy chọn định dạng */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Định dạng xuất</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border rounded-md p-4 cursor-pointer ${exportFormat === 'excel' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                onClick={() => setExportFormat('excel')}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="radio"
                    checked={exportFormat === 'excel'}
                    onChange={() => {}}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium">Excel (.xlsx)</span>
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-4 cursor-pointer ${exportFormat === 'pdf' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                onClick={() => setExportFormat('pdf')}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="radio"
                    checked={exportFormat === 'pdf'}
                    onChange={() => {}}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium">PDF (.pdf)</span>
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-4 cursor-pointer ${exportFormat === 'csv' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'}`}
                onClick={() => setExportFormat('csv')}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="radio"
                    checked={exportFormat === 'csv'}
                    onChange={() => {}}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium">CSV (.csv)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tùy chọn nội dung */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Tùy chọn nội dung</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="include-details"
                  type="checkbox"
                  checked={includeDetails}
                  onChange={() => setIncludeDetails(!includeDetails)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="include-details" className="ml-2 text-sm text-gray-700">
                  Bao gồm chi tiết sản phẩm trong đơn hàng
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="include-charts"
                  type="checkbox"
                  checked={includeCharts}
                  onChange={() => setIncludeCharts(!includeCharts)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="include-charts" className="ml-2 text-sm text-gray-700">
                  Bao gồm biểu đồ phân tích
                </label>
              </div>
            </div>
          </div>
          
          {/* Lịch xuất báo cáo tự động */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiMail className="mr-2" />
              Lập lịch xuất báo cáo
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="schedule-export"
                  type="checkbox"
                  checked={scheduleExport}
                  onChange={() => setScheduleExport(!scheduleExport)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="schedule-export" className="ml-2 text-sm text-gray-700">
                  Lên lịch gửi báo cáo tự động
                </label>
              </div>
              
              {scheduleExport && (
                <div className="pl-6 space-y-3">
                  <div>
                    <label htmlFor="schedule-frequency" className="block text-sm text-gray-700 mb-1">
                      Tần suất
                    </label>
                    <select
                      id="schedule-frequency"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={scheduleFrequency}
                      onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    >
                      <option value="daily">Hàng ngày</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="monthly">Hàng tháng</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="email-recipients" className="block text-sm text-gray-700 mb-1">
                      Email người nhận (cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      id="email-recipients"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="example@yumin.vn, manager@yumin.vn"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Button xuất báo cáo */}
          <div className="pt-4">
            <button
              className="w-full md:w-auto px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center justify-center"
              onClick={handleExport}
              disabled={isLoading || !isValidForm()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {scheduleExport ? 'Đang lên lịch...' : 'Đang xuất báo cáo...'}
                </>
              ) : (
                <>
                  <FiDownload className="mr-2" />
                  {scheduleExport ? 'Lên lịch gửi báo cáo' : 'Xuất báo cáo'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 