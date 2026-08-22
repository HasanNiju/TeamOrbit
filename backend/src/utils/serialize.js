const store = require("../data/store");

async function serializeUser(user) {
  if (!user) return null;
  const teamLeader = user.team_leader_id ? await store.findUserById(user.team_leader_id) : null;
  const manager = user.manager_id ? await store.findUserById(user.manager_id) : null;

  return {
    id: user.id,
    employeeId: user.employee_id,
    name: user.name,
    nameEn: user.name_en,
    role: user.role,
    designation: user.designation,
    mobile: user.mobile,
    address: user.address,
    zone: user.zone,
    photo: user.profile_photo_url,
    teamLeader: teamLeader ? teamLeader.name_en : null,
    teamLeaderId: user.team_leader_id,
    manager: manager ? manager.name_en : null,
    managerId: user.manager_id,
    language: user.language,
    status: user.status,
    createdAt: user.created_at,
  };
}

async function serializeEmployeeListItem(user) {
  const teamLeader = user.team_leader_id ? await store.findUserById(user.team_leader_id) : null;
  const totalSubmissions = await store.getEmployeeTotal(user.id);
  return {
    id: user.id,
    employeeId: user.employee_id,
    name: user.name_en,
    zone: user.zone,
    role: user.role,
    designation: user.designation,
    mobile: user.mobile,
    teamLeader: teamLeader ? teamLeader.name_en : null,
    teamLeaderId: user.team_leader_id,
    managerId: user.manager_id,
    status: user.status,
    totalSubmissions,
  };
}

async function serializeSubmission(s) {
  const employee = await store.findUserById(s.employee_user_id);
  return {
    id: s.id,
    employeeId: s.employee_id,
    name: employee?.name_en || s.name_snapshot,
    designation: s.designation_snapshot,
    address: s.address,
    mobile: s.mobile,
    opinion: s.opinion,
    date: s.submission_date,
    submittedAt: s.submitted_at,
  };
}

module.exports = { serializeUser, serializeEmployeeListItem, serializeSubmission };
