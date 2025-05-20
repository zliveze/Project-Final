// Các cấp độ log
export enum LogLevel {
  NONE = 0,   // Không hiển thị log
  ERROR = 1,  // Chỉ hiển thị lỗi
  WARN = 2,   // Hiển thị cảnh báo và lỗi
  INFO = 3,   // Hiển thị thông tin, cảnh báo và lỗi
  DEBUG = 4   // Hiển thị tất cả
}

// Cấu hình log mặc định
const DEFAULT_CONFIG = {
  // Trong development, mặc định chỉ hiển thị INFO trở lên để giảm số lượng log
  level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO,
  enableConsoleColors: true,
  showTimestamp: true,
  showLogLevel: true,
  moduleNameMaxLength: 20,
  actionNameMaxLength: 30,
  // Thêm cờ để kiểm soát log chi tiết cho các module cụ thể
  enableDetailedLogging: false
};

// Lưu trữ cấu hình hiện tại
let currentConfig = { ...DEFAULT_CONFIG };

// Các màu cho console
const COLORS = {
  debug: '#1565c0', // Xanh dương
  info: '#00796b',  // Xanh lá
  warn: '#ff8f00',  // Cam
  error: '#d32f2f',  // Đỏ
  module: '#d81b60', // Hồng
  action: '#6a1b9a', // Tím
  reset: ''
};

// Lưu trữ log gần đây để tránh log trùng lặp
const recentLogs: {[key: string]: {timestamp: number, count: number}} = {};
const LOG_DEBOUNCE_TIME = 1000; // 1 giây

/**
 * Tạo một logger cho một module cụ thể
 * @param moduleName Tên module (component, context, service, etc.)
 */
