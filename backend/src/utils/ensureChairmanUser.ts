import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { Role } from '../types/enums';

/**
 * Ensures that a default GROUP_CHAIRMAN user exists in the database on server boot.
 */
export async function ensureChairmanUser(): Promise<void> {
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { role: Role.GROUP_CHAIRMAN },
          { email: 'chairman@jyschool.com' },
          { email: 'chairman@rajacademy.com' },
        ],
      },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('Chairman@123', 12);
      const chairman = await prisma.user.create({
        data: {
          name: 'Sri Group Chairman',
          email: 'chairman@jyschool.com',
          password: hashedPassword,
          plainPassword: 'Chairman@123',
          role: Role.GROUP_CHAIRMAN,
          phone: '+91-9999900001',
          isActive: true,
        },
      });
      console.log('👑 [Chairman] Created default Group Chairman account:', chairman.email);
    } else if (existing.role !== Role.GROUP_CHAIRMAN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: Role.GROUP_CHAIRMAN },
      });
      console.log('👑 [Chairman] Updated existing account to GROUP_CHAIRMAN:', existing.email);
    }
  } catch (err: any) {
    console.warn('⚠️ [Chairman] ensureChairmanUser notice:', err?.message);
  }
}
