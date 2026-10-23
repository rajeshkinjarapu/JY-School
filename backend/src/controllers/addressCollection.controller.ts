import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add new address collection entry
export const addAddressCollection = async (req: Request, res: Response) => {
  try {
    const { studentName, fatherName, village, mandal, mobileNo, alternateMobileNo, referenceTeacherId: bodyTeacherId } = req.body;
    
    // Check if the user is a teacher
    // req.user is set by authentication middleware
    const user = (req as any).user;
    
    let referenceTeacherId: string | undefined = bodyTeacherId || undefined;
    if (!referenceTeacherId && user && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (teacher) {
        referenceTeacherId = teacher.id;
      }
    }

    const newEntry = await prisma.studentAddressCollection.create({
      data: {
        studentName,
        fatherName,
        village,
        mandal,
        mobileNo,
        alternateMobileNo: alternateMobileNo || undefined,
        referenceTeacherId,
        createdById: user?.id
      }
    });

    res.status(201).json({ success: true, data: newEntry, message: 'Address collected successfully.' });
  } catch (error: any) {
    console.error('Error adding address collection:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get address collections (supports teacher filtering and admin all)
export const getAddressCollections = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let whereCondition: any = {};

    // If teacher, only return addresses entered by this teacher
    if (user && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      whereCondition = {
        OR: [
          { createdById: user.id },
          ...(teacher ? [{ referenceTeacherId: teacher.id }] : [])
        ]
      };
    } else if (req.query.myOnly === 'true' && user) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      whereCondition = {
        OR: [
          { createdById: user.id },
          ...(teacher ? [{ referenceTeacherId: teacher.id }] : [])
        ]
      };
    } else if (req.query.teacherId) {
      whereCondition = { referenceTeacherId: String(req.query.teacherId) };
    }

    const records = await prisma.studentAddressCollection.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        referenceTeacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        createdBy: {
          select: { name: true }
        }
      }
    });

    // Map to include teacher name easily
    const data = records.map(record => ({
      ...record,
      referenceTeacherName: record.referenceTeacher?.user?.name || record.createdBy?.name || 'Unknown'
    }));

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching address collections:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete address collection entry
export const deleteAddressCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const record = await prisma.studentAddressCollection.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Role check: Teacher can only delete their own entries
    if (user && user.role === 'TEACHER' && record.createdById && record.createdById !== user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
    }

    await prisma.studentAddressCollection.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting address collection:', error);
    res.status(500).json({ success: false, message: 'Failed to delete record', error: error.message });
  }
};