export function createLogger(moduleName: string) {
  // Cắt ngắn tên module nếu quá dài
  const truncatedModuleName = moduleName.length > currentConfig.moduleNameMaxLength
    ? moduleName.substring(0, currentConfig.moduleNameMaxLength - 3) + '...'
    : moduleName.padEnd(currentConfig.moduleNameMaxLength, ' ');

  // Kiểm tra xem log có bị trùng lặp không
  const checkDuplicate = (level: string, action: string, data: any): boolean => {
    // Tạo key duy nhất cho log này
    const dataStr = data !== undefined ? JSON.stringify(data) : '';
    const logKey = `${level}:${moduleName}:${action}:${dataStr}`;

    const now = Date.now();
    const recentLog = recentLogs[logKey];

    if (recentLog && now - recentLog.timestamp < LOG_DEBOUNCE_TIME) {
      // Nếu log này đã xuất hiện gần đây, tăng số lần lặp lại
      recentLog.count++;
      recentLog.timestamp = now;
      return true; // Đây là log trùng lặp
    }

    // Đây là log mới hoặc đã quá thời gian debounce
    recentLogs[logKey] = { timestamp: now, count: 1 };

    // Dọn dẹp các log cũ
    Object.keys(recentLogs).forEach(key => {
      if (now - recentLogs[key].timestamp > LOG_DEBOUNCE_TIME * 10) {
        delete recentLogs[key];
      }
    });

    return false; // Không phải log trùng lặp
  };

  /**
   * Log debug - chỉ hiển thị khi ở chế độ debug
   * @param action Hành động đang thực hiện
   * @param data Dữ liệu cần log (optional)
   */
  const debug = (action: string, data?: any) => {
    if (currentConfig.level < LogLevel.DEBUG) return;

    // Kiểm tra xem module này có được bật log chi tiết không
    if (!currentConfig.enableDetailedLogging && moduleName.includes('Event')) {
      // Nếu không phải log chi tiết và là module Event, kiểm tra trùng lặp
      if (checkDuplicate('debug', action, data)) return;
    }

    const truncatedAction = action.length > currentConfig.actionNameMaxLength
      ? action.substring(0, currentConfig.actionNameMaxLength - 3) + '...'
      : action;

    if (currentConfig.enableConsoleColors) {
      console.log(
        `%c[${truncatedModuleName}]%c ${truncatedAction}`,
        `color: ${COLORS.module}; font-weight: bold`,
        `color: ${COLORS.debug}; font-weight: bold`,
        data !== undefined ? data : ''
      );
    } else {
      console.log(`[${truncatedModuleName}] ${truncatedAction}`, data !== undefined ? data : '');
    }
  };

  /**
   * Log thông tin - hiển thị ở cấp độ INFO trở lên
   * @param action Hành động đang thực hiện
   * @param data Dữ liệu cần log (optional)
   */
  const info = (action: string, data?: any) => {
    if (currentConfig.level < LogLevel.INFO) return;

    // Kiểm tra xem module này có được bật log chi tiết không
    if (!currentConfig.enableDetailedLogging && moduleName.includes('Event')) {
      // Nếu không phải log chi tiết và là module Event, kiểm tra trùng lặp
      if (checkDuplicate('info', action, data)) return;
    }

    const truncatedAction = action.length > currentConfig.actionNameMaxLength
      ? action.substring(0, currentConfig.actionNameMaxLength - 3) + '...'
      : action;

    if (currentConfig.enableConsoleColors) {
      console.log(
        `%c[${truncatedModuleName}]%c ${truncatedAction}`,
        `color: ${COLORS.module}; font-weight: bold`,
        `color: ${COLORS.info}; font-weight: bold`,
        data !== undefined ? data : ''
      );
    } else {
      console.log(`[${truncatedModuleName}] ${truncatedAction}`, data !== undefined ? data : '');
    }
  };

  /**
   * Log cảnh báo - hiển thị ở cấp độ WARN trở lên
   * @param action Hành động đang thực hiện
   * @param data Dữ liệu cần log (optional)
   */
  const warn = (action: string, data?: any) => {
    if (currentConfig.level < LogLevel.WARN) return;

    const truncatedAction = action.length > currentConfig.actionNameMaxLength
      ? action.substring(0, currentConfig.actionNameMaxLength - 3) + '...'
      : action;

    if (currentConfig.enableConsoleColors) {
      console.warn(
        `%c[${truncatedModuleName}]%c ${truncatedAction}`,
        `color: ${COLORS.module}; font-weight: bold`,
        `color: ${COLORS.warn}; font-weight: bold`,
        data !== undefined ? data : ''
      );
    } else {
      console.warn(`[${truncatedModuleName}] ${truncatedAction}`, data !== undefined ? data : '');
    }
  };

  /**
   * Log lỗi - luôn hiển thị trừ khi ở cấp độ NONE
   * @param action Hành động đang thực hiện
   * @param error Lỗi cần log
   */
  const error = (action: string, error: any) => {
    if (currentConfig.level < LogLevel.ERROR) return;

    const truncatedAction = action.length > currentConfig.actionNameMaxLength
      ? action.substring(0, currentConfig.actionNameMaxLength - 3) + '...'
      : action;

    if (currentConfig.enableConsoleColors) {
      console.error(
        `%c[${truncatedModuleName}]%c ${truncatedAction}`,
        `color: ${COLORS.module}; font-weight: bold`,
        `color: ${COLORS.error}; font-weight: bold`,
        error
      );
    } else {
      console.error(`[${truncatedModuleName}] ${truncatedAction}`, error);
    }
  };

  return {
    debug,
    info,
    warn,
    error
  };
}

/**
 * Cấu hình logger
 * @param config Cấu hình mới
 */
export function configureLogger(config: Partial<typeof DEFAULT_CONFIG>) {
  currentConfig = {
    ...currentConfig,
    ...config
  };
}

/**
 * Đặt cấp độ log
 * @param level Cấp độ log mới
 */
export function setLogLevel(level: LogLevel) {
  currentConfig.level = level;
}

/**
 * Bật/tắt log chi tiết cho các module
 * @param enable Bật (true) hoặc tắt (false) log chi tiết
 */
export function enableDetailedLogging(enable: boolean) {
  currentConfig.enableDetailedLogging = enable;
}

/**
 * Xóa tất cả log đã lưu trữ
 */
export function clearLogHistory() {
  Object.keys(recentLogs).forEach(key => {
    delete recentLogs[key];
  });
}

// Export một logger mặc định cho các module không cần logger riêng
export default createLogger('App');
