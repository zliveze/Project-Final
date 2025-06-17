import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Gọi trực tiếp đến backend NestJS (backend có global prefix 'api')
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/api/tasks/import/${taskId}`;

    console.log(`[API Route] Calling backend: ${backendUrl}`);
    console.log(`[API Route] TaskId: ${taskId}`);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[API Route] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[API Route] Backend error response: ${errorText}`);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `Backend error: ${response.status} - ${errorText}` };
      }

      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log(`[API Route] Backend success response:`, data);
    return res.status(200).json(data);

  } catch (error) {
    console.error('[API Route] Error fetching task status:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
