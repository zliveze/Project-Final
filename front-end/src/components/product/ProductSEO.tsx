import React from 'react';
import Head from 'next/head';

interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

interface ProductImage {
  url: string;
  alt: string;
}

interface Brand {
  name: string;
}

interface Product {
  name: string;
  slug: string;
  price: number;
  currentPrice?: number;
  status?: string;
  brand?: Brand;
  images?: ProductImage[];
  categoryIds?: string[];
  tags?: string[];
}

interface Category {
  _id: string;
  name: string;
}

interface ProductSEOProps {
  seo: SEO;
  product: Product;
  categories?: Category[];
}

const ProductSEO: React.FC<ProductSEOProps> = ({ seo = {}, product, categories = [] }) => {
  // Nếu không có dữ liệu product, không render
  if (!product) return null;

  // Xử lý fallback cho các trường hợp thiếu dữ liệu
  const productName = product.name || 'Sản phẩm';
  const metaTitle = seo.metaTitle || `${productName} | Yumin Cosmetics`;
  const metaDescription = seo.metaDescription || `Thông tin chi tiết về ${productName}`;
  const keywords = seo.keywords?.length ? seo.keywords.join(', ') : `${productName}, mỹ phẩm, yumin`;
  
  // Tạo URL tuyệt đối
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yumin-cosmetics.com';
  const productUrl = `${baseUrl}/product/${product.slug}`;
  
  // Lấy hình ảnh sản phẩm chính
  const mainImageUrl = product.images && product.images.length > 0 
    ? product.images[0].url 
    : `${baseUrl}/placeholder-product.jpg`;
  
  // Tạo schema.org JSON-LD cho sản phẩm
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    image: product.images?.map(img => img.url) || [mainImageUrl],
    description: metaDescription,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'Yumin Cosmetics',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'VND',
      price: product.currentPrice || product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability: product.status === 'active' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
  };

  // Tạo breadcrumb schema
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Trang chủ',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Sản phẩm',
      item: `${baseUrl}/shop`,
    }
  ];
  
  // Thêm danh mục nếu có
  if (categories && categories.length > 0) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: categories[0].name,
      item: `${baseUrl}/category/${categories[0]._id}`,
    });
  }
  
  // Thêm sản phẩm
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: productName,
    item: productUrl,
  });
  
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={productUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={mainImageUrl} />
      <meta property="product:price:amount" content={(product.currentPrice || product.price).toString()} />
      <meta property="product:price:currency" content="VND" />
      <meta property="product:availability" content={product.status === 'active' ? 'in stock' : 'out of stock'} />
      <meta property="product:brand" content={product.brand?.name || 'Yumin Cosmetics'} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="product" />
      <meta property="twitter:url" content={productUrl} />
      <meta property="twitter:title" content={metaTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={mainImageUrl} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={productUrl} />
      
      {/* JSON-LD structured data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </Head>
  );
};

export default ProductSEO; 