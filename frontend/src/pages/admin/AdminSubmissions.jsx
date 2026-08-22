import { useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";

export default function AdminSubmissions() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getSubmissions({ search, dateFrom, dateTo, sort, page, limit: 20 })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, dateFrom, dateTo, sort, page]);

  const rows = data?.submissions || [];
  const pagination = data?.pagination;

  const exportUrl = adminApi.getExportUrl({ search, dateFrom, dateTo, sort });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Submissions</h1>
          <p className="admin-page-header__subtitle">Search, filter, and export field reports.</p>
        </div>
        <a className="admin-btn admin-btn--ghost" href={exportUrl} target="_blank" rel="noreferrer">
          Export to Excel
        </a>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-toolbar__search"
          placeholder="Search by name, ID, mobile…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setPage(1);
            setDateFrom(e.target.value);
          }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setPage(1);
            setDateTo(e.target.value);
          }}
        />
        <select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
      </div>

      {error && <div className="banner banner--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Mobile</th>
              <th>Date</th>
              <th>Opinion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => setSelected(s)} style={{ cursor: "pointer" }}>
                <td>{s.name}</td>
                <td>{s.employeeId}</td>
                <td>{s.mobile}</td>
                <td>{s.date}</td>
                <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.opinion}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <div className="admin-empty">No submissions match these filters.</div>}
        {loading && <div className="admin-empty">Loading…</div>}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="admin-pagination__btns">
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="admin-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Submission detail</h2>
              <button type="button" className="admin-modal__close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Employee</span>
              <span className="admin-detail-row__value">{selected.name}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Employee ID</span>
              <span className="admin-detail-row__value">{selected.employeeId}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Designation</span>
              <span className="admin-detail-row__value">{selected.designation || "—"}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Mobile</span>
              <span className="admin-detail-row__value">{selected.mobile}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Address</span>
              <span className="admin-detail-row__value">{selected.address}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Submitted</span>
              <span className="admin-detail-row__value">{new Date(selected.submittedAt).toLocaleString()}</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.6 }}>{selected.opinion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
