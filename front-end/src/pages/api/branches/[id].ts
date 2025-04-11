import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to fetch a specific branch by ID
 * This endpoint will proxy requests to the backend NestJS API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid branch ID' });
  }

  try {
    // URL to the backend NestJS API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/branches/${id}`;
    
    // Forward request to backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching branch: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `Error fetching branch: ${response.statusText}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in branch API route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
