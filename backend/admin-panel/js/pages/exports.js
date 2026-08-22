import { api } from "../api.js";
import { el, toast, setButtonLoading } from "../ui.js";
import { presetRange } from "../dhaka.js";

export async function renderExports(root, user) {
  const isSuper = user.role === "SUPER_ADMIN";

  let employees = [];
  try {
    const data = isSuper ? await api.superUsers("MARKETING_OFFICER") : await api.adminEmployees();
    employees = data.employees;
  } catch {
    /* the "single employee" export option just won't be pre-populated */
  }

  root.innerHTML = "";
  const page = el(`
    <div>
      <div class="page-header">
        <div>
          <h1>Exports</h1>
          <p>Download reports as an Excel (.xlsx) file.</p>
        </div>
      </div>

      <div class="card" style="padding:22px 24px;max-width:520px;">
        <div class="field">
          <label>Date range</label>
          <select id="preset-select">
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div class="field" id="custom-range" style="display:none;">
          <label>From — To</label>
          <div style="display:flex;gap:10px;">
            <input type="date" id="date-from" />
            <input type="date" id="date-to" />
          </div>
        </div>
        <div class="field">
          <label>Employee</label>
          <select id="employee-select">
            <option value="">All employees ${isSuper ? "" : "(assigned to you)"}</option>
            ${employees.map((e) => `<option value="${e.employeeId}">${e.name} (${e.employeeId})</option>`).join("")}
          </select>
        </div>
        <button class="btn btn-primary" id="export-btn" style="width:100%;margin-top:6px;">&#8681; Download Excel</button>
        <p class="hint" style="margin-top:14px;">Columns: Employee ID, Name, Designation, Zone, Date, Time, Address, Mobile, Opinion / Remarks, Team Leader, Manager.</p>
      </div>
    </div>
  `);
  root.appendChild(page);

  const presetSelect = page.querySelector("#preset-select");
  const customRange = page.querySelector("#custom-range");
  presetSelect.addEventListener("change", () => {
    customRange.style.display = presetSelect.value === "custom" ? "block" : "none";
  });

  page.querySelector("#export-btn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const preset = presetSelect.value;
    const range = preset === "custom"
      ? { dateFrom: page.querySelector("#date-from").value || undefined, dateTo: page.querySelector("#date-to").value || undefined }
      : presetRange(preset);
    const employeeId = page.querySelector("#employee-select").value || undefined;

    setButtonLoading(btn, true, "Preparing file…");
    try {
      const params = { ...range, employeeId };
      if (isSuper) await api.superExport(params, "employee-reports.xlsx");
      else await api.adminExport(params, "employee-reports.xlsx");
      toast("Export downloaded.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}
