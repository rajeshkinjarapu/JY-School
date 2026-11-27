import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

let websiteTablesEnsured = false;

const WEBSITE_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "WebsiteSettings" (
    "id" TEXT PRIMARY KEY DEFAULT '1',
    "heroTitle" TEXT NOT NULL DEFAULT 'Shaping Brilliant Minds, Building Futures',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'IIT / NEET / OLYMPIAD FOUNDATION',
    "heroDescription" TEXT NOT NULL DEFAULT 'At Sri Venkateswara JY School, we nurture young minds with knowledge, values, and skills to become responsible global citizens.',
    "heroImageUrl" TEXT,
    "admissionsBannerTitle" TEXT NOT NULL DEFAULT 'ADMISSIONS OPEN FOR',
    "admissionsYear" TEXT NOT NULL DEFAULT '2027 – 2028',
    "missionText" TEXT NOT NULL DEFAULT 'To provide a nurturing and inclusive environment that encourages academic excellence, creativity, and character development — preparing students for a successful, meaningful future.',
    "visionText" TEXT NOT NULL DEFAULT 'To be a leading school recognized for delivering quality education and inspiring students to achieve their full potential and make a positive impact on the world.',
    "contactPhone" TEXT NOT NULL DEFAULT '+91 98765 43210',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@svjyschool.edu.in',
    "contactAddress" TEXT NOT NULL DEFAULT '123 Education Street, Knowledge City, KL 560001',
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "admissionsBannerTitle" TEXT NOT NULL DEFAULT 'ADMISSIONS OPEN FOR'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "admissionsYear" TEXT NOT NULL DEFAULT '2027 – 2028'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "missionText" TEXT NOT NULL DEFAULT 'To provide a nurturing and inclusive environment that encourages academic excellence, creativity, and character development — preparing students for a successful, meaningful future.'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "visionText" TEXT NOT NULL DEFAULT 'To be a leading school recognized for delivering quality education and inspiring students to achieve their full potential and make a positive impact on the world.'`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT`,
  `ALTER TABLE "WebsiteSettings" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT`,
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
  )`
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
  if (allOk) websiteTablesEnsured = true;
};

export const getWebsiteData = async (_req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();

    let settings: any = await prisma.websiteSettings.findUnique({ where: { id: '1' } }).catch(() => null);
    if (!settings) {
      try {
        settings = await prisma.websiteSettings.create({ data: { id: '1' } });
      } catch {
        try {
          const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`;
          settings = rows?.[0] || null;
        } catch {
          settings = null;
        }
      }
    }

    const stats = await prisma.websiteStat.findMany({ orderBy: { order: 'asc' } }).catch(() => []);
    const programs = await prisma.websiteProgram.findMany({ orderBy: { order: 'asc' } }).catch(() => []);
    const testimonials = await prisma.websiteTestimonial.findMany({ orderBy: { order: 'asc' } }).catch(() => []);
    const news = await prisma.websiteNews.findMany({ orderBy: { order: 'asc' } }).catch(() => []);

    res.status(200).json({
      success: true,
      data: { settings, stats, programs, testimonials, news }
    });
  } catch (error: any) {
    console.error('Error fetching website data:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch website data' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    await ensureWebsiteTablesExist();

    const body = req.body || {};
    const cleanData: Record<string, any> = {};
    const allowedFields = [
      'heroTitle',
      'heroSubtitle',
      'heroDescription',
      'heroImageUrl',
      'admissionsBannerTitle',
      'admissionsYear',
      'missionText',
      'visionText',
      'contactPhone',
      'contactEmail',
      'contactAddress',
      'facebookUrl',
      'instagramUrl',
      'youtubeUrl',
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        cleanData[key] = body[key] === '' && ['heroImageUrl', 'facebookUrl', 'instagramUrl', 'youtubeUrl'].includes(key)
          ? null
          : body[key];
      }
    }

    let settings: any;
    try {
      settings = await prisma.websiteSettings.upsert({
        where: { id: '1' },
        update: cleanData,
        create: { id: '1', ...cleanData }
      });
    } catch (prismaErr: any) {
      // Fallback if VPS Prisma Client hasn't been regenerated yet for the newly added columns
      console.warn('Prisma upsert fallback triggered for WebsiteSettings:', prismaErr?.message);
      await prisma.$executeRaw`
        INSERT INTO "WebsiteSettings" (
          "id", "heroTitle", "heroSubtitle", "heroDescription", "heroImageUrl",
          "admissionsBannerTitle", "admissionsYear", "missionText", "visionText",
          "contactPhone", "contactEmail", "contactAddress",
          "facebookUrl", "instagramUrl", "youtubeUrl", "updatedAt"
        ) VALUES (
          '1',
          ${cleanData.heroTitle ?? 'Shaping Brilliant Minds, Building Futures'},
          ${cleanData.heroSubtitle ?? 'IIT / NEET / OLYMPIAD FOUNDATION'},
          ${cleanData.heroDescription ?? 'At Sri Venkateswara JY School, we nurture young minds with knowledge, values, and skills to become responsible global citizens.'},
          ${cleanData.heroImageUrl ?? null},
          ${cleanData.admissionsBannerTitle ?? 'ADMISSIONS OPEN FOR'},
          ${cleanData.admissionsYear ?? '2027 – 2028'},
          ${cleanData.missionText ?? ''},
          ${cleanData.visionText ?? ''},
          ${cleanData.contactPhone ?? '+91 98765 43210'},
          ${cleanData.contactEmail ?? 'info@svjyschool.edu.in'},
          ${cleanData.contactAddress ?? '123 Education Street, Knowledge City'},
          ${cleanData.facebookUrl ?? null},
          ${cleanData.instagramUrl ?? null},
          ${cleanData.youtubeUrl ?? null},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("id") DO UPDATE SET
          "heroTitle" = EXCLUDED."heroTitle",
          "heroSubtitle" = EXCLUDED."heroSubtitle",
          "heroDescription" = EXCLUDED."heroDescription",
          "heroImageUrl" = EXCLUDED."heroImageUrl",
          "admissionsBannerTitle" = EXCLUDED."admissionsBannerTitle",
          "admissionsYear" = EXCLUDED."admissionsYear",
          "missionText" = EXCLUDED."missionText",
          "visionText" = EXCLUDED."visionText",
          "contactPhone" = EXCLUDED."contactPhone",
          "contactEmail" = EXCLUDED."contactEmail",
          "contactAddress" = EXCLUDED."contactAddress",
          "facebookUrl" = EXCLUDED."facebookUrl",
          "instagramUrl" = EXCLUDED."instagramUrl",
          "youtubeUrl" = EXCLUDED."youtubeUrl",
          "updatedAt" = CURRENT_TIMESTAMP
      `;
      const rows: any[] = await prisma.$queryRaw`SELECT * FROM "WebsiteSettings" WHERE "id" = '1' LIMIT 1`;
      settings = rows?.[0] || { id: '1', ...cleanData };
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error updating website settings:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to update website settings' });
  }
};

