import { api } from "../api.js";
import { el, toast, statusBadge, openPanel, setButtonLoading } from "../ui.js";

export async function renderTeamLeaders(root) {
  root.innerHTML = "";
  const page = el(`
    <div>
      <div class="page-header">
        <div>
          <h1>Team Leaders &amp; Admins</h1>
          <p>Team Leaders manage a set of Marketing Officers and report to a Manager.</p>
        </div>
        <button class="btn btn-primary" id="create-btn">+ New Team Leader</button>
      </div>
      <div class="card table-card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Admin ID</th><th>Name</th><th>Zone</th><th>Employees</th><th>Status</th><th></th></tr></thead>
            <tbody id="table-body"><tr><td colspan="6"><div class="center-loading"><div class="spinner dark"></div></div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  `);
  root.appendChild(page);

  let managers = [];
  try {
    managers = (await api.superUsers("SUPER_ADMIN")).users;
  } catch {
    /* fall back to empty manager list in the create form */
  }

  async function load() {
    const tbody = page.querySelector("#table-body");
    try {
      const { teamLeaders } = await api.superTeamLeaders();
      if (teamLeaders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty">No Team Leaders yet.</div></td></tr>`;
        return;
      }
      tbody.innerHTML = "";
      teamLeaders.forEach((tl) => {
        const tr = el(`
          <tr>
            <td class="mono">${tl.employeeId}</td>
            <td>${tl.name}</td>
            <td>${tl.zone || "—"}</td>
            <td class="mono">${tl.employeeCount}</td>
            <td>${statusBadge(tl.status)}</td>
            <td><button class="btn btn-ghost btn-sm" data-toggle="${tl.id}" data-status="${tl.status}">${tl.status === "active" ? "Deactivate" : "Activate"}</button></td>
          </tr>
        `);
        tr.querySelector("[data-toggle]").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          const nextStatus = btn.dataset.status === "active" ? "inactive" : "active";
          setButtonLoading(btn, true);
          try {
            await api.superUpdateUser(btn.dataset.toggle, { status: nextStatus });
            toast(`Team Leader ${nextStatus === "active" ? "activated" : "deactivated"}.`, "success");
            load();
          } catch (err) {
            toast(err.message, "error");
            setButtonLoading(btn, false);
          }
        });
        tbody.appendChild(tr);
      });
    } catch (err) {
      toast(err.message, "error");
      tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty">Could not load Team Leaders.</div></td></tr>`;
    }
  }

  page.querySelector("#create-btn").addEventListener("click", () => openCreateModal({ managers, onCreated: load }));
  load();
}

function openCreateModal({ managers, onCreated }) {
  const managerOptions = managers.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");

  const { close, panel } = openPanel({
    kind: "modal",
    title: "New Team Leader",
    bodyHtml: `
      <form id="create-form">
        <div class="field"><label>Admin / Employee ID</label><input type="text" id="f-employeeId" placeholder="TL-004" required /></div>
        <div class="field"><label>Full Name</label><input type="text" id="f-name" required /></div>
        <div class="field"><label>Mobile</label><input type="tel" id="f-mobile" placeholder="01XXXXXXXXX" /></div>
        <div class="field"><label>Zone</label><input type="text" id="f-zone" /></div>
        <div class="field"><label>Manager</label><select id="f-manager">${managerOptions}</select></div>
        <div class="field"><label>Temporary Password</label><input type="text" id="f-password" placeholder="min. 6 characters" required /></div>
        <div id="create-error"></div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="create-submit">Create Team Leader</button>
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
      managerId: panel.querySelector("#f-manager").value || undefined,
      password: panel.querySelector("#f-password").value,
    };
    const btn = panel.querySelector("#create-submit");
    setButtonLoading(btn, true, "Creating…");
    try {
      await api.superCreateUser({ ...body, role: "ADMIN" });
      toast("Team Leader created.", "success");
      close();
      onCreated();
    } catch (err) {
      errorBox.innerHTML = `<div class="login-error">${err.message}</div>`;
      setButtonLoading(btn, false);
    }
  });
}
