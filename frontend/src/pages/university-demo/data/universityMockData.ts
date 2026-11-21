export interface InstitutionWing {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  type: 'SCHOOL' | 'JUNIOR' | 'DEGREE' | 'PG' | 'BED';
  icon: string;
  color: string;
  badge: string;
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  feeCollection: string;
  feePercent: number;
}

export const INSTITUTION_WINGS: InstitutionWing[] = [
  {
    id: 'school',
    name: 'Sri Venkateswara JY Public School',
    shortName: 'School Wing',
    tagline: 'CBSE & State Curriculum (Nursery to 10th Class)',
    type: 'SCHOOL',
    icon: 'School',
    color: '#3B82F6',
    badge: 'K-10 School',
    totalStudents: 1250,
    totalFaculty: 65,
    totalCourses: 14,
    feeCollection: '₹2.45 Cr',
    feePercent: 88,
  },
  {
    id: 'junior',
    name: 'Sri Venkateswara Junior College',
    shortName: 'Junior College (Inter)',
    tagline: 'Board of Intermediate Education (MPC, BiPC, CEC, MEC)',
    type: 'JUNIOR',
    icon: 'GraduationCap',
    color: '#8B5CF6',
    badge: '+2 Intermediate',
    totalStudents: 1850,
    totalFaculty: 85,
    totalCourses: 6,
    feeCollection: '₹4.80 Cr',
    feePercent: 84,
  },
  {
    id: 'degree',
    name: 'Sri Venkateswara Autonomous Degree College',
    shortName: 'Degree College',
    tagline: 'CBCS Semester System (B.Sc, B.Com, BBA, B.A)',
    type: 'DEGREE',
    icon: 'Building2',
    color: '#059669',
    badge: 'UG Degree (Sem 1-6)',
    totalStudents: 2450,
    totalFaculty: 110,
    totalCourses: 12,
    feeCollection: '₹6.90 Cr',
    feePercent: 91,
  },
  {
    id: 'pg',
    name: 'Sri Venkateswara Post Graduate Center',
    shortName: 'PG College',
    tagline: 'Autonomous AICTE/UGC Approved (MBA, MCA, M.Sc)',
    type: 'PG',
    icon: 'Briefcase',
    color: '#D97706',
    badge: 'PG Masters (Sem 1-4)',
    totalStudents: 850,
    totalFaculty: 50,
    totalCourses: 5,
    feeCollection: '₹3.10 Cr',
    feePercent: 86,
  },
  {
    id: 'bed',
    name: 'Sri Venkateswara College of Education',
    shortName: 'B.Ed College',
    tagline: 'NCTE Recognized Teacher Training Program',
    type: 'BED',
    icon: 'BookOpen',
    color: '#DC2626',
    badge: 'B.Ed & D.El.Ed',
    totalStudents: 450,
    totalFaculty: 30,
    totalCourses: 2,
    feeCollection: '₹1.15 Cr',
    feePercent: 94,
  },
];

export const CHAIRMAN_KPI_DATA = {
  totalStudents: 6850,
  totalFaculty: 340,
  totalGrossRevenue: '₹18.40 Cr',
  collectedRevenue: '₹15.82 Cr',
  pendingFee: '₹2.58 Cr',
  collectionRate: 86,
  placementsThisYear: 412,
  placementRate: 89,
  attendanceTodayAvg: 93.4,
  admissionsGrowth: '+14.2%',
  wingsComparison: [
    { wing: 'School', students: 1250, revenue: 2.45, staff: 65, collection: 88 },
    { wing: 'Junior Col.', students: 1850, revenue: 4.80, staff: 85, collection: 84 },
    { wing: 'Degree Col.', students: 2450, revenue: 6.90, staff: 110, collection: 91 },
    { wing: 'PG Center', students: 850, revenue: 3.10, staff: 50, collection: 86 },
    { wing: 'B.Ed Col.', students: 450, revenue: 1.15, staff: 30, collection: 94 },
  ],
};

export const DEGREE_PROGRAMS = [
  {
    code: 'BSC-CS',
    name: 'B.Sc Computer Science (Data Science & AI)',
    duration: '3 Years (6 Semesters)',
    semesters: 6,
    strength: 360,
    hod: 'Dr. K. V. Ramanamurthy, Ph.D.',
    credits: 140,
    subjectsCount: 32,
    status: 'Autonomous',
  },
  {
    code: 'BCOM-CA',
    name: 'B.Com Computer Applications',
    duration: '3 Years (6 Semesters)',
    semesters: 6,
    strength: 420,
    hod: 'Prof. M. Sarada Devi, M.Phil',
    credits: 136,
    subjectsCount: 30,
    status: 'Autonomous',
  },
  {
    code: 'BBA-HM',
    name: 'Bachelor of Business Administration (BBA)',
    duration: '3 Years (6 Semesters)',
    semesters: 6,
    strength: 240,
    hod: 'Dr. P. Srinivas Rao, MBA, Ph.D.',
    credits: 138,
    subjectsCount: 28,
    status: 'Autonomous',
  },
  {
    code: 'BSC-MSCS',
    name: 'B.Sc (Maths, Statistics, Computer Science)',
    duration: '3 Years (6 Semesters)',
    semesters: 6,
    strength: 300,
    hod: 'Dr. G. Lakshmi Narayana, Ph.D.',
    credits: 140,
    subjectsCount: 32,
    status: 'Autonomous',
  },
];

