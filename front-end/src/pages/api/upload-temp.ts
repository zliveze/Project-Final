import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable'; // Import File type
import { v2 as cloudinary } from 'cloudinary';
// Removed unused imports: fs and path

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse form data
    const form = new formidable.IncomingForm({ keepExtensions: true });
    
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Get the image file
    let imageFile: File | undefined = undefined;
    if (files.image) {
      if (Array.isArray(files.image)) {
        imageFile = files.image[0];
      } else {
        imageFile = files.image;
      }
    }

    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get isPrimary field
    let isPrimaryValue: string | undefined = undefined;
    if (fields.isPrimary) {
      if (Array.isArray(fields.isPrimary)) {
        isPrimaryValue = fields.isPrimary[0];
      } else {
        isPrimaryValue = fields.isPrimary;
      }
    }
    const isPrimary = isPrimaryValue === 'true';

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageFile.filepath, {
      folder: 'products',
      resource_type: 'image',
    });

    // Return the Cloudinary URL and other details
    return res.status(200).json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      isPrimary
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ message: 'Error uploading image', error: (error as Error).message });
  }
}
