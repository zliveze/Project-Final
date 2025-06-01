# Chatbot AI Module - Yumin Beauty

Hệ thống chatbot AI tư vấn mỹ phẩm sử dụng Google Gemini AI tích hợp với dữ liệu sản phẩm thực tế.

## Tính năng chính

- 🤖 **AI Consultation**: Tư vấn mỹ phẩm thông minh với Gemini AI
- 📊 **Product Recommendations**: Gợi ý sản phẩm dựa trên loại da và nhu cầu
- 🔍 **Smart Search**: Tìm kiếm sản phẩm thông minh với context AI
- 💬 **Chat History**: Lưu trữ và quản lý lịch sử chat
- ⭐ **Feedback System**: Đánh giá và cải thiện chất lượng phản hồi
- 🏷️ **Entity Recognition**: Nhận diện thương hiệu, danh mục, sự kiện

## Cấu trúc Module

```
chatbot/
├── controllers/
│   └── chatbot.controller.ts       # API endpoints
├── services/
│   ├── chatbot.service.ts          # Logic xử lý chat chính
│   ├── gemini.service.ts           # Tích hợp Gemini AI
│   └── context.service.ts          # Quản lý context data
├── dto/
│   └── chat.dto.ts                 # Data Transfer Objects
├── schemas/
│   └── chat-message.schema.ts      # MongoDB schemas
└── chatbot.module.ts              # Module configuration
```

## API Endpoints

### 1. Gửi tin nhắn
```http
POST /chatbot/send-message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Tôi có da dầu, bạn có thể gợi ý sản phẩm nào phù hợp không?",
  "sessionId": "session_123", // optional
  "skinType": "da dầu", // optional
  "concerns": ["mụn", "lỗ chân lông to"], // optional
  "budget": 500000, // optional
  "preferredBrands": ["L'Oreal", "Maybelline"] // optional
}
```

### 2. Lấy lịch sử chat
```http
GET /chatbot/history?page=1&limit=20&sessionId=session_123
Authorization: Bearer <token>
```

### 3. Tìm kiếm sản phẩm
```http
POST /chatbot/search-products
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "serum vitamin c",
  "skinType": "da dầu",
  "budget": 1000000,
  "limit": 10
}
```

### 4. Đánh giá tin nhắn
```http
POST /chatbot/feedback/{messageId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "messageId": "message_id",
  "isHelpful": true,
  "feedback": "Thông tin rất hữu ích!"
}
```

### 5. Kiểm tra trạng thái
```http
GET /chatbot/health
```

## Cài đặt và cấu hình

### 1. Dependencies
```bash
npm install @google/generative-ai uuid
npm install -D @types/uuid
```

### 2. Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MODEL_NAME=gemini-1.5-flash
```

### 3. Import Module
```typescript
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    // other modules...
    ChatbotModule,
  ],
})
export class AppModule {}
```

## Workflow xử lý chat

1. **Nhận tin nhắn** từ user qua API endpoint
2. **Phân tích intent** để hiểu nhu cầu của user
3. **Thu thập context** từ database (products, brands, categories, events)
4. **Tạo prompt** với context phù hợp cho Gemini AI
5. **Gọi Gemini AI** để tạo phản hồi
6. **Phân tích response** để extract entities được mention
7. **Lưu lịch sử** chat vào database
8. **Trả về phản hồi** kèm gợi ý sản phẩm và thông tin liên quan

## Context Service

Context Service cung cấp dữ liệu thời gian thực cho AI:

- **Products**: Sản phẩm mỹ phẩm với thông tin chi tiết
- **Categories**: Danh mục sản phẩm theo cấp độ
- **Brands**: Thương hiệu và thông tin xuất xứ
- **Events**: Sự kiện khuyến mãi hiện tại
- **Campaigns**: Chiến dịch marketing

## Gemini AI Integration

- **Model**: gemini-1.5-flash (có thể thay đổi)
- **Safety Settings**: Cấu hình an toàn cho nội dung
- **Temperature**: 0.7 (cân bằng creativity và accuracy)
- **Max Tokens**: 2048
- **Timeout**: 30 seconds

## Monitoring và Logging

- **Request/Response Logging**: Ghi log tất cả requests
- **Error Handling**: Xử lý lỗi và fallback responses
- **Performance Tracking**: Theo dõi thời gian xử lý
- **User Intent Analytics**: Phân tích ý định người dùng

## Best Practices

1. **Rate Limiting**: Giới hạn số request để tránh spam
2. **Input Validation**: Validate tất cả input từ user
3. **Context Caching**: Cache context data để tối ưu performance
4. **Error Recovery**: Fallback khi AI service không khả dụng
5. **Data Privacy**: Không lưu trữ thông tin nhạy cảm

## Troubleshooting

### Common Issues

1. **Gemini API Key Invalid**: Kiểm tra API key trong .env
2. **Context Data Empty**: Đảm bảo database có dữ liệu
3. **Slow Response**: Kiểm tra network và context cache
4. **Authentication Failed**: Verify JWT token

### Debug Mode

Để enable debug mode, set LOG_LEVEL=debug trong .env:
```env
LOG_LEVEL=debug
```

## Roadmap

- [ ] WebSocket integration cho real-time chat
- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Advanced intent recognition với NLP
- [ ] Recommendation engine integration
- [ ] A/B testing cho responses

## Contributing

1. Follow TypeScript và NestJS conventions
2. Thêm tests cho features mới
3. Update documentation
4. Sử dụng conventional commits

## Support

For issues và questions, contact development team hoặc tạo issue trong repository. 