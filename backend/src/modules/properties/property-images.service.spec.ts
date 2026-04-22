// ===========================================
// PropertyImagesService unit tests
// ===========================================

import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { UserRole } from '../users/entities/user.entity';
import { PropertyImagesService } from './property-images.service';

describe('PropertyImagesService', () => {
  let service: PropertyImagesService;

  const propertyRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as any;

  const minioService = {
    uploadFiles: jest.fn(),
  } as any;

  const buildFile = (name: string, type = 'image/jpeg'): Express.Multer.File =>
    ({
      fieldname: 'images',
      originalname: name,
      encoding: '7bit',
      mimetype: type,
      size: 1024,
      buffer: Buffer.from('img'),
      stream: null as any,
      destination: '',
      filename: name,
      path: '',
    }) as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyImagesService(propertyRepository, minioService);
  });

  it('rejects generation request when total image count is below minimum', async () => {
    const propertyId = new ObjectId().toHexString();
    propertyRepository.findOne.mockResolvedValue({
      _id: new ObjectId(propertyId),
      ownerId: 'owner-1',
      managerId: 'manager-1',
      images: [],
    });

    const files = Array.from({ length: 3 }, (_, i) =>
      buildFile(`image-${i}.jpg`),
    );

    await expect(
      service.uploadImages(propertyId, files, 'owner-1', UserRole.OWNER, true),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(minioService.uploadFiles).not.toHaveBeenCalled();
  });

  it('returns virtual tour generation metadata when request is valid', async () => {
    const propertyId = new ObjectId().toHexString();
    const property = {
      _id: new ObjectId(propertyId),
      ownerId: 'owner-1',
      managerId: 'manager-1',
      images: [],
    };

    propertyRepository.findOne.mockResolvedValue(property);
    propertyRepository.save.mockImplementation(
      async (entity: unknown) => entity,
    );

    const files = Array.from({ length: 8 }, (_, i) =>
      buildFile(`image-${i}.jpg`),
    );
    minioService.uploadFiles.mockResolvedValue(
      files.map((file, index) => ({
        url: `https://cdn.example.com/${index}.jpg`,
        key: `properties/${propertyId}/${file.originalname}`,
      })),
    );

    const result = await service.uploadImages(
      propertyId,
      files,
      'owner-1',
      UserRole.OWNER,
      true,
    );

    expect(result.virtualTourGeneration).toEqual(
      expect.objectContaining({
        requested: true,
        status: 'requested',
        eligibleImageCount: 8,
      }),
    );
    expect(result.totalImages).toBe(8);
  });
});
