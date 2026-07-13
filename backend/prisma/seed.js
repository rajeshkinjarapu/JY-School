"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const enums_1 = require("../src/types/enums");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // Clear existing data in correct order
    await prisma.$transaction([
        prisma.auditLog.deleteMany(),
        prisma.message.deleteMany(),
        prisma.announcement.deleteMany(),
        prisma.mark.deleteMany(),
        prisma.attendance.deleteMany(),
        prisma.feePayment.deleteMany(),
        prisma.feeStructure.deleteMany(),
        prisma.timetable.deleteMany(),
        prisma.exam.deleteMany(),
        prisma.classSubjectTeacher.deleteMany(),
        prisma.subject.deleteMany(),
        prisma.student.deleteMany(),
        prisma.teacher.deleteMany(),
        prisma.parent.deleteMany(),
        prisma.class.deleteMany(),
        prisma.schoolSettings.deleteMany(),
        prisma.event.deleteMany(),
        prisma.user.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');
    // 1. School Settings
    await prisma.schoolSettings.create({
        data: {
            schoolName: 'JY School',
            address: '123 Education Street, Knowledge City, State 400001',
            phone: '+91-9876543210',
            email: 'info@rajacademy.com',
            website: 'https://rajacademy.com',
            currentYear: '2024-2025',
        },
    });
    console.log('✅ School settings created');
    // 2. Super Admin
    const adminPassword = await bcryptjs_1.default.hash('Admin@123', 12);
    const adminUser = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'admin@rajacademy.com',
            password: adminPassword,
            role: enums_1.Role.SUPER_ADMIN,
            phone: '+91-9000000001',
            isActive: true,
        },
    });
    console.log('✅ Super Admin created:', adminUser.email);
    // 3. Teacher User + Teacher Record
    const teacherPassword = await bcryptjs_1.default.hash('Teacher@123', 12);
    const teacherUser = await prisma.user.create({
        data: {
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@rajacademy.com',
            password: teacherPassword,
            role: enums_1.Role.TEACHER,
            phone: '+91-9000000002',
            isActive: true,
        },
    });
    const teacher = await prisma.teacher.create({
        data: {
            userId: teacherUser.id,
            employeeId: 'EMP240001',
            qualification: 'M.Sc Mathematics',
            specialization: 'Mathematics & Physics',
            joiningDate: new Date('2020-06-01'),
        },
    });
    console.log('✅ Teacher created:', teacherUser.email);
    // 4. Second Teacher
    const teacher2Password = await bcryptjs_1.default.hash('Teacher@123', 12);
    const teacher2User = await prisma.user.create({
        data: {
            name: 'Priya Sharma',
            email: 'priya.sharma@rajacademy.com',
            password: teacher2Password,
            role: enums_1.Role.TEACHER,
            phone: '+91-9000000003',
            isActive: true,
        },
    });
    const teacher2 = await prisma.teacher.create({
        data: {
            userId: teacher2User.id,
            employeeId: 'EMP240002',
            qualification: 'M.A English Literature',
            specialization: 'English & History',
            joiningDate: new Date('2021-06-01'),
        },
    });
    console.log('✅ Teacher 2 created:', teacher2User.email);
    // 5. Create Class Grade 10-A (2024-2025)
    const grade10A = await prisma.class.create({
        data: {
            name: 'Grade 10',
            section: 'A',
            academicYear: '2024-2025',
            capacity: 40,
            classTeacherId: teacher.id,
        },
    });
    console.log('✅ Class created: Grade 10-A');
    // 6. Create Class Grade 9-B
    const grade9B = await prisma.class.create({
        data: {
            name: 'Grade 9',
            section: 'B',
            academicYear: '2024-2025',
            capacity: 40,
            classTeacherId: teacher2.id,
        },
    });
    console.log('✅ Class created: Grade 9-B');
    // 7. Create Subjects for Grade 10-A
    const subjectMath = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH10', classId: grade10A.id } });
    const subjectSci = await prisma.subject.create({ data: { name: 'Science', code: 'SCI10', classId: grade10A.id } });
    const subjectEng = await prisma.subject.create({ data: { name: 'English', code: 'ENG10', classId: grade10A.id } });
    const subjectHist = await prisma.subject.create({ data: { name: 'History', code: 'HIST10', classId: grade10A.id } });
    const subjectCS = await prisma.subject.create({ data: { name: 'Computer Science', code: 'CS10', classId: grade10A.id } });
    console.log('✅ Subjects created for Grade 10-A');
    // 8. Subjects for Grade 9-B
    const subjectMath9 = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH09', classId: grade9B.id } });
    const subjectEng9 = await prisma.subject.create({ data: { name: 'English', code: 'ENG09', classId: grade9B.id } });
    // 9. Assign Teachers to Subjects
    await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectMath.id, teacherId: teacher.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectSci.id, teacherId: teacher.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectEng.id, teacherId: teacher2.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectHist.id, teacherId: teacher2.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectCS.id, teacherId: teacher.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade9B.id, subjectId: subjectMath9.id, teacherId: teacher.id } });
    await prisma.classSubjectTeacher.create({ data: { classId: grade9B.id, subjectId: subjectEng9.id, teacherId: teacher2.id } });
    console.log('✅ Teacher assignments created');
    // 10. Create Parent User + Parent Record
    const parentPassword = await bcryptjs_1.default.hash('Parent@123', 12);
    const parentUser = await prisma.user.create({
        data: {
            name: 'Suresh Verma',
            email: 'suresh.verma@gmail.com',
            password: parentPassword,
            role: enums_1.Role.PARENT,
            phone: '+91-9000000004',
            isActive: true,
        },
    });
    const parent = await prisma.parent.create({
        data: {
            userId: parentUser.id,
            occupation: 'Business',
            relation: 'Father',
        },
    });
    console.log('✅ Parent created:', parentUser.email);
    // 11. Create Student User + Student Record (Alice)
    const studentPassword = await bcryptjs_1.default.hash('Student@123', 12);
    const studentUser = await prisma.user.create({
        data: {
            name: 'Alice Verma',
            email: 'alice.verma@student.rajacademy.com',
            password: studentPassword,
            role: enums_1.Role.STUDENT,
            phone: '+91-9000000005',
            isActive: true,
        },
    });
    const student = await prisma.student.create({
        data: {
            userId: studentUser.id,
            rollNo: 'RAJ240001',
            classId: grade10A.id,
            dob: new Date('2009-03-15'),
            gender: enums_1.Gender.FEMALE,
            admissionDate: new Date('2024-06-01'),
            address: '45 Rose Street, Knowledge City',
            bloodGroup: 'B+',
            parentId: parent.id,
        },
    });
    console.log('✅ Student (Alice) created:', studentUser.email);
    // 12. Create Student 2 (Bob)
    const student2User = await prisma.user.create({
        data: {
            name: 'Bob Singh',
            email: 'bob.singh@student.rajacademy.com',
            password: await bcryptjs_1.default.hash('Student@123', 12),
            role: enums_1.Role.STUDENT,
            phone: '+91-9000000006',
            isActive: true,
        },
    });
    const student2 = await prisma.student.create({
        data: {
            userId: student2User.id,
            rollNo: 'RAJ240002',
            classId: grade10A.id,
            dob: new Date('2009-07-22'),
            gender: enums_1.Gender.MALE,
            admissionDate: new Date('2024-06-01'),
            address: '78 Blue Avenue, Knowledge City',
            bloodGroup: 'O+',
        },
    });
    console.log('✅ Student (Bob) created');
    // 13. Create Student 3 (Carol)
    const student3User = await prisma.user.create({
        data: {
            name: 'Carol Patel',
            email: 'carol.patel@student.rajacademy.com',
            password: await bcryptjs_1.default.hash('Student@123', 12),
            role: enums_1.Role.STUDENT,
            phone: '+91-9000000007',
            isActive: true,
        },
    });
    const student3 = await prisma.student.create({
        data: {
            userId: student3User.id,
            rollNo: 'RAJ240003',
            classId: grade9B.id,
            dob: new Date('2010-11-05'),
            gender: enums_1.Gender.FEMALE,
            admissionDate: new Date('2024-06-01'),
            address: '12 Green Park, Knowledge City',
            bloodGroup: 'A+',
        },
    });
    console.log('✅ Student (Carol) created');
    // 14. Fee Structure
    const feeStructure1 = await prisma.feeStructure.create({
        data: {
            classId: grade10A.id,
            term: 'Term 1',
            name: 'Tuition Fee - Term 1',
            amount: 15000,
            dueDate: new Date('2024-07-31'),
        },
    });
    const feeStructure2 = await prisma.feeStructure.create({
        data: {
            classId: grade10A.id,
            term: 'Term 2',
            name: 'Tuition Fee - Term 2',
            amount: 15000,
            dueDate: new Date('2024-11-30'),
        },
    });
    const feeStructure9 = await prisma.feeStructure.create({
        data: {
            classId: grade9B.id,
            term: 'Term 1',
            name: 'Tuition Fee - Term 1',
            amount: 12000,
            dueDate: new Date('2024-07-31'),
        },
    });
    console.log('✅ Fee structures created');
    // 15. Fee Payments (Alice - PAID, Bob - PARTIAL)
    await prisma.feePayment.create({
        data: {
            studentId: student.id,
            feeStructureId: feeStructure1.id,
            amountPaid: 15000,
            paymentDate: new Date('2024-07-15'),
            method: enums_1.PaymentMethod.ONLINE,
            status: enums_1.PaymentStatus.PAID,
            remarks: 'Full payment via UPI',
        },
    });
    await prisma.feePayment.create({
        data: {
            studentId: student2.id,
            feeStructureId: feeStructure1.id,
            amountPaid: 8000,
            paymentDate: new Date('2024-07-20'),
            method: enums_1.PaymentMethod.CASH,
            status: enums_1.PaymentStatus.PARTIAL,
            remarks: 'Partial payment - remaining due',
        },
    });
    console.log('✅ Fee payments created');
    // 16. Timetable for Grade 10-A (Mon-Fri, 5 periods each)
    const timetableEntries = [
        // Monday
        { day: 'Monday', startTime: '09:00', endTime: '10:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
        { day: 'Monday', startTime: '10:00', endTime: '11:00', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
        { day: 'Monday', startTime: '11:15', endTime: '12:15', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
        { day: 'Monday', startTime: '12:15', endTime: '13:15', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
        { day: 'Monday', startTime: '14:00', endTime: '15:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
        // Tuesday
        { day: 'Tuesday', startTime: '09:00', endTime: '10:00', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
        { day: 'Tuesday', startTime: '10:00', endTime: '11:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
        { day: 'Tuesday', startTime: '11:15', endTime: '12:15', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
        { day: 'Tuesday', startTime: '12:15', endTime: '13:15', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
        { day: 'Tuesday', startTime: '14:00', endTime: '15:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
        // Wednesday
        { day: 'Wednesday', startTime: '09:00', endTime: '10:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
        { day: 'Wednesday', startTime: '10:00', endTime: '11:00', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
        { day: 'Wednesday', startTime: '11:15', endTime: '12:15', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
        { day: 'Wednesday', startTime: '12:15', endTime: '13:15', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
        { day: 'Wednesday', startTime: '14:00', endTime: '15:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
        // Thursday
        { day: 'Thursday', startTime: '09:00', endTime: '10:00', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
        { day: 'Thursday', startTime: '10:00', endTime: '11:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
        { day: 'Thursday', startTime: '11:15', endTime: '12:15', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
        { day: 'Thursday', startTime: '12:15', endTime: '13:15', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
        { day: 'Thursday', startTime: '14:00', endTime: '15:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
        // Friday
        { day: 'Friday', startTime: '09:00', endTime: '10:00', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
        { day: 'Friday', startTime: '10:00', endTime: '11:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
        { day: 'Friday', startTime: '11:15', endTime: '12:15', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
        { day: 'Friday', startTime: '12:15', endTime: '13:15', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
        { day: 'Friday', startTime: '14:00', endTime: '15:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
    ];
    for (const entry of timetableEntries) {
        await prisma.timetable.create({
            data: { classId: grade10A.id, ...entry },
        });
    }
    console.log('✅ Timetable created (25 slots)');
    // 17. Exam + Marks
    const exam = await prisma.exam.create({
        data: {
            name: 'Mid-Term Examination',
            classId: grade10A.id,
            term: 'Term 1',
            examDate: new Date('2024-09-15'),
            maxMarks: 100,
            passingMarks: 40,
        },
    });
    // Marks for Alice (student)
    const aliceMarks = [
        { subjectId: subjectMath.id, marksObtained: 92, grade: 'A' },
        { subjectId: subjectSci.id, marksObtained: 88, grade: 'B+' },
        { subjectId: subjectEng.id, marksObtained: 85, grade: 'B+' },
        { subjectId: subjectHist.id, marksObtained: 78, grade: 'B' },
        { subjectId: subjectCS.id, marksObtained: 95, grade: 'A+' },
    ];
    for (const m of aliceMarks) {
        await prisma.mark.create({
            data: {
                studentId: student.id,
                examId: exam.id,
                subjectId: m.subjectId,
                marksObtained: m.marksObtained,
                maxMarks: 100,
                grade: m.grade,
            },
        });
    }
    // Marks for Bob (student2)
    const bobMarks = [
        { subjectId: subjectMath.id, marksObtained: 72, grade: 'B' },
        { subjectId: subjectSci.id, marksObtained: 65, grade: 'C+' },
        { subjectId: subjectEng.id, marksObtained: 70, grade: 'B' },
        { subjectId: subjectHist.id, marksObtained: 58, grade: 'C' },
        { subjectId: subjectCS.id, marksObtained: 80, grade: 'B+' },
    ];
    for (const m of bobMarks) {
        await prisma.mark.create({
            data: {
                studentId: student2.id,
                examId: exam.id,
                subjectId: m.subjectId,
                marksObtained: m.marksObtained,
                maxMarks: 100,
                grade: m.grade,
            },
        });
    }
    console.log('✅ Exam & marks created');
    // 18. Attendance Records (last 10 school days)
    const today = new Date();
    const attendanceDays = [];
    let dayCount = 0;
    let checkDate = new Date(today);
    while (dayCount < 10) {
        checkDate = new Date(checkDate.getTime() - 86400000);
        const dow = checkDate.getDay();
        if (dow !== 0 && dow !== 6) {
            attendanceDays.push(new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()));
            dayCount++;
        }
    }
    for (const date of attendanceDays) {
        // Alice attendance
        await prisma.attendance.create({
            data: {
                studentId: student.id,
                classId: grade10A.id,
                date,
                status: Math.random() > 0.1 ? enums_1.AttendanceStatus.PRESENT : enums_1.AttendanceStatus.ABSENT,
                markedById: teacherUser.id,
                teacherId: teacher.id,
            },
        });
        // Bob attendance
        await prisma.attendance.create({
            data: {
                studentId: student2.id,
                classId: grade10A.id,
                date,
                status: Math.random() > 0.2 ? enums_1.AttendanceStatus.PRESENT : enums_1.AttendanceStatus.ABSENT,
                markedById: teacherUser.id,
                teacherId: teacher.id,
            },
        });
        // Carol attendance
        await prisma.attendance.create({
            data: {
                studentId: student3.id,
                classId: grade9B.id,
                date,
                status: Math.random() > 0.15 ? enums_1.AttendanceStatus.PRESENT : enums_1.AttendanceStatus.LATE,
                markedById: teacher2User.id,
                teacherId: teacher2.id,
            },
        });
    }
    console.log('✅ Attendance records created (10 days x 3 students)');
    // 19. Announcements
    await prisma.announcement.create({
        data: {
            title: 'Welcome to Academic Year 2024-2025',
            content: 'We are excited to welcome all students, teachers, and parents to the new academic year. Please check the timetable and fee schedule for your class.',
            targetRoles: 'STUDENT,PARENT,TEACHER',
            createdById: adminUser.id,
            isActive: true,
        },
    });
    await prisma.announcement.create({
        data: {
            title: 'Mid-Term Examination Schedule Released',
            content: 'The Mid-Term Examination for Term 1 will be held from September 15 to September 22, 2024. Please check the detailed schedule on the notice board.',
            targetRoles: 'STUDENT,PARENT',
            createdById: adminUser.id,
            isActive: true,
            expiresAt: new Date('2024-09-30'),
        },
    });
    await prisma.announcement.create({
        data: {
            title: 'Staff Meeting - August 20th',
            content: 'All teaching staff are required to attend the monthly staff meeting on August 20, 2024 at 4:00 PM in the conference room.',
            targetRoles: 'TEACHER',
            createdById: adminUser.id,
            isActive: true,
        },
    });
    await prisma.announcement.create({
        data: {
            title: 'Fee Payment Reminder',
            content: 'Term 1 fees are due by July 31, 2024. Parents are requested to clear pending dues to avoid late fee charges.',
            targetRoles: 'PARENT',
            createdById: adminUser.id,
            isActive: true,
        },
    });
    console.log('✅ Announcements created');
    // 20. Messages between teacher and parent
    await prisma.message.create({
        data: {
            senderId: parentUser.id,
            receiverId: teacherUser.id,
            content: 'Hello Mr. Rajesh, I wanted to ask about Alice\'s performance in Mathematics this term.',
            readStatus: 'READ',
            sentAt: new Date(Date.now() - 2 * 86400000),
        },
    });
    await prisma.message.create({
        data: {
            senderId: teacherUser.id,
            receiverId: parentUser.id,
            content: 'Hello Mr. Verma! Alice is doing exceptionally well. She scored 92 in the mid-term. Keep encouraging her!',
            readStatus: 'READ',
            sentAt: new Date(Date.now() - 2 * 86400000 + 3600000),
        },
    });
    await prisma.message.create({
        data: {
            senderId: parentUser.id,
            receiverId: teacherUser.id,
            content: 'Thank you so much! That is wonderful news. Is there anything we should focus on at home?',
            readStatus: 'UNREAD',
            sentAt: new Date(Date.now() - 86400000),
        },
    });
    await prisma.message.create({
        data: {
            senderId: adminUser.id,
            receiverId: teacherUser.id,
            content: 'Rajesh, please submit the Term 1 marks by end of this week.',
            readStatus: 'READ',
            sentAt: new Date(Date.now() - 3 * 86400000),
        },
    });
    console.log('✅ Messages created');
    // 21. Events
    await prisma.event.create({
        data: {
            title: 'Annual Sports Day',
            description: 'Annual Sports Day celebration with various athletic events and competitions.',
            startDate: new Date('2024-10-15T08:00:00Z'),
            endDate: new Date('2024-10-15T17:00:00Z'),
            allDay: true,
            targetRoles: 'STUDENT,TEACHER,PARENT',
        },
    });
    await prisma.event.create({
        data: {
            title: 'Parent-Teacher Meeting',
            description: 'Monthly parent-teacher meeting to discuss student progress.',
            startDate: new Date('2024-08-30T10:00:00Z'),
            endDate: new Date('2024-08-30T13:00:00Z'),
            allDay: false,
            targetRoles: 'PARENT,TEACHER',
        },
    });
    await prisma.event.create({
        data: {
            title: 'Independence Day Celebration',
            description: 'Independence Day flag hoisting and cultural programs.',
            startDate: new Date('2024-08-15T08:00:00Z'),
            allDay: true,
            targetRoles: '',
        },
    });
    console.log('✅ Events created');
    // 22. Audit Log entry
    await prisma.auditLog.create({
        data: {
            userId: adminUser.id,
            action: 'SEED',
            entity: 'System',
            entityId: null,
            newValues: JSON.stringify({ message: 'Database seeded successfully' }),
            ipAddress: '127.0.0.1',
        },
    });
    console.log('\n🎉 ===== SEED COMPLETE =====');
    console.log('📧 Login credentials:');
    console.log('   Admin:   admin@rajacademy.com    / Admin@123    (SUPER_ADMIN)');
    console.log('   Teacher: rajesh.kumar@rajacademy.com / Teacher@123  (TEACHER)');
    console.log('   Teacher: priya.sharma@rajacademy.com / Teacher@123  (TEACHER)');
    console.log('   Parent:  suresh.verma@gmail.com    / Parent@123   (PARENT)');
    console.log('   Student: alice.verma@student.rajacademy.com / Student@123 (STUDENT)');
    console.log('   Student: bob.singh@student.rajacademy.com   / Student@123 (STUDENT)');
    console.log('   Student: carol.patel@student.rajacademy.com / Student@123 (STUDENT)');
    console.log('===========================\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map