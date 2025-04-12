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

  // Updated describe block to match the actual method name 'getWishlist'
  describe('getWishlist', () => {
    it('should throw NotFoundException if user not found', async () => {
      const nonExistentUserId = new Types.ObjectId().toString();

      // Mock findById on userModel instead of usersService.findOne for WishlistService
      jest.spyOn(service['userModel'], 'findById').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getWishlist(nonExistentUserId)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if wishlist is empty', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        wishlist: [],
      };

       jest.spyOn(service['userModel'], 'findById').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);


      const result = await service.getWishlist(userId);
      expect(result).toEqual([]);
    });

     // Add more tests for getWishlist, e.g., returning formatted items
  });

  describe('addToWishlist', () => {
    it('should throw NotFoundException if product not found', async () => {
      const userId = new Types.ObjectId().toString();
      const nonExistentProductId = new Types.ObjectId().toString();
      const variantId = 'variant-123'; // Add variantId

      // Mock findById on productModel to return null
       jest.spyOn(service['productModel'], 'findById').mockReturnValue({
         exec: jest.fn().mockResolvedValue(null),
       } as any);


      // Expect addToWishlist to throw NotFoundException, passing all 3 arguments
      await expect(service.addToWishlist(userId, nonExistentProductId, variantId)).rejects.toThrow(NotFoundException);
    });

     it('should throw NotFoundException if variant not found in product', async () => {
      const userId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId();
      const nonExistentVariantId = 'non-existent-variant';
      const mockProduct = {
        _id: productId,
        variants: [{ variantId: 'existing-variant-1' }] // Product exists but variant doesn't
      };

       jest.spyOn(service['productModel'], 'findById').mockReturnValue({
         exec: jest.fn().mockResolvedValue(mockProduct),
       } as any);

      await expect(service.addToWishlist(userId, productId, nonExistentVariantId)).rejects.toThrow(NotFoundException);
    });

     it('should call usersService.addToWishlist with correct parameters', async () => {
        const userId = new Types.ObjectId().toString();
        const productId = new Types.ObjectId();
        const variantId = 'variant-123';
        const mockProduct = { _id: productId, variants: [{ variantId: new Types.ObjectId(variantId) }] }; // Mock product with variant
        const mockUser = { _id: userId, wishlist: [] }; // Mock user

        jest.spyOn(service['productModel'], 'findById').mockReturnValue({ exec: jest.fn().mockResolvedValue(mockProduct) } as any);
        jest.spyOn(usersService, 'addToWishlist').mockResolvedValue(mockUser as any); // Mock the underlying service call

        await service.addToWishlist(userId, productId, variantId);

        expect(usersService.addToWishlist).toHaveBeenCalledWith(userId, productId, variantId);
    });
  });

  describe('removeFromWishlist', () => {
    it('should call usersService.removeFromWishlist with correct parameters', async () => {
      const userId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId();
      const variantId = 'variant-123'; // Add variantId

      const mockUser = {
        _id: userId,
        wishlist: [{ productId, variantId }], // Wishlist contains the item
      };

      // Mock the usersService method directly
      jest.spyOn(usersService, 'removeFromWishlist').mockResolvedValue(mockUser as any);

      const result = await service.removeFromWishlist(userId, productId, variantId);

      // Verify the underlying service method was called correctly
      expect(usersService.removeFromWishlist).toHaveBeenCalledWith(userId, productId, variantId);
      expect(result).toEqual(mockUser); // Check the returned user
    });

     // Add tests for cases like item not found in wishlist if needed
  });

  // Removed describe block for 'clearWishlist' as the method doesn't exist
});
