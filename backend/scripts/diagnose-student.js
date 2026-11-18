// Comprehensive Student Diagnostic Script
// Usage: node scripts/diagnose-student.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔍 JY SCHOOL - STUDENT DATA & PHOTO INVESTIGATION');
  console.log('====================================================\n');

  // 1. Direct Search for JY26-6022
  console.log('--- 1. Searching for "JY26-6022" directly ---');
  const directStudent = await prisma.student.findFirst({
    where: {
      OR: [
        { rollNo: { equals: 'JY26-6022', mode: 'insensitive' } },
        { user: { email: { equals: 'JY26-6022', mode: 'insensitive' } } },
      ]
    },
    include: {
      user: true,
      class: true
    }
  });

  if (directStudent) {
    console.log('✅ Student record FOUND with rollNo "JY26-6022":');
    console.log({
      id: directStudent.id,
      rollNo: directStudent.rollNo,
      name: directStudent.user?.name,
      email: directStudent.user?.email,
      className: directStudent.class?.name,
      section: directStudent.class?.section,
      gender: directStudent.gender,
      aadharNo: directStudent.aadharNo,
      childId: directStudent.childId,
      apaarId: directStudent.apaarId,
      fatherName: directStudent.fatherName,
      motherName: directStudent.motherName,
      hasPhoto: !!directStudent.user?.photoUrl,
      updatedAt: directStudent.user?.updatedAt
    });
  } else {
    console.log('❌ No active student found with exact rollNo "JY26-6022".');
  }

  // 2. Fuzzy Search for 6022 across all fields
  console.log('\n--- 2. Fuzzy search for "6022" across Student & User ---');
  const fuzzyStudents = await prisma.student.findMany({
    where: {
      OR: [
        { rollNo: { contains: '6022' } },
        { rollNo: { contains: '602' } },
        { aadharNo: { contains: '6022' } },
        { childId: { contains: '6022' } },
        { apaarId: { contains: '6022' } },
        { user: { email: { contains: '6022' } } },
        { user: { name: { contains: '6022' } } }
      ]
    },
    include: { user: true, class: true }
  });

  console.log(`Found ${fuzzyStudents.length} student(s) matching fuzzy "6022":`);
  fuzzyStudents.forEach(s => {
    console.log(` - ID: ${s.id} | Roll: ${s.rollNo} | Name: ${s.user?.name} | Class: ${s.class?.name} | Updated: ${s.user?.updatedAt}`);
  });

  // 3. Search for Roll Numbers ending in '022' or '22' in 6th Class
  console.log('\n--- 3. Students in 6th Class or with Roll No matching "%22" ---');
  const class6Students = await prisma.student.findMany({
    where: {
      OR: [
        { class: { name: { contains: '6' } } },
        { rollNo: { endsWith: '022' } },
        { rollNo: { endsWith: '22' } },
        { rollNo: { startsWith: 'JY26-6' } }
      ]
    },
    orderBy: { rollNo: 'asc' },
    include: { user: true, class: true },
    take: 35
  });

  console.log(`Found ${class6Students.length} relevant student(s):`);
  class6Students.forEach(s => {
    console.log(` - Roll: ${s.rollNo.padEnd(12)} | Name: ${(s.user?.name || '').padEnd(25)} | Class: ${s.class?.name || 'N/A'} | Has Photo: ${s.user?.photoUrl ? 'YES' : 'NO'}`);
  });

  // 4. Check AuditLog for any history of JY26-6022 or Student Deletions
  console.log('\n--- 4. Checking Audit Logs for JY26-6022 or DELETIONS ---');
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { oldValues: { contains: '6022' } },
          { newValues: { contains: '6022' } },
          { entityId: { contains: '6022' } },
          { action: { contains: 'DELETE' } },
          { entity: 'STUDENT' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    console.log(`Found ${auditLogs.length} audit log entries:`);
    auditLogs.forEach(log => {
      console.log(` [${log.createdAt.toISOString()}] Action: ${log.action} | Entity: ${log.entity} | EntityId: ${log.entityId}`);
      if (log.oldValues) console.log(`   Old: ${log.oldValues.substring(0, 150)}...`);
      if (log.newValues) console.log(`   New: ${log.newValues.substring(0, 150)}...`);
    });
  } catch (err) {
    console.log('AuditLog check skipped or table empty:', err.message);
  }

  // 5. Check for Duplicate Names or Duplicate Photos
  console.log('\n--- 5. Checking for Duplicate Names among active students ---');
  const allStudents = await prisma.student.findMany({
    include: { user: true, class: true }
  });
  console.log(`Total active students in DB: ${allStudents.length}`);

  const nameMap = new Map();
  for (const s of allStudents) {
    const n = (s.user?.name || '').trim().toLowerCase();
    if (!nameMap.has(n)) nameMap.set(n, []);
    nameMap.get(n).push(s);
  }

  const duplicates = Array.from(nameMap.entries()).filter(([_, list]) => list.length > 1);
  console.log(`Found ${duplicates.length} duplicate name(s):`);
  duplicates.forEach(([name, list]) => {
    console.log(`⚠️ Name "${name}" appears ${list.length} times:`);
    list.forEach(s => {
      console.log(`    - Roll: ${s.rollNo} | Class: ${s.class?.name} | Created: ${s.user?.createdAt} | Updated: ${s.user?.updatedAt} | Photo: ${s.user?.photoUrl ? 'YES' : 'NO'}`);
    });
  });

  // 6. Check for Duplicate Photos
  console.log('\n--- 6. Checking for Duplicate Photos (Photo Swap / Sharing) ---');
  const photoMap = new Map();
  for (const s of allStudents) {
    if (s.user?.photoUrl) {
      // Use photo length and prefix as signature to avoid huge memory
      const sig = s.user.photoUrl.substring(0, 100) + s.user.photoUrl.slice(-100);
      if (!photoMap.has(sig)) photoMap.set(sig, []);
      photoMap.get(sig).push(s);
    }
  }

  const sharedPhotos = Array.from(photoMap.entries()).filter(([_, list]) => list.length > 1);
  console.log(`Found ${sharedPhotos.length} photo(s) shared by multiple students:`);
  sharedPhotos.forEach(([_, list]) => {
    console.log(`⚠️ Same photo shared between ${list.length} students:`);
    list.forEach(s => {
      console.log(`    - Roll: ${s.rollNo} | Name: ${s.user?.name} | Class: ${s.class?.name} | Updated: ${s.user?.updatedAt}`);
    });
  });

  // 7. Check recently updated students (last 14 days)
  console.log('\n--- 7. Most recently updated students (Last 10) ---');
  const recentUpdates = [...allStudents].sort((a, b) => {
    const tA = new Date(a.user?.updatedAt || 0).getTime();
    const tB = new Date(b.user?.updatedAt || 0).getTime();
    return tB - tA;
  }).slice(0, 10);

  recentUpdates.forEach(s => {
    console.log(` - Roll: ${s.rollNo.padEnd(12)} | Name: ${(s.user?.name || '').padEnd(25)} | Class: ${(s.class?.name || '').padEnd(8)} | Updated: ${s.user?.updatedAt?.toISOString()}`);
  });

  console.log('\n====================================================');
  console.log('✅ INVESTIGATION COMPLETE');
  console.log('====================================================');
}

main()
  .catch(e => {
    console.error('Error during diagnostic:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