export const PERIOD_ATTENDANCE_STUDENTS = [
  { id: '1', pin: '22034012001', name: 'A. Sai Vignesh', present: true, totalAttended: 42, totalConducted: 46, percent: 91.3 },
  { id: '2', pin: '22034012002', name: 'B. Hima Bindu', present: true, totalAttended: 45, totalConducted: 46, percent: 97.8 },
  { id: '3', pin: '22034012003', name: 'CH. Vamsi Krishna', present: false, totalAttended: 32, totalConducted: 46, percent: 69.5, atRisk: true },
  { id: '4', pin: '22034012004', name: 'D. Mounika Sri', present: true, totalAttended: 40, totalConducted: 46, percent: 86.9 },
  { id: '5', pin: '22034012005', name: 'G. Tharun Kumar', present: true, totalAttended: 38, totalConducted: 46, percent: 82.6 },
  { id: '6', pin: '22034012006', name: 'K. Sneha Latha', present: true, totalAttended: 44, totalConducted: 46, percent: 95.6 },
  { id: '7', pin: '22034012007', name: 'M. Pavan Kalyan', present: false, totalAttended: 31, totalConducted: 46, percent: 67.3, atRisk: true },
  { id: '8', pin: '22034012008', name: 'N. Divya Teja', present: true, totalAttended: 41, totalConducted: 46, percent: 89.1 },
  { id: '9', pin: '22034012009', name: 'P. Sai Charitha', present: true, totalAttended: 43, totalConducted: 46, percent: 93.4 },
  { id: '10', pin: '22034012010', name: 'R. Akhil Varma', present: true, totalAttended: 37, totalConducted: 46, percent: 80.4 },
];

export const STUDENT_CBCS_GRADE_MEMO = {
  studentName: 'SRI RAMACHANDRA RAJU',
  pinNo: '22034012045',
  course: 'B.Sc (Computer Science & Data Science)',
  semester: 'SEMESTER - IV (Autonomous)',
  academicYear: '2024 - 2025',
  monthYear: 'NOVEMBER 2025',
  hallTicketNo: 'HT22034012045',
  subjects: [
    { code: 'CS401', name: 'Advanced Java & J2EE Programming', credits: 4, internal: 23, internalMax: 25, external: 69, externalMax: 75, total: 92, gradePoint: 10, letterGrade: 'O (Outstanding)' },
    { code: 'CS402', name: 'Database Management Systems & SQL', credits: 4, internal: 22, internalMax: 25, external: 65, externalMax: 75, total: 87, gradePoint: 9, letterGrade: 'A+ (Excellent)' },
    { code: 'CS403', name: 'Operating Systems & Linux Shell', credits: 4, internal: 21, internalMax: 25, external: 62, externalMax: 75, total: 83, gradePoint: 8, letterGrade: 'A (Very Good)' },
    { code: 'CS404', name: 'Web Technologies (React & Node.js)', credits: 3, internal: 24, internalMax: 25, external: 71, externalMax: 75, total: 95, gradePoint: 10, letterGrade: 'O (Outstanding)' },
    { code: 'CS405L', name: 'Java & DBMS Computing Laboratory', credits: 2, internal: 25, internalMax: 25, external: 73, externalMax: 75, total: 98, gradePoint: 10, letterGrade: 'O (Outstanding)' },
    { code: 'CS406', name: 'Quantitative Aptitude & Communication', credits: 2, internal: 20, internalMax: 25, external: 60, externalMax: 75, total: 80, gradePoint: 8, letterGrade: 'A (Very Good)' },
  ],
  totalCredits: 19,
  sgpa: '9.16',
  cgpa: '8.84',
  result: 'PASSED IN FIRST CLASS WITH DISTINCTION',
  backlogs: 0,
  jvdStatus: {
    scheme: 'Jagananna Vidya Deevena (RTF - 100% Reimbursement)',
    applicationNo: 'JVD2024AP0094821',
    eligibleTuitionFee: '₹28,500',
    govtReleased: '₹28,500',
    paymentDate: '14-Oct-2025 (Direct DBT to College Account)',
    collegeBalanceDue: '₹0 (Fully Paid)',
    status: 'ACTIVE & VERIFIED',
  },
};
