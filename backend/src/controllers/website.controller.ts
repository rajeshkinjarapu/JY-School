import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getWebsiteData = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.websiteSettings.findUnique({ where: { id: "1" } });
    const stats = await prisma.websiteStat.findMany({ orderBy: { order: 'asc' } });
    const programs = await prisma.websiteProgram.findMany({ orderBy: { order: 'asc' } });
    const testimonials = await prisma.websiteTestimonial.findMany({ orderBy: { order: 'asc' } });
    const news = await prisma.websiteNews.findMany({ orderBy: { order: 'asc' } });

    res.status(200).json({
      success: true,
      data: {
        settings,
        stats,
        programs,
        testimonials,
        news
      }
    });
  } catch (error) {
    console.error('Error fetching website data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch website data' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const settings = await prisma.websiteSettings.upsert({
      where: { id: "1" },
      update: data,
      create: { id: "1", ...data }
    });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating website settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update website settings' });
  }
};

// --- WebsiteStats CRUD ---
export const createStat = async (req: Request, res: Response) => {
  try {
    const stat = await prisma.websiteStat.create({ data: req.body });
    res.status(201).json({ success: true, data: stat });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create stat' }); }
};

export const updateStat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stat = await prisma.websiteStat.update({ where: { id }, data: req.body });
    res.status(200).json({ success: true, data: stat });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update stat' }); }
};

export const deleteStat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteStat.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Stat deleted' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete stat' }); }
};

// --- WebsiteProgram CRUD ---
export const createProgram = async (req: Request, res: Response) => {
  try {
    const program = await prisma.websiteProgram.create({ data: req.body });
    res.status(201).json({ success: true, data: program });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create program' }); }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const program = await prisma.websiteProgram.update({ where: { id }, data: req.body });
    res.status(200).json({ success: true, data: program });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update program' }); }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteProgram.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Program deleted' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete program' }); }
};

// --- WebsiteTestimonial CRUD ---
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await prisma.websiteTestimonial.create({ data: req.body });
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create testimonial' }); }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testimonial = await prisma.websiteTestimonial.update({ where: { id }, data: req.body });
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update testimonial' }); }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteTestimonial.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete testimonial' }); }
};

// --- WebsiteNews CRUD ---
export const createNews = async (req: Request, res: Response) => {
  try {
    const news = await prisma.websiteNews.create({ data: req.body });
    res.status(201).json({ success: true, data: news });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create news' }); }
};

export const updateNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const news = await prisma.websiteNews.update({ where: { id }, data: req.body });
    res.status(200).json({ success: true, data: news });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update news' }); }
};

export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.websiteNews.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'News deleted' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete news' }); }
};
