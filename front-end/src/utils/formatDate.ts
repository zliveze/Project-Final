/**
 * Định dạng ngày giờ thành chuỗi ngày tháng năm giờ phút giây
 * @param dateString Chuỗi ngày giờ định dạng ISO
 * @param includeTime Có hiển thị thời gian hay không
 * @returns Chuỗi ngày tháng năm giờ phút đã định dạng
 */
export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Kiểm tra xem ngày có hợp lệ không
    if (isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    // Định dạng ngày tháng
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let formattedDate = `${day}/${month}/${year}`;
    
    // Thêm thời gian nếu cần
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      formattedDate += ` ${hours}:${minutes}`;
    }
    
    return formattedDate;
  } catch (error) {
    console.error('Lỗi khi định dạng ngày:', error);
    return 'Ngày không hợp lệ';
  }
}; 