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
          currentYear: '2026-2027'
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
    const { schoolName, address, phone, email, website, logoUrl, currentYear, examGradingSystem, examAutoPublish, examSendSms, examShowGradesOnAdmitCard, examAdmitCardInstructions, bankName, bankAccountNumber, bankIfsc, upiId } = req.body;
    let settings = await prisma.schoolSettings.findFirst();

    let qrCodeUrl = settings?.qrCodeUrl;
    if (req.file) {
      qrCodeUrl = `/uploads/${req.file.filename}`;
    }

    const parseBool = (val: any, defaultVal: boolean) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return defaultVal;
    };

    const dataPayload = { 
      schoolName, address, phone, email, website, logoUrl, currentYear, examGradingSystem, 
      examAutoPublish: parseBool(examAutoPublish, settings?.examAutoPublish ?? false), 
      examSendSms: parseBool(examSendSms, settings?.examSendSms ?? true), 
      examShowGradesOnAdmitCard: parseBool(examShowGradesOnAdmitCard, settings?.examShowGradesOnAdmitCard ?? false), 
      examAdmitCardInstructions,
      bankName, bankAccountNumber, bankIfsc, upiId, qrCodeUrl
    };

    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: dataPayload
      });
    } else {
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: dataPayload
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
      years.push('2026-2027');
    }
    successResponse(res, years, 'Academic years fetched successfully');
  } catch (error) {
    next(error);
  }
};
