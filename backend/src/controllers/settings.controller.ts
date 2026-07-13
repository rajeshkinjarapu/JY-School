import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: {
          schoolName: 'JY School',
          currentYear: '2024-2025'
        }
      });
    }
    successResponse(res, settings, 'School settings fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { schoolName, address, phone, email, website, logoUrl, currentYear } = req.body;
    let settings = await prisma.schoolSettings.findFirst();

    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: { schoolName, address, phone, email, website, logoUrl, currentYear }
      });
    } else {
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { schoolName, address, phone, email, website, logoUrl, currentYear }
      });
    }

    successResponse(res, settings, 'School settings updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getAcademicYears = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const classes = await prisma.class.findMany({
      select: { academicYear: true },
      distinct: ['academicYear']
    });
    const years = classes.map(c => c.academicYear);
    if (years.length === 0) {
      years.push('2024-2025');
    }
    successResponse(res, years, 'Academic years fetched successfully');
  } catch (error) {
    next(error);
  }
};
