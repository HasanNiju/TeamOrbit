import { api } from "../api.js";
import { el, toast, roleBadge, setButtonLoading } from "../ui.js";

export async function renderAccount(root, user) {
  root.innerHTML = "";
  const page = el(`
    <div>
      <div class="page-header">
        <div><h1>Account</h1><p>Your profile and login details.</p></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:840px;">
        <div class="card" style="padding:22px 24px;">
          <div style="font-weight:700;margin-bottom:14px;">Profile</div>
          <div class="field"><label>Employee / Admin ID</label><input type="text" value="${user.employeeId}" disabled /></div>
          <div class="field"><label>Role</label><div>${roleBadge(user.role)}</div></div>
          <div class="field"><label>Full Name</label><input type="text" id="f-name" value="${user.nameEn || ""}" /></div>
          <div class="field"><label>Mobile</label><input type="tel" id="f-mobile" value="${user.mobile || ""}" /></div>
          <div class="field"><label>Zone</label><input type="text" id="f-zone" value="${user.zone || ""}" /></div>
          <button class="btn btn-primary" id="save-profile">Save changes</button>
        </div>

        <div class="card" style="padding:22px 24px;">
          <div style="font-weight:700;margin-bottom:14px;">Change Password</div>
          <div class="field"><label>Current Password</label><input type="password" id="f-current" /></div>
          <div class="field"><label>New Password</label><input type="password" id="f-new" placeholder="min. 6 characters" /></div>
          <button class="btn btn-secondary" id="save-password">Update password</button>
        </div>
      </div>
    </div>
  `);
  root.appendChild(page);

  page.querySelector("#save-profile").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    setButtonLoading(btn, true, "Saving…");
    try {
      await api.updateAccount({
        name: page.querySelector("#f-name").value.trim(),
        mobile: page.querySelector("#f-mobile").value.trim(),
        zone: page.querySelector("#f-zone").value.trim(),
      });
      toast("Profile updated.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });

  page.querySelector("#save-password").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const currentPassword = page.querySelector("#f-current").value;
    const newPassword = page.querySelector("#f-new").value;
    if (!currentPassword || !newPassword) return toast("Fill in both password fields.", "error");
    setButtonLoading(btn, true, "Updating…");
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast("Password updated.", "success");
      page.querySelector("#f-current").value = "";
      page.querySelector("#f-new").value = "";
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}
