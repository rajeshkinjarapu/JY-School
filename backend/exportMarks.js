const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  const marks = await prisma.mark.findMany({
    where: { examId: '9f997160-3621-4fe4-a596-f6d725bf6c70' },
    include: {
      student: { include: { user: true, class: true } },
      subject: true
    }
  });
  
  if (marks.length === 0) {
    console.log('No marks found');
    return;
  }
  
  let csv = 'Student Name,Admission No,Class,Subject,Marks Obtained,Max Marks,Grade,Remarks\n';
  for (const m of marks) {
    const studentName = m.student.user.name.replace(/,/g, '');
    const admNo = m.student.admissionNumber || '';
    const className = m.student.class ? m.student.class.name : '';
    const subjectName = m.subject.name;
    const marksObt = m.marksObtained;
    const maxMarks = m.maxMarks;
    const grade = m.grade || '';
    const remarks = m.remarks ? m.remarks.replace(/,/g, '') : '';
    csv += \\,\,\,\,\,\,\,\\n\;
  }
  
  fs.writeFileSync('C:/Users/SRI/Desktop/FORMATIVE_ASSESSMENT_MARKS.csv', csv);
  console.log('SUCCESS: CSV saved to Desktop with ' + marks.length + ' records.');
}
main().finally(() => prisma.());
