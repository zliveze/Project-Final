import React from 'react';
import Head from 'next/head';

interface ProductSEOProps {
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  product: {
    name: string;
    slug: string;
    price: number;
    currentPrice: number;
    status: string;
    brand: {
      name: string;
    };
    images: {
      url: string;
      alt: string;
    }[];
    categoryIds?: string[];
    tags?: string[];
  };
  categories?: {
    _id: string;
    name: string;
  }[];
}

const ProductSEO: React.FC<ProductSEOProps> = ({ seo, product, categories }) => {
  // Tạo URL tuyệt đối
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yumin-cosmetics.com';
  const productUrl = `${baseUrl}/product/${product.slug}`;
  
  // Tạo schema.org JSON-LD cho sản phẩm
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(img => img.url),
    description: seo.metaDescription,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'VND',
      price: product.currentPrice,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability: product.status === 'active' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
  };

  // Tạo breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
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
      },
      ...(categories && categories.length > 0 ? [
        {
          '@type': 'ListItem',
          position: 3,
          name: categories[0].name,
          item: `${baseUrl}/category/${categories[0]._id}`,
        }
      ] : []),
      {
        '@type': 'ListItem',
        position: categories && categories.length > 0 ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <Head>
      <title>{seo.metaTitle}</title>
      <meta name="description" content={seo.metaDescription} />
      <meta name="keywords" content={seo.keywords.join(', ')} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={productUrl} />
      <meta property="og:title" content={seo.metaTitle} />
      <meta property="og:description" content={seo.metaDescription} />
      <meta property="og:image" content={product.images[0]?.url} />
      <meta property="product:price:amount" content={product.currentPrice.toString()} />
      <meta property="product:price:currency" content="VND" />
      <meta property="product:availability" content={product.status === 'active' ? 'in stock' : 'out of stock'} />
      <meta property="product:brand" content={product.brand.name} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="product" />
      <meta property="twitter:url" content={productUrl} />
      <meta property="twitter:title" content={seo.metaTitle} />
      <meta property="twitter:description" content={seo.metaDescription} />
      <meta property="twitter:image" content={product.images[0]?.url} />
      
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