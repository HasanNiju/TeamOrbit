// ---------------------------------------------------------------------------
// Seeds realistic dummy data so every screen (employee app + admin panel)
// has something meaningful to show before Supabase/Postgres is connected.
// Mirrors the seed used in the frontend's mock API so EMP-001 / demo123
// behaves the same in both places.
// ---------------------------------------------------------------------------

const store = require("./store");
const { ROLES } = store;

const ZONES = ["Dhaka North", "Dhaka South", "Chattogram", "Sylhet", "Khulna"];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random submitted_at timestamp within the 08:00-20:00 Dhaka window, `daysAgo` days back. */
function randomSubmittedAt(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  // Asia/Dhaka is UTC+6 with no DST; 08:00-20:00 Dhaka == 02:00-14:00 UTC.
  const hourUtc = randomBetween(2, 13);
  const minuteUtc = randomBetween(0, 59);
  d.setUTCHours(hourUtc, minuteUtc, randomBetween(0, 59), 0);
  return d;
}

function seedSubmissionsFor(employeeUser, { days, minPerDay, maxPerDay, skipRatio = 0.25 }) {
  for (let daysAgo = days; daysAgo >= 1; daysAgo -= 1) {
    if (Math.random() < skipRatio) continue; // some days have no reports, like real usage
    const count = randomBetween(minPerDay, maxPerDay);
    for (let i = 0; i < count; i += 1) {
      const submittedAt = randomSubmittedAt(daysAgo);
      const record = {
        id: store.genId("sub"),
        employee_user_id: employeeUser.id,
        employee_id: employeeUser.employee_id,
        name_snapshot: employeeUser.name,
        designation_snapshot: employeeUser.designation,
        address: employeeUser.address || "Dhaka, Bangladesh",
        mobile: employeeUser.mobile || "01700000000",
        opinion: SAMPLE_OPINIONS[randomBetween(0, SAMPLE_OPINIONS.length - 1)],
        submission_date: dhakaDateKeyOf(submittedAt),
        submitted_at: submittedAt.toISOString(),
        created_at: submittedAt.toISOString(),
        updated_at: submittedAt.toISOString(),
      };
      store.submissions.push(record);
    }
  }
}

const { getDhakaDateKey: dhakaDateKeyOf } = require("../utils/dhakaTime");

const SAMPLE_OPINIONS = [
  "Visited 12 retail outlets today, distributed promotional materials and collected feedback on the new product line.",
  "Met with 5 potential clients in the assigned zone; two showed strong interest in the seasonal package.",
  "Followed up on last week's leads, resolved two complaints, and updated shop owners on the upcoming price list.",
  "Conducted a market survey in the local bazaar to understand competitor pricing and customer preferences.",
  "Attended a team briefing in the morning, then covered the northern part of the zone for field visits.",
  "Distributed samples to 8 shops and recorded initial reactions for the weekly report.",
];

