const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const INITIAL_USERS = [
  {
    id: 'usr_dsw_1',
    name: 'Dr. Saurabh Gupta',
    email: 'saurabhsrmscet123@gmail.com',
    password: 'password123',
    role: 'DSW',
    department: 'Central Administration',
    status: 'ACTIVE',
  },
  {
    id: 'usr_hod_cs',
    name: 'Dr. Ramesh Sharma',
    email: 'hod.cs@college.edu',
    password: 'password123',
    role: 'HOD',
    department: 'Computer Science',
    status: 'ACTIVE',
  },
  {
    id: 'usr_hod_ec',
    name: 'Dr. Sunita Verma',
    email: 'hod.ec@college.edu',
    password: 'password123',
    role: 'HOD',
    department: 'Electronics',
    status: 'ACTIVE',
  },
  {
    id: 'usr_faculty_coding',
    name: 'Prof. Vivek Sengupta',
    email: 'faculty.coding@college.edu',
    password: 'password123',
    role: 'FACULTY_INCHARGE',
    department: 'Computer Science',
    status: 'ACTIVE',
  },
  {
    id: 'usr_faculty_robotics',
    name: 'Prof. Anita Rao',
    email: 'faculty.robotics@college.edu',
    password: 'password123',
    role: 'FACULTY_INCHARGE',
    department: 'Electronics',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_vikas',
    name: 'Vikas Pal',
    email: 'student.vikas@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2022CS101',
    year: '4th Year',
    semester: 'Semester 7',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_rahul',
    name: 'Rahul Sharma',
    email: 'student.rahul@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2023CS102',
    year: '3rd Year',
    semester: 'Semester 5',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_priya',
    name: 'Priya Verma',
    email: 'student.priya@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2023CS103',
    year: '3rd Year',
    semester: 'Semester 5',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_rohan',
    name: 'Rohan Verma',
    email: 'student.rohan@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2024CS104',
    year: '2nd Year',
    semester: 'Semester 3',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_sneha',
    name: 'Sneha Gupta',
    email: 'student.sneha@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2025CS105',
    year: '1st Year',
    semester: 'Semester 1',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_ananya',
    name: 'Ananya Patel',
    email: 'student.ananya@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Electronics',
    branch: 'Electronics',
    rollNumber: '2024EC201',
    year: '2nd Year',
    semester: 'Semester 3',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_aarav',
    name: 'Aarav Mehta',
    email: 'student.aarav@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Electronics',
    branch: 'Electronics',
    rollNumber: '2022EC202',
    year: '4th Year',
    semester: 'Semester 7',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_diya',
    name: 'Diya Sharma',
    email: 'student.diya@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Electronics',
    branch: 'Electronics',
    rollNumber: '2023EC203',
    year: '3rd Year',
    semester: 'Semester 5',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_ishaan',
    name: 'Ishaan Singh',
    email: 'student.ishaan@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Electronics',
    branch: 'Electronics',
    rollNumber: '2025EC204',
    year: '1st Year',
    semester: 'Semester 1',
    status: 'ACTIVE',
  },
  {
    id: 'usr_student_ishika',
    name: 'Ishika Joshi',
    email: 'ishikaequinox123@gmail.com',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    branch: 'Computer Science',
    rollNumber: '2022CS199',
    year: '4th Year',
    semester: 'Semester 7',
    status: 'ACTIVE',
  },
  {
    id: 'usr_inactive_student',
    name: 'Amit Kumar',
    email: 'inactive.student@college.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Mechanical Engineering',
    branch: 'Mechanical Engineering',
    rollNumber: '2025ME301',
    year: '1st Year',
    semester: 'Semester 1',
    status: 'INACTIVE',
  }
];

const INITIAL_CLUBS = [
  {
    id: 'club_coding_ai',
    name: 'Turing Coding & AI Club',
    description: 'Premier competitive coding, machine learning, and software engineering community.',
    department: 'Computer Science',
    facultyInchargeId: 'usr_faculty_coding',
  },
  {
    id: 'club_robotics',
    name: 'RoboTech Automation Club',
    description: 'Hardware prototyping, embedded IoT systems, drone technology, and autonomous bots.',
    department: 'Electronics',
    facultyInchargeId: 'usr_faculty_robotics',
  },
  {
    id: 'club_cyber_sec',
    name: 'CyberShield InfoSec Club',
    description: 'Ethical hacking, cybersecurity defenses, CTF competitions, and bug bounties.',
    department: 'Computer Science',
    facultyInchargeId: 'usr_faculty_coding',
  },
  {
    id: 'club_cultural',
    name: 'Sanskriti Cultural & Arts Society',
    description: 'Music, theater, classical dance, visual arts, and college cultural fest leadership.',
    department: 'Central / Interdisciplinary',
    facultyInchargeId: 'usr_faculty_robotics',
  }
];