// --- WebsiteStats CRUD ---
export const createStat = async (req: Request, res: Response) => {
  try {
    const { label, value, color, icon, order } = req.body || {};
    const stat = await prisma.websiteStat.create({
      data: { label, value, color: color || 'blue', icon: icon || 'fa-star', order: Number(order) || 0 }
    });
    res.status(201).json({ success: true, data: stat });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to create stat' }); }
};

export const updateStat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, value, color, icon, order } = req.body || {};
    const stat = await prisma.websiteStat.update({
      where: { id },
      data: { label, value, color, icon, order: order !== undefined ? Number(order) : undefined }
    });
    res.status(200).json({ success: true, data: stat });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to update stat' }); }
};

export const deleteStat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteStat.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Stat deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to delete stat' }); }
};

// --- WebsiteProgram CRUD ---
export const createProgram = async (req: Request, res: Response) => {
  try {
    const { title, description, icon, color, order } = req.body || {};
    const program = await prisma.websiteProgram.create({
      data: { title, description, icon: icon || 'fa-book', color: color || 'blue', order: Number(order) || 0 }
    });
    res.status(201).json({ success: true, data: program });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to create program' }); }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, icon, color, order } = req.body || {};
    const program = await prisma.websiteProgram.update({
      where: { id },
      data: { title, description, icon, color, order: order !== undefined ? Number(order) : undefined }
    });
    res.status(200).json({ success: true, data: program });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to update program' }); }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteProgram.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Program deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to delete program' }); }
};

// --- WebsiteTestimonial CRUD ---
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { name, role, text, rating, order } = req.body || {};
    const testimonial = await prisma.websiteTestimonial.create({
      data: { name, role, text, rating: Number(rating) || 5, order: Number(order) || 0 }
    });
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to create testimonial' }); }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, text, rating, order } = req.body || {};
    const testimonial = await prisma.websiteTestimonial.update({
      where: { id },
      data: { name, role, text, rating: rating !== undefined ? Number(rating) : undefined, order: order !== undefined ? Number(order) : undefined }
    });
    res.status(200).json({ success: true, data: testimonial });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to update testimonial' }); }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteTestimonial.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to delete testimonial' }); }
};

// --- WebsiteNews CRUD ---
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, description, date, tag, order } = req.body || {};
    const news = await prisma.websiteNews.create({
      data: { title, description, date: date ? new Date(date) : new Date(), tag: tag || 'News', order: Number(order) || 0 }
    });
    res.status(201).json({ success: true, data: news });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to create news' }); }
};

export const updateNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, tag, order } = req.body || {};
    const news = await prisma.websiteNews.update({
      where: { id },
      data: { title, description, date: date ? new Date(date) : undefined, tag, order: order !== undefined ? Number(order) : undefined }
    });
    res.status(200).json({ success: true, data: news });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to update news' }); }
};

export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteNews.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'News deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error?.message || 'Failed to delete news' }); }
};
