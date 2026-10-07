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
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "academicYear" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "registeredByName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "registeredById" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "cashReceivedByName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "cashReceivedById" TEXT;`);
    
    // New fields
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "motherTongue" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "fatherOccupation" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "fatherAadhar" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "fatherPhone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "motherOccupation" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "motherAadhar" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "motherPhone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'Indian';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "state" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "district" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "mandal" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "village" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "doorNo" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "religion" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "caste" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "subCaste" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "previousSchool" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "hasSiblings" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "siblingsData" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdmissionInquiry" ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT true;`);

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
    res.json({ 
      success: true, 
      schoolName: settings?.schoolName,
      qrCodeUrl: settings?.qrCodeUrl, 
      upiId: settings?.upiId 
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Location Hierarchy API
router.get('/locations', (req, res) => {
  const data = {
    states: ['Andhra Pradesh', 'Telangana', 'Odisha', 'Other'],
    districts: {
      'Andhra Pradesh': [
        'Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli', 'Parvathipuram Manyam',
        'Alluri Sitharama Raju', 'Kakinada', 'East Godavari', 'Dr. B.R. Ambedkar Konaseema',
        'West Godavari', 'Eluru', 'Krishna', 'NTR', 'Guntur', 'Bapatla', 'Palnadu',
        'Prakasam', 'SPS Nellore', 'Kurnool', 'Nandyal', 'Ananthapuramu', 'Sri Sathya Sai',
        'YSR Kadapa', 'Annamayya', 'Chittoor', 'Tirupati'
      ],
      'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Warangal', 'Khammam', 'Nizamabad', 'Karimnagar'],
      'Odisha': ['Ganjam', 'Gajapati', 'Rayagada', 'Koraput', 'Khordha (Bhubaneswar)']
    },
    mandals: {
      'Srikakulam': [
        'Narasannapeta', 'Polaki', 'Jalumuru', 'Kotabommali', 'Sarubujjili',
        'Srikakulam', 'Amadalavalasa', 'Tekkali', 'Gara', 'Ranasthalam',
        'Etcherla', 'Laveru', 'Ponduru', 'Burja', 'Santhabommali',
        'Sompeta', 'Palasa', 'Mandasa', 'Itchapuram', 'Kanchili', 'Kaviti',
        'Kalingapatnam', 'Pathapatnam', 'Meliaputti', 'Hiramandalam', 'Kotturu',
        'Bhamini', 'Seethampeta', 'Regidi Amadalavalasa', 'Vangara', 'Rajam', 'G.Sigadam'
      ]
    },
    villages: {
      'Narasannapeta': [
        'Narasannapeta Main (Ward 1)', 'Raja Veedhi / Market (Ward 2)', 'RTC Complex Area (Ward 3)',
        'Shanti Nagar (Ward 4)', 'Madapam', 'Makivalasa', 'Komarthi', 'Satyavaram', 'Karavanja',
        'Urlam', 'Jamachakram', 'Borubhadra', 'Gopalapenta', 'Kambakaya', 'Mabagam', 'Nadagam',
        'Potnuru', 'Thamminaidupeta', 'Yaragam', 'Gorripadu', 'Tilaru'
      ],
      'Polaki': [
        'Polaki', 'Priyagraharam', 'Susaram', 'Dola', 'Gujjuvada', 'Ampolu',
        'Mulasavalapuram', 'Temburu', 'Chintada'
      ],
      'Jalumuru': [
        'Jalumuru', 'Challavanipeta', 'Makannapeta', 'Timadam', 'Ranastalam', 'Karada', 'Gothivada'
      ],
      'Kotabommali': [
        'Kotabommali', 'Komanapalli', 'Pakivalasa', 'Nimzada', 'Thilavada'
      ],
      'Sarubujjili': [
        'Sarubujjili', 'Purushottapuram', 'Kusalapuram', 'Shalantri'
      ],
      'Srikakulam': [
        'Srikakulam Town', 'Arasavalli', 'Balaga', 'Gujarathipeta', 'Peddapadu',
        'Killi Veedhi', 'Fazulbegpeta', 'Chapuram'
      ]
    }
  };
  res.json({ success: true, data });
});

// Helper for admission creation
const handleCreateAdmission = async (req: express.Request, res: express.Response) => {
  try {
    await ensureAdmissionsTable();

    const { 
      studentName, fatherName, motherName, phone, 
      aadharNo, dob, gender, classApplied, address,
      studentImage, admissionFee, paymentMethod, paymentReceipt, paymentStatus,
      academicYear, registeredByName, registeredById,
      cashReceivedByName, cashReceivedById,
      alternatePhone, motherTongue, fatherOccupation, fatherAadhar, fatherPhone,
      motherOccupation, motherAadhar, motherPhone,
      nationality, state, district, mandal, village, doorNo,
      religion, caste, subCaste, previousSchool,
      hasSiblings, siblingsData, termsAccepted
    } = req.body;

    if (!studentName || (!phone && !fatherPhone && !motherPhone)) {
      return res.status(400).json({ success: false, message: 'Student Name and at least one Contact Phone are required' });
    }

    const primaryPhone = String(phone || fatherPhone || motherPhone).trim();
    const parsedDob = dob && !isNaN(new Date(dob).getTime()) ? new Date(dob) : null;
    const finalPaymentStatus = paymentStatus || (paymentReceipt || paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING');

    // Build consolidated address if structured parts provided
    let fullAddress = address ? String(address).trim() : '';
    if (!fullAddress && (doorNo || village || mandal || district)) {
      const parts = [doorNo, village, mandal, district, state].filter(Boolean);
      fullAddress = parts.join(', ');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const application = await prisma.admissionInquiry.create({
      data: {
        studentName: String(studentName).trim(),
        fatherName: fatherName ? String(fatherName).trim() : null,
        motherName: motherName ? String(motherName).trim() : null,
        phone: primaryPhone,
        aadharNo: aadharNo ? String(aadharNo).trim() : null,
        dob: parsedDob,
        gender: gender || null,
        classApplied: classApplied || null,
        address: fullAddress || null,
        studentImage: studentImage || null,
        admissionFee: admissionFee ? String(admissionFee).trim() : null,
        paymentMethod: paymentMethod || 'CASH',
        paymentReceipt: paymentReceipt || null,
        paymentStatus: finalPaymentStatus,
        academicYear: academicYear ? String(academicYear).trim() : null,
        registeredByName: registeredByName ? String(registeredByName).trim() : null,
        registeredById: registeredById ? String(registeredById).trim() : null,
        cashReceivedByName: cashReceivedByName ? String(cashReceivedByName).trim() : null,
        cashReceivedById: cashReceivedById ? String(cashReceivedById).trim() : null,

        // Extended fields
        alternatePhone: alternatePhone ? String(alternatePhone).trim() : null,
        motherTongue: motherTongue ? String(motherTongue).trim() : null,
        fatherOccupation: fatherOccupation ? String(fatherOccupation).trim() : null,
        fatherAadhar: fatherAadhar ? String(fatherAadhar).trim() : null,
        fatherPhone: fatherPhone ? String(fatherPhone).trim() : null,
        motherOccupation: motherOccupation ? String(motherOccupation).trim() : null,
        motherAadhar: motherAadhar ? String(motherAadhar).trim() : null,
        motherPhone: motherPhone ? String(motherPhone).trim() : null,
        nationality: nationality ? String(nationality).trim() : 'Indian',
        state: state ? String(state).trim() : null,
        district: district ? String(district).trim() : null,
        mandal: mandal ? String(mandal).trim() : null,
        village: village ? String(village).trim() : null,
        doorNo: doorNo ? String(doorNo).trim() : null,
        religion: religion ? String(religion).trim() : null,
        caste: caste ? String(caste).trim() : null,
        subCaste: subCaste ? String(subCaste).trim() : null,
        previousSchool: previousSchool ? String(previousSchool).trim() : null,
        hasSiblings: Boolean(hasSiblings),
        siblingsData: typeof siblingsData === 'object' ? JSON.stringify(siblingsData) : (siblingsData ? String(siblingsData) : null),
        termsAccepted: termsAccepted !== undefined ? Boolean(termsAccepted) : true
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
    await ensureAdmissionsTable();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const admissions = await prisma.admissionInquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: admissions });
  } catch (error: any) {
    console.error('Fetch admissions error:', error);
    try {
      tableChecked = false;
      await ensureAdmissionsTable();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const retryAdmissions = await prisma.admissionInquiry.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ success: true, data: retryAdmissions });
    } catch (retryErr) {
      return res.json({ success: true, data: [] });
    }
  }
});

// Protected route: Update admission status
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    await ensureAdmissionsTable();
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
    await ensureAdmissionsTable();
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
