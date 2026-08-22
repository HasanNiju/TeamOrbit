import { api, setToken, ApiError } from "../api.js";
import { el, setButtonLoading } from "../ui.js";

export function renderLogin(root, onSuccess) {
  root.innerHTML = "";
  const page = el(`
    <div class="login-screen">
      <div class="card login-card">
        <div class="login-card__brand">
          <div class="sidebar__brand-mark">TO</div>
          <div>
            <div style="font-weight:700;font-size:16px;">TeamOrbit</div>
            <div style="font-size:12px;color:var(--color-text-muted);">Management Panel</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p>Team Leader / Manager access only.</p>
        <div id="login-error"></div>
        <form id="login-form">
          <div class="field">
            <label for="employeeId">Employee / Admin ID</label>
            <input type="text" id="employeeId" autocomplete="username" placeholder="e.g. TL-001" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" autocomplete="current-password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn btn-primary" id="login-submit" style="width:100%;">Sign in</button>
        </form>
        <div class="login-demo">
          Dummy accounts (Phase 1 data):<br />
          Super Admin — <code>SA-001</code> / <code>admin123</code><br />
          Team Leader — <code>TL-001</code> / <code>leader123</code>
        </div>
      </div>
    </div>
  `);
  root.appendChild(page);

  const form = page.querySelector("#login-form");
  const errorBox = page.querySelector("#login-error");
  const submitBtn = page.querySelector("#login-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.innerHTML = "";
    const employeeId = page.querySelector("#employeeId").value.trim();
    const password = page.querySelector("#password").value;

    setButtonLoading(submitBtn, true, "Signing in…");
    try {
      const { token, user } = await api.login(employeeId, password);
      if (user.role === "MARKETING_OFFICER") {
        throw new ApiError("This account is for the employee app, not the management panel.", "WRONG_APP", 403);
      }
      setToken(token);
      onSuccess(user);
    } catch (err) {
      errorBox.innerHTML = `<div class="login-error">${err.message || "Login failed."}</div>`;
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}
