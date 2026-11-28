import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma';

let websiteTablesEnsured = false;

const WEBSITE_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "WebsiteSettings" (
    "id" TEXT PRIMARY KEY DEFAULT '1',
    "heroTitle" TEXT NOT NULL DEFAULT 'Shaping Brilliant Minds, Building Futures',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'IIT / NEET / OLYMPIAD FOUNDATION',
    "heroDescription" TEXT NOT NULL DEFAULT 'At Sri Venkateswara JY School, we nurture young minds with knowledge, values, and skills to become responsible global citizens.',
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "admissionsBannerTitle" TEXT NOT NULL DEFAULT 'ADMISSIONS OPEN FOR',
    "admissionsYear" TEXT NOT NULL DEFAULT '2027 – 2028',
    "missionText" TEXT NOT NULL DEFAULT 'To provide a nurturing and inclusive environment that encourages academic excellence, creativity, and character development.',
    "visionText" TEXT NOT NULL DEFAULT 'To be a leading institution recognized for delivering quality education and inspiring students to achieve their full potential.',
    "principalName" TEXT DEFAULT 'Principal',
    "principalMessage" TEXT,
    "principalPhotoUrl" TEXT,
    "contactPhone" TEXT NOT NULL DEFAULT '+91 98765 43210',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@svjyschool.edu.in',
    "contactAddress" TEXT NOT NULL DEFAULT 'Opposite Hero Showroom, SVL Paradise, Narasannapeta',
    "whatsappNumber" TEXT,
    "googleMapEmbedUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "publicResultExamIds" TEXT NOT NULL DEFAULT '[]',
    "showFacultySection" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "heroVideoUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "admissionsBannerTitle" TEXT NOT NULL DEFAULT 'ADMISSIONS OPEN FOR'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "admissionsYear" TEXT NOT NULL DEFAULT '2027 – 2028'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "missionText" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "visionText" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "principalName" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "principalMessage" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "principalPhotoUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "googleMapEmbedUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "publicResultExamIds" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "showFacultySection" BOOLEAN NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS "WebsiteStat" (
    "id" TEXT PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteProgram" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteTestimonial" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteNews" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'News',
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteNavLink" (
    "id" TEXT PRIMARY KEY,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'HEADER',
    "badgeText" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteCustomPage" (
    "id" TEXT PRIMARY KEY,
    "slug" TEXT UNIQUE NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Academics',
    "content" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "pdfUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteMedia" (
    "id" TEXT PRIMARY KEY,
    "mediaType" TEXT NOT NULL DEFAULT 'VIDEO',
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Campus',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteDownload" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CIRCULAR',
    "fileUrl" TEXT NOT NULL,
    "isTicker" BOOLEAN NOT NULL DEFAULT true,
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS "WebsiteTopper" (
    "id" TEXT PRIMARY KEY,
    "studentName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "examTitle" TEXT NOT NULL,
    "scoreOrRank" TEXT NOT NULL,
    "photoUrl" TEXT,
    "academicYear" TEXT DEFAULT '2026-2027',
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
];

const ensureWebsiteTablesExist = async () => {
  if (websiteTablesEnsured) return;
  let allOk = true;
  for (const sql of WEBSITE_DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err: any) {
      allOk = false;
      console.warn('Notice ensuring Website CMS DDL:', err?.message);
    }
  }
  if (allOk) {
    websiteTablesEnsured = true;
    await seedDefaultPagesIfEmpty();
  }
};

const seedDefaultPagesIfEmpty = async () => {
  try {
    const existing: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "WebsiteCustomPage"`;
    if ((existing?.[0]?.cnt || 0) === 0) {
      const defaults = [
        {
          slug: 'curriculum',
          title: 'Academic Curriculum & Pattern',
          subtitle: 'State Board + IIT-JEE / NEET / Olympiad Integrated Syllabus',
          category: 'Academics',
          content: 'Our curriculum blends conceptual mastery with analytical problem solving.\n\n1. Foundational Stage (Nursery - Grade 5): Activity-based numeracy, phonics, STEM curiosity labs, and communication.\n2. Preparatory & Middle Stage (Grades 6 - 8): Integrated IIT-JEE/NEET foundation in Mathematics & Science alongside Robotics.\n3. High School Excellence (Grades 9 - 10): Board exam perfection, weekly OMR Grand Tests, and individualized mentoring.',
        },
        {
          slug: 'promotion-policy',
          title: 'Examination & Promotion Policy',
          subtitle: 'Continuous & Comprehensive Evaluation (CCE) Standards',
          category: 'Policies',
          content: 'Promotions are evaluated fairly based on Formative Assessments (FA-1 to FA-4), Summative Assessments (SA-1 & SA-2), minimum 75% attendance, and co-scholastic participation.',
        },
        {
          slug: 'behavioral-policy',
          title: 'Student Code of Conduct & Campus Discipline',
          subtitle: 'Cultivating Respect, Integrity & Responsibility',
          category: 'Policies',
          content: 'Students are expected to maintain punctuality, neat uniform, courteous conduct toward peers and faculty, and care for campus property and laboratories.',
        },
        {
          slug: 'awards',
          title: 'Awards, Scholarships & Honors',
          subtitle: 'Recognizing Academic Merit & All-Round Excellence',
          category: 'Achievements',
          content: 'Annual Gold Medals, Merit Scholarships, Best Attendance Awards, Science Olympiad Citations, and Inter-School Sports Championships celebrate student talent.',
        },
      ];
      for (const d of defaults) {
        await prisma.$executeRaw`
          INSERT INTO "WebsiteCustomPage" ("id", "slug", "title", "subtitle", "category", "content", "isPublished", "updatedAt")
          VALUES (${randomUUID()}, ${d.slug}, ${d.title}, ${d.subtitle}, ${d.category}, ${d.content}, true, NOW())
          ON CONFLICT ("slug") DO NOTHING
        `.catch(() => {});
      }
    }
  } catch {}
};

const parseIdArray = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {}
  }
  return [];
};

const calcGradeFromPct = (pct: number) => {
  if (pct >= 91) return { grade: 'A1', gp: 10 };
  if (pct >= 81) return { grade: 'A2', gp: 9 };
  if (pct >= 71) return { grade: 'B1', gp: 8 };
  if (pct >= 61) return { grade: 'B2', gp: 7 };
  if (pct >= 51) return { grade: 'C1', gp: 6 };
  if (pct >= 41) return { grade: 'C2', gp: 5 };
  if (pct >= 35) return { grade: 'D', gp: 4 };
  return { grade: 'E', gp: 3 };
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC COMBINED WEBSITE PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────
export const getWebsiteData = async (_req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();

    const settingsRows = await prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`.catch(() => []);
    let settings = settingsRows?.[0] || null;
    if (!settings) {
      await prisma.$executeRaw`INSERT INTO "WebsiteSettings" ("id") VALUES ('1') ON CONFLICT ("id") DO NOTHING`.catch(() => {});
      const retry = await prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`.catch(() => []);
      settings = retry?.[0] || null;
    }

    const [
      stats,
      programs,
      testimonials,
      news,
      navLinks,
      customPages,
      media,
      downloads,
      toppers,
      allExams,
      teachers,
      studentsCount,
      teachersCount,
      classesCount,
      schoolSettings,
    ] = await Promise.all([
      prisma.websiteStat.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
      prisma.websiteProgram.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
      prisma.websiteTestimonial.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
      prisma.websiteNews.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
      prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteNavLink" ORDER BY "order" ASC, "label" ASC`.catch(() => []),
      prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteCustomPage" ORDER BY "updatedAt" DESC`.catch(() => []),
      prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteMedia" ORDER BY "order" ASC`.catch(() => []),
      prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteDownload" ORDER BY "publishDate" DESC`.catch(() => []),
      prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteTopper" ORDER BY "order" ASC`.catch(() => []),
      prisma.exam.findMany({ orderBy: { examDate: 'desc' }, select: { id: true, name: true, term: true, examDate: true, admitCardPublished: true } }).catch(() => []),
      prisma.teacher.findMany({
        where: { user: { isActive: true } },
        take: 50,
        orderBy: { user: { name: 'asc' } },
        include: { user: { select: { name: true, photoUrl: true } } },
      }).catch(() => []),
      prisma.student.count().catch(() => 0),
      prisma.teacher.count().catch(() => 0),
      prisma.class.count().catch(() => 0),
      prisma.schoolSettings.findFirst().catch(() => null),
    ]);

    const publishedIds = new Set(parseIdArray(settings?.publicResultExamIds));
    const publicExams = allExams.filter(e => publishedIds.has(e.id));
    const admitCardExams = allExams.filter(e => e.admitCardPublished);

    const faculty =
      settings?.showFacultySection === false
        ? []
        : teachers.map(t => ({
            id: t.id,
            name: t.user?.name || 'Faculty',
            photoUrl: t.user?.photoUrl || null,
            qualification: t.qualification || '',
            specialization: t.specialization || '',
          }));

    res.status(200).json({
      success: true,
      data: {
        settings: settings
          ? { ...settings, publicResultExamIds: Array.from(publishedIds) }
          : null,
        stats,
        programs,
        testimonials,
        news,
        navLinks,
        customPages,
        media,
        downloads,
        toppers,
        publicExams,
        admitCardExams,
        faculty,
        erpCounts: { studentsCount, teachersCount, classesCount },
        paymentConfig: schoolSettings
          ? {
              schoolName: schoolSettings.schoolName || 'SRI VENKATESWARA JY SCHOOL',
              upiId: schoolSettings.upiId || null,
              qrCodeUrl: schoolSettings.qrCodeUrl || null,
              bankName: schoolSettings.bankName || null,
              bankAccountNumber: schoolSettings.bankAccountNumber || null,
              bankIfsc: schoolSettings.bankIfsc || null,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching website data:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch website data' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SELF-SERVICE PORTALS (NO LOGIN REQUIRED - ROLL NO + DOB VERIFIED)
// ─────────────────────────────────────────────────────────────────────────────
export const lookupPublicResult = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { rollNo, dob, examId } = req.body || {};
    if (!rollNo || !dob) {
      return res.status(400).json({ success: false, message: 'Roll Number and Date of Birth are required' });
    }

    const settingsRows = await prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`.catch(() => []);
    const settings = settingsRows?.[0];
    const publishedExamIds = parseIdArray(settings?.publicResultExamIds);

    if (publishedExamIds.length === 0) {
      return res.status(404).json({ success: false, message: 'No exam results are currently published on the website.' });
    }

    const student = await prisma.student.findFirst({
      where: { rollNo: { equals: String(rollNo).trim(), mode: 'insensitive' } },
      include: {
        user: { select: { name: true, photoUrl: true } },
        class: { select: { name: true, section: true, academicYear: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found. Please verify your Roll Number.' });
    }

    if (!student.dob) {
      return res.status(400).json({ success: false, message: 'Date of Birth is not updated in school records. Please contact the office.' });
    }

    const storedDob = new Date(student.dob).toISOString().split('T')[0];
    const enteredDob = new Date(dob).toISOString().split('T')[0];
    if (storedDob !== enteredDob) {
      return res.status(401).json({ success: false, message: 'Date of Birth does not match school records.' });
    }

    const targetExamIds = examId && publishedExamIds.includes(String(examId)) ? [String(examId)] : publishedExamIds;

    const marks = await prisma.mark.findMany({
      where: {
        studentId: student.id,
        examId: { in: targetExamIds },
      },
      include: {
        exam: { select: { id: true, name: true, term: true, examDate: true, maxMarks: true, passingMarks: true } },
        subject: { select: { name: true, code: true } },
      },
      orderBy: [{ exam: { examDate: 'desc' } }, { subject: { name: 'asc' } }],
    });

    if (marks.length === 0) {
      return res.status(404).json({ success: false, message: 'No published marks found for this exam yet.' });
    }

    // Group by Exam
    const examsMap = new Map<string, any>();
    for (const m of marks) {
      if (!examsMap.has(m.examId)) {
        examsMap.set(m.examId, {
          examId: m.examId,
          examName: m.exam.name,
          term: m.exam.term,
          examDate: m.exam.examDate,
          totalObtained: 0,
          totalMax: 0,
          subjects: [],
        });
      }
      const grp = examsMap.get(m.examId);
      grp.totalObtained += Number(m.marksObtained) || 0;
      grp.totalMax += Number(m.maxMarks) || 100;
      const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
      const gInfo = calcGradeFromPct(pct);
      grp.subjects.push({
        subjectName: m.subject?.name || 'Subject',
        code: m.subject?.code || '',
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        percentage: pct,
        grade: m.grade || gInfo.grade,
        remarks: m.remarks || '',
      });
    }

    const examResults = Array.from(examsMap.values()).map(er => {
      const overallPct = er.totalMax > 0 ? Number(((er.totalObtained / er.totalMax) * 100).toFixed(1)) : 0;
      const gInfo = calcGradeFromPct(overallPct);
      return {
        ...er,
        overallPercentage: overallPct,
        overallGrade: gInfo.grade,
        gpa: gInfo.gp,
        status: overallPct >= 35 ? 'PASS' : 'NEEDS IMPROVEMENT',
      };
    });

    const schoolMeta = await prisma.schoolSettings.findFirst().catch(() => null);

    res.json({
      success: true,
      data: {
        student: {
          name: student.user?.name,
          rollNo: student.rollNo,
          fatherName: student.fatherName,
          className: `${student.class?.name || ''} ${student.class?.section || ''}`.trim(),
          academicYear: student.class?.academicYear || schoolMeta?.currentYear || '2026-2027',
          dob: storedDob,
        },
        school: {
          schoolName: schoolMeta?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
          address: schoolMeta?.address || settings?.contactAddress || '',
          logoUrl: schoolMeta?.logoUrl || '',
          principalSignatureUrl: schoolMeta?.principalSignatureUrl || '',
        },
        examResults,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Result lookup failed' });
  }
};

export const lookupPublicHallTicket = async (req: Request, res: Response) => {
  try {
    const { rollNo, dob, examId } = req.body || {};
    if (!rollNo || !dob || !examId) {
      return res.status(400).json({ success: false, message: 'Roll Number, Date of Birth and Exam are required' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: String(examId) },
      include: {
        examPlans: {
          include: { subject: { select: { name: true, code: true } } },
          orderBy: { examDate: 'asc' },
        },
      },
    });

    if (!exam || !exam.admitCardPublished) {
      return res.status(403).json({ success: false, message: 'Hall Ticket is not published for the selected exam yet.' });
    }

    const student = await prisma.student.findFirst({
      where: { rollNo: { equals: String(rollNo).trim(), mode: 'insensitive' } },
      include: {
        user: { select: { name: true, photoUrl: true } },
        class: { select: { id: true, name: true, section: true, academicYear: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student Roll Number not found.' });
    }

    if (!student.dob) {
      return res.status(400).json({ success: false, message: 'Date of Birth is missing in school records.' });
    }

    const storedDob = new Date(student.dob).toISOString().split('T')[0];
    const enteredDob = new Date(dob).toISOString().split('T')[0];
    if (storedDob !== enteredDob) {
      return res.status(401).json({ success: false, message: 'Date of Birth does not match our records.' });
    }

    const schoolMeta = await prisma.schoolSettings.findFirst().catch(() => null);

    res.json({
      success: true,
      data: {
        student: {
          name: student.user?.name,
          rollNo: student.rollNo,
          fatherName: student.fatherName,
          className: `${student.class?.name || ''} ${student.class?.section || ''}`.trim(),
          dob: storedDob,
          photoUrl: student.user?.photoUrl || null,
        },
        exam: {
          id: exam.id,
          name: exam.name,
          term: exam.term,
          examDate: exam.examDate,
        },
        schedule: exam.examPlans.map(p => ({
          subject: p.subject?.name || 'Subject',
          code: p.subject?.code || '',
          date: p.examDate,
          time: `${p.startTime} - ${p.endTime}`,
          room: p.room || 'Exam Hall',
        })),
        school: {
          schoolName: schoolMeta?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
          address: schoolMeta?.address || '',
          logoUrl: schoolMeta?.logoUrl || '',
          principalSignatureUrl: schoolMeta?.principalSignatureUrl || '',
          instructions: schoolMeta?.examAdmitCardInstructions || 'Bring this Admit Card and School ID Card to every examination.',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Hall ticket lookup failed' });
  }
};

export const lookupAdmissionStatus = async (req: Request, res: Response) => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone || phone.length < 6) {
      return res.status(400).json({ success: false, message: 'Enter valid registered mobile number' });
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);

    const inquiries = await prisma.admissionInquiry.findMany({
      where: {
        OR: [
          { phone: { contains: cleanDigits } },
          { fatherPhone: { contains: cleanDigits } },
          { alternatePhone: { contains: cleanDigits } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        studentName: true,
        classApplied: true,
        status: true,
        academicYear: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: inquiries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Status lookup failed' });
  }
};

const verifyStudentByRollAndDob = async (rollNo: string, dob: string) => {
  const student = await prisma.student.findFirst({
    where: { rollNo: { equals: String(rollNo).trim(), mode: 'insensitive' } },
    include: {
      user: { select: { name: true, photoUrl: true, phone: true } },
      class: { select: { id: true, name: true, section: true, academicYear: true } },
    },
  });
  if (!student) return { errorStatus: 404, errorMessage: 'Student not found. Please check your Roll Number.' };
  if (!student.dob) return { errorStatus: 400, errorMessage: 'Date of Birth is not updated in school records. Please contact the office.' };
  const storedDob = new Date(student.dob).toISOString().split('T')[0];
  const enteredDob = new Date(dob).toISOString().split('T')[0];
  if (isNaN(new Date(dob).getTime()) || storedDob !== enteredDob) {
    return { errorStatus: 401, errorMessage: 'Date of Birth does not match school records.' };
  }
  return { student, storedDob };
};

export const lookupPublicFeeStatus = async (req: Request, res: Response) => {
  try {
    const { rollNo, dob } = req.body || {};
    if (!rollNo || !dob) {
      return res.status(400).json({ success: false, message: 'Roll Number and Date of Birth are required' });
    }

    const verified = await verifyStudentByRollAndDob(rollNo, dob);
    if ('errorMessage' in verified) {
      return res.status(verified.errorStatus).json({ success: false, message: verified.errorMessage });
    }
    const { student, storedDob } = verified;

    const structureWhere: any = student.classId
      ? { OR: [{ classId: student.classId, studentId: null }, { studentId: student.id }] }
      : { studentId: student.id };

    const [structures, payments, discounts, schoolMeta] = await Promise.all([
      prisma.feeStructure.findMany({ where: structureWhere, orderBy: { dueDate: 'asc' } }),
      prisma.feePayment.findMany({
        where: { studentId: student.id },
        include: { feeStructure: { select: { name: true, term: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feeDiscount.findMany({ where: { studentId: student.id } }),
      prisma.schoolSettings.findFirst().catch(() => null),
    ]);

    const discountMap = new Map<string, number>();
    for (const d of discounts) {
      discountMap.set(d.feeStructureId, Number(d.amount) || 0);
    }

    const paidMap = new Map<string, number>();
    const pendingMap = new Map<string, number>();
    for (const p of payments) {
      if (p.status === 'PAID') {
        paidMap.set(p.feeStructureId, (paidMap.get(p.feeStructureId) || 0) + (Number(p.amountPaid) || 0));
      } else if (p.status === 'PENDING') {
        pendingMap.set(p.feeStructureId, (pendingMap.get(p.feeStructureId) || 0) + (Number(p.amountPaid) || 0));
      }
    }

    let totalFee = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalPendingApproval = 0;
    let totalBalance = 0;

    const feeItems = structures.map(st => {
      const discount = discountMap.get(st.id) || 0;
      const effectiveAmount = Math.max(0, Number(st.amount) - discount);
      const paidAmount = paidMap.get(st.id) || 0;
      const pendingApprovalAmount = pendingMap.get(st.id) || 0;
      const amountDue = Math.max(0, effectiveAmount - paidAmount);
      let status = 'PENDING';
      if (paidAmount >= effectiveAmount) status = 'PAID';
      else if (pendingApprovalAmount > 0) status = 'PENDING_APPROVAL';
      else if (paidAmount > 0) status = 'PARTIAL';
      else if (st.dueDate < new Date()) status = 'OVERDUE';

      totalFee += Number(st.amount) || 0;
      totalDiscount += discount;
      totalPaid += paidAmount;
      totalPendingApproval += pendingApprovalAmount;
      totalBalance += amountDue;

      return {
        id: st.id,
        name: st.name,
        term: st.term,
        dueDate: st.dueDate,
        originalAmount: Number(st.amount),
        discount,
        effectiveAmount,
        paidAmount,
        pendingApprovalAmount,
        amountDue,
        status,
      };
    });

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.user?.name || 'Student',
          rollNo: student.rollNo,
          fatherName: student.fatherName || '',
          phone: student.fatherPhone || student.user?.phone || '',
          className: `${student.class?.name || ''} ${student.class?.section || ''}`.trim(),
          academicYear: student.class?.academicYear || schoolMeta?.currentYear || '2026-2027',
          dob: storedDob,
        },
        summary: {
          totalFee,
          totalDiscount,
          totalPaid,
          totalPendingApproval,
          totalBalance,
        },
        feeItems,
        recentPayments: payments.slice(0, 12).map(p => ({
          id: p.id,
          receiptNo: p.receiptNo,
          feeName: p.feeStructure?.name || 'School Fee',
          term: p.feeStructure?.term || '',
          amountPaid: p.amountPaid,
          paymentDate: p.paymentDate,
          method: p.method,
          status: p.status,
          utrNumber: p.utrNumber,
        })),
        paymentConfig: {
          schoolName: schoolMeta?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
          upiId: schoolMeta?.upiId || null,
          qrCodeUrl: schoolMeta?.qrCodeUrl || null,
          bankName: schoolMeta?.bankName || null,
          bankAccountNumber: schoolMeta?.bankAccountNumber || null,
          bankIfsc: schoolMeta?.bankIfsc || null,
          phone: schoolMeta?.phone || '+91 95029 24437',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Fee lookup failed' });
  }
};

export const submitPublicFeePayment = async (req: Request, res: Response) => {
  try {
    const { rollNo, dob, feeStructureId, amountPaid, method, utrNumber, screenshotUrl, remarks } = req.body || {};
    if (!rollNo || !dob || !feeStructureId || !amountPaid) {
      return res.status(400).json({ success: false, message: 'Roll Number, Date of Birth, Fee Item, and Amount are required' });
    }

    const amt = Number(amountPaid);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid payment amount' });
    }

    const cleanUtr = String(utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 4) {
      return res.status(400).json({ success: false, message: 'Valid UTR / Transaction Reference Number is required' });
    }

    const verified = await verifyStudentByRollAndDob(rollNo, dob);
    if ('errorMessage' in verified) {
      return res.status(verified.errorStatus).json({ success: false, message: verified.errorMessage });
    }
    const { student } = verified;

    const feeStructure = await prisma.feeStructure.findUnique({ where: { id: String(feeStructureId) } });
    if (!feeStructure) {
      return res.status(404).json({ success: false, message: 'Selected fee structure was not found' });
    }

    const isEligible =
      feeStructure.studentId === student.id ||
      (feeStructure.studentId === null && feeStructure.classId === student.classId);
    if (!isEligible) {
      return res.status(403).json({ success: false, message: 'Selected fee item does not belong to this student' });
    }

    const payment = await prisma.feePayment.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amountPaid: amt,
        method: String(method || 'UPI').toUpperCase(),
        utrNumber: cleanUtr,
        screenshotUrl: screenshotUrl ? String(screenshotUrl).trim() : null,
        remarks: remarks ? `[Website] ${String(remarks).trim()}` : '[Website Online Fee Payment]',
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully! Office verification is pending.',
      data: {
        id: payment.id,
        receiptNo: payment.receiptNo,
        amountPaid: payment.amountPaid,
        feeName: feeStructure.name,
        method: payment.method,
        utrNumber: payment.utrNumber,
        status: payment.status,
        paymentDate: payment.paymentDate,
        studentName: student.user?.name || 'Student',
        rollNo: student.rollNo,
        className: `${student.class?.name || ''} ${student.class?.section || ''}`.trim(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to submit fee payment' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: SETTINGS + EXAM PUBLISH SWITCHES
// ─────────────────────────────────────────────────────────────────────────────
export const updateSettings = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const body = req.body || {};

    const cleanPublicIds =
      body.publicResultExamIds !== undefined ? JSON.stringify(parseIdArray(body.publicResultExamIds)) : undefined;

    await prisma.$executeRaw`
      INSERT INTO "WebsiteSettings" (
        "id", "heroTitle", "heroSubtitle", "heroDescription", "heroImageUrl", "heroVideoUrl",
        "admissionsBannerTitle", "admissionsYear", "missionText", "visionText",
        "principalName", "principalMessage", "principalPhotoUrl",
        "contactPhone", "contactEmail", "contactAddress", "whatsappNumber", "googleMapEmbedUrl",
        "facebookUrl", "instagramUrl", "youtubeUrl", "publicResultExamIds", "showFacultySection", "updatedAt"
      ) VALUES (
        '1',
        ${body.heroTitle ?? 'Shaping Brilliant Minds, Building Futures'},
        ${body.heroSubtitle ?? 'EXCELLENCE IN EDUCATION SINCE 2005'},
        ${body.heroDescription ?? ''},
        ${body.heroImageUrl || null},
        ${body.heroVideoUrl || null},
        ${body.admissionsBannerTitle ?? 'ADMISSIONS OPEN FOR'},
        ${body.admissionsYear ?? '2027 – 2028'},
        ${body.missionText ?? ''},
        ${body.visionText ?? ''},
        ${body.principalName || 'Principal'},
        ${body.principalMessage || null},
        ${body.principalPhotoUrl || null},
        ${body.contactPhone ?? '+91 98765 43210'},
        ${body.contactEmail ?? 'info@svjyschool.edu.in'},
        ${body.contactAddress ?? ''},
        ${body.whatsappNumber || null},
        ${body.googleMapEmbedUrl || null},
        ${body.facebookUrl || null},
        ${body.instagramUrl || null},
        ${body.youtubeUrl || null},
        ${cleanPublicIds ?? '[]'},
        ${body.showFacultySection !== undefined ? Boolean(body.showFacultySection) : true},
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "heroTitle" = COALESCE(NULLIF(${body.heroTitle ?? null}, ''), "WebsiteSettings"."heroTitle"),
        "heroSubtitle" = COALESCE(${body.heroSubtitle ?? null}, "WebsiteSettings"."heroSubtitle"),
        "heroDescription" = COALESCE(${body.heroDescription ?? null}, "WebsiteSettings"."heroDescription"),
        "heroImageUrl" = ${body.heroImageUrl === '' ? null : (body.heroImageUrl ?? null)},
        "heroVideoUrl" = ${body.heroVideoUrl === '' ? null : (body.heroVideoUrl ?? null)},
        "admissionsBannerTitle" = COALESCE(${body.admissionsBannerTitle ?? null}, "WebsiteSettings"."admissionsBannerTitle"),
        "admissionsYear" = COALESCE(${body.admissionsYear ?? null}, "WebsiteSettings"."admissionsYear"),
        "missionText" = COALESCE(${body.missionText ?? null}, "WebsiteSettings"."missionText"),
        "visionText" = COALESCE(${body.visionText ?? null}, "WebsiteSettings"."visionText"),
        "principalName" = ${body.principalName ?? null},
        "principalMessage" = ${body.principalMessage ?? null},
        "principalPhotoUrl" = ${body.principalPhotoUrl === '' ? null : (body.principalPhotoUrl ?? null)},
        "contactPhone" = COALESCE(${body.contactPhone ?? null}, "WebsiteSettings"."contactPhone"),
        "contactEmail" = COALESCE(${body.contactEmail ?? null}, "WebsiteSettings"."contactEmail"),
        "contactAddress" = COALESCE(${body.contactAddress ?? null}, "WebsiteSettings"."contactAddress"),
        "whatsappNumber" = ${body.whatsappNumber === '' ? null : (body.whatsappNumber ?? null)},
        "googleMapEmbedUrl" = ${body.googleMapEmbedUrl === '' ? null : (body.googleMapEmbedUrl ?? null)},
        "facebookUrl" = ${body.facebookUrl === '' ? null : (body.facebookUrl ?? null)},
        "instagramUrl" = ${body.instagramUrl === '' ? null : (body.instagramUrl ?? null)},
        "youtubeUrl" = ${body.youtubeUrl === '' ? null : (body.youtubeUrl ?? null)},
        "publicResultExamIds" = COALESCE(${cleanPublicIds ?? null}, "WebsiteSettings"."publicResultExamIds"),
        "showFacultySection" = COALESCE(${body.showFacultySection !== undefined ? Boolean(body.showFacultySection) : null}, "WebsiteSettings"."showFacultySection"),
        "updatedAt" = NOW()
    `;

    const rows: any[] = await prisma.$queryRaw`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`;
    const saved = rows?.[0] || {};
    res.status(200).json({
      success: true,
      data: { ...saved, publicResultExamIds: parseIdArray(saved.publicResultExamIds) },
    });
  } catch (error: any) {
    console.error('Error updating website settings:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to update website settings' });
  }
};

export const getAdminExamsForWebsite = async (_req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const [exams, settingsRows] = await Promise.all([
      prisma.exam.findMany({
        orderBy: { examDate: 'desc' },
        select: { id: true, name: true, term: true, examDate: true, admitCardPublished: true, _count: { select: { marks: true } } },
      }),
      prisma.$queryRaw<any[]>`SELECT "publicResultExamIds" FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`.catch(() => []),
    ]);
    const publishedSet = new Set(parseIdArray(settingsRows?.[0]?.publicResultExamIds));
    res.json({
      success: true,
      data: exams.map(e => ({
        ...e,
        marksCount: e._count.marks,
        publicResultPublished: publishedSet.has(e.id),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch exams' });
  }
};

export const toggleWebsiteExamPublish = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { id } = req.params;
    const { publicResultPublished, admitCardPublished } = req.body || {};

    if (typeof admitCardPublished === 'boolean') {
      await prisma.exam.update({ where: { id }, data: { admitCardPublished } });
    }

    if (typeof publicResultPublished === 'boolean') {
      const rows = await prisma.$queryRaw<any[]>`SELECT "publicResultExamIds" FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`.catch(() => [] as any[]);
      const current = new Set(parseIdArray(rows?.[0]?.publicResultExamIds));
      if (publicResultPublished) current.add(id);
      else current.delete(id);

      const jsonStr = JSON.stringify(Array.from(current));
      await prisma.$executeRaw`
        INSERT INTO "WebsiteSettings" ("id", "publicResultExamIds", "updatedAt")
        VALUES ('1', ${jsonStr}, NOW())
        ON CONFLICT ("id") DO UPDATE SET "publicResultExamIds" = ${jsonStr}, "updatedAt" = NOW()
      `;
    }

    res.json({ success: true, message: 'Website exam visibility updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to toggle exam publish state' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CRUD: STATS, PROGRAMS, TESTIMONIALS, NEWS (EXISTING)
// ─────────────────────────────────────────────────────────────────────────────
export const createStat = async (req: Request, res: Response) => {
  try {
    const { label, value, color, icon, order } = req.body || {};
    const stat = await prisma.websiteStat.create({
      data: { label, value, color: color || 'blue', icon: icon || 'fa-star', order: Number(order) || 0 },
    });
    res.status(201).json({ success: true, data: stat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to create stat' });
  }
};
export const updateStat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, value, color, icon, order } = req.body || {};
    const stat = await prisma.websiteStat.update({
      where: { id },
      data: { label, value, color, icon, order: order !== undefined ? Number(order) : undefined },
    });
    res.status(200).json({ success: true, data: stat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to update stat' });
  }
};
export const deleteStat = async (req: Request, res: Response) => {
  try {
    await prisma.websiteStat.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Stat deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete stat' });
  }
};

export const createProgram = async (req: Request, res: Response) => {
  try {
    const { title, description, icon, color, order } = req.body || {};
    const program = await prisma.websiteProgram.create({
      data: { title, description, icon: icon || 'fa-book', color: color || 'blue', order: Number(order) || 0 },
    });
    res.status(201).json({ success: true, data: program });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to create program' });
  }
};
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, icon, color, order } = req.body || {};
    const program = await prisma.websiteProgram.update({
      where: { id },
      data: { title, description, icon, color, order: order !== undefined ? Number(order) : undefined },
    });
    res.status(200).json({ success: true, data: program });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to update program' });
  }
};
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    await prisma.websiteProgram.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Program deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete program' });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { name, role, text, rating, order } = req.body || {};
    const testimonial = await prisma.websiteTestimonial.create({
      data: { name, role, text, rating: Number(rating) || 5, order: Number(order) || 0 },
    });
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to create testimonial' });
  }
};
export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, text, rating, order } = req.body || {};
    const testimonial = await prisma.websiteTestimonial.update({
      where: { id },
      data: {
        name,
        role,
        text,
        rating: rating !== undefined ? Number(rating) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });
    res.status(200).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to update testimonial' });
  }
};
export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    await prisma.websiteTestimonial.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete testimonial' });
  }
};

export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, description, date, tag, order } = req.body || {};
    const news = await prisma.websiteNews.create({
      data: { title, description, date: date ? new Date(date) : new Date(), tag: tag || 'News', order: Number(order) || 0 },
    });
    res.status(201).json({ success: true, data: news });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to create news' });
  }
};
export const updateNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, tag, order } = req.body || {};
    const news = await prisma.websiteNews.update({
      where: { id },
      data: { title, description, date: date ? new Date(date) : undefined, tag, order: order !== undefined ? Number(order) : undefined },
    });
    res.status(200).json({ success: true, data: news });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to update news' });
  }
};
export const deleteNews = async (req: Request, res: Response) => {
  try {
    await prisma.websiteNews.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'News deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete news' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW UNIVERSITY CMS CRUD: NAV LINKS, CUSTOM PAGES, MEDIA, DOWNLOADS, TOPPERS
// ─────────────────────────────────────────────────────────────────────────────
export const createNavLink = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { label, url, group, badgeText, openInNewTab, order, isActive } = req.body || {};
    if (!label || !url) return res.status(400).json({ success: false, message: 'Label and URL are required' });
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "WebsiteNavLink" ("id", "label", "url", "group", "badgeText", "openInNewTab", "order", "isActive")
      VALUES (${id}, ${label}, ${url}, ${group || 'HEADER'}, ${badgeText || null}, ${Boolean(openInNewTab)}, ${Number(order) || 0}, ${isActive !== false})
    `;
    res.status(201).json({ success: true, data: { id, label, url } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to create nav link' });
  }
};

export const deleteNavLink = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    await prisma.$executeRaw`DELETE FROM "WebsiteNavLink" WHERE "id" = ${req.params.id}`;
    res.json({ success: true, message: 'Nav link deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const upsertCustomPage = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { id, slug, title, subtitle, category, content, bannerUrl, pdfUrl, isPublished } = req.body || {};
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    const cleanSlug = String(slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const pageId = id || randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "WebsiteCustomPage" ("id", "slug", "title", "subtitle", "category", "content", "bannerUrl", "pdfUrl", "isPublished", "updatedAt")
      VALUES (${pageId}, ${cleanSlug}, ${title}, ${subtitle || null}, ${category || 'Academics'}, ${content}, ${bannerUrl || null}, ${pdfUrl || null}, ${isPublished !== false}, NOW())
      ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "subtitle" = EXCLUDED."subtitle",
        "category" = EXCLUDED."category",
        "content" = EXCLUDED."content",
        "bannerUrl" = EXCLUDED."bannerUrl",
        "pdfUrl" = EXCLUDED."pdfUrl",
        "isPublished" = EXCLUDED."isPublished",
        "updatedAt" = NOW()
    `;
    res.json({ success: true, data: { id: pageId, slug: cleanSlug, title } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to save page' });
  }
};

export const deleteCustomPage = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    await prisma.$executeRaw`DELETE FROM "WebsiteCustomPage" WHERE "id" = ${req.params.id}`;
    res.json({ success: true, message: 'Page deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const createMedia = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { mediaType, title, category, url, thumbnailUrl, description, isFeatured, order } = req.body || {};
    if (!title || !url) return res.status(400).json({ success: false, message: 'Title and URL are required' });
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "WebsiteMedia" ("id", "mediaType", "title", "category", "url", "thumbnailUrl", "description", "isFeatured", "order")
      VALUES (${id}, ${mediaType || 'VIDEO'}, ${title}, ${category || 'Campus'}, ${url}, ${thumbnailUrl || null}, ${description || null}, ${Boolean(isFeatured)}, ${Number(order) || 0})
    `;
    res.status(201).json({ success: true, data: { id, title } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    await prisma.$executeRaw`DELETE FROM "WebsiteMedia" WHERE "id" = ${req.params.id}`;
    res.json({ success: true, message: 'Media deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const createDownload = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { title, category, fileUrl, isTicker, publishDate } = req.body || {};
    if (!title || !fileUrl) return res.status(400).json({ success: false, message: 'Title and URL are required' });
    const id = randomUUID();
    const dt = publishDate ? new Date(publishDate) : new Date();
    await prisma.$executeRaw`
      INSERT INTO "WebsiteDownload" ("id", "title", "category", "fileUrl", "isTicker", "publishDate", "isActive")
      VALUES (${id}, ${title}, ${category || 'CIRCULAR'}, ${fileUrl}, ${isTicker !== false}, ${dt}, true)
    `;
    res.status(201).json({ success: true, data: { id, title } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const deleteDownload = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    await prisma.$executeRaw`DELETE FROM "WebsiteDownload" WHERE "id" = ${req.params.id}`;
    res.json({ success: true, message: 'Download deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const createTopper = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    const { studentName, className, examTitle, scoreOrRank, photoUrl, academicYear, order } = req.body || {};
    if (!studentName || !scoreOrRank) return res.status(400).json({ success: false, message: 'Student name and score/rank are required' });
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "WebsiteTopper" ("id", "studentName", "className", "examTitle", "scoreOrRank", "photoUrl", "academicYear", "order")
      VALUES (${id}, ${studentName}, ${className || ''}, ${examTitle || 'Annual Merit'}, ${scoreOrRank}, ${photoUrl || null}, ${academicYear || '2026-2027'}, ${Number(order) || 0})
    `;
    res.status(201).json({ success: true, data: { id, studentName } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};

export const deleteTopper = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();
    await prisma.$executeRaw`DELETE FROM "WebsiteTopper" WHERE "id" = ${req.params.id}`;
    res.json({ success: true, message: 'Topper deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
};
