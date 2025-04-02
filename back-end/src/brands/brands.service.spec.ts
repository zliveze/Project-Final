import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { getModelToken } from '@nestjs/mongoose';
import { Brand } from './schemas/brand.schema';
import { NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('BrandsService', () => {
  let service: BrandsService;
  let mockBrandModel: any;
  let mockCloudinaryService: any;

  beforeEach(async () => {
    mockBrandModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockReturnThis(),
      save: jest.fn().mockReturnThis(),
      new: jest.fn().mockResolvedValue({
        save: jest.fn().mockResolvedValue({
          _id: 'brand1',
          name: 'Test Brand',
          logo: {
            url: 'logo.jpg',
            alt: 'Test Brand Logo',
          },
          status: 'active',
          featured: false,
        }),
      }),
    };

    mockCloudinaryService = {
      uploadImage: jest.fn().mockResolvedValue({
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/logo.jpg',
        publicId: 'brands/logos/logo',
        width: 200,
        height: 200,
        format: 'jpg'
      }),
      deleteImage: jest.fn().mockResolvedValue(true),
      isCloudinaryUrl: jest.fn().mockReturnValue(true),
      extractPublicIdFromUrl: jest.fn().mockReturnValue('brands/logos/logo'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getModelToken(Brand.name),
          useValue: mockBrandModel,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new brand', async () => {
      const createBrandDto = {
        name: 'Test Brand',
        logo: {
          url: 'logo.jpg',
          alt: 'Test Brand Logo',
        },
      };
      
      const result = {
        _id: 'brand1',
        ...createBrandDto,
        status: 'active',
        featured: false,
      };
      
      mockBrandModel.new.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(result),
      }));
      
      expect(await service.create(createBrandDto)).toEqual(result);
    });

    it('should upload logo if logoImageData is provided', async () => {
      const createBrandDto = {
        name: 'Test Brand',
        logoImageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
      };
      
      const result = {
        _id: 'brand1',
        name: 'Test Brand',
        logo: {
          url: 'https://res.cloudinary.com/demo/image/upload/logo.jpg',
          publicId: 'brands/logos/logo',
          alt: 'Test Brand Logo',
        },
        status: 'active',
        featured: false,
      };
      
      mockBrandModel.new.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(result),
      }));
      
      await service.create(createBrandDto);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        createBrandDto.logoImageData,
        expect.objectContaining({
          folder: 'brands/logos',
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of brands', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
      };
      
      const brands = [
        {
          _id: '1',
          name: 'Brand 1',
          logo: {
            url: 'logo1.jpg',
            alt: 'Brand 1 Logo',
          },
          status: 'active',
          featured: true,
        },
        {
          _id: '2',
          name: 'Brand 2',
          logo: {
            url: 'logo2.jpg',
            alt: 'Brand 2 Logo',
          },
          status: 'inactive',
          featured: false,
        },
      ];
      
      mockBrandModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(brands),
              }),
            }),
          }),
        }),
      });
      
      mockBrandModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });
      
      expect(await service.findAll(queryDto)).toEqual({
        items: brands,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  // Thêm các test case khác tùy theo nhu cầu
}); 