import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationModel;

  const mockNotification = {
    _id: '507f1f77bcf86cd799439011',
    content: 'Thông báo test',
    type: 'system',
    priority: 1,
    startDate: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    mockNotificationModel = {
      new: jest.fn().mockResolvedValue(mockNotification),
      constructor: jest.fn().mockResolvedValue(mockNotification),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      exec: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      mockNotificationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockNotification),
      });

      expect(await service.findOne('507f1f77bcf86cd799439011')).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockNotificationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(service.findOne('nonexistentId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const createNotificationDto = {
        content: 'Thông báo mới',
        type: 'system',
        priority: 1,
        startDate: new Date().toISOString(),
      };

      mockNotificationModel.constructor.mockImplementation(() => ({
        ...mockNotification,
        ...createNotificationDto,
        save: jest.fn().mockResolvedValueOnce({
          ...mockNotification,
          ...createNotificationDto,
        }),
      }));

      const result = await service.create(createNotificationDto);
      expect(result).toHaveProperty('content', 'Thông báo mới');
      expect(result).toHaveProperty('type', 'system');
    });
  });
}); 