import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Logger, BadRequestException, NotFoundException } from '@nestjs/common';

import { ProductsService } from './products.service';
import { Product, ProductDocument, ProductStatus } from './schemas/product.schema';
import { Brand } from '../brands/schemas/brand.schema';
import { Category } from '../categories/schemas/category.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventsService } from '../events/events.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CampaignsService } from '../campaigns/campaigns.service';

// Mock Mongoose Document methods
const mockProductDocument = (productData: Partial<Product>) => {
  const doc = {
    ...productData,
    save: jest.fn().mockResolvedValue(productData), // Mock save method
    // Add other Mongoose document methods if needed by the service during these tests
  };
  // Ensure `variants` is an array if it's part of productData, otherwise default to empty array
  if (productData.variants === undefined) {
    doc.variants = [];
  }
  // Ensure inventory arrays are initialized if not provided
  doc.inventory = productData.inventory || [];
  doc.variantInventory = productData.variantInventory || [];
  doc.combinationInventory = productData.combinationInventory || [];
  
  return doc as unknown as ProductDocument;
};


describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: Model<ProductDocument>;
  let logger: Logger;

  // Mock IDs
  const branchAId = new Types.ObjectId().toHexString();
  const branchBId = new Types.ObjectId().toHexString();
  const branchCId = new Types.ObjectId().toHexString(); // For cases where a branch is not touched

  const variant1Id = new Types.ObjectId();
  const combo1AId = new Types.ObjectId();
  const combo1BId = new Types.ObjectId();


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            // Mock collection and createIndex for hasTextIndex check in constructor
            collection: { 
              indexes: jest.fn().mockResolvedValue([]),
              createIndex: jest.fn().mockResolvedValue(undefined),
            },
          },
        },
        {
          provide: getModelToken(Brand.name),
          useValue: {}, // Mock BrandModel as needed
        },
        {
          provide: getModelToken(Category.name),
          useValue: {}, // Mock CategoryModel as needed
        },
        {
          provide: CloudinaryService,
          useValue: {}, // Mock CloudinaryService as needed
        },
        {
          provide: EventsService,
          useValue: {}, // Mock EventsService as needed
        },
        {
          provide: WebsocketService,
          useValue: {}, // Mock WebsocketService as needed
        },
        {
          provide: CampaignsService,
          useValue: {}, // Mock CampaignsService as needed
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            setLogLevels: jest.fn(), // Added setLogLevels
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productModel = module.get<Model<ProductDocument>>(getModelToken(Product.name));
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('removeBranchFromProducts', () => {
    // Scenario 1: Product with No Variants
    it('should remove branch from a product with no variants and update status', async () => {
      const productData: Partial<Product> = {
        _id: new Types.ObjectId(),
        name: 'Simple Product',
        status: ProductStatus.ACTIVE,
        inventory: [
          { branchId: new Types.ObjectId(branchAId), quantity: 10, lowStockThreshold: 5 },
          { branchId: new Types.ObjectId(branchBId), quantity: 5, lowStockThreshold: 5 },
        ],
        variants: [],
      };
      const mockDoc = mockProductDocument(productData);
      (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);

      const result = await service.removeBranchFromProducts(branchAId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockDoc.inventory.length).toBe(1);
      expect(mockDoc.inventory[0].branchId.toString()).toBe(branchBId);
      expect(mockDoc.inventory[0].quantity).toBe(5);
      expect(mockDoc.status).toBe(ProductStatus.ACTIVE); // Still active due to branchB
      expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    it('should set product with no variants to out_of_stock if all stock removed', async () => {
        const productData: Partial<Product> = {
          _id: new Types.ObjectId(),
          name: 'Single Branch Product',
          status: ProductStatus.ACTIVE,
          inventory: [
            { branchId: new Types.ObjectId(branchAId), quantity: 10, lowStockThreshold: 5 },
          ],
          variants: [],
        };
        const mockDoc = mockProductDocument(productData);
        (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);
  
        const result = await service.removeBranchFromProducts(branchAId);
  
        expect(result.success).toBe(true);
        expect(result.count).toBe(1);
        expect(mockDoc.inventory.length).toBe(0);
        expect(mockDoc.status).toBe(ProductStatus.OUT_OF_STOCK);
        expect(mockDoc.save).toHaveBeenCalledTimes(1);
      });

    // Scenario 2: Product with Variants (No Combinations)
    it('should remove branch from a product with variants (no combinations) and update inventories and status', async () => {
      const productData: Partial<Product> = {
        _id: new Types.ObjectId(),
        name: 'Variant Product',
        status: ProductStatus.ACTIVE,
        variants: [{ variantId: variant1Id, sku: 'VAR1', name: 'V1', options: {}, images: [], price: 0, currentPrice: 0, costPrice: 0, barcode: '' }],
        inventory: [ // Main inventory reflects sums
          { branchId: new Types.ObjectId(branchAId), quantity: 20, lowStockThreshold: 5 },
          { branchId: new Types.ObjectId(branchBId), quantity: 15, lowStockThreshold: 5 },
        ],
        variantInventory: [
          { branchId: new Types.ObjectId(branchAId), variantId: variant1Id, quantity: 20, lowStockThreshold: 2 },
          { branchId: new Types.ObjectId(branchBId), variantId: variant1Id, quantity: 15, lowStockThreshold: 2 },
        ],
      };
      const mockDoc = mockProductDocument(productData);
      (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);

      const result = await service.removeBranchFromProducts(branchAId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      
      // Check variantInventory
      expect(mockDoc.variantInventory.length).toBe(1);
      expect(mockDoc.variantInventory[0].branchId.toString()).toBe(branchBId);
      expect(mockDoc.variantInventory[0].variantId.toString()).toBe(variant1Id.toString());
      expect(mockDoc.variantInventory[0].quantity).toBe(15);

      // Check main inventory (should be synced)
      expect(mockDoc.inventory.length).toBe(1);
      expect(mockDoc.inventory[0].branchId.toString()).toBe(branchBId);
      expect(mockDoc.inventory[0].quantity).toBe(15); // Sum of variant stock in branchB

      expect(mockDoc.status).toBe(ProductStatus.ACTIVE); // Still active due to branchB variant stock
      expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    // Scenario 3: Product with Variants and Combinations
    it('should remove branch from a product with variants and combinations, updating all inventories and status', async () => {
      const productData: Partial<Product> = {
        _id: new Types.ObjectId(),
        name: 'Combo Product',
        status: ProductStatus.ACTIVE,
        variants: [{ 
            variantId: variant1Id, sku: 'VAR1COMBO', name: 'V1C', options: {}, images: [], price: 0, currentPrice: 0, costPrice: 0, barcode: '',
            combinations: [
                { combinationId: combo1AId, attributes: { color: 'Red' }, price: 0, additionalPrice: 0 },
                { combinationId: combo1BId, attributes: { color: 'Blue' }, price: 0, additionalPrice: 0 },
            ]
        }],
        inventory: [ // Main inventory reflects sums
          { branchId: new Types.ObjectId(branchAId), quantity: 30, lowStockThreshold: 5 }, // 10+20
          { branchId: new Types.ObjectId(branchBId), quantity: 25, lowStockThreshold: 5 }, // 5+20
        ],
        variantInventory: [ // Variant inventory reflects sums of its combinations per branch
          { branchId: new Types.ObjectId(branchAId), variantId: variant1Id, quantity: 30, lowStockThreshold: 3 },
          { branchId: new Types.ObjectId(branchBId), variantId: variant1Id, quantity: 25, lowStockThreshold: 3 },
        ],
        combinationInventory: [
          { branchId: new Types.ObjectId(branchAId), variantId: variant1Id, combinationId: combo1AId, quantity: 10, lowStockThreshold: 1 },
          { branchId: new Types.ObjectId(branchAId), variantId: variant1Id, combinationId: combo1BId, quantity: 20, lowStockThreshold: 1 },
          { branchId: new Types.ObjectId(branchBId), variantId: variant1Id, combinationId: combo1AId, quantity: 5, lowStockThreshold: 1 },
          { branchId: new Types.ObjectId(branchBId), variantId: variant1Id, combinationId: combo1BId, quantity: 20, lowStockThreshold: 1 },
        ],
      };
      const mockDoc = mockProductDocument(productData);
      (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);

      const result = await service.removeBranchFromProducts(branchAId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);

      // Check combinationInventory
      expect(mockDoc.combinationInventory.length).toBe(2);
      mockDoc.combinationInventory.forEach(ci => expect(ci.branchId.toString()).toBe(branchBId));
      expect(mockDoc.combinationInventory.find(ci => ci.combinationId.equals(combo1AId))?.quantity).toBe(5);
      expect(mockDoc.combinationInventory.find(ci => ci.combinationId.equals(combo1BId))?.quantity).toBe(20);
      
      // Check variantInventory
      expect(mockDoc.variantInventory.length).toBe(1);
      expect(mockDoc.variantInventory[0].branchId.toString()).toBe(branchBId);
      expect(mockDoc.variantInventory[0].variantId.toString()).toBe(variant1Id.toString());
      expect(mockDoc.variantInventory[0].quantity).toBe(25); // 5 + 20

      // Check main inventory
      expect(mockDoc.inventory.length).toBe(1);
      expect(mockDoc.inventory[0].branchId.toString()).toBe(branchBId);
      expect(mockDoc.inventory[0].quantity).toBe(25);

      expect(mockDoc.status).toBe(ProductStatus.ACTIVE);
      expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    // Scenario 4: Product Becomes Out of Stock
    it('should set product to out_of_stock when last branch inventory is removed', async () => {
        const productData: Partial<Product> = {
            _id: new Types.ObjectId(),
            name: 'Single Branch Variant Product',
            status: ProductStatus.ACTIVE,
            variants: [{ variantId: variant1Id, sku: 'VAR1', name: 'V1', options: {}, images: [], price: 0, currentPrice: 0, costPrice: 0, barcode: '' }],
            inventory: [{ branchId: new Types.ObjectId(branchAId), quantity: 10, lowStockThreshold: 5 }],
            variantInventory: [{ branchId: new Types.ObjectId(branchAId), variantId: variant1Id, quantity: 10, lowStockThreshold: 2 }],
            combinationInventory: [], // Assuming no combinations for simplicity here, or they'd also be in branchA
        };
        const mockDoc = mockProductDocument(productData);
        (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);

        const result = await service.removeBranchFromProducts(branchAId);

        expect(result.success).toBe(true);
        expect(result.count).toBe(1);
        
        expect(mockDoc.variantInventory.length).toBe(0);
        expect(mockDoc.inventory.length).toBe(0);
        expect(mockDoc.status).toBe(ProductStatus.OUT_OF_STOCK);
        expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });
    
    // Scenario 5: No Products Found for Branch
    it('should return count 0 if no products are found for the branch', async () => {
      (productModel.find as jest.Mock).mockResolvedValue([]); // No products found

      const result = await service.removeBranchFromProducts(branchAId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      // No save should be called if no products
      // This relies on the mockDoc.save not being called, which we can't directly check here
      // without a more complex setup of spying on saves of non-existent docs.
      // The main check is that count is 0 and it completes without error.
    });

    it('should not modify a product if the branch to be removed is not in its inventory', async () => {
        const productData: Partial<Product> = {
          _id: new Types.ObjectId(),
          name: 'Unaffected Product',
          status: ProductStatus.ACTIVE,
          inventory: [
            { branchId: new Types.ObjectId(branchBId), quantity: 5, lowStockThreshold: 5 },
          ],
          variants: [],
        };
        const mockDoc = mockProductDocument(productData);
        // ProductModel.find will return this product because the $or clause in service might still pick it up
        // if we imagine a more complex scenario. For this test, we assume it's returned.
        // The important part is that the *logic inside the loop* should not modify it.
        (productModel.find as jest.Mock).mockResolvedValue([mockDoc]);
  
        const result = await service.removeBranchFromProducts(branchAId); // Removing branchA
  
        expect(result.success).toBe(true);
        // Count should be 0 because this specific product was not modified as branchA wasn't in its inventory.
        // If productModel.find was more specific and didn't return this product, count would also be 0.
        // The key is `productModified` inside the loop in the service.
        expect(result.count).toBe(0); 
        expect(mockDoc.inventory.length).toBe(1); // Inventory unchanged
        expect(mockDoc.inventory[0].branchId.toString()).toBe(branchBId);
        expect(mockDoc.status).toBe(ProductStatus.ACTIVE); // Status unchanged
        expect(mockDoc.save).not.toHaveBeenCalled(); // Save should not be called
      });
  });
});
