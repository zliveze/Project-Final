import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Portal component để render nội dung bên ngoài cấu trúc DOM chính
 * Hữu ích cho modal, popover, tooltip, v.v.
 */
export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Tạo một div mới và thêm vào body nếu chưa có
  useEffect(() => {
    if (!document.getElementById('portal-root')) {
      const portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      portalRoot.style.position = 'fixed';
      portalRoot.style.zIndex = '9999';
      portalRoot.style.top = '0';
      portalRoot.style.left = '0';
      portalRoot.style.width = '100%';
      portalRoot.style.height = '100%';
      portalRoot.style.pointerEvents = 'none';
      document.body.appendChild(portalRoot);
    }
  }, []);

  return mounted && typeof document !== 'undefined'
    ? createPortal(
        children,
        document.getElementById('portal-root') || document.body
      )
    : null;
}
