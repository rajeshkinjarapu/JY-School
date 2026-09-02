const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating academic year for all classes to 2026-2027...");
  try {
    const result = await prisma.class.updateMany({
      where: {}, // Update all
      data: {
        academicYear: '2026-2027',
      },
    });
    console.log(`Successfully updated ${result.count} classes.`);

    const settingsResult = await prisma.schoolSettings.updateMany({
      where: {},
      data: {
        currentYear: '2026-2027',
      }
    });
    console.log(`Successfully updated school settings.`);
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
