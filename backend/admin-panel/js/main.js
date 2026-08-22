import { api, getToken, setToken } from "./api.js";
import { renderLogin } from "./pages/login.js";
import { renderShell } from "./layout.js";
import { startRouter } from "./router.js";
import { toast } from "./ui.js";

const appRoot = document.getElementById("app");

async function boot() {
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }

  try {
    const { user } = await api.me();
    if (user.role === "MARKETING_OFFICER") {
      // This link is the management panel; Marketing Officers use the
      // separate employee app, so don't let a stray token in here either.
      setToken(null);
      showLogin();
      return;
    }
    showApp(user);
  } catch {
    setToken(null);
    showLogin();
  }
}

function showLogin() {
  window.location.hash = "";
  renderLogin(appRoot, (user) => showApp(user));
}

function showApp(user) {
  appRoot.innerHTML = "";
  const shell = renderShell(user, async () => {
    try {
      await api.logout();
    } catch {
      /* best-effort — clear the client session regardless */
    }
    setToken(null);
    toast("Logged out.");
    showLogin();
  });
  appRoot.appendChild(shell);
  startRouter(shell, user);
}

boot();
