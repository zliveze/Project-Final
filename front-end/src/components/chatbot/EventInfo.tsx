import React, { useState } from 'react';
import { Calendar, Clock, Tag, ChevronRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface EventProduct {
  productId: string;
  productName: string;
  adjustedPrice: number;
  originalPrice: number;
  image: string;
}

interface EventInfo {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startDateFormatted?: string;
  endDateFormatted?: string;
  durationText?: string;
  discountInfo?: string;
  products?: EventProduct[];
}

interface EventInfoProps {
  events: EventInfo[];
  campaigns?: EventInfo[];
  title?: string;
}

export default function EventInfo({ events, campaigns = [], title = "Sự kiện đang diễn ra" }: EventInfoProps) {
  const router = useRouter();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  if ((!events || events.length === 0) && (!campaigns || campaigns.length === 0)) {
    return null;
  }

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateDiscount = (originalPrice: number, adjustedPrice: number) => {
    if (!adjustedPrice || adjustedPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - adjustedPrice) / originalPrice) * 100);
  };

  const toggleEvent = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const toggleCampaign = (id: string) => {
    setExpandedCampaignId(expandedCampaignId === id ? null : id);
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
        {title}
      </h4>

      {/* Sự kiện */}
      {events && events.length > 0 && (
        <div className="space-y-3 mb-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white rounded-lg overflow-hidden border border-gray-200 transition-shadow hover:shadow-md"
            >
              <div 
                className="p-3 cursor-pointer flex justify-between items-center"
                onClick={() => toggleEvent(event.id)}
              >
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900">{event.title}</h5>
                  <div className="flex items-center mt-1">
                    <Clock className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-600">
                      {event.durationText || `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`}
                    </span>
                  </div>
                </div>
                {expandedEventId === event.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {expandedEventId === event.id && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <p className="text-xs text-gray-700 my-2">{event.description}</p>
                  
                  {event.discountInfo && (
                    <p className="text-xs bg-blue-50 p-2 rounded my-2 text-blue-700">
                      {event.discountInfo}
                    </p>
                  )}
                  
                  {event.products && event.products.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-800 mb-2">Sản phẩm khuyến mãi:</h6>
                      <div className="grid grid-cols-1 gap-2">
                        {event.products?.map(product => (
                          <Link 
                            href={`/product/${product.productId}`} 
                            key={product.productId}
                            className="flex items-center p-2 border rounded hover:bg-gray-50"
                          >
                            <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden mr-2">
                              <Image
                                src={product.image || '/404.png'}
                                alt={product.productName}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/404.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="text-xs font-medium truncate">{product.productName}</h6>
                              <div className="flex items-center mt-1">
                                <span className="text-xs font-medium text-pink-600">
                                  {formatPrice(product.adjustedPrice)}
                                </span>
                                {product.originalPrice > product.adjustedPrice && (
                                  <span className="text-xs text-gray-400 line-through ml-1">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chiến dịch */}
      {campaigns && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="bg-white rounded-lg overflow-hidden border border-gray-200 transition-shadow hover:shadow-md"
            >
              <div 
                className="p-3 cursor-pointer flex justify-between items-center"
                onClick={() => toggleCampaign(campaign.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h5 className="text-sm font-medium text-gray-900">{campaign.title}</h5>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                      {(campaign as any).type || 'Chiến dịch'}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-600">
                      {campaign.durationText || `${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`}
                    </span>
                  </div>
                </div>
                {expandedCampaignId === campaign.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {expandedCampaignId === campaign.id && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <p className="text-xs text-gray-700 my-2">{campaign.description}</p>
                  
                  {campaign.products && campaign.products.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-800 mb-2">Sản phẩm trong chiến dịch:</h6>
                      <div className="grid grid-cols-1 gap-2">
                        {campaign.products?.map(product => (
                          <Link 
                            href={`/product/${product.productId}`} 
                            key={product.productId}
                            className="flex items-center p-2 border rounded hover:bg-gray-50"
                          >
                            <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden mr-2">
                              <Image
                                src={product.image || '/404.png'}
                                alt={product.productName}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/404.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="text-xs font-medium truncate">{product.productName}</h6>
                              <div className="flex items-center mt-1">
                                <span className="text-xs font-medium text-blue-600">
                                  {formatPrice(product.adjustedPrice)}
                                </span>
                                {product.originalPrice > product.adjustedPrice && (
                                  <span className="text-xs text-gray-400 line-through ml-1">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 