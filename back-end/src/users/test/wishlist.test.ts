import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WishlistService } from '../services/wishlist.service';
import { UsersService } from '../users.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { WishlistController } from '../controllers/wishlist.controller';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('WishlistService', () => {
  let service: WishlistService;
  let usersService: UsersService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/test'),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Product.name, schema: ProductSchema },
        ]),
      ],
      controllers: [WishlistController],
      providers: [WishlistService, UsersService],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWishlistItems', () => {
    it('should throw NotFoundException if user not found', async () => {
      const nonExistentUserId = new Types.ObjectId().toString();

      jest.spyOn(usersService, 'findOne').mockImplementation((): Promise<any> => {
        return Promise.resolve(null);
      });

      await expect(service.getWishlistItems(nonExistentUserId)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if wishlist is empty', async () => {
      const userId = new Types.ObjectId().toString();

      jest.spyOn(usersService, 'findOne').mockImplementation(() => {
        return Promise.resolve({
          _id: userId,
          wishlist: [],
        } as any);
      });

      const result = await service.getWishlistItems(userId);
      expect(result).toEqual([]);
    });
  });

  describe('addToWishlist', () => {
    it('should throw NotFoundException if product not found', async () => {
      const userId = new Types.ObjectId().toString();
      const nonExistentProductId = new Types.ObjectId().toString();

      // Create a mock Query object that returns null when exec() is called
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      // Mock the exists method to return the mock Query
      jest.spyOn(service['productModel'], 'exists').mockReturnValue(mockQuery as any);

      await expect(service.addToWishlist(userId, nonExistentProductId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromWishlist', () => {
    it('should call usersService.removeFromWishlist with correct parameters', async () => {
      const userId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId().toString();

      const mockUser = {
        _id: userId,
        wishlist: [productId],
      };

      jest.spyOn(usersService, 'removeFromWishlist').mockImplementation(() => {
        return Promise.resolve(mockUser as any);
      });

      const result = await service.removeFromWishlist(userId, productId);
      expect(usersService.removeFromWishlist).toHaveBeenCalledWith(userId, productId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('clearWishlist', () => {
    it('should throw NotFoundException if user not found', async () => {
      const nonExistentUserId = new Types.ObjectId().toString();

      jest.spyOn(usersService, 'findOne').mockImplementation((): Promise<any> => {
        return Promise.resolve(null);
      });

      await expect(service.clearWishlist(nonExistentUserId)).rejects.toThrow(NotFoundException);
    });

    it('should clear the wishlist', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        wishlist: [new Types.ObjectId().toString(), new Types.ObjectId().toString()],
        save: jest.fn().mockImplementation(function() {
          this.wishlist = [];
          return this;
        }),
      };

      jest.spyOn(usersService, 'findOne').mockImplementation(() => {
        return Promise.resolve(mockUser as any);
      });

      const result = await service.clearWishlist(userId);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.wishlist).toEqual([]);
    });
  });
});
