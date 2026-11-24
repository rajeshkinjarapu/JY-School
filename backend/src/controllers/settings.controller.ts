import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings: any = await prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: {
          schoolName: 'SRI VENKATESWARA JY SCHOOL',
          currentYear: '2026-2027'
        }
      });
    }

    // Safely parse extra exam settings if stored as JSON in website
    let extraExamConfig = {};
    if (settings.website && typeof settings.website === 'string' && settings.website.startsWith('{')) {
      try {
        extraExamConfig = JSON.parse(settings.website);
      } catch (e) {}
    }

    const merged = {
      ...settings,
      schoolSubtitle: (extraExamConfig as any).schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)',
      examPassMarks: (extraExamConfig as any).examPassMarks ?? 35,
      examGraceMarks: (extraExamConfig as any).examGraceMarks ?? 5,
      examShowRank: (extraExamConfig as any).examShowRank ?? true,
      examStrictModeration: (extraExamConfig as any).examStrictModeration ?? false,
      examDefaultTiming: (extraExamConfig as any).examDefaultTiming || '09:30 AM - 12:30 PM',
      examShowStudentPhoto: (extraExamConfig as any).examShowStudentPhoto ?? true,
      realWebsite: (extraExamConfig as any).realWebsite || ''
    };

    successResponse(res, merged, 'School settings fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      schoolName, address, phone, email, website, logoUrl, principalSignatureUrl, teacherSignatureUrl, currentYear, 
      examGradingSystem, examAutoPublish, examSendSms, examShowGradesOnAdmitCard, examAdmitCardInstructions, 
      bankName, bankAccountNumber, bankIfsc, upiId,
      // Extra Exam Settings
      schoolSubtitle, examPassMarks, examGraceMarks, examShowRank, examStrictModeration, examDefaultTiming, examShowStudentPhoto
    } = req.body;
    
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

    // Pack extra exam settings safely into JSON stored in website column
    let prevConfig: any = {};
    if (settings?.website && typeof settings.website === 'string' && settings.website.startsWith('{')) {
      try {
        prevConfig = JSON.parse(settings.website);
      } catch (e) {}
    }

    const extraConfig = {
      schoolSubtitle: schoolSubtitle !== undefined ? schoolSubtitle : (prevConfig.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)'),
      examPassMarks: examPassMarks !== undefined ? Number(examPassMarks) : (prevConfig.examPassMarks ?? 35),
      examGraceMarks: examGraceMarks !== undefined ? Number(examGraceMarks) : (prevConfig.examGraceMarks ?? 5),
      examShowRank: examShowRank !== undefined ? parseBool(examShowRank, true) : (prevConfig.examShowRank ?? true),
      examStrictModeration: examStrictModeration !== undefined ? parseBool(examStrictModeration, false) : (prevConfig.examStrictModeration ?? false),
      examDefaultTiming: examDefaultTiming !== undefined ? examDefaultTiming : (prevConfig.examDefaultTiming || '09:30 AM - 12:30 PM'),
      examShowStudentPhoto: examShowStudentPhoto !== undefined ? parseBool(examShowStudentPhoto, true) : (prevConfig.examShowStudentPhoto ?? true),
      realWebsite: (website && !website.startsWith('{')) ? website : (prevConfig.realWebsite || '')
    };

    const dataPayload = { 
      schoolName: schoolName !== undefined ? schoolName : settings?.schoolName, 
      address: address !== undefined ? address : settings?.address, 
      phone: phone !== undefined ? phone : settings?.phone, 
      email: email !== undefined ? email : settings?.email, 
      website: JSON.stringify(extraConfig), 
      logoUrl: logoUrl !== undefined ? logoUrl : settings?.logoUrl, 
      principalSignatureUrl: principalSignatureUrl !== undefined ? principalSignatureUrl : settings?.principalSignatureUrl, 
      teacherSignatureUrl: teacherSignatureUrl !== undefined ? teacherSignatureUrl : settings?.teacherSignatureUrl, 
      currentYear: currentYear !== undefined ? currentYear : settings?.currentYear, 
      examGradingSystem: examGradingSystem !== undefined ? examGradingSystem : settings?.examGradingSystem, 
      examAutoPublish: examAutoPublish !== undefined ? parseBool(examAutoPublish, settings?.examAutoPublish ?? false) : settings?.examAutoPublish, 
      examSendSms: examSendSms !== undefined ? parseBool(examSendSms, settings?.examSendSms ?? true) : settings?.examSendSms, 
      examShowGradesOnAdmitCard: examShowGradesOnAdmitCard !== undefined ? parseBool(examShowGradesOnAdmitCard, settings?.examShowGradesOnAdmitCard ?? false) : settings?.examShowGradesOnAdmitCard, 
      examAdmitCardInstructions: examAdmitCardInstructions !== undefined ? examAdmitCardInstructions : settings?.examAdmitCardInstructions,
      bankName: bankName !== undefined ? bankName : settings?.bankName, 
      bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : settings?.bankAccountNumber, 
      bankIfsc: bankIfsc !== undefined ? bankIfsc : settings?.bankIfsc, 
      upiId: upiId !== undefined ? upiId : settings?.upiId, 
      qrCodeUrl
    };

    let updatedSettings: any;
    if (!settings) {
      updatedSettings = await prisma.schoolSettings.create({
        data: dataPayload
      });
    } else {
      updatedSettings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: dataPayload
      });
    }

    const responseData = {
      ...updatedSettings,
      ...extraConfig
    };

    successResponse(res, responseData, 'School settings updated successfully');
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
