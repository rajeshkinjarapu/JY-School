import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { Role } from '../types/enums';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, type } = req.query;
    const role = req.user?.role;

    const where: any = {};

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (role && role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
      where.OR = [
        { targetRoles: { contains: role } },
        { targetRoles: { contains: 'ALL' } },
        { targetRoles: '' }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    successResponse(res, events, 'Events fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, startDate, endDate, allDay, targetRoles } = req.body;

    const rolesStr = Array.isArray(targetRoles) 
      ? targetRoles.join(',') 
      : (typeof targetRoles === 'string' && targetRoles ? targetRoles : 'STUDENT,TEACHER');

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay !== undefined ? Boolean(allDay) : true,
        targetRoles: rolesStr
      }
    });

    successResponse(res, event, 'Event created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, startDate, endDate, allDay, targetRoles } = req.body;

    const rolesStr = targetRoles !== undefined
      ? (Array.isArray(targetRoles) ? targetRoles.join(',') : String(targetRoles))
      : undefined;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description !== undefined ? description : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay !== undefined ? Boolean(allDay) : undefined,
        targetRoles: rolesStr
      }
    });

    successResponse(res, event, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.event.delete({ where: { id } });

    successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const populateDefaults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = Number(req.body?.year) || 2026;
    const defaultHolidays = [
      { title: "New Year's Day (నూతన సంవత్సరం)", description: "HOLIDAY:NATIONAL", startDate: new Date(`${year}-01-01`), endDate: new Date(`${year}-01-01`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Bhogi (భోగి పండుగ)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-01-13`), endDate: new Date(`${year}-01-13`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Makara Sankranti (మకర సంక్రాంతి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-01-14`), endDate: new Date(`${year}-01-14`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Kanuma (కనుమ పండుగ)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-01-15`), endDate: new Date(`${year}-01-15`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Republic Day (గణతంత్ర దినోత్సవం)", description: "HOLIDAY:NATIONAL", startDate: new Date(`${year}-01-26`), endDate: new Date(`${year}-01-26`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Maha Shivaratri (మహా శివరాత్రి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-02-15`), endDate: new Date(`${year}-02-15`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Holi (హోలీ)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-03-04`), endDate: new Date(`${year}-03-04`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Ugadi (ఉగాది - తెలుగు నూతన సంవత్సరం)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-03-19`), endDate: new Date(`${year}-03-19`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Sri Rama Navami (శ్రీరామ నవమి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-03-27`), endDate: new Date(`${year}-03-27`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Good Friday (గుడ్ ఫ్రైడే)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-04-03`), endDate: new Date(`${year}-04-03`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Dr. B.R. Ambedkar Jayanti (అంబేద్కర్ జయంతి)", description: "HOLIDAY:NATIONAL", startDate: new Date(`${year}-04-14`), endDate: new Date(`${year}-04-14`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Summer Vacation (వేసవి సెలవులు)", description: "HOLIDAY:VACATION", startDate: new Date(`${year}-04-24`), endDate: new Date(`${year}-06-11`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Bakrid / Eid al-Adha (బక్రీద్)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-05-27`), endDate: new Date(`${year}-05-27`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Independence Day (స్వాతంత్య్ర దినోత్సవం)", description: "HOLIDAY:NATIONAL", startDate: new Date(`${year}-08-15`), endDate: new Date(`${year}-08-15`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Vinayaka Chavithi (వినాయక చవితి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-09-14`), endDate: new Date(`${year}-09-14`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Milad-un-Nabi (మిలాద్-ఉన్-నబి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-09-25`), endDate: new Date(`${year}-09-25`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Mahatma Gandhi Jayanti (గాంధీ జయంతి)", description: "HOLIDAY:NATIONAL", startDate: new Date(`${year}-10-02`), endDate: new Date(`${year}-10-02`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Dasara Vacation (దసరా సెలవులు)", description: "HOLIDAY:VACATION", startDate: new Date(`${year}-10-18`), endDate: new Date(`${year}-10-24`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Vijayadasami (విజయదశమి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-10-20`), endDate: new Date(`${year}-10-20`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Deepavali (దీపావళి)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-11-08`), endDate: new Date(`${year}-11-08`), allDay: true, targetRoles: "STUDENT,TEACHER" },
      { title: "Christmas (క్రిస్మస్)", description: "HOLIDAY:FESTIVAL", startDate: new Date(`${year}-12-25`), endDate: new Date(`${year}-12-25`), allDay: true, targetRoles: "STUDENT,TEACHER" },
    ];

    for (const h of defaultHolidays) {
      const exists = await prisma.event.findFirst({
        where: {
          title: h.title,
          startDate: h.startDate
        }
      });
      if (!exists) {
        await prisma.event.create({ data: h });
      }
    }

    const allEvents = await prisma.event.findMany({ orderBy: { startDate: 'asc' } });
    successResponse(res, allEvents, 'Official holidays populated successfully');
  } catch (error) {
    next(error);
  }
};
