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
        referenceTeacherId
      }
    });

    res.status(201).json({ success: true, data: newEntry, message: 'Address collected successfully.' });
  } catch (error: any) {
    console.error('Error adding address collection:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all address collections (for Admin)
export const getAddressCollections = async (req: Request, res: Response) => {
  try {
    const records = await prisma.studentAddressCollection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referenceTeacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Map to include teacher name easily
    const data = records.map(record => ({
      ...record,
      referenceTeacherName: record.referenceTeacher?.user?.name || 'Unknown'
    }));

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching address collections:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
