import { useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import AdminModal from "./AdminModal";
import Field from "../../components/Field";
import Button from "../../components/Button";
import Toast from "../../components/Toast";

const emptyTlForm = { employeeId: "", name: "", mobile: "", zone: "", password: "" };
const emptySaForm = { employeeId: "", name: "", mobile: "", password: "" };
const emptyEditForm = { name: "", mobile: "", zone: "", address: "", designation: "" };

export default function AdminTeamLeaders() {
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyTlForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [superAdmins, setSuperAdmins] = useState([]);
  const [saLoading, setSaLoading] = useState(true);
  const [saError, setSaError] = useState(null);
  const [showAddSa, setShowAddSa] = useState(false);
  const [saForm, setSaForm] = useState(emptySaForm);
  const [saFormError, setSaFormError] = useState(null);
  const [saSaving, setSaSaving] = useState(false);

  const [editingInfo, setEditingInfo] = useState(null); // user whose profile is being edited (TL or SA)
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFormError, setEditFormError] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [toast, setToast] = useState(null);

  function load() {
    setLoading(true);
    adminApi
      .listTeamLeaders()
      .then((d) => setTeamLeaders(d.teamLeaders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function loadSuperAdmins() {
    setSaLoading(true);
    adminApi
      .listSuperAdmins()
      .then((d) => setSuperAdmins(d.users || []))
      .catch((err) => setSaError(err.message))
      .finally(() => setSaLoading(false));
  }

  useEffect(load, []);
  useEffect(loadSuperAdmins, []);

  async function handleAdd(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.employeeId || !form.name || !form.password) {
      setFormError("Employee ID, name, and password are required.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createUser({ ...form, role: "ADMIN" });
      setShowAdd(false);
      setForm(emptyTlForm);
      setToast("Team leader added.");
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(tl) {
    const nextStatus = tl.status === "active" ? "inactive" : "active";
    await adminApi.updateUser(tl.id, { status: nextStatus });
    load();
  }

  async function handleAddSuperAdmin(e) {
    e.preventDefault();
    setSaFormError(null);
    if (!saForm.employeeId || !saForm.name || !saForm.password) {
      setSaFormError("Employee ID, name, and password are required.");
      return;
    }
    if (saForm.password.length < 6) {
      setSaFormError("Password must be at least 6 characters.");
      return;
    }
    setSaSaving(true);
    try {
      await adminApi.createSuperAdmin(saForm);
      setShowAddSa(false);
      setSaForm(emptySaForm);
      setToast("Super Admin account created.");
      loadSuperAdmins();
    } catch (err) {
      setSaFormError(err.message);
    } finally {
      setSaSaving(false);
    }
  }

  async function toggleSuperAdminStatus(sa) {
    const nextStatus = sa.status === "active" ? "inactive" : "active";
    await adminApi.updateUser(sa.id, { status: nextStatus });
    loadSuperAdmins();
  }

  function startEditInfo(user) {
    setEditFormError(null);
    setEditForm({
      name: user.name || "",
      mobile: user.mobile || "",
      zone: user.zone || "",
      address: user.address || "",
      designation: user.designation || "",
    });
    setEditingInfo(user);
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setEditFormError(null);
    if (!editForm.name?.trim()) {
      setEditFormError("Name is required.");
      return;
    }
    setSavingEdit(true);
    try {
      await adminApi.updateUser(editingInfo.id, editForm);
      const wasSuperAdmin = editingInfo.role === "SUPER_ADMIN";
      setEditingInfo(null);
      setToast("Profile updated.");
      if (wasSuperAdmin) loadSuperAdmins();
      else load();
    } catch (err) {
      setEditFormError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(user, isSuperAdmin) {
    const confirmed = window.confirm(`Delete ${user.name} (${user.employeeId})? This permanently removes the account. This can't be undone.`);
    if (!confirmed) return;
    setDeletingId(user.id);
    try {
      await adminApi.deleteUser(user.id);
      setToast("Account deleted.");
      if (isSuperAdmin) loadSuperAdmins();
      else load();
    } catch (err) {
      if (isSuperAdmin) setSaError(err.message);
      else setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Team Leaders</h1>
          <p className="admin-page-header__subtitle">Team Leaders and how many Marketing Officers report to them.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowAdd(true)}>
          + Add team leader
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
              <th>Employees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamLeaders.map((tl) => (
              <tr key={tl.id}>
                <td>{tl.name}</td>
                <td>{tl.employeeId}</td>
                <td>{tl.zone || "—"}</td>
                <td>{tl.employeeCount}</td>
                <td>
                  <span className={`admin-badge ${tl.status === "active" ? "admin-badge--active" : "admin-badge--inactive"}`}>
                    {tl.status}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ marginRight: 6 }} onClick={() => startEditInfo({ ...tl, role: "ADMIN" })}>
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ marginRight: 6 }} onClick={() => toggleStatus(tl)}>
                    {tl.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => handleDelete(tl, false)}
                    disabled={deletingId === tl.id}
                  >
                    {deletingId === tl.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && teamLeaders.length === 0 && <div className="admin-empty">No Team Leaders yet.</div>}
        {loading && <div className="admin-empty">Loading…</div>}
      </div>

      <div className="admin-page-header" style={{ marginTop: 32 }}>
        <div>
          <h1 className="admin-page-header__title">Managers (Super Admins)</h1>
          <p className="admin-page-header__subtitle">Full organization access. Only another Manager can create one.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowAddSa(true)}>
          + Add manager
        </button>
      </div>

      {saError && <div className="banner banner--error" style={{ marginBottom: 16 }}>{saError}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {superAdmins.map((sa) => (
              <tr key={sa.id}>
                <td>{sa.name}</td>
                <td>{sa.employeeId}</td>
                <td>{sa.mobile || "—"}</td>
                <td>
                  <span className={`admin-badge ${sa.status === "active" ? "admin-badge--active" : "admin-badge--inactive"}`}>
                    {sa.status}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ marginRight: 6 }} onClick={() => startEditInfo({ ...sa, role: "SUPER_ADMIN" })}>
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ marginRight: 6 }} onClick={() => toggleSuperAdminStatus(sa)}>
                    {sa.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => handleDelete(sa, true)}
                    disabled={deletingId === sa.id}
                  >
                    {deletingId === sa.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!saLoading && superAdmins.length === 0 && <div className="admin-empty">No Managers yet.</div>}
        {saLoading && <div className="admin-empty">Loading…</div>}
      </div>

      {showAdd && (
        <AdminModal title="Add team leader" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <Field id="tl-emp-id" label="Employee ID" value={form.employeeId} onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))} placeholder="TL-004" />
            <Field id="tl-name" label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Team Leader name" />
            <Field id="tl-mobile" label="Mobile" value={form.mobile} onChange={(v) => setForm((f) => ({ ...f, mobile: v }))} placeholder="017XXXXXXXX" />
            <Field id="tl-zone" label="Zone" value={form.zone} onChange={(v) => setForm((f) => ({ ...f, zone: v }))} placeholder="Dhaka North" />
            <Field id="tl-password" label="Temporary password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="At least 6 characters" />
            {formError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{formError}</div>}
            <Button type="submit" loading={saving}>
              {saving ? "Adding…" : "Add team leader"}
            </Button>
          </form>
        </AdminModal>
      )}

      {showAddSa && (
        <AdminModal title="Add manager (Super Admin)" onClose={() => setShowAddSa(false)}>
          <form onSubmit={handleAddSuperAdmin}>
            <Field id="sa-emp-id" label="Employee ID" value={saForm.employeeId} onChange={(v) => setSaForm((f) => ({ ...f, employeeId: v }))} placeholder="SA-003" />
            <Field id="sa-name" label="Full name" value={saForm.name} onChange={(v) => setSaForm((f) => ({ ...f, name: v }))} placeholder="Manager name" />
            <Field id="sa-mobile" label="Mobile" value={saForm.mobile} onChange={(v) => setSaForm((f) => ({ ...f, mobile: v }))} placeholder="017XXXXXXXX" />
            <Field id="sa-password" label="Temporary password" type="password" value={saForm.password} onChange={(v) => setSaForm((f) => ({ ...f, password: v }))} placeholder="At least 6 characters" />
            {saFormError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{saFormError}</div>}
            <Button type="submit" loading={saSaving}>
              {saSaving ? "Adding…" : "Add manager"}
            </Button>
          </form>
        </AdminModal>
      )}

      {editingInfo && (
        <AdminModal title={`Edit ${editingInfo.name}`} onClose={() => setEditingInfo(null)}>
          <form onSubmit={handleSaveInfo}>
            <Field id="tl-edit-name" label="Name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} placeholder="Full name" />
            <Field id="tl-edit-mobile" label="Mobile" value={editForm.mobile} onChange={(v) => setEditForm((f) => ({ ...f, mobile: v }))} placeholder="017XXXXXXXX" />
            <Field id="tl-edit-zone" label="Zone" value={editForm.zone} onChange={(v) => setEditForm((f) => ({ ...f, zone: v }))} placeholder="Dhaka North" />
            <Field id="tl-edit-address" label="Address" value={editForm.address} onChange={(v) => setEditForm((f) => ({ ...f, address: v }))} placeholder="Address" multiline />
            <Field id="tl-edit-designation" label="Designation" value={editForm.designation} onChange={(v) => setEditForm((f) => ({ ...f, designation: v }))} placeholder="Designation" />
            {editFormError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{editFormError}</div>}
            <Button type="submit" loading={savingEdit}>
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </AdminModal>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
