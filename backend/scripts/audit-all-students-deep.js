// Full Deep Audit of All Students Across All Classes in JY School ERP
// Usage: node scripts/audit-all-students-deep.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('🛡️ JY SCHOOL - COMPREHENSIVE SCHOOL-WIDE STUDENT INTEGRITY AUDIT');
  console.log('====================================================================\n');

  // 1. Fetch all students with their classes and user profiles
  const allStudents = await prisma.student.findMany({
    include: {
      user: true,
      class: true
    },
    orderBy: [
      { class: { name: 'asc' } },
      { rollNo: 'asc' }
    ]
  });

  console.log(`📊 TOTAL ACTIVE STUDENTS IN DATABASE: ${allStudents.length}\n`);

  // ------------------------------------------------------------------
  // AUDIT 1: GENDER VS TELUGU NAME MISMATCH (DETECT NAME SHIFTS)
  // ------------------------------------------------------------------
  console.log('--- AUDIT 1: GENDER VS STUDENT NAME INTEGRITY ---');
  const maleKeywords = ['KUMAR', 'RAO', 'NAIDU', 'VARDHAN', 'BABU', 'REDDY', 'PRASAD', 'SANKAR', 'SWAMY', 'RAJ', 'DILIP', 'ROHAN', 'HARSHA', 'SAI', 'RAM', 'ROSHAN', 'SOURYA', 'TEJA', 'BHARADWAJ', 'KUSHAL', 'VIHAN', 'MANOJ', 'SIDDARDHA', 'GUNASEKHAR', 'HAMEER', 'BHARATH', 'JAYANTH', 'PRAVEEN', 'SRIKAR', 'BALARAJU', 'HEMASUNDAR', 'JASWANTH', 'KOUSHIK', 'HITHIN', 'GOVARDHAN', 'DYANESH', 'TARUN', 'SURYA', 'HIMA SAGAR', 'MOKSHITH'];
  const femaleKeywords = ['KUMARI', 'DEVI', 'LAKSHMI', 'LAXMI', 'PRIYA', 'SRI', 'SREE', 'VANI', 'LATHA', 'MOUNIKA', 'CHANDINI', 'CHINMAYI', 'CHAITHRA', 'HARSHINI', 'SAHITYA', 'GAYATHRI', 'POOJITHA', 'BHAVYA', 'SOWJANYA', 'DIVYA', 'ANUSHA', 'SWATHI', 'LEKHANA', 'VEDHITHA', 'VENNELA', 'PARINITHA', 'LIKSHITA', 'HEMALATHA', 'PURVIKA', 'CHARITHA', 'JITHYA', 'CHAHNA', 'JAHNAVI', 'NITHYASRI', 'ROHITHA', 'LASYA', 'THANUJA', 'JEEVIKA', 'RUDRANI', 'AMRUTHA', 'VAISHNAVI', 'BHAVITA', 'NITEESHA', 'LIKHITHA', 'LAHARI', 'BHASHINI', 'SYAMALA', 'MADHUKSHARA', 'LIKHITESWARI', 'TEJASWINI', 'BHARGAVI', 'SANJANA', 'VEDITHA', 'BHAVAGNA', 'TANVITA', 'DILLESWARI', 'INDUKUMARI', 'MOHINI PRIYA', 'AKSHAYA', 'TRIVENI', 'NUTHANA', 'SANJANA'];

  const genderMismatches = [];

  allStudents.forEach(s => {
    const nameUpper = (s.user?.name || '').toUpperCase().trim();
    const gender = (s.gender || '').toUpperCase().trim();
    if (!gender || !nameUpper) return;

    const words = nameUpper.split(/[\s.]+/);
    const lastWord = words[words.length - 1];

    if (gender === 'FEMALE') {
      // Check if ends with a strong male name and none of female keywords
      const hasMaleSuffix = ['KUMAR', 'RAO', 'VARDHAN', 'BABU', 'NAIDU', 'REDDY', 'SANKAR', 'SWAMY', 'PRASAD', 'ROHAN', 'DILIP', 'VIHAN', 'SIDDARDHA'].includes(lastWord);
      const hasFemaleWord = words.some(w => femaleKeywords.includes(w));
      if (hasMaleSuffix && !hasFemaleWord) {
        genderMismatches.push({
          rollNo: s.rollNo,
          studentName: s.user?.name,
          className: s.class?.name,
          recordedGender: gender,
          flag: 'Flagged as FEMALE but name appears MALE',
          fatherName: s.fatherName,
          motherName: s.motherName
        });
      }
    } else if (gender === 'MALE') {
      // Check if ends with a strong female name and none of male keywords
      const hasFemaleSuffix = ['KUMARI', 'DEVI', 'PRIYA', 'LATHA', 'MOUNIKA', 'CHANDINI', 'CHINMAYI', 'CHAITHRA', 'HARSHINI', 'SAHITYA', 'GAYATHRI', 'POOJITHA', 'BHAVYA', 'SOWJANYA', 'DIVYA', 'ANUSHA', 'SWATHI', 'LEKHANA', 'VEDHITHA', 'VENNELA', 'PARINITHA', 'LIKSHITA', 'HEMALATHA', 'PURVIKA', 'CHARITHA', 'JITHYA', 'CHAHNA', 'JAHNAVI', 'NITHYASRI', 'ROHITHA', 'LASYA', 'THANUJA', 'JEEVIKA', 'AMRUTHA', 'VAISHNAVI', 'BHAVITA', 'NITEESHA', 'LIKHITHA', 'LAHARI', 'BHASHINI', 'TEJASWINI', 'BHARGAVI', 'SANJANA', 'VEDITHA', 'BHAVAGNA', 'TANVITA', 'DILLESWARI', 'INDUKUMARI', 'AKSHAYA', 'TRIVENI', 'NUTHANA'].includes(lastWord);
      const hasMaleWord = words.some(w => maleKeywords.includes(w));
      if (hasFemaleSuffix && !hasMaleWord) {
        genderMismatches.push({
          rollNo: s.rollNo,
          studentName: s.user?.name,
          className: s.class?.name,
          recordedGender: gender,
          flag: 'Flagged as MALE but name appears FEMALE',
          fatherName: s.fatherName,
          motherName: s.motherName
        });
      }
    }
  });

  if (genderMismatches.length === 0) {
    console.log('✅ No gender/name mismatches found across the school!\n');
  } else {
    console.log(`⚠️ Found ${genderMismatches.length} student(s) with potential Gender/Name mismatches:`);
    genderMismatches.forEach(m => {
      console.log(`  - [${m.rollNo}] (${m.className}) ${m.studentName} [${m.recordedGender}] -> Father: ${m.fatherName || 'N/A'} | Mother: ${m.motherName || 'N/A'}`);
      console.log(`    Note: ${m.flag}`);
    });
    console.log('');
  }

  // ------------------------------------------------------------------
  // AUDIT 2: FULL SURNAME CONFLICTS (FATHER HAS SURNAME != STUDENT SURNAME)
  // ------------------------------------------------------------------
  console.log('--- AUDIT 2: FULL SURNAME CONFLICTS (EXPLICIT FATHER SURNAME != STUDENT SURNAME) ---');
  const surnameConflicts = [];

  allStudents.forEach(s => {
    const studentName = (s.user?.name || '').trim();
    const fatherName = (s.fatherName || '').trim();
    if (!studentName || !fatherName) return;

    const studentWords = studentName.split(/[\s.]+/).filter(w => w.length > 0);
    const fatherWords = fatherName.split(/[\s.]+/).filter(w => w.length > 0);

    // Only inspect if Father has 2 or more words (e.g. "NAKKA PAPA RAO", "NADIMANTI GOVINDARAO")
    if (studentWords.length >= 2 && fatherWords.length >= 2) {
      const studentSurname = studentWords[0].toUpperCase();
      const fatherSurname = fatherWords[0].toUpperCase();

      // Ignore single-letter initials like "K", "P", "S"
      if (studentSurname.length >= 3 && fatherSurname.length >= 3 && studentSurname !== fatherSurname) {
        // Exclude common compound names or known variations
        surnameConflicts.push({
          rollNo: s.rollNo,
          studentName,
          className: s.class?.name,
          fatherName,
          motherName: s.motherName,
          studentSurname,
          fatherSurname
        });
      }
    }
  });

  console.log(`Found ${surnameConflicts.length} student(s) where Father has an explicit Surname different from Student's Surname:`);
  surnameConflicts.forEach(c => {
    console.log(`  - [${c.rollNo}] (${c.className}) Student: "${c.studentName}" vs Father: "${c.fatherName}" [${c.studentSurname} != ${c.fatherSurname}]`);
  });
  console.log('');

  // ------------------------------------------------------------------
  // AUDIT 3: DUPLICATE GOVERNMENT IDS (AADHAR, CHILD ID, APAAR ID)
  // ------------------------------------------------------------------
  console.log('--- AUDIT 3: DUPLICATE GOVERNMENT IDS CHECK ---');
  const aadharMap = new Map();
  const childIdMap = new Map();
  const apaarIdMap = new Map();

  allStudents.forEach(s => {
    if (s.aadharNo && s.aadharNo.trim().length >= 10) {
      const a = s.aadharNo.trim();
      if (!aadharMap.has(a)) aadharMap.set(a, []);
      aadharMap.get(a).push(s);
    }
    if (s.childId && s.childId.trim().length >= 5) {
      const c = s.childId.trim();
      if (!childIdMap.has(c)) childIdMap.set(c, []);
      childIdMap.get(c).push(s);
    }
    if (s.apaarId && s.apaarId.trim().length >= 5) {
      const ap = s.apaarId.trim();
      if (!apaarIdMap.has(ap)) apaarIdMap.set(ap, []);
      apaarIdMap.get(ap).push(s);
    }
  });

  const dupAadhar = Array.from(aadharMap.entries()).filter(([_, list]) => list.length > 1);
  const dupChild = Array.from(childIdMap.entries()).filter(([_, list]) => list.length > 1);
  const dupApaar = Array.from(apaarIdMap.entries()).filter(([_, list]) => list.length > 1);

  if (dupAadhar.length === 0 && dupChild.length === 0 && dupApaar.length === 0) {
    console.log('✅ Zero duplicate Aadhar, Child ID, or APAAR IDs found across the school!\n');
  } else {
    if (dupAadhar.length > 0) {
      console.log(`⚠️ Duplicate Aadhar numbers found: ${dupAadhar.length}`);
      dupAadhar.forEach(([a, list]) => {
        console.log(`  - Aadhar ${a} shared by: ${list.map(s => `${s.rollNo} (${s.user?.name})`).join(', ')}`);
      });
    }
    if (dupChild.length > 0) {
      console.log(`⚠️ Duplicate Child IDs found: ${dupChild.length}`);
      dupChild.forEach(([c, list]) => {
        console.log(`  - Child ID ${c} shared by: ${list.map(s => `${s.rollNo} (${s.user?.name})`).join(', ')}`);
      });
    }
    if (dupApaar.length > 0) {
      console.log(`⚠️ Duplicate APAAR IDs found: ${dupApaar.length}`);
      dupApaar.forEach(([ap, list]) => {
        console.log(`  - APAAR ID ${ap} shared by: ${list.map(s => `${s.rollNo} (${s.user?.name})`).join(', ')}`);
      });
    }
    console.log('');
  }

  // ------------------------------------------------------------------
  // AUDIT 4: CLASS-BY-CLASS ENROLLMENT & ROLL NUMBER SEQUENCE
  // ------------------------------------------------------------------
  console.log('--- AUDIT 4: CLASS-BY-CLASS STUDENT COUNTS & ROLL NUMBER RANGES ---');
  const classGroups = new Map();
  allStudents.forEach(s => {
    const cName = s.class?.name || 'Unassigned';
    if (!classGroups.has(cName)) classGroups.set(cName, []);
    classGroups.get(cName).push(s);
  });

  const classOrder = ['Nursery', 'LKG', 'UKG', 'PP1', 'PP2', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const sortedClasses = Array.from(classGroups.keys()).sort((a, b) => {
    const idxA = classOrder.indexOf(a);
    const idxB = classOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  console.log('----------------------------------------------------------------------------------');
  console.log('Class Name   | Student Count | Min Roll No   | Max Roll No   | Photos Attached');
  console.log('----------------------------------------------------------------------------------');
  sortedClasses.forEach(cName => {
    const list = classGroups.get(cName);
    const rolls = list.map(s => s.rollNo).sort();
    const minRoll = rolls[0] || 'N/A';
    const maxRoll = rolls[rolls.length - 1] || 'N/A';
    const photoCount = list.filter(s => s.user?.photoUrl).length;

    console.log(`${cName.padEnd(12)} | ${String(list.length).padStart(13)} | ${minRoll.padEnd(13)} | ${maxRoll.padEnd(13)} | ${photoCount}/${list.length}`);
  });
  console.log('----------------------------------------------------------------------------------\n');

  // ------------------------------------------------------------------
  // AUDIT 5: ORPHAN USER ACCOUNTS (USERS WITH ROLE 'STUDENT' BUT NO STUDENT)
  // ------------------------------------------------------------------
  console.log('--- AUDIT 5: ORPHAN STUDENT USERS (MISSING STUDENT PROFILE) ---');
  const orphanUsers = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      student: null
    }
  });

  if (orphanUsers.length === 0) {
    console.log('✅ Zero orphan student users found! Every STUDENT user has an active Student record.\n');
  } else {
    console.log(`⚠️ Found ${orphanUsers.length} orphan student users:`);
    orphanUsers.forEach(u => {
      console.log(`  - User ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Created: ${u.createdAt}`);
    });
    console.log('');
  }

  // ------------------------------------------------------------------
  // AUDIT 6: MISSING CRITICAL DATA (STUDENTS WITH NO NAME OR NO ROLLNO)
  // ------------------------------------------------------------------
  console.log('--- AUDIT 6: STUDENTS WITH MISSING NAME, ROLL NO OR CLASS ---');
  const missingData = allStudents.filter(s => !s.user?.name || !s.rollNo || !s.classId);
  if (missingData.length === 0) {
    console.log('✅ Every student has a valid Name, Roll Number, and Class assigned!\n');
  } else {
    console.log(`⚠️ Found ${missingData.length} students with missing critical fields:`);
    missingData.forEach(s => {
      console.log(`  - Roll: ${s.rollNo} | Name: ${s.user?.name} | Class: ${s.class?.name}`);
    });
    console.log('');
  }

  console.log('====================================================================');
  console.log('✅ COMPREHENSIVE SCHOOL-WIDE AUDIT COMPLETE');
  console.log('====================================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
