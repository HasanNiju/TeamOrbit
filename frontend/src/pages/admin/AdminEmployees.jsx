import { useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import AdminModal from "./AdminModal";
import Field from "../../components/Field";
import Button from "../../components/Button";

const emptyForm = { employeeId: "", name: "", mobile: "", zone: "", address: "", password: "" };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function load() {
    setLoading(true);
    adminApi
      .getEmployees()
      .then((d) => setEmployees(d.employees || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.employeeId || !form.name || !form.password) {
      setFormError("Employee ID, name, and password are required.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createEmployee(form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(emp) {
    setDetailLoading(true);
    setDetail({ id: emp.id, name: emp.name });
    try {
      const d = await adminApi.getEmployeeDetail(emp.id);
      setDetail(d);
    } catch (err) {
      setDetail(null);
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Employees</h1>
          <p className="admin-page-header__subtitle">Marketing Officers on your team.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowAdd(true)}>
          + Add employee
        </button>
      </div>

      {error && <div className="banner banner--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Zone</th>
              <th>Total Reports</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} onClick={() => openDetail(e)} style={{ cursor: "pointer" }}>
                <td>{e.name}</td>
                <td>{e.employeeId}</td>
                <td>{e.zone || "—"}</td>
                <td>{e.totalSubmissions}</td>
                <td>
                  <span className={`admin-badge ${e.status === "active" ? "admin-badge--active" : "admin-badge--inactive"}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && employees.length === 0 && <div className="admin-empty">No employees yet. Add your first one above.</div>}
        {loading && <div className="admin-empty">Loading…</div>}
      </div>

      {showAdd && (
        <AdminModal title="Add employee" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <Field id="new-emp-id" label="Employee ID" value={form.employeeId} onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))} placeholder="EMP-009" />
            <Field id="new-emp-name" label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Employee name" />
            <Field id="new-emp-mobile" label="Mobile" value={form.mobile} onChange={(v) => setForm((f) => ({ ...f, mobile: v }))} placeholder="017XXXXXXXX" />
            <Field id="new-emp-zone" label="Zone" value={form.zone} onChange={(v) => setForm((f) => ({ ...f, zone: v }))} placeholder="Dhaka North" />
            <Field id="new-emp-address" label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Address" />
            <Field id="new-emp-password" label="Temporary password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="At least 6 characters" />
            {formError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{formError}</div>}
            <Button type="submit" loading={saving}>
              {saving ? "Adding…" : "Add employee"}
            </Button>
          </form>
        </AdminModal>
      )}

      {detail && (
        <AdminModal title={detail.employee?.name || detail.name || "Employee"} onClose={() => setDetail(null)}>
          {detailLoading ? (
            <p>Loading…</p>
          ) : detail.employee ? (
            <>
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Employee ID</span>
                <span className="admin-detail-row__value">{detail.employee.employeeId}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Mobile</span>
                <span className="admin-detail-row__value">{detail.employee.mobile || "—"}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Zone</span>
                <span className="admin-detail-row__value">{detail.employee.zone || "—"}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Rank</span>
                <span className="admin-detail-row__value">
                  #{detail.rank} of {detail.rankOutOf}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Today / Week / Month / Total</span>
                <span className="admin-detail-row__value">
                  {detail.stats?.today} / {detail.stats?.week} / {detail.stats?.month} / {detail.stats?.total}
                </span>
              </div>
            </>
          ) : (
            <p>Could not load details.</p>
          )}
        </AdminModal>
      )}
    </div>
  );
}
