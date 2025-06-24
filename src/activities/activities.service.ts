import { Injectable } from '@nestjs/common';
import { Activity, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivitySearch } from './interfaces';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(activityData: Prisma.ActivityCreateInput) {
    return this.prismaService.activity.create({ data: activityData });
  }

  async findById(id: string) {
    return this.prismaService.activity.findUnique({ where: { id } });
  }
  async findManyByIds(ids: string[]): Promise<Activity[]> {
    return this.prismaService.activity.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

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
  async findRandomActivities(limit = 4, excludeIds: string[] = []) {
    // For PostgreSQL/Neon, you can use raw SQL for true randomization
    return this.prismaService.$queryRaw`
      SELECT * FROM "Activity" 
      WHERE id NOT IN (${Prisma.join(excludeIds)})
      ORDER BY RANDOM() 
      LIMIT ${limit}
    `;
  }

  async updateActivity(
    id: string,
    updateActivityDto: Prisma.ActivityUpdateInput,
  ) {
    return this.prismaService.activity.update({
      where: { id },
      data: { ...updateActivityDto },
    });
  }

  async deleteActivity(id: string) {
    return this.prismaService.activity.delete({ where: { id } });
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
