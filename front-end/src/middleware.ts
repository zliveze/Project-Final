import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('adminToken')?.value;
  const userToken = request.cookies.get('accessToken')?.value;
  
  // Nếu là route admin (ngoại trừ trang đăng nhập) và không có token
  if (pathname.startsWith('/admin') && 
      pathname !== '/admin/auth/login' && 
      !adminToken) {
    return NextResponse.redirect(new URL('/admin/auth/login', request.url));
  }
  
  // Nếu đã đăng nhập admin và truy cập trang đăng nhập, chuyển hướng về dashboard
  if (pathname === '/admin/auth/login' && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Nếu đã đăng nhập user và truy cập các trang auth (đăng nhập/đăng ký/quên mật khẩu), chuyển hướng về trang chủ
  if (userToken && (
    pathname === '/auth/login' || 
    pathname === '/auth/register' || 
    pathname === '/auth/forgot-password' || 
    pathname === '/auth/reset-password'
  )) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}; 