import bcrypt from 'bcryptjs';
import { prisma } from '../src/utils/prisma';
import { Role } from '../src/types/enums';

async function main() {
  console.log('👑 [Chairman Setup] Initializing or Updating Group Chairman Account...');

  const email = process.argv[2] || 'chairman@jyschool.com';
  const password = process.argv[3] || 'Chairman@123';
  const name = process.argv[4] || 'Sri Group Chairman & Managing Trustee';

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { role: Role.GROUP_CHAIRMAN },
      ],
    },
  });

  const hashedPassword = await bcrypt.hash(password, 12);

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        name,
        role: Role.GROUP_CHAIRMAN,
        password: hashedPassword,
        plainPassword: password,
        isActive: true,
      },
    });
    console.log(`✅ [Chairman Setup] Account updated successfully:`);
    console.log(`   - Name:     ${updated.name}`);
    console.log(`   - Email:    ${updated.email}`);
    console.log(`   - Password: ${password}`);
    console.log(`   - Role:     ${updated.role}`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        role: Role.GROUP_CHAIRMAN,
        password: hashedPassword,
        plainPassword: password,
        phone: '+91-9999900001',
        isActive: true,
      },
    });
    console.log(`✅ [Chairman Setup] Account created successfully:`);
    console.log(`   - Name:     ${created.name}`);
    console.log(`   - Email:    ${created.email}`);
    console.log(`   - Password: ${password}`);
    console.log(`   - Role:     ${created.role}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error creating chairman:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
