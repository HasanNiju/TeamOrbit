import { api } from "../api.js";
import { el, toast, debounce, formatDateTime, formatDate, openPanel, detailRow, setButtonLoading } from "../ui.js";
import { presetRange } from "../dhaka.js";

export async function renderSubmissions(root, user) {
  const isSuper = user.role === "SUPER_ADMIN";
  const state = { search: "", preset: "all", dateFrom: null, dateTo: null, sort: "newest", page: 1, limit: 20, teamLeaderId: "" };

  root.innerHTML = "";
  const page = el(`
    <div>
      <div class="page-header">
        <div>
          <h1>Submissions</h1>
          <p>${isSuper ? "All reports across the organization" : "Reports from your assigned employees"}</p>
        </div>
        <button class="btn btn-primary" id="export-btn">&#8681; Export to Excel</button>
      </div>

      <div class="card table-card">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <span class="icon">&#128269;</span>
            <input type="search" id="search-input" placeholder="Search by ID, name, mobile, designation…" />
          </div>
          <div class="filters-row">
            <select id="preset-select">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <input type="date" id="date-from" style="display:none;width:150px;" />
            <input type="date" id="date-to" style="display:none;width:150px;" />
            ${isSuper ? `<select id="tl-select"><option value="">All Team Leaders</option></select>` : ""}
            <select id="sort-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>
          <div class="spacer"></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Date</th><th>Time</th><th></th></tr>
            </thead>
            <tbody id="table-body"></tbody>
          </table>
        </div>
        <div class="pagination" id="pagination"></div>
      </div>
    </div>
  `);
  root.appendChild(page);

  const tbody = page.querySelector("#table-body");
  const pagination = page.querySelector("#pagination");
  const presetSelect = page.querySelector("#preset-select");
  const dateFrom = page.querySelector("#date-from");
  const dateTo = page.querySelector("#date-to");
  const tlSelect = page.querySelector("#tl-select");

  if (isSuper) {
    try {
      const { teamLeaders } = await api.superTeamLeaders();
      teamLeaders.forEach((tl) => {
        tlSelect.appendChild(el(`<option value="${tl.id}">${tl.name} (${tl.employeeCount})</option>`));
      });
      tlSelect.addEventListener("change", () => {
        state.teamLeaderId = tlSelect.value;
        state.page = 1;
        load();
      });
    } catch {
      /* non-fatal — filter just won't populate */
    }
  }

  presetSelect.addEventListener("change", () => {
    state.preset = presetSelect.value;
    const isCustom = state.preset === "custom";
    dateFrom.style.display = isCustom ? "block" : "none";
    dateTo.style.display = isCustom ? "block" : "none";
    if (!isCustom) {
      const range = presetRange(state.preset);
      state.dateFrom = range.dateFrom || null;
      state.dateTo = range.dateTo || null;
      state.page = 1;
      load();
    }
  });

  [dateFrom, dateTo].forEach((input) =>
    input.addEventListener("change", () => {
      state.dateFrom = dateFrom.value || null;
      state.dateTo = dateTo.value || null;
      state.page = 1;
      load();
    })
  );

  page.querySelector("#sort-select").addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    load();
  });

  page.querySelector("#search-input").addEventListener(
    "input",
    debounce((e) => {
      state.search = e.target.value;
      state.page = 1;
      load();
    }, 300)
  );

  page.querySelector("#export-btn").addEventListener("click", async (e) => {
    setButtonLoading(e.currentTarget, true, "Exporting…");
    try {
      const params = buildParams(state, { forExport: true });
      if (isSuper) await api.superExport(params, "employee-reports.xlsx");
      else await api.adminExport(params, "employee-reports.xlsx");
      toast("Export downloaded.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setButtonLoading(e.currentTarget, false);
    }
  });

  async function load() {
    tbody.innerHTML = `<tr><td colspan="6"><div class="center-loading"><div class="spinner dark"></div></div></td></tr>`;
    try {
      const params = buildParams(state);
      const { submissions, pagination: p } = isSuper ? await api.superSubmissions(params) : await api.adminSubmissions(params);
      renderRows(submissions);
      renderPagination(p);
    } catch (err) {
      toast(err.message, "error");
      tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty">Could not load submissions.</div></td></tr>`;
    }
  }

  function renderRows(rows) {
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty">No submissions match these filters.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    rows.forEach((s) => {
      const tr = el(`
        <tr>
          <td class="mono">${s.employeeId}</td>
          <td>${s.name}</td>
          <td>${s.designation || "—"}</td>
          <td>${formatDate(s.date)}</td>
          <td class="mono">${formatDateTime(s.submittedAt).split(",").slice(-1)[0].trim()}</td>
          <td><button class="btn btn-ghost btn-sm" data-view>View</button></td>
        </tr>
      `);
      tr.querySelector("[data-view]").addEventListener("click", () => openDetail(s));
      tbody.appendChild(tr);
    });
  }

  function renderPagination(p) {
    pagination.innerHTML = "";
    const info = el(`<div>Showing ${(p.page - 1) * p.limit + (p.total ? 1 : 0)}–${Math.min(p.page * p.limit, p.total)} of ${p.total}</div>`);
    const controls = el(`
      <div class="controls">
        <button class="btn btn-secondary btn-sm" id="prev-page" ${p.page <= 1 ? "disabled" : ""}>Prev</button>
        <button class="btn btn-secondary btn-sm" id="next-page" ${p.page >= p.totalPages ? "disabled" : ""}>Next</button>
      </div>
    `);
    pagination.appendChild(info);
    pagination.appendChild(controls);
    controls.querySelector("#prev-page").addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      load();
    });
    controls.querySelector("#next-page").addEventListener("click", () => {
      state.page = state.page + 1;
      load();
    });
  }

  function openDetail(s) {
    const { close } = openPanel({
      kind: "drawer",
      title: "Submission Details",
      bodyHtml: `
        ${detailRow("Employee ID", s.employeeId)}
        ${detailRow("Contact Person's Name", s.contactName)}
        ${detailRow("Contact Person's Designation", s.contactDesignation)}
        ${detailRow("Date", formatDate(s.date))}
        ${detailRow("Submitted", formatDateTime(s.submittedAt))}
        ${detailRow("Address", s.address)}
        ${detailRow("Mobile", s.mobile)}
        ${detailRow("Opinion / Remarks", s.opinion)}
      `,
      footerHtml: `<button class="btn btn-secondary" data-close>Close</button>`,
    });
  }

  load();
}

function buildParams(state, { forExport = false } = {}) {
  return {
    search: state.search || undefined,
    dateFrom: state.dateFrom || undefined,
    dateTo: state.dateTo || undefined,
    sort: state.sort,
    teamLeaderId: state.teamLeaderId || undefined,
    ...(forExport ? {} : { page: state.page, limit: state.limit }),
  };
}
