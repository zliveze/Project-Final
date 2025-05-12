import { jsPDF } from 'jspdf';

/**
 * Hàm tải font Pin-Sans vào jsPDF
 * @param doc Đối tượng jsPDF cần thêm font
 */
export const loadPinSansFont = async (doc: jsPDF): Promise<void> => {
  try {
    // Tải font từ thư mục public/fonts
    const fontPaths = {
      regular: '/fonts/Pin-Sans-Regular.ttf',
      bold: '/fonts/Pin-Sans-Bold.ttf',
      medium: '/fonts/Pin-Sans-Medium.ttf',
    };

    // Tải font Regular
    const regularFontResponse = await fetch(fontPaths.regular);
    if (regularFontResponse.ok) {
      const regularFontData = await regularFontResponse.arrayBuffer();
      doc.addFileToVFS('Pin-Sans-Regular.ttf', arrayBufferToBase64(regularFontData));
      doc.addFont('Pin-Sans-Regular.ttf', 'Pin-Sans', 'normal');
      console.log('Đã tải font Pin-Sans Regular thành công');
    } else {
      console.error('Không thể tải font Pin-Sans Regular');
    }

    // Tải font Bold
    const boldFontResponse = await fetch(fontPaths.bold);
    if (boldFontResponse.ok) {
      const boldFontData = await boldFontResponse.arrayBuffer();
      doc.addFileToVFS('Pin-Sans-Bold.ttf', arrayBufferToBase64(boldFontData));
      doc.addFont('Pin-Sans-Bold.ttf', 'Pin-Sans', 'bold');
      console.log('Đã tải font Pin-Sans Bold thành công');
    } else {
      console.error('Không thể tải font Pin-Sans Bold');
    }

    // Tải font Medium
    const mediumFontResponse = await fetch(fontPaths.medium);
    if (mediumFontResponse.ok) {
      const mediumFontData = await mediumFontResponse.arrayBuffer();
      doc.addFileToVFS('Pin-Sans-Medium.ttf', arrayBufferToBase64(mediumFontData));
      doc.addFont('Pin-Sans-Medium.ttf', 'Pin-Sans', 'medium');
      console.log('Đã tải font Pin-Sans Medium thành công');
    } else {
      console.error('Không thể tải font Pin-Sans Medium');
    }
  } catch (error) {
    console.error('Lỗi khi tải font Pin-Sans:', error);
  }
};

/**
 * Chuyển đổi ArrayBuffer thành chuỗi Base64
 * @param buffer ArrayBuffer cần chuyển đổi
 * @returns Chuỗi Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
