/**
 * CampusHire – deterministic TEST seed for the upgraded flow.
 *
 *   node prisma/seed.js
 *
 * WIPES ALL DATA, then creates a small, predictable dataset with one record in every
 * stage of the pipeline so each new feature can be clicked through immediately.
 * Every account uses the password:  password123
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
const PASSWORD = "password123";
const uuid = () => crypto.randomUUID();
const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log("🌱 Seeding CampusHire test data...");
  const hash = await bcrypt.hash(PASSWORD, 10);

  /* ------------------------------------------------------------- cleanup */
  console.log("🧹 Cleaning...");
  await prisma.$transaction([
    prisma.aptitudeAttempt.deleteMany(),
    prisma.aptitudeQuestion.deleteMany(),
    prisma.aptitudeTest.deleteMany(),
    prisma.googleCredential.deleteMany(),
    prisma.idempotencyKey.deleteMany(),
    prisma.session.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.application.deleteMany(),
    prisma.studentSkill.deleteMany(),
    prisma.jobSkill.deleteMany(),
    prisma.job.deleteMany(),
    prisma.collab.deleteMany(),
    prisma.mentor.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.student.deleteMany(),
    prisma.company.deleteMany(),
    prisma.college.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  /* ------------------------------------------------------------- helpers */
  const mkUser = async (name, email, role) =>
    prisma.user.create({
      data: { name, email, role, password: hash, hasCompletedProfile: true },
    });

  /* ------------------------------------------------------------- colleges (admin user email == college email) */
  const demoCollege = await prisma.college.create({
    data: {
      name: "Demo Institute of Technology",
      address: "123 Tech Lane, Anand",
      email: "admin@college.com",
      phone: "9998887771",
    },
  });
  const greenCollege = await prisma.college.create({
    data: {
      name: "Greenville Institute of Technology",
      address: "9 Lake Road, Surat",
      email: "admin@greenville.com",
      phone: "9998887772",
    },
  });
  await mkUser("Demo College Admin", demoCollege.email, "collegeAdmin");
  await mkUser("Greenville College Admin", greenCollege.email, "collegeAdmin");

  /* ------------------------------------------------------------- companies (admin user email == company email) */
  const mkCompany = (name, email, reg) =>
    prisma.company.create({
      data: {
        name,
        email,
        registrationNo: reg,
        address: `${name} HQ, Ahmedabad`,
        contactNo: "9000000000",
        status: "active",
        collabNameShowUp: true,
      },
    });
  const demoCorp = await mkCompany(
    "Demo Corp",
    "admin@company.com",
    "REG-DEMO-001",
  );
  const acme = await mkCompany("Acme Tech", "admin@acme.com", "REG-ACME-002");
  const globex = await mkCompany(
    "Globex Ltd",
    "admin@globex.com",
    "REG-GLOBEX-003",
  );
  const demoCorpAdmin = await mkUser(
    "Demo Corp Admin",
    demoCorp.email,
    "companyAdmin",
  );
  await mkUser("Acme Admin", acme.email, "companyAdmin");
  await mkUser("Globex Admin", globex.email, "companyAdmin");

  /* ------------------------------------------------------------- mentors / employee */
  const mkMentor = async (name, email, college) => {
    const u = await mkUser(name, email, "mentor");
    return prisma.mentor.create({
      data: { userId: u.id, collegeId: college.id },
    });
  };
  const mentor1 = await mkMentor(
    "Prof. Mentor One",
    "mentor1@college.com",
    demoCollege,
  );
  const mentor2 = await mkMentor(
    "Prof. Mentor Two",
    "mentor2@college.com",
    demoCollege,
  );
  const empUser = await mkUser(
    "Erin Employee",
    "employee@company.com",
    "employee",
  );
  const employee = await prisma.employee.create({
    data: { userId: empUser.id, companyId: demoCorp.id },
  });

  /* ------------------------------------------------------------- skills */
  const skillNames = [
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Python",
    "Testing",
    "Data Analysis",
    "Communication",
  ];
  await prisma.skill.createMany({ data: skillNames.map((name) => ({ name })) });
  const skills = Object.fromEntries(
    (await prisma.skill.findMany()).map((s) => [s.name, s.id]),
  );

  /* ------------------------------------------------------------- students */
  const students = {}; // key -> Student row
  const mkStudent = async (
    key,
    name,
    email,
    college,
    branch = "CS",
    year = 4,
  ) => {
    const u = await mkUser(name, email, "student");
    const s = await prisma.student.create({
      data: {
        userId: u.id,
        collegeId: college.id,
        year,
        branch,
        rollNo: key.toUpperCase().padEnd(6, "0"),
        resume: `https://example.com/resumes/${key}.pdf`,
        aboutMe: `Final year ${branch} student (${name}).`,
      },
    });
    await prisma.studentSkill.createMany({
      data: faker.helpers
        .arrayElements(Object.values(skills), 3)
        .map((skillId) => ({ studentId: s.id, skillId })),
    });
    students[key] = s;
    return s;
  };
  // s1..s10 each sit at a specific pipeline stage (see applications below)
  const names = [
    "Aarav Shah",
    "Diya Patel",
    "Kabir Mehta",
    "Isha Desai",
    "Rohan Joshi",
    "Meera Nair",
    "Vivaan Trivedi",
    "Anaya Gupta",
    "Dev Parekh",
    "Sara Khan",
  ];
  for (let i = 0; i < names.length; i++)
    await mkStudent(
      `s${i + 1}`,
      names[i],
      `s${i + 1}@demo.com`,
      demoCollege,
      ["CS", "IT", "ECE"][i % 3],
      (i % 4) + 1,
    );
  await mkStudent("demo", "Demo Student", "student@demo.com", demoCollege); // clean student, no applications
  await mkStudent(
    "g1",
    "Greenville Student",
    "student@greenville.com",
    greenCollege,
  ); // other-college isolation check
  for (let i = 0; i < 25; i++)
    await mkStudent(
      `x${i + 1}`,
      faker.person.fullName(),
      `x${i + 1}@demo.com`,
      demoCollege,
      faker.helpers.arrayElement(["CS", "IT", "ECE", "MECH"]),
      faker.number.int({ min: 1, max: 4 }),
    );

  /* ------------------------------------------------------------- collaborations – one of every state */
  await prisma.collab.createMany({
    data: [
      {
        collegeId: demoCollege.id,
        companyId: demoCorp.id,
        status: "accepted",
        initiatedBy: "company",
      }, // working partnership
      {
        collegeId: demoCollege.id,
        companyId: acme.id,
        status: "pending",
        initiatedBy: "company",
      }, // COLLEGE can accept/reject
      {
        collegeId: greenCollege.id,
        companyId: demoCorp.id,
        status: "pending",
        initiatedBy: "college",
      }, // COMPANY can accept/reject
      {
        collegeId: greenCollege.id,
        companyId: globex.id,
        status: "rejected",
        initiatedBy: "company",
      }, // re-request test
      // Demo College <-> Globex: no row  => college can send a fresh invite
    ],
  });

  /* ------------------------------------------------------------- jobs (Demo Corp @ Demo Institute) */
  const mkJob = async (title, salary, o = {}) => {
    const job = await prisma.job.create({
      data: {
        title,
        salary,
        tenure: "Permanent",
        address: demoCorp.address,
        status: "active",
        dueDate: days(30),
        isApproved: true,
        mentorId: mentor1.id,
        collegeId: demoCollege.id,
        companyId: demoCorp.id,
        jobHash: crypto
          .createHash("sha256")
          .update(title + (o.tag ?? ""))
          .digest("hex"),
        ...o.data,
      },
    });
    await prisma.jobSkill.createMany({
      data: (o.skills ?? []).map((n) => ({
        jobId: job.id,
        skillId: skills[n],
      })),
    });
    return job;
  };
  const jobSE = await mkJob("Software Engineer", 1200000, {
    skills: ["JavaScript", "React", "Node.js"],
  }); // HAS aptitude test
  const jobQA = await mkJob("QA Analyst", 600000, {
    skills: ["Testing", "SQL"],
  }); // no test
  const jobDA = await mkJob("Data Analyst", 800000, {
    skills: ["Python", "Data Analysis"],
    data: { isApproved: false, mentorId: null },
  }); // college must approve + assign mentor
  const jobOld = await mkJob("Support Engineer (deadline passed)", 400000, {
    skills: ["Communication"],
    data: { dueDate: days(-3) },
  });

  /* ------------------------------------------------------------- aptitude test for Software Engineer (published) */
  const test = await prisma.aptitudeTest.create({
    data: {
      jobId: jobSE.id,
      companyId: demoCorp.id,
      title: "SE Screening Test",
      instructions: "5 questions, negative marking of 0.25 per wrong answer.",
      durationMins: 20,
      passingPercent: 60,
      negativeMarking: 0.25,
      autoRejectOnFail: false,
      isPublished: true,
    },
  });
  const QUESTIONS = [
    ["What is 15% of 240?", ["24", "30", "36", "42"], 2, "Quant"],
    [
      "Find the next number: 2, 6, 12, 20, ?",
      ["28", "30", "32", "36"],
      1,
      "Logical",
    ],
    [
      "A train 120 m long passes a pole in 6 s. Its speed is?",
      ["60 km/h", "72 km/h", "80 km/h", "90 km/h"],
      1,
      "Quant",
    ],
    [
      "Choose the word closest in meaning to 'CANDID'.",
      ["Frank", "Rude", "Shy", "Careful"],
      0,
      "Verbal",
    ],
    [
      "If all roses are flowers and some flowers fade, which must be true?",
      [
        "All roses fade",
        "Some roses may fade",
        "No rose fades",
        "All flowers are roses",
      ],
      1,
      "Logical",
    ],
  ];
  const q = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const [text, options, correctIndex, section] = QUESTIONS[i];
    q.push(
      await prisma.aptitudeQuestion.create({
        data: {
          id: uuid(),
          testId: test.id,
          text,
          options,
          correctIndex,
          marks: 1,
          section,
          order: i,
        },
      }),
    );
  }

  /* ------------------------------------------------------------- applications */
  const apply = (key, job, status, mentorApproval, extra = {}) =>
    prisma.application.create({
      data: {
        studentId: students[key].id,
        jobId: job.id,
        mentorId: job.mentorId,
        status,
        mentorApproval,
        ...extra,
      },
    });

  // Software Engineer (job with aptitude test)
  await apply("s1", jobSE, "pending", "pending"); // MENTOR: approve / reject
  await apply("s2", jobSE, "pending", "pending"); // MENTOR
  await apply("s3", jobSE, "pending", "approved"); // COMPANY: shortlist -> auto-assigns the aptitude test
  const appS4 = await apply("s4", jobSE, "aptitude", "approved"); // STUDENT s4: take the test (not started)
  const appS5 = await apply("s5", jobSE, "aptitude", "approved"); // test PASSED  -> company can schedule interview
  const appS6 = await apply("s6", jobSE, "aptitude", "approved"); // test FAILED  -> company can only reject
  const appS7 = await apply("s7", jobSE, "interview", "approved"); // interview booked -> reschedule / cancel / hire / reject
  const appS8 = await apply("s8", jobSE, "hired", "approved"); // finalized
  await apply("s9", jobSE, "rejected", "rejected"); // rejected by mentor (never reaches the company)

  // QA Analyst (no test)
  await apply("s1", jobQA, "pending", "approved"); // COMPANY: shortlist (no test)
  await apply("s2", jobQA, "shortlisted", "approved"); // COMPANY: schedule interview directly
  await apply("s3", jobQA, "rejected", "approved"); // rejected by company

  // Expired job: mentor must be blocked by the deadline rule
  await apply("s10", jobOld, "pending", "pending");

  // Graded attempts (grading = +1 correct, -0.25 wrong, 0 blank; total 5; pass 60%)
  const attempt = async (app, key, answers, score, percent, passed) =>
    prisma.aptitudeAttempt.create({
      data: {
        testId: test.id,
        applicationId: app.id,
        studentId: students[key].id,
        status: "submitted",
        startedAt: days(-1),
        expiresAt: new Date(days(-1).getTime() + 20 * 60000),
        submittedAt: new Date(days(-1).getTime() + 12 * 60000),
        answers,
        score,
        totalMarks: 5,
        percent,
        passed,
        tabSwitches: key === "s6" ? 4 : 0,
      },
    });
  // s5: 4 correct, 1 blank -> 4/5 = 80%  PASS
  await attempt(
    appS5,
    "s5",
    { [q[0].id]: 2, [q[1].id]: 1, [q[2].id]: 1, [q[3].id]: 0 },
    4,
    80,
    true,
  );
  // s6: 2 correct, 1 wrong, 2 blank -> 1.75/5 = 35%  FAIL (and 4 tab switches to see the warning)
  await attempt(
    appS6,
    "s6",
    { [q[0].id]: 2, [q[1].id]: 1, [q[2].id]: 0 },
    1.75,
    35,
    false,
  );
  // s7 and s8 also passed earlier
  await attempt(
    appS7,
    "s7",
    { [q[0].id]: 2, [q[1].id]: 1, [q[2].id]: 1, [q[3].id]: 0, [q[4].id]: 1 },
    5,
    100,
    true,
  );
  await attempt(
    appS8,
    "s8",
    { [q[0].id]: 2, [q[1].id]: 1, [q[2].id]: 1, [q[3].id]: 0 },
    4,
    80,
    true,
  );

  /* ------------------------------------------------------------- interviews */
  const slot = days(2);
  slot.setHours(11, 0, 0, 0);
  await prisma.interview.create({
    data: {
      applicationId: appS7.id,
      studentId: students.s7.id,
      employeeId: employee.id,
      scheduledByUserId: demoCorpAdmin.id,
      startsAt: slot,
      endsAt: new Date(slot.getTime() + 45 * 60000),
      timeZone: "Asia/Kolkata",
      mode: "online",
      meetLink: "https://meet.google.com/abc-defg-hij",
      status: "scheduled",
      notes: "Bring your laptop.",
    },
  });
  const past = days(-5);
  await prisma.interview.create({
    data: {
      applicationId: appS8.id,
      studentId: students.s8.id,
      employeeId: employee.id,
      scheduledByUserId: demoCorpAdmin.id,
      startsAt: past,
      endsAt: new Date(past.getTime() + 45 * 60000),
      mode: "offline",
      address: "Demo Corp HQ, Ahmedabad",
      status: "completed",
    },
  });

  /* ------------------------------------------------------------- redis caches would show OLD data after a re-seed */
  try {
    const { redisConnection } = await import("../config/redis.js");
    await Promise.race([
      redisConnection.flushdb(),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("redis timeout")), 3000),
      ),
    ]);
    console.log("🧽 Redis flushed (cached lists would otherwise be stale)");
    redisConnection.disconnect();
  } catch (e) {
    console.log(
      `⚠️  Could not flush Redis (${e.message}). Run  redis-cli FLUSHDB  yourself.`,
    );
    process.exit(0);
  }

  console.log(`
✅ Done.  Password for every account:  ${PASSWORD}

  ROLE            LOGIN                      WHAT TO TRY
  college admin   admin@college.com          Companies page: Acme's request (accept), invite Globex; approve "Data Analyst" + assign mentor
  college admin   admin@greenville.com       Greenville -> Demo Corp invite is pending (company side); re-invite Globex (was rejected)
  company admin   admin@company.com          Accept Greenville's invite; board: Software Engineer & QA Analyst; aptitude builder; Google connect
  company admin   admin@acme.com             Sent a request to Demo Institute (college must accept)
  company admin   admin@globex.com           Invite target for Demo Institute
  employee        employee@company.com       Same board as the company admin
  mentor          mentor1@college.com        s1, s2 pending on Software Engineer (approve/reject); deadline-passed job blocks decisions
  student         s4@demo.com                Aptitude test waiting -> take it (20 min, resumable)
  student         s7@demo.com                Interview in 2 days (Interviews page)
  student         s3@demo.com                Approved by mentor; becomes "aptitude" after the company shortlists
  student         s1@demo.com / s2@demo.com  Pending mentor review
  student         student@demo.com           No applications – apply to QA/Software jobs fresh
  student         student@greenville.com     Other college – must NOT see Demo Institute jobs
  (25 extra students x1..x25@demo.com fill the college student list)
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
