import { api } from "../api.js";
import { el, toast, statusBadge, openPanel, setButtonLoading } from "../ui.js";

export async function renderEmployees(root, user) {
  const isSuper = user.role === "SUPER_ADMIN";

  root.innerHTML = "";
  const page = el(`
    <div>
      <div class="page-header">
        <div>
          <h1>Employees</h1>
          <p>${isSuper ? "All Marketing Officers in the organization" : "Marketing Officers assigned to you"}</p>
        </div>
        <button class="btn btn-primary" id="create-btn">+ New Employee</button>
      </div>
      <div class="card table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Employee ID</th><th>Name</th><th>Zone</th><th>Team Leader</th><th>Reports</th><th>Status</th><th></th></tr>
            </thead>
            <tbody id="table-body"><tr><td colspan="7"><div class="center-loading"><div class="spinner dark"></div></div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  `);
  root.appendChild(page);

  let teamLeaders = [];
  if (isSuper) {
    try {
      teamLeaders = (await api.superTeamLeaders()).teamLeaders;
    } catch {
      /* create modal will just show an empty dropdown */
    }
  }

  async function load() {
    const tbody = page.querySelector("#table-body");
    try {
      const { employees } = isSuper ? await api.superUsers("MARKETING_OFFICER") : await api.adminEmployees();
      if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty">No employees yet. Create the first one.</div></td></tr>`;
        return;
      }
      tbody.innerHTML = "";
      employees.forEach((emp) => {
        const tr = el(`
          <tr>
            <td class="mono">${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${emp.zone || "—"}</td>
            <td>${emp.teamLeader || "—"}</td>
            <td class="mono">${emp.totalSubmissions}</td>
            <td>${statusBadge(emp.status)}</td>
            <td>
              ${isSuper ? `<button class="btn btn-ghost btn-sm" data-toggle="${emp.id}" data-status="${emp.status}">${emp.status === "active" ? "Deactivate" : "Activate"}</button>` : ""}
            </td>
          </tr>
        `);
        const toggleBtn = tr.querySelector("[data-toggle]");
        if (toggleBtn) {
          toggleBtn.addEventListener("click", async () => {
            const nextStatus = toggleBtn.dataset.status === "active" ? "inactive" : "active";
            setButtonLoading(toggleBtn, true);
            try {
              await api.superUpdateUser(toggleBtn.dataset.toggle, { status: nextStatus });
              toast(`Employee ${nextStatus === "active" ? "activated" : "deactivated"}.`, "success");
              load();
            } catch (err) {
              toast(err.message, "error");
              setButtonLoading(toggleBtn, false);
            }
          });
        }
        tbody.appendChild(tr);
      });
    } catch (err) {
      toast(err.message, "error");
      tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty">Could not load employees.</div></td></tr>`;
    }
  }

  page.querySelector("#create-btn").addEventListener("click", () => openCreateModal({ isSuper, teamLeaders, onCreated: load }));

  load();
}

function openCreateModal({ isSuper, teamLeaders, onCreated }) {
  const tlOptions = teamLeaders.map((tl) => `<option value="${tl.id}">${tl.name} — ${tl.zone || ""}</option>`).join("");

  const { close, panel } = openPanel({
    kind: "modal",
    title: "New Marketing Officer",
    bodyHtml: `
      <form id="create-form">
        <div class="field"><label>Employee ID</label><input type="text" id="f-employeeId" placeholder="EMP-009" required /></div>
        <div class="field"><label>Full Name</label><input type="text" id="f-name" required /></div>
        <div class="field"><label>Mobile</label><input type="tel" id="f-mobile" placeholder="01XXXXXXXXX" /></div>
        <div class="field"><label>Zone</label><input type="text" id="f-zone" placeholder="e.g. Dhaka North" /></div>
        <div class="field"><label>Address</label><textarea id="f-address"></textarea></div>
        ${isSuper ? `<div class="field"><label>Team Leader</label><select id="f-teamLeader"><option value="">— Unassigned —</option>${tlOptions}</select></div>` : ""}
        <div class="field"><label>Temporary Password</label><input type="text" id="f-password" placeholder="min. 6 characters" required /></div>
        <div id="create-error"></div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="create-submit">Create Employee</button>
    `,
  });

  panel.querySelector("#create-submit").addEventListener("click", async () => {
    const errorBox = panel.querySelector("#create-error");
    errorBox.innerHTML = "";
    const body = {
      employeeId: panel.querySelector("#f-employeeId").value.trim(),
      name: panel.querySelector("#f-name").value.trim(),
      mobile: panel.querySelector("#f-mobile").value.trim(),
      zone: panel.querySelector("#f-zone").value.trim(),
      address: panel.querySelector("#f-address").value.trim(),
      password: panel.querySelector("#f-password").value,
    };
    if (isSuper) {
      body.role = "MARKETING_OFFICER";
      body.teamLeaderId = panel.querySelector("#f-teamLeader").value || undefined;
    }

    const btn = panel.querySelector("#create-submit");
    setButtonLoading(btn, true, "Creating…");
    try {
      if (isSuper) await api.superCreateUser(body);
      else await api.adminCreateEmployee(body);
      toast("Employee created.", "success");
      close();
      onCreated();
    } catch (err) {
      errorBox.innerHTML = `<div class="login-error">${err.message}</div>`;
      setButtonLoading(btn, false);
    }
  });
}
