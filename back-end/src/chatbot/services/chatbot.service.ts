import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeminiService } from './gemini.service';
import { ContextService, ProductContext, CategoryContext, BrandContext, EventContext } from './context.service';
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema';
import {
  SendMessageDto,
  ChatResponseDto,
  GetChatHistoryDto,
  ChatHistoryResponseDto,
  FeedbackDto,
  SearchProductsDto,
  ProductRecommendationDto,
} from '../dto/chat.dto';
import { MessageRole, MessageType } from '../schemas/chat-message.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessageDocument>,
    private geminiService: GeminiService,
    private contextService: ContextService,
  ) {}

  async sendMessage(
    userId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<ChatResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing message for user ${userId}`);
      
      // Generate sessionId if not provided
      const sessionId = sendMessageDto.sessionId || `session_${uuidv4()}`;
      
      // Phân tích intent từ tin nhắn
      const userIntent = await this.analyzeUserIntent(sendMessageDto.message);
      
      // Lấy context phù hợp dựa trên intent và preferences
      const context = await this.buildContext(sendMessageDto, userIntent);
      
      // Lưu tin nhắn người dùng
      const userMessage = await this.saveUserMessage(userId, { ...sendMessageDto, sessionId });
      
      // Tạo prompt với context
      const prompt = this.buildPrompt(sendMessageDto.message, context, sendMessageDto);
      
      // Gọi Gemini AI
      const aiResponse = await this.geminiService.generateChatResponse(prompt);
      
      // Phân tích response để extract các entities được mention
      const extractedEntities = await this.extractEntitiesFromResponse(aiResponse);
      
      // Tìm các từ khóa từ tin nhắn người dùng
      const userKeywords = this.extractKeywordsFromResponse(sendMessageDto.message);
      
      // Lưu tin nhắn AI response
      const processingTime = Date.now() - startTime;
      const botMessage = await this.saveBotMessage(
        userId,
        sessionId,
        aiResponse,
        extractedEntities,
        userIntent,
        processingTime,
        context.contextUsed,
      );
      
      // Gợi ý sản phẩm nếu có
      let recommendedProducts: any[] = [];
      
      // Ưu tiên lấy sản phẩm từ entities đã trích xuất
      if (extractedEntities.products && extractedEntities.products.length > 0) {
        recommendedProducts = extractedEntities.products.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice || product.price,
          brand: product.brand,
          imageUrl: `/images/products/${product.id}.jpg`,
          reason: 'Sản phẩm được đề xuất dựa trên yêu cầu của bạn',
        }));
      } 
      // Nếu không có sản phẩm từ trích xuất, thử lấy từ từ khóa người dùng
      else if (userKeywords.length > 0) {
        const keywordProducts = await Promise.all(
          userKeywords.map(keyword => this.contextService.searchProducts(keyword, 2))
        );
        
        // Gộp và loại bỏ trùng lặp
        const flattenedProducts = keywordProducts.flat();
        const uniqueProducts = this.removeDuplicateProducts(flattenedProducts);
        
        recommendedProducts = uniqueProducts.slice(0, 5).map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice || product.price,
          brand: product.brand,
          imageUrl: `/images/products/${product.id}.jpg`,
          reason: `Sản phẩm liên quan đến "${userKeywords.join(', ')}"`,
        }));
      } 
      // Cuối cùng, thử lấy sản phẩm dựa trên preferences của người dùng
      else {
        recommendedProducts = await this.getProductRecommendations(
          sendMessageDto,
          aiResponse,
          extractedEntities,
        );
      }

      // Đảm bảo luôn có ít nhất 3 sản phẩm được gợi ý
      if (recommendedProducts.length === 0) {
        const randomProducts = this.getRandomProducts(context.products, 3);
        recommendedProducts = randomProducts.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice || product.price,
          brand: product.brand,
          imageUrl: `/images/products/${product.id}.jpg`,
          reason: 'Sản phẩm phổ biến bạn có thể quan tâm',
        }));
      }
      
      this.logger.log(`Message processed successfully for user ${userId}`);
      
      return {
        messageId: (botMessage._id as any).toString(),
        sessionId,
        response: aiResponse,
        type: MessageType.TEXT,
        recommendedProducts,
        relatedCategories: extractedEntities.categories?.map((cat: CategoryContext) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          level: cat.level,
        })) || [],
        relatedBrands: extractedEntities.brands?.map((brand: BrandContext) => ({
          id: brand.id,
          name: brand.name,
          description: brand.description,
          origin: brand.origin,
        })) || [],
        relatedEvents: extractedEntities.events?.map((event: EventContext) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          discountInfo: event.description || '',
          products: event.products || []
        })) || [],
        relatedCampaigns: extractedEntities.campaigns?.map((campaign: any) => ({
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          type: campaign.type,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          products: campaign.products || []
        })) || [],
        metadata: {
          userIntent,
          confidence: 0.85, // Có thể implement confidence scoring
          processingTime,
          contextUsed: context.contextUsed,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể xử lý tin nhắn. Vui lòng thử lại.');
    }
  }

  async getChatHistory(
    userId: string,
    getChatHistoryDto: GetChatHistoryDto,
  ): Promise<ChatHistoryResponseDto> {
    try {
      const { sessionId, page = 1, limit = 20 } = getChatHistoryDto;
      const skip = (page - 1) * limit;

      const filter: any = { userId };
      if (sessionId) {
        filter.sessionId = sessionId;
      }

      const [messages, total] = await Promise.all([
        this.chatMessageModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('attachedProducts.productId')
          .populate('attachedCategories.categoryId')
          .populate('attachedBrands.brandId')
          .populate('attachedEvents.eventId')
          .exec(),
        this.chatMessageModel.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Map messages to correct format
      const formattedMessages = messages.reverse().map(msg => ({
        messageId: (msg._id as any).toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        type: msg.type,
        attachedProducts: msg.attachedProducts || [],
        attachedCategories: msg.attachedCategories || [],
        attachedBrands: msg.attachedBrands || [],
        attachedEvents: msg.attachedEvents || [],
        metadata: msg.metadata,
        isHelpful: msg.isHelpful,
        feedback: msg.feedback,
        createdAt: msg.createdAt,
      }));

      return {
        messages: formattedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        sessionId: sessionId || 'all',
      };
    } catch (error) {
      this.logger.error(`Error getting chat history: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể lấy lịch sử chat.');
    }
  }

  async searchProducts(searchDto: SearchProductsDto): Promise<ProductContext[]> {
    try {
      const { query, limit = 10 } = searchDto;
      return await this.contextService.searchProducts(query, limit);
    } catch (error) {
      this.logger.error(`Error searching products: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể tìm kiếm sản phẩm.');
    }
  }

  private async getProductRecommendations(
    sendMessageDto: SendMessageDto,
    aiResponse: string,
    extractedEntities: any,
  ): Promise<any[]> {
    try {
      // Kiểm tra nếu có sản phẩm được mention trong response
      if (extractedEntities.products && extractedEntities.products.length > 0) {
        return extractedEntities.products.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice || product.price,
          brand: product.brand,
          imageUrl: `/images/products/${product.id}.jpg`, // Thêm đường dẫn hình ảnh
          reason: 'Sản phẩm được đề xuất dựa trên yêu cầu của bạn',
        }));
      }
      
      // Nếu không có sản phẩm được mention, thử tìm sản phẩm dựa trên intent
      const userIntent = await this.analyzeUserIntent(sendMessageDto.message);
      const skinType = sendMessageDto.skinType || '';
      
      // Tìm kiếm sản phẩm dựa trên preferences
      let searchCriteria = '';
      
      if (userIntent === 'makeup_product') {
        if (sendMessageDto.message.toLowerCase().includes('kẻ mắt') || 
            sendMessageDto.message.toLowerCase().includes('eyeliner')) {
          searchCriteria = 'eyeliner kẻ mắt';
        } else if (sendMessageDto.message.toLowerCase().includes('son') || 
                  sendMessageDto.message.toLowerCase().includes('lipstick')) {
          searchCriteria = 'son lipstick';
        } else if (sendMessageDto.message.toLowerCase().includes('phấn mắt') || 
                  sendMessageDto.message.toLowerCase().includes('eyeshadow')) {
          searchCriteria = 'phấn mắt eyeshadow';
        } else {
          searchCriteria = 'trang điểm makeup';
        }
      } else if (userIntent === 'skincare_product') {
        if (skinType) {
          searchCriteria = `skincare ${skinType}`;
        } else {
          searchCriteria = 'skincare';
        }
      } else if (userIntent === 'skin_consultation') {
        searchCriteria = `skincare ${skinType || ''}`;
      } else if (userIntent === 'price_inquiry') {
        // Lấy các sản phẩm trong range giá phù hợp với ngân sách
        searchCriteria = sendMessageDto.budget ? `price ${sendMessageDto.budget}` : 'popular';
      } else if (userIntent === 'brand_inquiry') {
        // Tìm các sản phẩm của thương hiệu được nhắc đến
        const brands = extractedEntities.brands;
        if (brands && brands.length > 0) {
          searchCriteria = brands[0].name;
        } else {
          searchCriteria = 'popular brands';
        }
      } else {
        // Mặc định lấy các sản phẩm phổ biến
        searchCriteria = 'popular';
      }
      
      // Tìm kiếm sản phẩm từ context service
      const products = await this.contextService.searchProducts(searchCriteria, 5);
      
      // Map products to recommendation format
      return products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug || '',
        price: product.price,
        currentPrice: product.currentPrice || product.price,
        brand: product.brand,
        imageUrl: `/images/products/${product.id}.jpg`, // Thêm đường dẫn hình ảnh
        reason: `Sản phẩm phù hợp với nhu cầu của bạn`,
      }));
    } catch (error) {
      this.logger.warn(`Error getting product recommendations: ${error.message}`);
      return [];
    }
  }

  async provideFeedback(
    userId: string,
    messageId: string,
    feedbackDto: FeedbackDto,
  ): Promise<void> {
    try {
      await this.chatMessageModel.findByIdAndUpdate(messageId, {
        isHelpful: feedbackDto.isHelpful,
        feedback: feedbackDto.feedback,
        updatedAt: new Date(),
      });

      this.logger.log(`Feedback provided for message ${messageId}`);
    } catch (error) {
      this.logger.error(`Error providing feedback: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể gửi phản hồi.');
    }
  }

  private async analyzeUserIntent(message: string): Promise<string> {
    // Đơn giản hóa intent analysis bằng keyword matching
    // Có thể mở rộng với ML models sau này
    const message_lower = message.toLowerCase();
    
    // Tìm kiếm sản phẩm
    if (message_lower.includes('tìm') || message_lower.includes('search') || 
        message_lower.includes('recommend') || message_lower.includes('gợi ý') ||
        message_lower.includes('mua') || message_lower.includes('tư vấn')) {
      return 'product_search';
    }
    
    // Tư vấn về loại da
    if (message_lower.includes('da dầu') || message_lower.includes('da khô') || 
        message_lower.includes('da nhạy cảm') || message_lower.includes('da mụn') ||
        message_lower.includes('da hỗn hợp') || message_lower.includes('da thường')) {
      return 'skin_consultation';
    }
    
    // Tìm kiếm mỹ phẩm cụ thể
    const makeupKeywords = ['son', 'kẻ mắt', 'phấn', 'mascara', 'cushion', 'foundation', 
                          'kem nền', 'eyeliner', 'lipstick', 'phấn mắt', 'eyeshadow', 
                          'má hồng', 'blush', 'bút', 'chì', 'makeup', 'trang điểm'];
    
    for (const keyword of makeupKeywords) {
      if (message_lower.includes(keyword)) {
        return 'makeup_product';
      }
    }
    
    // Tìm kiếm sản phẩm chăm sóc da
    const skincareKeywords = ['kem', 'serum', 'mask', 'mặt nạ', 'toner', 'sữa rửa mặt', 
                            'cleaner', 'kem chống nắng', 'sunscreen', 'dưỡng ẩm', 
                            'lotion', 'skincare', 'chăm sóc da'];
    
    for (const keyword of skincareKeywords) {
      if (message_lower.includes(keyword)) {
        return 'skincare_product';
      }
    }
    
    // Hỏi về giá
    if (message_lower.includes('giá') || message_lower.includes('price') || 
        message_lower.includes('budget') || message_lower.includes('bao nhiêu') ||
        message_lower.includes('rẻ') || message_lower.includes('đắt')) {
      return 'price_inquiry';
    }
    
    // Hỏi về thương hiệu
    if (message_lower.includes('thương hiệu') || message_lower.includes('brand') ||
        message_lower.includes('hãng') || message_lower.includes('công ty')) {
      return 'brand_inquiry';
    }
    
    // Hỏi về sự kiện và khuyến mãi
    if (message_lower.includes('sự kiện') || message_lower.includes('event') || 
        message_lower.includes('khuyến mãi') || message_lower.includes('sale') ||
        message_lower.includes('giảm giá') || message_lower.includes('ưu đãi')) {
      return 'event_inquiry';
    }
    
    return 'general_consultation';
  }

  private async buildContext(sendMessageDto: SendMessageDto, userIntent: string): Promise<any> {
    const context: {
      products: ProductContext[];
      categories: CategoryContext[];
      brands: BrandContext[];
      events: EventContext[];
      campaigns: any[];
      contextUsed: string[];
    } = {
      products: [],
      categories: [],
      brands: [],
      events: [],
      campaigns: [],
      contextUsed: [],
    };

    try {
      // Lấy context dựa trên intent
      switch (userIntent) {
        case 'product_search':
        case 'skin_consultation':
          if (sendMessageDto.skinType) {
            context.products = await this.contextService.getProductsBySkinType(sendMessageDto.skinType);
          } else if (sendMessageDto.concerns && sendMessageDto.concerns.length > 0) {
            context.products = await this.contextService.getProductsByConcern(sendMessageDto.concerns[0]);
          } else {
            context.products = await this.contextService.searchProducts('', 20);
          }
          context.contextUsed.push('products');
          break;

        case 'brand_inquiry':
          context.brands = await this.contextService.getBrandsContext();
          context.contextUsed.push('brands');
          break;

        case 'event_inquiry':
          context.events = await this.contextService.getEventsContext();
          context.campaigns = await this.contextService.getCampaignsContext();
          context.contextUsed.push('events', 'campaigns');
          break;

        default:
          // Lấy tất cả context cho general consultation
          const fullContext = await this.contextService.getFullContext();
          context.categories = fullContext.categories as CategoryContext[];
          context.brands = fullContext.brands as BrandContext[];
          context.events = fullContext.events as EventContext[];
          context.campaigns = fullContext.campaigns as any[];
          context.contextUsed.push('categories', 'brands', 'events', 'campaigns');
          break;
      }
    } catch (error) {
      this.logger.warn(`Error building context: ${error.message}`);
    }

    return context;
  }

  private buildPrompt(message: string, context: any, userPreferences: SendMessageDto): string {
    // Tạo system message cho chatbot
    const systemInstructions = `
    Bạn là Yumin Assistant, trợ lý ảo của website thương mại điện tử Yumin Beauty. 
    Nhiệm vụ của bạn là giúp khách hàng tìm hiểu về sản phẩm mỹ phẩm, giải đáp thắc mắc và gợi ý sản phẩm phù hợp.
    
    Quy tắc:
    1. Trả lời ngắn gọn, chính xác, thân thiện và chuyên nghiệp.
    2. Chỉ sử dụng thông tin có trong ngữ cảnh được cung cấp bên dưới.
    3. Luôn nhắc đến sản phẩm cụ thể từ Yumin Beauty khi được hỏi về sản phẩm.
    4. Nếu không chắc chắn hoặc không có thông tin, hãy dẫn dắt khách hàng cung cấp thêm thông tin để có thể tư vấn tốt hơn.
    5. Nhắc đến các sự kiện khuyến mãi hiện tại nếu phù hợp.
    6. Khi nhắc đến sản phẩm, hãy cung cấp tên đầy đủ, giá và thương hiệu.
    7. Nhắc đến cả tên sản phẩm và ID sản phẩm để hệ thống có thể hiển thị chi tiết sản phẩm đó cho người dùng.
    8. Khi nói về kẻ mắt, nhớ nhắc đến tên các sản phẩm eyeliner cụ thể có trong hệ thống.
    
    Hướng dẫn bổ sung:
    1. Khi nhắc đến sản phẩm, hãy nêu rõ "Tôi gợi ý bạn xem sản phẩm X của thương hiệu Y" để hệ thống có thể phát hiện và hiển thị sản phẩm đó.
    2. Với các câu hỏi về trang điểm, đặc biệt là kẻ mắt (eyeliner), hãy nhắc đến ít nhất 2-3 sản phẩm cụ thể từ các thương hiệu phổ biến.
    3. Với các sự kiện khuyến mãi, hãy nhắc rõ ngày bắt đầu và kết thúc theo định dạng dd/MM/yyyy.
    
    Thông tin ngữ cảnh:
    ${context.contextText || ''}
    
    Thông tin về khách hàng:
    - Loại da: ${userPreferences.skinType || 'Chưa xác định'}
    - Các vấn đề quan tâm: ${userPreferences.concerns?.join(', ') || 'Chưa xác định'}
    - Ngân sách: ${userPreferences.budget ? `${userPreferences.budget} VNĐ` : 'Chưa xác định'}
    - Thương hiệu yêu thích: ${userPreferences.preferredBrands?.join(', ') || 'Chưa xác định'}
    `;
    
    // Biểu diễn cuộc hội thoại cho prompt
    const prompt = `
    ${systemInstructions}
    
    Tin nhắn người dùng: ${message}
    
    Trả lời: 
    `;
    
    return prompt;
  }

  private async extractEntitiesFromResponse(response: string): Promise<any> {
    // Đơn giản hóa entity extraction bằng keyword matching
    // Có thể mở rộng với NLP models sau này
    const entities = {
      products: [] as ProductContext[],
      categories: [] as CategoryContext[],
      brands: [] as BrandContext[],
      events: [] as EventContext[],
      campaigns: [] as any[],
    };

    try {
      // Extract từ response dựa trên context đã có
      const fullContext = await this.contextService.getFullContext();

      // Tìm brands được mention
      entities.brands = fullContext.brands.filter(brand => 
        response.toLowerCase().includes(brand.name.toLowerCase())
      );

      // Tìm categories được mention
      entities.categories = fullContext.categories.filter(category => 
        response.toLowerCase().includes(category.name.toLowerCase())
      );

      // Tìm events được mention
      entities.events = fullContext.events.filter(event => 
        response.toLowerCase().includes(event.title.toLowerCase())
      );

      // Tìm campaigns được mention
      entities.campaigns = fullContext.campaigns.filter(campaign => 
        response.toLowerCase().includes(campaign.title.toLowerCase())
      );

      // Tìm products được mention (dựa trên tên)
      entities.products = fullContext.products.filter(product => 
        response.toLowerCase().includes(product.name.toLowerCase())
      );

      // Phân tích nội dung response để tìm kiếm từ khóa liên quan đến sản phẩm
      const keywords = this.extractKeywordsFromResponse(response);
      
      // Nếu không tìm thấy sản phẩm nào bằng tên, thử tìm bằng mô tả và từ khóa
      if (entities.products.length === 0 && keywords.length > 0) {
        // Tìm kiếm sản phẩm dựa trên từ khóa trích xuất
        const keywordProducts = await Promise.all(
          keywords.map(keyword => this.contextService.searchProducts(keyword, 2))
        );
        
        // Gộp và loại bỏ trùng lặp
        const flattenedProducts = keywordProducts.flat();
        const uniqueProducts = this.removeDuplicateProducts(flattenedProducts);
        
        // Lấy tối đa 5 sản phẩm
        entities.products = uniqueProducts.slice(0, 5);
      }
      
      // Nếu vẫn không tìm thấy sản phẩm nào, lấy sản phẩm bán chạy
      if (entities.products.length === 0) {
        entities.products = fullContext.products
          .filter(product => product.flags?.isBestSeller)
          .slice(0, 5);
      }

      // Nếu vẫn không có sản phẩm nào, lấy ngẫu nhiên 3 sản phẩm
      if (entities.products.length === 0) {
        entities.products = this.getRandomProducts(fullContext.products, 3);
      }

      // Bổ sung thông tin hình ảnh cho sản phẩm nếu chưa có
      entities.products = entities.products.map(product => ({
        ...product,
        imageUrl: `/images/products/${product.id}.jpg`
      }));
    } catch (error) {
      this.logger.warn(`Error extracting entities: ${error.message}`);
    }

    return entities;
  }

  // Phương thức hỗ trợ trích xuất từ khóa từ phản hồi
  private extractKeywordsFromResponse(response: string): string[] {
    const keywords: string[] = [];
    
    // Các từ khóa liên quan đến mỹ phẩm
    const cosmeticKeywords = [
      'son', 'lipstick', 'kem', 'cream', 'serum', 'mask', 'mặt nạ', 'kẻ mắt', 'eyeliner',
      'mascara', 'phấn', 'powder', 'foundation', 'cushion', 'dưỡng', 'toner', 'sữa rửa mặt',
      'cleanser', 'gel', 'lotion', 'sunscreen', 'kem chống nắng', 'essence', 'da dầu', 'da khô',
      'da nhạy cảm', 'mụn', 'thâm', 'nám', 'lão hóa', 'chống nhăn', 'dưỡng ẩm', 'sáng da',
      'nước hoa', 'perfume', 'trang điểm', 'makeup', 'chăm sóc da', 'skincare', 'dầu gội',
      'shampoo', 'dầu xả', 'conditioner', 'nước tẩy trang', 'makeup remover', 'bút', 'phấn mắt', 
      'eyeshadow', 'chì kẻ mắt', 'môi', 'lips', 'mắt', 'eye', 'mặt', 'face', 'tóc', 'hair'
    ];
    
    // Phân tích từng từ trong phản hồi
    const words = response.toLowerCase().split(/\s+/);
    for (const word of words) {
      // Kiểm tra từ có nằm trong danh sách từ khóa không
      if (cosmeticKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
        if (!keywords.includes(word) && word.length > 2) {
          keywords.push(word);
        }
      }
    }
    
    // Tìm kiếm các thương hiệu mỹ phẩm thường gặp
    const brands = [
      'loreal', "l'oreal", 'maybelline', 'nivea', 'neutrogena', 'olay', 'garnier', 
      'la roche-posay', 'bioderma', 'the ordinary', 'innisfree', 'laneige', 'the face shop',
      'mac', 'nyx', 'clinique', 'shiseido', 'estee lauder', 'lancome', 'ysl', 'dior',
      'chanel', 'revlon', 'bourjois', 'etude house', 'skinfood', 'some by mi', 'cosrx',
      'senka', 'biore', 'vichy', 'avene', 'eucerin', 'cerave', 'laroche', 'kiehl'
    ];
    
    for (const brand of brands) {
      if (response.toLowerCase().includes(brand) && !keywords.includes(brand)) {
        keywords.push(brand);
      }
    }
    
    return keywords;
  }

  // Loại bỏ sản phẩm trùng lặp
  private removeDuplicateProducts(products: ProductContext[]): ProductContext[] {
    const uniqueIds = new Set<string>();
    const uniqueProducts: ProductContext[] = [];
    
    for (const product of products) {
      if (!uniqueIds.has(product.id)) {
        uniqueIds.add(product.id);
        uniqueProducts.push(product);
      }
    }
    
    return uniqueProducts;
  }

  // Lấy ngẫu nhiên số lượng sản phẩm từ danh sách
  private getRandomProducts(products: ProductContext[], count: number): ProductContext[] {
    // Tạo bản sao để không làm thay đổi mảng ban đầu
    const productsCopy = [...products];
    const result: ProductContext[] = [];
    
    // Lấy ngẫu nhiên các sản phẩm
    for (let i = 0; i < count && productsCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * productsCopy.length);
      result.push(productsCopy[randomIndex]);
      productsCopy.splice(randomIndex, 1);
    }
    
    return result;
  }

  private async saveUserMessage(
    userId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<ChatMessageDocument> {
    const userMessage = new this.chatMessageModel({
      userId,
      sessionId: sendMessageDto.sessionId,
      content: sendMessageDto.message,
      role: MessageRole.USER,
      type: MessageType.TEXT,
      attachedProducts: [],
      attachedCategories: [],
      attachedBrands: [],
      attachedEvents: [],
    });

    return await userMessage.save();
  }

  private async saveBotMessage(
    userId: string,
    sessionId: string,
    response: string,
    extractedEntities: any,
    userIntent: string,
    processingTime: number,
    contextUsed: string[],
  ): Promise<ChatMessageDocument> {
    const botMessage = new this.chatMessageModel({
      userId,
      sessionId,
      content: response,
      role: MessageRole.ASSISTANT,
      type: MessageType.TEXT,
      attachedProducts: extractedEntities.products?.map((p: any) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        currentPrice: p.currentPrice,
        brand: p.brand,
        reason: 'Mentioned in response',
      })) || [],
      attachedCategories: extractedEntities.categories?.map((c: any) => ({
        categoryId: c.id,
        name: c.name,
        description: c.description,
        level: c.level,
      })) || [],
      attachedBrands: extractedEntities.brands?.map((b: any) => ({
        brandId: b.id,
        name: b.name,
        description: b.description,
        origin: b.origin,
      })) || [],
      attachedEvents: extractedEntities.events?.map((e: any) => ({
        eventId: e.id,
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
      })) || [],
      metadata: {
        userIntent,
        confidence: 0.85,
        processingTime,
        contextUsed,
      },
    });

    return await botMessage.save();
  }
} 