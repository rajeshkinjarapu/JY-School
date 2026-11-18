// Deep History and Forensic Trace for 6th Class Swapped Students
// Usage: node scripts/trace-student-history.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('====================================================');
  console.log('🔍 FORENSIC TRACE: 6TH CLASS SWAPPED STUDENTS');
  console.log('====================================================\n');

  const targetRolls = ['JY26-6018', 'JY26-6020', 'JY26-6021', 'JY26-6022', 'JY26-6023'];

  for (const roll of targetRolls) {
    console.log(`\n=================== [ ${roll} ] ===================`);
    const student = await prisma.student.findUnique({
      where: { rollNo: roll },
      include: {
        user: true,
        class: true,
        feePayments: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        feeStructures: true,
        marks: {
          include: { exam: true, subject: true },
          take: 5
        },
        slipTestMarks: {
          take: 5
        }
      }
    });

    if (!student) {
      console.log(`❌ Student ${roll} not found!`);
      continue;
    }

    console.log('STUDENT & USER PROFILE:');
    console.log({
      id: student.id,
      rollNo: student.rollNo,
      currentName: student.user?.name,
      email: student.user?.email,
      phone: student.user?.phone,
      gender: student.gender,
      dob: student.dob,
      address: student.address,
      aadharNo: student.aadharNo,
      childId: student.childId,
      apaarId: student.apaarId,
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      fatherAadhar: student.fatherAadhar,
      motherName: student.motherName,
      motherPhone: student.motherPhone,
      motherAadhar: student.motherAadhar,
      userCreatedAt: student.user?.createdAt,
      userUpdatedAt: student.user?.updatedAt,
      studentAdmissionDate: student.admissionDate,
      hasPhoto: !!student.user?.photoUrl,
      photoLength: student.user?.photoUrl?.length || 0
    });

    console.log('\nFEE PAYMENTS HISTORY:');
    if (student.feePayments.length === 0) {
      console.log('  (No fee payments recorded)');
    } else {
      student.feePayments.forEach(p => {
        console.log(`  - Paid: ₹${p.amount} | Date: ${p.paymentDate?.toISOString()?.split('T')[0]} | Mode: ${p.paymentMode} | Remarks: ${p.remarks || 'None'} | Receipt: ${p.receiptNo || 'N/A'}`);
      });
    }

    console.log('\nEXAM MARKS HISTORY:');
    if (student.marks.length === 0) {
      console.log('  (No exam marks recorded)');
    } else {
      student.marks.forEach(m => {
        console.log(`  - Exam: ${m.exam?.name} | Subject: ${m.subject?.name} | Marks: ${m.marksObtained}/${m.maxMarks} | Date: ${m.createdAt?.toISOString()?.split('T')[0]}`);
      });
    }
  }

  // Check if there are any Excel files or Zip files in uploads directory
  console.log('\n--- Checking uploads / tmp directories for uploaded spreadsheets ---');
  const checkDirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../../uploads'),
    '/tmp'
  ];

  for (const d of checkDirs) {
    if (fs.existsSync(d)) {
      try {
        const files = fs.readdirSync(d);
        const excelOrZip = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv') || f.endsWith('.zip'));
        console.log(`Directory ${d} has ${excelOrZip.length} excel/zip files:`);
        excelOrZip.slice(0, 10).forEach(f => {
          const stat = fs.statSync(path.join(d, f));
          console.log(`  - ${f} (${(stat.size / 1024).toFixed(1)} KB) modified: ${stat.mtime.toISOString()}`);
        });
      } catch (err) {
        console.log(`Error reading ${d}:`, err.message);
      }
    }
  }

  // Check Local Database if accessible
  console.log('\n--- Checking Local Database (jy_school_local) if available ---');
  if (process.env.LOCAL_DATABASE_URL) {
    try {
      const { PrismaClient: LocalPrismaClient } = require('@prisma/client');
      // Create separate connection if possible or use pg
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.LOCAL_DATABASE_URL });
      await client.connect();
      console.log('✅ Connected to local postgres (jy_school_local)!');
      const res = await client.query(`
        SELECT s."rollNo", u."name", s."fatherName", s."motherName", s."aadharNo"
        FROM "Student" s
        JOIN "User" u ON s."userId" = u."id"
        WHERE s."rollNo" IN ('JY26-6018', 'JY26-6021', 'JY26-6022')
           OR s."fatherName" ILIKE '%NADIMANTI%'
           OR u."name" ILIKE '%NADIMANTI%'
           OR u."name" ILIKE '%NEERAJ%'
      `);
      console.log(`Found ${res.rows.length} rows in jy_school_local:`);
      res.rows.forEach(r => console.log(r));
      await client.end();
    } catch (localErr) {
      console.log('Local DB query skipped or not connected:', localErr.message);
    }
  }

  console.log('\n====================================================');
  console.log('✅ TRACE COMPLETE');
  console.log('====================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
