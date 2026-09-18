import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure table and columns exist in Postgres safely
let tableChecked = false;
async function ensureAdmissionsTable() {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdmissionInquiry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentName" TEXT NOT NULL,
        "fatherName" TEXT,
        "motherName" TEXT,
        "phone" TEXT NOT NULL,
        "aadharNo" TEXT,
        "dob" TIMESTAMP(3),
        "gender" TEXT,
        "classApplied" TEXT,
        "address" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "studentImage" TEXT,
        "admissionFee" TEXT,
        "paymentMethod" TEXT,
        "paymentReceipt" TEXT,
        "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "studentImage" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "admissionFee" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "paymentReceipt" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'PENDING';`);
    tableChecked = true;
  } catch (err: any) {
    console.warn('Admission table check notice:', err?.message || err);
  }
}

// Public route to fetch admission settings (like QR Code)
router.get('/config', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const settings = await prisma.settings.findFirst();
    res.json({ success: true, qrCodeUrl: settings?.qrCodeUrl, upiId: settings?.upiId });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Helper for admission creation
const handleCreateAdmission = async (req: express.Request, res: express.Response) => {
  try {
    await ensureAdmissionsTable();

    const { 
      studentName, fatherName, motherName, phone, 
      aadharNo, dob, gender, classApplied, address,
      studentImage, admissionFee, paymentMethod, paymentReceipt, paymentStatus
    } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({ success: false, message: 'Student Name and Phone are required' });
    }

    const parsedDob = dob && !isNaN(new Date(dob).getTime()) ? new Date(dob) : null;
    const finalPaymentStatus = paymentStatus || (paymentReceipt || paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const application = await prisma.admissionInquiry.create({
      data: {
        studentName: String(studentName).trim(),
        fatherName: fatherName ? String(fatherName).trim() : null,
        motherName: motherName ? String(motherName).trim() : null,
        phone: String(phone).trim(),
        aadharNo: aadharNo ? String(aadharNo).trim() : null,
        dob: parsedDob,
        gender: gender || null,
        classApplied: classApplied || null,
        address: address ? String(address).trim() : null,
        studentImage: studentImage || null,
        admissionFee: admissionFee ? String(admissionFee).trim() : null,
        paymentMethod: paymentMethod || 'CASH',
        paymentReceipt: paymentReceipt || null,
        paymentStatus: finalPaymentStatus
      }
    });

    res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (error: any) {
    console.error('Admission Submit Error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Server error while submitting application' });
  }
};

// Public route: Submit a new admission application
router.post('/apply', handleCreateAdmission);
router.post('/register', handleCreateAdmission);

// Protected route: Get all admission inquiries
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const admissions = await prisma.admissionInquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: admissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admissions' });
  }
});

// Protected route: Update admission status
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const updated = await prisma.admissionInquiry.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: updated, message: 'Status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update admission status' });
  }
});

// Protected route: Delete admission inquiry
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.admissionInquiry.delete({ where: { id } });
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
  }
});

export default router;
