import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

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

// Public route: Submit a new admission application from the website
router.post('/apply', async (req, res) => {
  try {
    const { 
      studentName, fatherName, motherName, phone, 
      aadharNo, dob, gender, classApplied, address,
      studentImage, admissionFee, paymentMethod, paymentReceipt
    } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({ success: false, message: 'Student Name and Phone are required' });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const application = await prisma.admissionInquiry.create({
      data: {
        studentName,
        fatherName,
        motherName,
        phone,
        aadharNo,
        dob: dob ? new Date(dob) : null,
        gender,
        classApplied,
        address,
        studentImage,
        admissionFee,
        paymentMethod,
        paymentReceipt,
        paymentStatus: paymentReceipt ? 'COMPLETED' : 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (error: any) {
    console.error('Admission Submit Error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting application' });
  }
});

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

// Alias for registration
router.post('/register', async (req, res) => {
  try {
    const { 
      studentName, fatherName, motherName, phone, 
      aadharNo, dob, gender, classApplied, address,
      studentImage, admissionFee, paymentMethod, paymentReceipt
    } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({ success: false, message: 'Student Name and Phone are required' });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const application = await prisma.admissionInquiry.create({
      data: {
        studentName,
        fatherName,
        motherName,
        phone,
        aadharNo,
        dob: dob ? new Date(dob) : null,
        gender,
        classApplied,
        address,
        studentImage,
        admissionFee,
        paymentMethod,
        paymentReceipt,
        paymentStatus: paymentReceipt || paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (error: any) {
    console.error('Admission Submit Error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting application' });
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