const INITIAL_EVENTS = [
  {
    id: 'evt_hackathon_2026',
    title: 'CodeSprint 2026: 36-Hour National Hackathon',
    description: 'Flagship annual hackathon focusing on AI agents, distributed systems, and climate tech solutions.',
    date: new Date('2026-09-18T09:00:00.000Z'),
    startTime: '09:00',
    endTime: '21:00',
    venue: 'College Central Auditorium & Computing Complex',
    capacity: 300,
    status: 'APPROVED',
    officiallyDeclared: true,
    clubId: 'club_coding_ai',
    coordinatorId: 'usr_student_priya',
    facultyDecision: 'APPROVED',
    hodDecision: 'APPROVED',
  },
  {
    id: 'evt_drone_workshop',
    title: 'Autonomous Drone Navigation & Embedded ROS Workshop',
    description: 'Hands-on training for quadcopter flight controller programming using ROS2 and OpenCV.',
    date: new Date('2026-09-22T10:00:00.000Z'),
    startTime: '10:00',
    endTime: '17:00',
    venue: 'Robotics Lab 3, ECE Block',
    capacity: 60,
    status: 'PENDING_HOD',
    clubId: 'club_robotics',
    coordinatorId: null,
    facultyDecision: 'APPROVED',
  },
  {
    id: 'evt_ctf_cyber',
    title: 'Capture The Flag (CTF) Intra-College Challenge',
    description: 'Beginner-friendly Jeopardy-style CTF covering web exploitation, cryptography, and forensics.',
    date: new Date('2026-09-28T14:00:00.000Z'),
    startTime: '14:00',
    endTime: '22:00',
    venue: 'Virtual / Online Lab Server',
    capacity: 150,
    status: 'PENDING_FACULTY',
    clubId: 'club_cyber_sec',
    coordinatorId: null,
  }
];

async function seed() {
  console.log('Seeding PostgreSQL database ccms_db...');

  // 1. Seed Users
  for (const user of INITIAL_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        status: user.status,
        department: user.department,
        branch: user.branch || user.department,
        year: user.year || null,
        semester: user.semester || null,
        rollNumber: user.rollNumber || null,
      },
    });
  }
  console.log('Users seeded.');

  // 2. Seed Clubs
  for (const club of INITIAL_CLUBS) {
    await prisma.club.upsert({
      where: { id: club.id },
      update: {},
      create: {
        id: club.id,
        name: club.name,
        description: club.description,
        department: club.department,
        facultyInchargeId: club.facultyInchargeId,
      },
    });
  }
  console.log('Clubs seeded.');

  // 3. Appoint Coordinator (Priya Verma for Coding & AI Club)
  await prisma.clubCoordinator.upsert({
    where: { clubId_userId: { clubId: 'club_coding_ai', userId: 'usr_student_priya' } },
    update: {},
    create: {
      clubId: 'club_coding_ai',
      userId: 'usr_student_priya',
    },
  });

  // 4. Seed Memberships
  const memberships = [
    { clubId: 'club_coding_ai', userId: 'usr_student_vikas' },
    { clubId: 'club_coding_ai', userId: 'usr_student_rahul' },
    { clubId: 'club_coding_ai', userId: 'usr_student_priya' },
    { clubId: 'club_coding_ai', userId: 'usr_student_rohan' },
    { clubId: 'club_robotics', userId: 'usr_student_rahul' },
    { clubId: 'club_robotics', userId: 'usr_student_ananya' },
    { clubId: 'club_robotics', userId: 'usr_student_aarav' },
    { clubId: 'club_robotics', userId: 'usr_student_diya' },
    { clubId: 'club_cultural', userId: 'usr_student_priya' },
  ];
  for (const m of memberships) {
    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId: m.clubId, userId: m.userId } },
      update: {},
      create: { clubId: m.clubId, userId: m.userId },
    });
  }
  console.log('Memberships seeded.');

  // 5. Seed Events
  for (const event of INITIAL_EVENTS) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        capacity: event.capacity,
        status: event.status,
        officiallyDeclared: event.officiallyDeclared || false,
        clubId: event.clubId,
        coordinatorId: event.coordinatorId || null,
        facultyDecision: event.facultyDecision || null,
        hodDecision: event.hodDecision || null,
      },
    });
  }
  console.log('Events seeded.');

  // 6. Seed Registrations
  const registrations = [
    { eventId: 'evt_hackathon_2026', userId: 'usr_student_vikas' },
    { eventId: 'evt_hackathon_2026', userId: 'usr_student_rahul' },
    { eventId: 'evt_hackathon_2026', userId: 'usr_student_priya' },
  ];
  for (const r of registrations) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: r.eventId, userId: r.userId } },
      update: {},
      create: { eventId: r.eventId, userId: r.userId },
    });
  }

  console.log('PostgreSQL database ccms_db initialization complete!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  prisma.$disconnect();
  process.exit(1);
});
