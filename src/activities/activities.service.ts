import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivitySearch } from './interfaces';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(activityData: CreateActivityDto): Promise<ActivityDto> {
    try {
      const dataToCreate: Prisma.ActivityCreateInput = {
        ...activityData,
        gallery_images: activityData.gallery_images ?? [],
        openHours:
          activityData.openHours === undefined ? null : activityData.openHours,
      };
      return (await this.prismaService.activity.create({
        data: dataToCreate,
      })) as ActivityDto;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create activity');
    }
  }

  async findById(id: string): Promise<ActivityDto> {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity as ActivityDto;
  }

  async findManyByIds(ids: string[]): Promise<ActivityDto[]> {
    try {
      const activities = await this.prismaService.activity.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return activities as ActivityDto[];
    } catch (error) {
      throw new InternalServerErrorException('Error finding by Ids');
    }
  }

  async createMany(body: CreateActivityDto[]): Promise<Prisma.BatchPayload> {
    try {
      const dataToCreate: Prisma.ActivityCreateManyInput[] = body.map(
        (dto) => ({
          ...dto,
          gallery_images: dto.gallery_images ?? [],
          openHours: dto.openHours === undefined ? null : dto.openHours,
        }),
      );

      return this.prismaService.activity.createMany({ data: dataToCreate });
    } catch (error) {
      // Ensure any error from Prisma is caught and re-thrown as InternalServerErrorException
      throw new InternalServerErrorException(
        'Failed to create multiple activities',
      );
    }
  }

  async findActivities({
    searchQuery,
    categories,
    latitude,
    longitude,
    limit,
    offset = 0,
  }: ActivitySearch): Promise<ActivityDto[]> {
    const where: Prisma.ActivityWhereInput = {
      AND: [
        searchQuery
          ? {
              OR: [
                {
                  name: { contains: searchQuery, mode: 'insensitive' as const },
                },
                {
                  description: {
                    contains: searchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              ].filter((condition) => Object.keys(condition).length > 0),
            }
          : {},
        categories?.length
          ? {
              category: {
                in: categories.split(','),
                mode: 'insensitive' as const,
              },
            }
          : {},
      ],
    };

    const activities = await this.prismaService.activity.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    if (latitude && longitude) {
      return this.sortByDistance(
        activities as ActivityDto[],
        latitude,
        longitude,
      );
    }

    return activities as ActivityDto[];
  }

  async findRandomActivities(limit = 4): Promise<ActivityDto[]> {
    const randomActivities = await this.prismaService.$queryRaw<ActivityDto[]>`
      SELECT * FROM "Activity"
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    return randomActivities;
  }

  async updateActivity(
    id: string,
    updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityDto> {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    try {
      const dataToUpdate: Prisma.ActivityUpdateInput = {};

      // Iterate over the keys in updateActivityDto and assign them to dataToUpdate
      // This handles all fields that might be present in updateActivityDto
      for (const key in updateActivityDto) {
        if (updateActivityDto.hasOwnProperty(key)) {
          const value = updateActivityDto[key];

          if (key === 'gallery_images') {
            // Special handling for gallery_images: null becomes [], undefined means omit
            if (value !== undefined) {
              dataToUpdate.gallery_images = value ?? [];
            }
          } else if (key === 'openHours') {
            // Special handling for openHours: null remains null, undefined means omit
            if (value !== undefined) {
              dataToUpdate.openHours = value;
            }
          } else if (value !== undefined) {
            // For all other fields, include if not undefined
            dataToUpdate[key] = value;
          }
        }
      }

      return (await this.prismaService.activity.update({
        where: { id },
        data: dataToUpdate,
      })) as ActivityDto;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update activity');
    }
  }

  async deleteActivity(id: string): Promise<ActivityDto> {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    try {
      return (await this.prismaService.activity.delete({
        where: { id },
      })) as ActivityDto;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete activity');
    }
  }

  private sortByDistance(
    activities: ActivityDto[],
    userLat: number,
    userLon: number,
  ): ActivityDto[] {
    const sortedActivities = activities
      .map((activity) => ({
        ...activity,
        distance: this.calculateDistance(
          userLat,
          userLon,
          activity.latitude,
          activity.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...rest }) => rest as ActivityDto);
    return sortedActivities;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
