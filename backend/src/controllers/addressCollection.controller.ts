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

// Bulk import address collection entries from Excel
export const bulkAddAddressCollection = async (req: Request, res: Response) => {
  try {
    const { records, defaultTeacherId } = req.body;
    const user = (req as any).user;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided for import.' });
    }

    // Fetch teachers to match names if provided
    const allTeachers = await prisma.teacher.findMany({
      include: { user: { select: { name: true } } }
    });

    const teacherMapByName = new Map<string, string>();
    allTeachers.forEach(t => {
      if (t.user?.name) {
        teacherMapByName.set(t.user.name.trim().toLowerCase(), t.id);
      }
    });

    // Check if the current user is a teacher
    let userTeacherId: string | undefined = undefined;
    if (user && user.role === 'TEACHER') {
      const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (t) userTeacherId = t.id;
    }

    const validEntries: any[] = [];
    for (const r of records) {
      const studentName = (r.studentName || r['Student Name'] || r.StudentName || r.name || '').toString().trim();
      const fatherName = (r.fatherName || r['Father Name'] || r.FatherName || r.father || '').toString().trim();
      const village = (r.village || r['Village'] || r.town || '').toString().trim();
      const mandal = (r.mandal || r['Mandal'] || '').toString().trim();
      let mobileNo = (r.mobileNo || r['Mobile No'] || r['Phone'] || r.phone || r['Mobile'] || '').toString().trim();
      const alternateMobileNo = (r.alternateMobileNo || r['Alternate Mobile No'] || r['Alt Mobile'] || r.altMobile || '').toString().trim();

      if (!studentName || !village || !mandal) {
        continue; // skip rows without essential fields
      }

      // Determine reference teacher
      let refTeacherId = r.referenceTeacherId || defaultTeacherId || userTeacherId || null;
      if (!refTeacherId && r.referenceTeacherName) {
        const queryName = r.referenceTeacherName.toString().trim().toLowerCase();
        for (const [tName, tId] of teacherMapByName.entries()) {
          if (tName === queryName || queryName.includes(tName) || tName.includes(queryName)) {
            refTeacherId = tId;
            break;
          }
        }
      }

      validEntries.push({
        studentName: studentName.toUpperCase(),
        fatherName: (fatherName || '-').toUpperCase(),
        village: village.toUpperCase(),
        mandal: mandal.toUpperCase(),
        mobileNo: mobileNo || '-',
        alternateMobileNo: alternateMobileNo || null,
        referenceTeacherId: refTeacherId || null,
        createdById: user?.id || null
      });
    }

    if (validEntries.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid records found in the uploaded file. Please make sure Student Name, Village, and Mandal are present.' });
    }

    const result = await prisma.studentAddressCollection.createMany({
      data: validEntries
    });

    res.status(201).json({
      success: true,
      count: result.count,
      message: `Successfully imported ${result.count} student addresses.`
    });
  } catch (error: any) {
    console.error('Error bulk importing address collections:', error);
    res.status(500).json({ success: false, message: 'Server error during import', error: error.message });
  }
};
