import { Test, TestingModule } from '@nestjs/testing';
import { BannersService } from './banners.service';
import { getModelToken } from '@nestjs/mongoose';
import { Banner } from './schemas/banner.schema';
import { NotFoundException } from '@nestjs/common';

describe('BannersService', () => {
  let service: BannersService;
  let mockBannerModel: any;

  beforeEach(async () => {
    mockBannerModel = {
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
          _id: 'banner1',
          title: 'Test banner',
          desktopImage: 'desktop.jpg',
          mobileImage: 'mobile.jpg',
          active: true,
          order: 1,
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        {
          provide: getModelToken(Banner.name),
          useValue: mockBannerModel,
        },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new banner', async () => {
      const createBannerDto = {
        title: 'Test Banner',
        desktopImage: 'desktop.jpg',
        mobileImage: 'mobile.jpg',
      };
      
      mockBannerModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            order: 5,
          }),
        }),
      });
      
      const result = {
        _id: 'banner1',
        ...createBannerDto,
        order: 6,
        active: true,
      };
      
      mockBannerModel.new.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(result),
      }));
      
      expect(await service.create(createBannerDto)).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of banners', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
      };
      
      const banners = [
        {
          _id: '1',
          title: 'Banner 1',
          desktopImage: 'desktop1.jpg',
          mobileImage: 'mobile1.jpg',
          order: 1,
          active: true,
        },
        {
          _id: '2',
          title: 'Banner 2',
          desktopImage: 'desktop2.jpg',
          mobileImage: 'mobile2.jpg',
          order: 2,
          active: false,
        },
      ];
      
      mockBannerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(banners),
              }),
            }),
          }),
        }),
      });
      
      mockBannerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });
      
      expect(await service.findAll(queryDto)).toEqual({
        items: banners,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  // Thêm các test case khác tùy theo nhu cầu
}); 