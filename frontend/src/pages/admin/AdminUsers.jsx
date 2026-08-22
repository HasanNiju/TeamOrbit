import { useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import AdminModal from "./AdminModal";
import Field from "../../components/Field";
import Button from "../../components/Button";

const emptyForm = { employeeId: "", name: "", mobile: "", zone: "", address: "", password: "", teamLeaderId: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null); // user being reassigned/status-changed

  function load() {
    setLoading(true);
    Promise.all([adminApi.listUsers("MARKETING_OFFICER"), adminApi.listTeamLeaders()])
      .then(([u, tl]) => {
        setUsers(u.users || []);
        setTeamLeaders(tl.teamLeaders || []);
      })
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
      await adminApi.createUser({ ...form, role: "MARKETING_OFFICER" });
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    await adminApi.updateUser(user.id, { status: nextStatus });
    load();
  }

  async function reassign(userId, teamLeaderId) {
    await adminApi.updateAssignments({ userId, teamLeaderId });
    setEditing(null);
    load();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Marketing Officers</h1>
          <p className="admin-page-header__subtitle">All Marketing Officers across every team.</p>
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
              <th>Team Leader</th>
              <th>Total Reports</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.employeeId}</td>
                <td>{u.teamLeader || "Unassigned"}</td>
                <td>{u.totalSubmissions}</td>
                <td>
                  <span className={`admin-badge ${u.status === "active" ? "admin-badge--active" : "admin-badge--inactive"}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ marginRight: 6 }} onClick={() => setEditing(u)}>
                    Reassign
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => toggleStatus(u)}>
                    {u.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="admin-empty">No Marketing Officers yet.</div>}
        {loading && <div className="admin-empty">Loading…</div>}
      </div>

      {showAdd && (
        <AdminModal title="Add employee" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <Field id="u-emp-id" label="Employee ID" value={form.employeeId} onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))} placeholder="EMP-009" />
            <Field id="u-emp-name" label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Employee name" />
            <div className="field">
              <label className="field__label" htmlFor="u-emp-tl">Team Leader</label>
              <select
                id="u-emp-tl"
                className="field__input"
                value={form.teamLeaderId}
                onChange={(e) => setForm((f) => ({ ...f, teamLeaderId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {teamLeaders.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {tl.name} ({tl.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <Field id="u-emp-mobile" label="Mobile" value={form.mobile} onChange={(v) => setForm((f) => ({ ...f, mobile: v }))} placeholder="017XXXXXXXX" />
            <Field id="u-emp-zone" label="Zone" value={form.zone} onChange={(v) => setForm((f) => ({ ...f, zone: v }))} placeholder="Dhaka North" />
            <Field id="u-emp-address" label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Address" />
            <Field id="u-emp-password" label="Temporary password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="At least 6 characters" />
            {formError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{formError}</div>}
            <Button type="submit" loading={saving}>
              {saving ? "Adding…" : "Add employee"}
            </Button>
          </form>
        </AdminModal>
      )}

      {editing && (
        <AdminModal title={`Reassign ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="field">
            <label className="field__label" htmlFor="reassign-tl">New Team Leader</label>
            <select id="reassign-tl" className="field__input" defaultValue={editing.teamLeaderId || ""} onChange={(e) => reassign(editing.id, e.target.value)}>
              <option value="" disabled>
                Choose a Team Leader
              </option>
              {teamLeaders.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.name} ({tl.employeeId})
                </option>
              ))}
            </select>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
