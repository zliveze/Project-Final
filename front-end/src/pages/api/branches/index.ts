import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to fetch branches
 * This endpoint will proxy requests to the backend NestJS API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get query parameters, tăng limit mặc định
    const { page = 1, limit = 1000, search } = req.query; 
    
    // Create query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search.toString());
    
    // URL to the backend NestJS API - Sử dụng endpoint user không cần authentication
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://backendyumin.vercel.app/api'}/branches?${queryParams.toString()}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward request to backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers, // Sử dụng headers đã có token (nếu có)
    });

    if (!response.ok) {
      console.error(`Error fetching branches: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `Error fetching branches: ${response.statusText}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in branches API route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
