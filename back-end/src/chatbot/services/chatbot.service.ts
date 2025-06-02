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
      
      // BƯỚC 1: AI phân tích câu hỏi và tạo search queries
      this.logger.log(`Analyzing user question: "${sendMessageDto.message}"`);
      const searchQueries = await this.generateSearchQueriesWithAI(sendMessageDto.message);

      // BƯỚC 2: Search database với queries do AI tạo ra
      let searchResults: ProductContext[] = [];
      for (const query of searchQueries) {
        const products = await this.contextService.searchProducts(query, 10);
        if (products.length > 0) {
          searchResults = [...searchResults, ...products];
          this.logger.log(`Query "${query}" found ${products.length} products`);
        }
      }

      // Loại bỏ trùng lặp và giới hạn kết quả
      searchResults = this.removeDuplicateProducts(searchResults).slice(0, 20);

      // BƯỚC 3: Phân tích intent và build context
      const userIntent = await this.analyzeUserIntent(sendMessageDto.message);
      const context = await this.buildContext(sendMessageDto, userIntent);

      // Lưu tin nhắn người dùng
      const userMessage = await this.saveUserMessage(userId, { ...sendMessageDto, sessionId });

      // BƯỚC 4: AI trả lời dựa trên kết quả search thực tế
      let aiResponse: string;
      let extractedEntities: any;
      let userKeywords: string[];

      try {
        // Tạo prompt với kết quả search thực tế
        const promptWithSearchResults = this.buildPromptWithSearchResults(
          sendMessageDto.message,
          searchResults,
          context,
          sendMessageDto
        );

        aiResponse = await this.geminiService.generateChatResponse(promptWithSearchResults);

        // Phân tích response để extract các entities được mention
        extractedEntities = await this.extractEntitiesFromResponse(aiResponse);

        // Tìm các từ khóa từ tin nhắn người dùng
        userKeywords = this.extractKeywordsFromResponse(sendMessageDto.message);
      } catch (geminiError) {
        this.logger.warn(`Gemini API error: ${geminiError.message}`);

        // Fallback response dựa trên search results
        if (searchResults.length > 0) {
          aiResponse = `Dựa trên yêu cầu của bạn, tôi tìm thấy ${searchResults.length} sản phẩm phù hợp. Bạn có thể xem các sản phẩm được gợi ý bên dưới.`;
        } else {
          // Kiểm tra nếu là lỗi quá tải (503) hoặc các lỗi API khác
          if (geminiError.message.includes('503') ||
              geminiError.message.includes('overloaded') ||
              geminiError.message.includes('UNAVAILABLE') ||
              geminiError.message.includes('Request failed with status code 503')) {

            aiResponse = 'Hiện tại hệ thống đang có quá nhiều lượt truy cập dẫn đến quá tải, hãy thử lại sau ít phút. Trong thời gian chờ đợi, bạn có thể xem các sản phẩm phổ biến dưới đây.';
          } else {
            aiResponse = 'Xin lỗi, hiện tại tôi gặp một chút vấn đề kỹ thuật. Vui lòng thử lại sau ít phút. Trong thời gian này, bạn có thể xem các sản phẩm được gợi ý dưới đây.';
          }
        }

        // Tạo entities từ search results hoặc mặc định
        extractedEntities = {
          products: searchResults.slice(0, 5), // Sử dụng search results
          categories: [],
          brands: [],
          events: [],
          campaigns: [],
        };

        // Trích xuất từ khóa từ tin nhắn người dùng
        userKeywords = this.extractKeywordsFromResponse(sendMessageDto.message);
      }
      
      // Kiểm tra xem có nên gợi ý sản phẩm hay không
      // Nếu có lỗi Gemini (aiResponse chứa thông báo lỗi), luôn hiển thị sản phẩm gợi ý
      const isGeminiError = aiResponse.includes('Hiện tại hệ thống đang có quá nhiều lượt truy cập') ||
                           aiResponse.includes('Xin lỗi, hiện tại tôi gặp một chút vấn đề kỹ thuật');
      const shouldRecommendProducts = isGeminiError || this.shouldRecommendProducts(userIntent, sendMessageDto.message, extractedEntities);

      // Gợi ý sản phẩm nếu cần thiết
      let recommendedProducts: any[] = [];
      this.logger.log(`Should recommend products: ${shouldRecommendProducts}, Search results: ${searchResults.length}, Extracted entities products: ${extractedEntities.products?.length || 0}`);

      if (shouldRecommendProducts) {
        // BƯỚC 1: Sử dụng AI để trích xuất sản phẩm được đề cập trong response
        const mentionedProducts = await this.extractMentionedProductsWithAI(aiResponse, searchResults);

        if (mentionedProducts.length > 0) {
          this.logger.log(`AI extracted ${mentionedProducts.length} mentioned products from response`);
          recommendedProducts = mentionedProducts;
        }
        // BƯỚC 2: Fallback - lấy sản phẩm từ search results
        else if (searchResults.length > 0) {
          this.logger.log(`Using ${searchResults.length} products from search results for recommendations`);
          recommendedProducts = searchResults.slice(0, 5).map(product => {
            // Lấy ảnh chính hoặc ảnh đầu tiên
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/404.png';

            return {
              id: product.id,
              name: product.name,
              slug: product.slug || '',
              price: product.price,
              currentPrice: product.currentPrice || product.price,
              brand: product.brand,
              imageUrl: imageUrl,
              reason: 'Sản phẩm phù hợp với yêu cầu của bạn',
            };
          });
        }
        // BƯỚC 2: Fallback - lấy từ entities đã trích xuất
        else if (extractedEntities.products && extractedEntities.products.length > 0) {
          recommendedProducts = extractedEntities.products.map(product => {
            // Lấy ảnh chính hoặc ảnh đầu tiên
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/404.png';

            return {
              id: product.id,
              name: product.name,
              slug: product.slug || '',
              price: product.price,
              currentPrice: product.currentPrice || product.price,
              brand: product.brand,
              imageUrl: imageUrl,
              reason: 'Sản phẩm được đề xuất dựa trên yêu cầu của bạn',
            };
          });
        }
        // Nếu không có sản phẩm từ trích xuất, sử dụng smart search
        else if (userKeywords.length > 0) {
          // Thử smart search trước
          const smartSearchProducts = await this.smartProductSearch(sendMessageDto.message, 5);

          if (smartSearchProducts.length > 0) {
            recommendedProducts = smartSearchProducts.map(product => {
              // Lấy ảnh chính hoặc ảnh đầu tiên
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
              const imageUrl = primaryImage?.url || '/404.png';

              return {
                id: product.id,
                name: product.name,
                slug: product.slug || '',
                price: product.price,
                currentPrice: product.currentPrice || product.price,
                brand: product.brand,
                imageUrl: imageUrl,
                reason: 'Sản phẩm phù hợp với yêu cầu của bạn',
              };
            });
          } else {
            // Fallback: tìm kiếm theo từ khóa truyền thống
            const keywordProducts = await Promise.all(
              userKeywords.map(keyword => this.contextService.searchProducts(keyword, 2))
            );

            // Gộp và loại bỏ trùng lặp
            const flattenedProducts = keywordProducts.flat();
            const uniqueProducts = this.removeDuplicateProducts(flattenedProducts);

            recommendedProducts = uniqueProducts.slice(0, 5).map(product => {
              // Lấy ảnh chính hoặc ảnh đầu tiên
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
              const imageUrl = primaryImage?.url || '/404.png';

              return {
                id: product.id,
                name: product.name,
                slug: product.slug || '',
                price: product.price,
                currentPrice: product.currentPrice || product.price,
                brand: product.brand,
                imageUrl: imageUrl,
                reason: `Sản phẩm liên quan đến "${userKeywords.join(', ')}"`,
              };
            });
          }
        }
        // Cuối cùng, thử smart search hoặc lấy sản phẩm dựa trên preferences
        else {
          // Thử smart search trước
          const smartSearchProducts = await this.smartProductSearch(sendMessageDto.message, 5);

          if (smartSearchProducts.length > 0) {
            recommendedProducts = smartSearchProducts.map(product => {
              // Lấy ảnh chính hoặc ảnh đầu tiên
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
              const imageUrl = primaryImage?.url || '/404.png';

              return {
                id: product.id,
                name: product.name,
                slug: product.slug || '',
                price: product.price,
                currentPrice: product.currentPrice || product.price,
                brand: product.brand,
                imageUrl: imageUrl,
                reason: 'Sản phẩm phù hợp với yêu cầu của bạn',
              };
            });
          } else {
            // Fallback: sử dụng logic cũ
            recommendedProducts = await this.getProductRecommendations(
              sendMessageDto,
              aiResponse,
              extractedEntities,
            );
          }
        }

        // Đảm bảo luôn có ít nhất 3 sản phẩm được gợi ý (chỉ khi shouldRecommendProducts = true)
        if (recommendedProducts.length === 0) {
          // Nếu context.products rỗng, lấy sản phẩm từ database
          let productsToUse = context.products;
          if (!productsToUse || productsToUse.length === 0) {
            try {
              // Lấy sản phẩm phổ biến từ database
              productsToUse = await this.contextService.searchProducts('', 10);
            } catch (error) {
              this.logger.warn(`Error getting fallback products: ${error.message}`);
              productsToUse = [];
            }
          }

          const randomProducts = this.getRandomProducts(productsToUse, 5);
          recommendedProducts = randomProducts.map(product => {
            // Lấy ảnh chính hoặc ảnh đầu tiên
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/404.png';

            return {
              id: product.id,
              name: product.name,
              slug: product.slug || '',
              price: product.price,
              currentPrice: product.currentPrice || product.price,
              brand: product.brand,
              imageUrl: imageUrl,
              reason: isGeminiError ? 'Sản phẩm phổ biến bạn có thể quan tâm' : 'Sản phẩm phổ biến bạn có thể quan tâm',
            };
          });
        }
      }

      // Lưu tin nhắn AI response sau khi đã xử lý xong
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
        return extractedEntities.products.map(product => {
          // Lấy ảnh chính hoặc ảnh đầu tiên
          const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
          const imageUrl = primaryImage?.url || '/404.png';

          return {
            id: product.id,
            name: product.name,
            slug: product.slug || '',
            price: product.price,
            currentPrice: product.currentPrice || product.price,
            brand: product.brand,
            imageUrl: imageUrl,
            reason: 'Sản phẩm được đề xuất dựa trên yêu cầu của bạn',
          };
        });
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
      return products.map(product => {
        // Lấy ảnh chính hoặc ảnh đầu tiên
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        const imageUrl = primaryImage?.url || '/404.png';

        return {
          id: product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice || product.price,
          brand: product.brand,
          imageUrl: imageUrl,
          reason: `Sản phẩm phù hợp với nhu cầu của bạn`,
        };
      });
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

  private shouldRecommendProducts(userIntent: string, message: string, extractedEntities: any): boolean {
    // Các intent luôn cần gợi ý sản phẩm
    const productRelatedIntents = [
      'product_search',
      'makeup_product',
      'skincare_product',
      'skin_consultation',
      'price_inquiry',
      'brand_inquiry'
    ];

    // Nếu intent liên quan đến sản phẩm
    if (productRelatedIntents.includes(userIntent)) {
      return true;
    }

    // Nếu có sản phẩm được trích xuất từ response
    if (extractedEntities.products && extractedEntities.products.length > 0) {
      return true;
    }

    // Kiểm tra từ khóa trong tin nhắn
    const message_lower = message.toLowerCase();
    const productKeywords = [
      'mua', 'tìm', 'gợi ý', 'recommend', 'tư vấn', 'sản phẩm',
      'son', 'kẻ mắt', 'phấn', 'mascara', 'kem', 'serum', 'toner',
      'skincare', 'makeup', 'trang điểm', 'chăm sóc da',
      'giá', 'price', 'budget', 'bao nhiêu', 'rẻ', 'đắt'
    ];

    // Nếu tin nhắn chứa từ khóa liên quan đến sản phẩm
    for (const keyword of productKeywords) {
      if (message_lower.includes(keyword)) {
        return true;
      }
    }

    // Các trường hợp không nên gợi ý sản phẩm
    const generalGreetings = [
      'xin chào', 'hello', 'hi', 'chào bạn', 'chào',
      'cảm ơn', 'thank you', 'thanks', 'tạm biệt', 'bye',
      'bạn là ai', 'who are you', 'bạn có thể làm gì',
      'what can you do', 'giúp tôi', 'help me',
      'thông tin', 'information', 'hướng dẫn', 'guide'
    ];

    // Nếu là lời chào hoặc câu hỏi chung
    for (const greeting of generalGreetings) {
      if (message_lower.includes(greeting)) {
        return false;
      }
    }

    // Mặc định không gợi ý sản phẩm cho general consultation
    return userIntent !== 'general_consultation';
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
          // Thêm sản phẩm để có fallback khi Gemini lỗi
          context.products = await this.contextService.searchProducts('', 10);
          context.contextUsed.push('brands', 'products');
          break;

        case 'event_inquiry':
          context.events = await this.contextService.getEventsContext();
          context.campaigns = await this.contextService.getCampaignsContext();
          // Thêm sản phẩm để có fallback khi Gemini lỗi
          context.products = await this.contextService.searchProducts('', 10);
          context.contextUsed.push('events', 'campaigns', 'products');
          break;

        default:
          // Lấy tất cả context cho general consultation
          const fullContext = await this.contextService.getFullContext();
          context.products = fullContext.products as ProductContext[];
          context.categories = fullContext.categories as CategoryContext[];
          context.brands = fullContext.brands as BrandContext[];
          context.events = fullContext.events as EventContext[];
          context.campaigns = fullContext.campaigns as any[];
          context.contextUsed.push('products', 'categories', 'brands', 'events', 'campaigns');
          break;
      }
    } catch (error) {
      this.logger.warn(`Error building context: ${error.message}`);
    }

    return context;
  }

  // Phương thức mới: Build prompt với kết quả search thực tế
  private buildPromptWithSearchResults(
    message: string,
    searchResults: ProductContext[],
    context: any,
    userPreferences: SendMessageDto
  ): string {
    // Tạo danh sách sản phẩm từ search results - KHÔNG BAO GỒM ID
    let productList = '';
    if (searchResults.length > 0) {
      productList = '\n=== SẢN PHẨM TÌM THẤY TRONG DATABASE ===\n';
      searchResults.forEach((product, index) => {
        productList += `${index + 1}. ${product.name}\n`;
        productList += `   - Giá: ${product.currentPrice || product.price}đ\n`;
        productList += `   - Thương hiệu: ${product.brand}\n`;
        if (product.description) {
          productList += `   - Mô tả: ${product.description}\n`;
        }
        productList += '\n';
      });
    } else {
      productList = '\n=== KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP ===\n';
    }

    // Tạo contextText từ dữ liệu khác (events, campaigns, etc.)
    const contextText = this.buildContextText(context);

    // Hướng dẫn hệ thống cho AI
    const systemInstructions = `
Bạn là Yumin AI Assistant - trợ lý thông minh của Yumin Beauty, website bán mỹ phẩm hàng đầu Việt Nam.

NHIỆM VỤ CHÍNH:
- Tư vấn sản phẩm mỹ phẩm dựa trên KẾT QUẢ TÌM KIẾM THỰC TẾ từ database
- Cung cấp thông tin chính xác về sản phẩm, thương hiệu, khuyến mãi
- Hỗ trợ chăm sóc da và làm đẹp
- Trả lời thân thiện, chuyên nghiệp và hữu ích

NGUYÊN TẮC QUAN TRỌNG:
1. ✅ CHỈ giới thiệu sản phẩm có trong "SẢN PHẨM TÌM THẤY TRONG DATABASE"
2. ✅ Luôn đề cập ID sản phẩm khi giới thiệu: "Tên sản phẩm (ID: xxx)"
3. ❌ TUYỆT ĐỐI KHÔNG bịa đặt sản phẩm không có trong danh sách
4. ✅ Nếu không tìm thấy sản phẩm phù hợp, hãy thành thật nói "không tìm thấy"
5. ✅ Ưu tiên sản phẩm phù hợp với loại da và ngân sách của khách hàng

${productList}

THÔNG TIN NGỮ CẢNH KHÁC:
${contextText}

Thông tin về khách hàng:
- Loại da: ${userPreferences.skinType || 'Chưa xác định'}
- Các vấn đề quan tâm: ${userPreferences.concerns?.join(', ') || 'Chưa xác định'}
- Ngân sách: ${userPreferences.budget ? `${userPreferences.budget} VNĐ` : 'Chưa xác định'}
- Thương hiệu yêu thích: ${userPreferences.preferredBrands?.join(', ') || 'Chưa xác định'}

HƯỚNG DẪN TRẢ LỜI:
- Nếu tìm thấy sản phẩm phù hợp: Giới thiệu cụ thể với tên, giá, thương hiệu (KHÔNG bao gồm ID)
- Nếu không tìm thấy: Nói thành thật "Rất tiếc, hiện tại chúng tôi không có sản phẩm [tên sản phẩm] trong kho"
- Luôn gợi ý sản phẩm thay thế nếu có trong danh sách
- TUYỆT ĐỐI KHÔNG được để lộ ID sản phẩm trong câu trả lời
`;

    const prompt = `
${systemInstructions}

Câu hỏi khách hàng: "${message}"

Hãy trả lời dựa trên danh sách sản phẩm tìm thấy ở trên:
`;

    return prompt;
  }

  private buildPrompt(message: string, context: any, userPreferences: SendMessageDto): string {
    // Tạo contextText từ dữ liệu thực
    const contextText = this.buildContextText(context);

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
    ${contextText}

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

  private buildContextText(context: any): string {
    let contextText = '';

    // Thêm thông tin Events
    if (context.events && context.events.length > 0) {
      contextText += '\n=== SỰ KIỆN KHUYẾN MÃI HIỆN TẠI ===\n';
      context.events.forEach((event: any) => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        // Format ngày theo dd/MM/yyyy
        const formatDate = (date: Date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        contextText += `\nSự kiện: ${event.title}\n`;
        contextText += `Mô tả: ${event.description}\n`;
        contextText += `Thời gian: Từ ${formatDate(startDate)} đến ${formatDate(endDate)}\n`;

        if (event.products && event.products.length > 0) {
          contextText += `Sản phẩm khuyến mãi:\n`;
          event.products.slice(0, 10).forEach((product: any) => {
            const discount = product.originalPrice > 0 ?
              Math.round((1 - product.adjustedPrice / product.originalPrice) * 100) : 0;
            contextText += `- ${product.productName}: ${product.adjustedPrice.toLocaleString()}đ (giảm ${discount}% từ ${product.originalPrice.toLocaleString()}đ)\n`;
          });
          if (event.products.length > 10) {
            contextText += `... và ${event.products.length - 10} sản phẩm khác\n`;
          }
        }
        contextText += '\n';
      });
    }

    // Thêm thông tin Campaigns
    if (context.campaigns && context.campaigns.length > 0) {
      contextText += '\n=== CHIẾN DỊCH KHUYẾN MÃI ===\n';
      context.campaigns.forEach((campaign: any) => {
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);

        const formatDate = (date: Date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        contextText += `\nChiến dịch: ${campaign.title}\n`;
        contextText += `Loại: ${campaign.type}\n`;
        contextText += `Mô tả: ${campaign.description}\n`;
        contextText += `Thời gian: Từ ${formatDate(startDate)} đến ${formatDate(endDate)}\n`;

        if (campaign.products && campaign.products.length > 0) {
          contextText += `Sản phẩm tham gia:\n`;
          campaign.products.slice(0, 10).forEach((product: any) => {
            const discount = product.originalPrice > 0 ?
              Math.round((1 - product.adjustedPrice / product.originalPrice) * 100) : 0;
            contextText += `- ${product.productName}: ${product.adjustedPrice.toLocaleString()}đ (giảm ${discount}% từ ${product.originalPrice.toLocaleString()}đ)\n`;
          });
          if (campaign.products.length > 10) {
            contextText += `... và ${campaign.products.length - 10} sản phẩm khác\n`;
          }
        }
        contextText += '\n';
      });
    }

    // Thêm thông tin Products (nếu có)
    if (context.products && context.products.length > 0) {
      contextText += '\n=== SẢN PHẨM CÓ SẴN ===\n';
      context.products.slice(0, 20).forEach((product: any) => {
        contextText += `- ${product.name} (ID: ${product.id}): ${product.currentPrice || product.price}đ`;
        if (product.brand) contextText += ` - ${product.brand}`;
        contextText += '\n';
      });
      if (context.products.length > 20) {
        contextText += `... và ${context.products.length - 20} sản phẩm khác\n`;
      }
    }

    // Thêm thông tin Brands (nếu có)
    if (context.brands && context.brands.length > 0) {
      contextText += '\n=== THƯƠNG HIỆU ===\n';
      context.brands.forEach((brand: any) => {
        contextText += `- ${brand.name}`;
        if (brand.origin) contextText += ` (${brand.origin})`;
        if (brand.description) contextText += `: ${brand.description}`;
        contextText += '\n';
      });
    }

    return contextText || 'Không có thông tin ngữ cảnh cụ thể.';
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

      // Chỉ tìm kiếm sản phẩm nếu response thực sự mention về sản phẩm
      // Không tự động thêm sản phẩm fallback ở đây
      // Logic fallback sẽ được xử lý ở sendMessage method dựa trên shouldRecommendProducts

      // Đảm bảo tất cả sản phẩm đều có imageUrl từ database
      entities.products = entities.products.map(product => {
        // Lấy ảnh chính hoặc ảnh đầu tiên
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        const imageUrl = primaryImage?.url || '/404.png';

        return {
          ...product,
          imageUrl: imageUrl
        };
      });
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
      'eyeshadow', 'chì kẻ mắt', 'môi', 'lips', 'mắt', 'eye', 'mặt', 'face', 'tóc', 'hair',
      'dung dịch', 'vệ sinh', 'làm sạch', 'rửa', 'tẩy', 'sạch', 'khử trùng', 'diệt khuẩn'
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

  // Phương thức tìm kiếm sản phẩm thông minh với AI Gemini
  private async smartProductSearch(message: string, limit: number = 5): Promise<ProductContext[]> {
    try {
      this.logger.log(`AI-powered smart search for: "${message}"`);

      // Bước 1: Sử dụng AI Gemini để phân tích và tạo search queries thông minh
      const aiSearchQueries = await this.generateSearchQueriesWithAI(message);

      // Bước 2: Tìm kiếm với các queries do AI tạo ra
      for (const searchQuery of aiSearchQueries) {
        const products = await this.contextService.searchProducts(searchQuery, limit);
        if (products.length > 0) {
          this.logger.log(`AI-generated query "${searchQuery}" found ${products.length} products`);
          return products;
        }
      }

      // Bước 3: Fallback - tìm kiếm trực tiếp với message gốc
      let products = await this.contextService.searchProducts(message, limit);
      if (products.length > 0) {
        this.logger.log(`Direct search found ${products.length} products`);
        return products;
      }

      // Bước 4: Fallback cuối - sản phẩm phổ biến
      this.logger.log('No specific products found, returning popular products');
      return await this.contextService.searchProducts('', limit);

    } catch (error) {
      this.logger.warn(`Error in AI-powered smart search: ${error.message}`);
      // Fallback về tìm kiếm truyền thống
      return await this.contextService.searchProducts(message, limit);
    }
  }

  // Sử dụng AI Gemini để tạo ra các search queries thông minh
  private async generateSearchQueriesWithAI(message: string): Promise<string[]> {
    try {
      const prompt = `
Bạn là chuyên gia phân tích ngôn ngữ tự nhiên cho website bán mỹ phẩm Yumin Beauty.

NHIỆM VỤ: Phân tích câu hỏi khách hàng và tạo từ khóa tìm kiếm tối ưu.

NGỮ CẢNH: Website bán đầy đủ các loại mỹ phẩm:
- Chăm sóc da: kem dưỡng, serum, toner, sữa rửa mặt, kem chống nắng, mặt nạ
- Trang điểm: son môi, phấn nền, mascara, kẻ mắt, phấn mắt, má hồng
- Chăm sóc cơ thể: dầu gội, sữa tắm, kem body, dung dịch vệ sinh
- Dụng cụ: dao cạo, cọ trang điểm, gương, kẹp tóc
- Nước hoa và các sản phẩm khác

CÂU HỎI KHÁCH HÀNG: "${message}"

HƯỚNG DẪN:
1. Phân tích ý định khách hàng
2. Tạo 3-5 từ khóa theo thứ tự ưu tiên (chính xác → tổng quát)
3. Bao gồm cả tiếng Việt và tiếng Anh
4. Xem xét từ đồng nghĩa và cách gọi khác nhau

VÍ DỤ:
Input: "Tôi cần dao cạo"
Output: ["dao cạo", "razor", "cạo râu", "dao", "shaving"]

Input: "Son môi màu đỏ"
Output: ["son môi đỏ", "son đỏ", "lipstick red", "son môi", "lipstick"]

Input: "Kem dưỡng ẩm cho da khô"
Output: ["kem dưỡng ẩm da khô", "moisturizer dry skin", "kem dưỡng da khô", "kem dưỡng ẩm", "moisturizer"]

CHỈ TRẢ VỀ MẢNG JSON, KHÔNG GIẢI THÍCH:
`;

      const messages = [{
        role: 'user' as const,
        parts: [{ text: prompt }]
      }];

      const result = await this.geminiService.generateContent(messages, {
        temperature: 0.3, // Thấp để có kết quả ổn định hơn
        maxTokens: 500
      });

      // Parse kết quả từ AI
      const cleanedResult = result.replace(/```json|```/g, '').trim();
      const searchQueries = JSON.parse(cleanedResult);

      if (Array.isArray(searchQueries) && searchQueries.length > 0) {
        this.logger.log(`AI generated ${searchQueries.length} search queries: ${searchQueries.join(', ')}`);
        return searchQueries;
      }

      // Fallback nếu AI không trả về đúng format
      return [message];

    } catch (error) {
      this.logger.warn(`Error generating AI search queries: ${error.message}`);
      // Fallback về phương pháp truyền thống
      return this.generateFallbackQueries(message);
    }
  }

  // Fallback method khi AI không hoạt động
  private generateFallbackQueries(message: string): string[] {
    const cleanedMessage = this.extractAndCleanKeywords(message);
    const keywords = this.extractKeywords(message);

    const queries = [
      message, // Query gốc
      cleanedMessage, // Query đã làm sạch
      ...keywords, // Từng từ khóa riêng lẻ
    ];

    // Loại bỏ trùng lặp và rỗng
    return [...new Set(queries.filter(q => q && q.trim().length > 0))];
  }

  // Trích xuất và làm sạch từ khóa
  private extractAndCleanKeywords(message: string): string {
    // Loại bỏ stop words và từ không cần thiết
    const stopWords = [
      'tôi', 'cần', 'muốn', 'mua', 'có', 'gì', 'nào', 'được', 'cho', 'của', 'và', 'với', 'trong', 'để', 'là', 'một', 'các', 'này', 'đó',
      'i', 'need', 'want', 'buy', 'have', 'what', 'which', 'can', 'for', 'of', 'and', 'with', 'in', 'to', 'is', 'a', 'an', 'the', 'this', 'that'
    ];

    const words = message.toLowerCase().split(/\s+/);
    const cleanedWords = words.filter(word =>
      word.length > 1 &&
      !stopWords.includes(word) &&
      !/^\d+$/.test(word) // Loại bỏ số
    );

    return cleanedWords.join(' ');
  }

  // Trích xuất từ khóa chính
  private extractKeywords(message: string): string[] {
    const cleanedMessage = this.extractAndCleanKeywords(message);
    return cleanedMessage.split(/\s+/).filter(word => word.length > 2);
  }

  // Mở rộng từ khóa với từ đồng nghĩa (có thể lấy từ database hoặc API)
  private async expandKeywordsWithSynonyms(keywords: string[]): Promise<string[]> {
    const expandedKeywords: string[] = [];

    // Từ điển đồng nghĩa cơ bản (có thể mở rộng bằng cách lấy từ database)
    const synonymMap: { [key: string]: string[] } = {
      'dao': ['razor', 'blade', 'cạo'],
      'cạo': ['dao', 'razor', 'shaving'],
      'son': ['lipstick', 'lip', 'môi'],
      'kem': ['cream', 'lotion'],
      'dưỡng': ['moisturizer', 'nourish'],
      'làm sạch': ['cleanser', 'clean', 'wash'],
      'vệ sinh': ['hygiene', 'clean'],
      'mặt nạ': ['mask', 'facial'],
      'chống nắng': ['sunscreen', 'spf', 'sun protection'],
      'trang điểm': ['makeup', 'cosmetic'],
      'chăm sóc': ['care', 'treatment'],
      'da': ['skin'],
      'mặt': ['face', 'facial'],
      'mắt': ['eye'],
      'môi': ['lip', 'lips'],
      'tóc': ['hair'],
    };

    for (const keyword of keywords) {
      // Thêm từ khóa gốc
      if (!expandedKeywords.includes(keyword)) {
        expandedKeywords.push(keyword);
      }

      // Thêm từ đồng nghĩa
      if (synonymMap[keyword]) {
        for (const synonym of synonymMap[keyword]) {
          if (!expandedKeywords.includes(synonym)) {
            expandedKeywords.push(synonym);
          }
        }
      }

      // Tìm từ đồng nghĩa ngược
      for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (synonyms.includes(keyword) && !expandedKeywords.includes(key)) {
          expandedKeywords.push(key);
        }
      }
    }

    return expandedKeywords;
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

  // Sử dụng AI để trích xuất sản phẩm được đề cập trong response
  private async extractMentionedProductsWithAI(
    aiResponse: string,
    availableProducts: ProductContext[]
  ): Promise<any[]> {
    try {
      if (!aiResponse || availableProducts.length === 0) {
        return [];
      }

      // Tạo danh sách sản phẩm có sẵn cho AI
      const productList = availableProducts.map((product, index) =>
        `${index + 1}. "${product.name}" - ${product.brand} - ${product.currentPrice || product.price}đ`
      ).join('\n');

      const prompt = `
Bạn là chuyên gia phân tích văn bản. Nhiệm vụ của bạn là trích xuất CHÍNH XÁC các sản phẩm được đề cập trong phản hồi AI.

PHẢN HỒI AI:
"${aiResponse}"

DANH SÁCH SẢN PHẨM CÓ SẴN:
${productList}

NHIỆM VỤ:
1. Đọc kỹ phản hồi AI
2. Tìm các tên sản phẩm được đề cập cụ thể
3. Khớp với danh sách sản phẩm có sẵn
4. Trả về chỉ số (index) của các sản phẩm được đề cập

VÍ DỤ:
- Nếu AI đề cập "SON BLACK ROUGE MV06" và sản phẩm này ở vị trí số 5 trong danh sách → trả về [4] (index bắt đầu từ 0)
- Nếu AI đề cập nhiều sản phẩm → trả về mảng các index

QUY TẮC:
- CHỈ trả về index của sản phẩm được đề cập TRỰC TIẾP trong phản hồi
- KHÔNG đoán mò hoặc thêm sản phẩm không được đề cập
- Nếu không tìm thấy sản phẩm nào được đề cập → trả về []

CHỈ TRẢ VỀ MẢNG JSON CÁC SỐ INDEX, VÍ DỤ: [0, 2, 5] hoặc []
`;

      const messages = [{
        role: 'user' as const,
        parts: [{ text: prompt }]
      }];

      const result = await this.geminiService.generateContent(messages, {
        temperature: 0.1, // Rất thấp để có kết quả chính xác
        maxTokens: 200
      });

      // Parse kết quả từ AI
      const cleanedResult = result.replace(/```json|```/g, '').trim();
      const mentionedIndexes = JSON.parse(cleanedResult);

      if (Array.isArray(mentionedIndexes) && mentionedIndexes.length > 0) {
        this.logger.log(`AI found mentioned products at indexes: ${mentionedIndexes.join(', ')}`);

        // Lấy sản phẩm theo index và format cho frontend
        const mentionedProducts = mentionedIndexes
          .filter(index => index >= 0 && index < availableProducts.length)
          .map(index => {
            const product = availableProducts[index];
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/404.png';

            return {
              id: product.id,
              name: product.name,
              slug: product.slug || '',
              price: product.price,
              currentPrice: product.currentPrice || product.price,
              brand: product.brand,
              imageUrl: imageUrl,
              reason: 'Sản phẩm được AI tư vấn trong tin nhắn',
            };
          });

        return mentionedProducts;
      }

      return [];

    } catch (error) {
      this.logger.warn(`Error extracting mentioned products with AI: ${error.message}`);
      return [];
    }
  }
}