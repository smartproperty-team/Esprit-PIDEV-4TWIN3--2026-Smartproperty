// ===========================================
// PropertiesService unit tests
// ===========================================

import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { UserRole } from '../users/entities/user.entity';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { PropertyStatus, PropertyType } from './entities/property.entity';
import { PropertiesService } from './properties.service';

describe('PropertiesService', () => {
  let service: PropertiesService;

  const propertyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  } as any;

  const usersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  } as any;

  const agenciesRepository = {
    findOne: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(
      propertyRepository,
      usersRepository,
      agenciesRepository,
    );
  });

  const baseCreateDto = (): CreatePropertyDto => ({
    title: 'Test property',
    type: PropertyType.APARTMENT,
    price: 1200,
    address: {
      street: '123 Main St',
      city: 'Tunis',
      state: 'Tunis',
      zipCode: '1000',
      country: 'Tunisia',
    },
  });

  it('sanitizes virtual tour URL on create', async () => {
    const dto = {
      ...baseCreateDto(),
      virtualTour: ' https://www.youtube.com/watch?v=abc123#section ',
    };

    propertyRepository.create.mockImplementation((payload: unknown) => payload);
    propertyRepository.save.mockImplementation(
      async (payload: unknown) => payload,
    );

    const result = await service.create(
      dto,
      '507f1f77bcf86cd799439011',
      UserRole.BRANCH_MANAGER,
    );

    expect(propertyRepository.create).toHaveBeenCalledTimes(1);
    const createdPayload = propertyRepository.create.mock.calls[0][0] as Record<
      string,
      unknown
    >;

    expect(createdPayload.virtualTour).toBe(
      'https://www.youtube.com/watch?v=abc123',
    );
    expect(createdPayload.status).toBe(PropertyStatus.AVAILABLE);
    expect(createdPayload.currency).toBe('USD');
    expect(result).toEqual(createdPayload);
  });

  it('rejects local/private virtual tour URL on create', async () => {
    const dto = {
      ...baseCreateDto(),
      virtualTour: 'http://localhost:8080/tour',
    };

    await expect(
      service.create(dto, '507f1f77bcf86cd799439011', UserRole.BRANCH_MANAGER),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects local/private virtual tour URL on update', async () => {
    const propertyId = new ObjectId().toHexString();

    propertyRepository.findOne.mockResolvedValue({
      _id: new ObjectId(propertyId),
      ownerId: 'owner-id',
      managerId: 'manager-id',
      address: {
        street: 's',
        city: 'c',
        state: 'st',
        zipCode: 'z',
        country: 'co',
      },
      features: {},
      deletedAt: null,
    });

    const updateDto: UpdatePropertyDto = {
      virtualTour: 'http://192.168.1.5:3000/tour',
    };

    await expect(
      service.update(propertyId, updateDto, 'owner-id', UserRole.OWNER),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows clearing virtual tour on update with empty input', async () => {
    const propertyId = new ObjectId().toHexString();

    const entity = {
      _id: new ObjectId(propertyId),
      ownerId: 'owner-id',
      managerId: 'manager-id',
      address: {
        street: 's',
        city: 'c',
        state: 'st',
        zipCode: 'z',
        country: 'co',
      },
      features: {},
      virtualTour: 'https://matterport.com/show/?m=abc',
      deletedAt: null,
    } as any;

    propertyRepository.findOne.mockResolvedValue(entity);
    propertyRepository.save.mockImplementation(
      async (payload: unknown) => payload,
    );

    const updateDto: UpdatePropertyDto = {
      virtualTour: '   ',
    };

    const updated = await service.update(
      propertyId,
      updateDto,
      'owner-id',
      UserRole.OWNER,
    );

    expect(propertyRepository.save).toHaveBeenCalledTimes(1);
    expect(updated.virtualTour).toBeUndefined();
  });
});
