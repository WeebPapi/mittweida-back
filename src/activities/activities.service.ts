import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Activity, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivitySearch } from './interfaces';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(activityData: CreateActivityDto) {
    try {
      return await this.prismaService.activity.create({ data: activityData });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create activity');
    }
  }

  async findById(id: string) {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }
  async findManyByIds(ids: string[]): Promise<Activity[]> {
    try {
      return this.prismaService.activity.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error finding by Ids');
    }
  }

  // async createMany(body) {
  //   return this.prismaService.activity.createMany({ data: body });
  // }
  async findActivities({
    searchQuery,
    categories,
    latitude,
    longitude,
    limit = 4,
    offset = 0,
  }: ActivitySearch) {
    const where = {
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
      return this.sortByDistance(activities, latitude, longitude);
    }

    return activities;
  }
  async findRandomActivities(limit = 4) {
    return this.prismaService.$queryRaw`
      SELECT * FROM "Activity" 
      ORDER BY RANDOM() 
      LIMIT ${limit}
    `;
  }

  async updateActivity(id: string, updateActivityDto: UpdateActivityDto) {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    try {
      return await this.prismaService.activity.update({
        where: { id },
        data: updateActivityDto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update activity');
    }
  }

  async deleteActivity(id: string) {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    try {
      return await this.prismaService.activity.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete activity');
    }
  }

  private sortByDistance(
    activities: Activity[],
    userLat: number,
    userLon: number,
  ) {
    return activities
      .map((activity) => ({
        ...activity,
        distance: this.calculateDistance(
          userLat,
          userLon,
          activity.latitude,
          activity.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
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
