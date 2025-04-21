import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ViettelPostService } from './services/viettel-post.service';

@Global() // Make services available globally without importing SharedModule everywhere
@Module({
  imports: [
    HttpModule, // Import HttpModule to make HttpService available
    ConfigModule, // Import ConfigModule if ViettelPostService uses ConfigService
  ],
  providers: [ViettelPostService],
  exports: [ViettelPostService], // Export ViettelPostService to be used in other modules
})
export class SharedModule {}