function seed() {
  if (store.users.length > 0) return; // already seeded (e.g. hot reload)

  // --- Super Admin / Manager -------------------------------------------------
  const superAdminId = process.env.BOOTSTRAP_SUPER_ADMIN_ID || "SA-001";
  const superAdminPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || "admin123";
  const nasrin = store.createUser({
    employeeId: superAdminId,
    name: "Nasrin Sultana",
    nameEn: "Nasrin Sultana",
    password: superAdminPassword,
    role: ROLES.SUPER_ADMIN,
    designation: "General Manager",
    mobile: "01799999999",
    zone: "Head Office",
    language: "en",
    status: "active",
  });

  const rafiq = store.createUser({
    employeeId: "SA-002",
    name: "Rafiqul Islam",
    nameEn: "Rafiqul Islam",
    password: "admin123",
    role: ROLES.SUPER_ADMIN,
    designation: "Operations Manager",
    mobile: "01788888888",
    zone: "Head Office",
    language: "en",
    status: "active",
  });

  // --- Team Leaders / Admins --------------------------------------------------
  const kamal = store.createUser({
    employeeId: "TL-001",
    name: "Kamal Hossain",
    nameEn: "Kamal Hossain",
    password: "leader123",
    role: ROLES.ADMIN,
    designation: "Team Leader",
    mobile: "01766666666",
    zone: "Dhaka North",
    managerId: nasrin.id,
    language: "en",
    status: "active",
  });

  const shirin = store.createUser({
    employeeId: "TL-002",
    name: "Shirin Akter",
    nameEn: "Shirin Akter",
    password: "leader123",
    role: ROLES.ADMIN,
    designation: "Team Leader",
    mobile: "01755555555",
    zone: "Chattogram",
    managerId: nasrin.id,
    language: "en",
    status: "active",
  });

  const jahid = store.createUser({
    employeeId: "TL-003",
    name: "Jahidul Karim",
    nameEn: "Jahidul Karim",
    password: "leader123",
    role: ROLES.ADMIN,
    designation: "Team Leader",
    mobile: "01744444444",
    zone: "Sylhet",
    managerId: rafiq.id,
    language: "en",
    status: "active",
  });

  // --- Marketing Officers ------------------------------------------------------
  const employeeSeeds = [
    { employeeId: "EMP-001", name: "রহিম আহমেদ", nameEn: "Rahim Ahmed", teamLeader: kamal, mobile: "01711111111", address: "House 12, Road 5, Mirpur, Dhaka", zone: "Dhaka North", password: "demo123" },
    { employeeId: "EMP-002", name: "করিম উদ্দিন", nameEn: "Karim Uddin", teamLeader: kamal, mobile: "01712222222", address: "Uttara Sector 7, Dhaka", zone: "Dhaka North" },
    { employeeId: "EMP-003", name: "সালমা বেগম", nameEn: "Salma Begum", teamLeader: kamal, mobile: "01713333333", address: "Mohammadpur, Dhaka", zone: "Dhaka North" },
    { employeeId: "EMP-004", name: "ফরহাদ হোসেন", nameEn: "Forhad Hossain", teamLeader: shirin, mobile: "01714444444", address: "Agrabad, Chattogram", zone: "Chattogram" },
    { employeeId: "EMP-005", name: "নাসরিন আক্তার", nameEn: "Nasrin Akter", teamLeader: shirin, mobile: "01715555555", address: "GEC Circle, Chattogram", zone: "Chattogram" },
    { employeeId: "EMP-006", name: "তানভীর আহমেদ", nameEn: "Tanvir Ahmed", teamLeader: shirin, mobile: "01716666666", address: "Halishahar, Chattogram", zone: "Chattogram" },
    { employeeId: "EMP-007", name: "মিলা রহমান", nameEn: "Mila Rahman", teamLeader: jahid, mobile: "01717777777", address: "Zindabazar, Sylhet", zone: "Sylhet" },
    { employeeId: "EMP-008", name: "সোহেল রানা", nameEn: "Sohel Rana", teamLeader: jahid, mobile: "01718888888", address: "Ambarkhana, Sylhet", zone: "Sylhet", status: "inactive" },
  ];

  for (const e of employeeSeeds) {
    const user = store.createUser({
      employeeId: e.employeeId,
      name: e.name,
      nameEn: e.nameEn,
      password: e.password || "demo123",
      role: ROLES.MARKETING_OFFICER,
      designation: "Marketing Officer",
      mobile: e.mobile,
      address: e.address,
      zone: e.zone,
      teamLeaderId: e.teamLeader.id,
      managerId: e.teamLeader.manager_id,
      language: "bn",
      status: e.status || "active",
    });

    if (user.status === "active") {
      seedSubmissionsFor(user, { days: 45, minPerDay: 1, maxPerDay: 5, skipRatio: 0.22 });
    }
  }

  console.log(`[seed] ${store.users.length} users, ${store.submissions.length} submissions`);
}

module.exports = { seed };
