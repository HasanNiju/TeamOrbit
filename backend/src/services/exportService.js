const ExcelJS = require("exceljs");
const { findUsersByIds } = require("../data/store");
const { formatEnglishDate, formatEnglishTime } = require("../utils/dhakaTime");

const COLUMNS = [
  { header: "Employee ID", key: "employeeId", width: 14 },
  { header: "Employee Name", key: "employeeName", width: 22 },
  { header: "Contact Person's Name", key: "contactName", width: 22 },
  { header: "Contact Person's Designation", key: "contactDesignation", width: 24 },
  { header: "Zone", key: "zone", width: 16 },
  { header: "Date", key: "date", width: 16 },
  { header: "Submission Time", key: "time", width: 16 },
  { header: "Address", key: "address", width: 30 },
  { header: "Mobile", key: "mobile", width: 16 },
  { header: "Opinion / Remarks", key: "opinion", width: 45 },
  { header: "Team Leader", key: "teamLeader", width: 20 },
  { header: "Manager", key: "manager", width: 20 },
];

/** Builds an .xlsx buffer for the given list of submission records. */
async function buildSubmissionsWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeamOrbit";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Reports", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE4F1EC" },
  };
  sheet.autoFilter = { from: "A1", to: "L1" };

  // Batch-fetch every employee referenced by these rows in one round trip
  // (rather than querying per-row), then a second round trip for the team
  // leaders/managers those employees report to — two queries total instead
  // of up to 3x the row count.
  const employeeIds = rows.map((s) => s.employee_user_id);
  const employeeMap = await findUsersByIds(employeeIds);

  const supervisorIds = [];
  for (const employee of employeeMap.values()) {
    supervisorIds.push(employee.team_leader_id, employee.manager_id);
  }
  const supervisorMap = await findUsersByIds(supervisorIds);

  for (const s of rows) {
    const employee = employeeMap.get(s.employee_user_id) || null;
    const teamLeader = employee ? supervisorMap.get(employee.team_leader_id) : null;
    const manager = employee ? supervisorMap.get(employee.manager_id) : null;
    const submittedAt = new Date(s.submitted_at);

    sheet.addRow({
      employeeId: s.employee_id,
      employeeName: employee?.name_en || s.name_snapshot,
      contactName: s.name_snapshot,
      contactDesignation: s.designation_snapshot,
      zone: employee?.zone || "",
      date: formatEnglishDate(submittedAt),
      time: formatEnglishTime(submittedAt),
      address: s.address,
      mobile: s.mobile,
      opinion: s.opinion,
      teamLeader: teamLeader?.name_en || "",
      manager: manager?.name_en || "",
    });
  }

  const dataRowCount = Math.max(sheet.rowCount - 1, 0);
  for (const row of sheet.getRows(2, dataRowCount) || []) {
    row.alignment = { vertical: "top", wrapText: true };
  }

  return workbook.xlsx.writeBuffer();
}

/** e.g. "employee-reports-2026-08-17.xlsx" (PRD §31). */
function buildExportFilename({ employeeId = null } = {}) {
  const dateKey = new Date().toISOString().slice(0, 10);
  return employeeId ? `${employeeId}-reports-${dateKey}.xlsx` : `employee-reports-${dateKey}.xlsx`;
}

module.exports = { buildSubmissionsWorkbook, buildExportFilename };
