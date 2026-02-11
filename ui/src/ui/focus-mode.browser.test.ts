import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OpenClawApp } from "./app.ts";

// oxlint-disable-next-line typescript/unbound-method
const originalConnect = OpenClawApp.prototype.connect;

function mountApp(pathname: string) {
  window.history.replaceState({}, "", pathname);
  const app = document.createElement("starforgeos-app") as OpenClawApp;
  document.body.append(app);
  return app;
}

beforeEach(() => {
  OpenClawApp.prototype.connect = () => {
    // no-op: avoid real gateway WS connections in browser tests
  };
  window.__STARFORGEOS_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

afterEach(() => {
  OpenClawApp.prototype.connect = originalConnect;
  window.__STARFORGEOS_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("chat focus mode", () => {
  it("collapses header + sidebar on chat tab only", async () => {
    const app = mountApp("/chat");
    await app.updateComplete;

    const shell = app.querySelector(".shell");
    expect(shell).not.toBeNull();
    expect(shell?.classList.contains("shell--chat-focus")).toBe(false);

    const toggle = app.querySelector<HTMLButtonElement>('button[title^="Toggle focus mode"]');
    expect(toggle).not.toBeNull();
    toggle?.click();

    await app.updateComplete;
    expect(shell?.classList.contains("shell--chat-focus")).toBe(true);

    const opsButton = Array.from(app.querySelectorAll<HTMLButtonElement>(".mode-rail__item")).find(
      (button) => button.textContent?.includes("OPS"),
    );
    opsButton?.click();
    await app.updateComplete;

    const link = app.querySelector<HTMLAnchorElement>('a.nav-item[href="/channels"]');
    expect(link).not.toBeNull();
    link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));

    await app.updateComplete;
    expect(app.tab).toBe("channels");
    expect(shell?.classList.contains("shell--chat-focus")).toBe(false);

    const chatButton = Array.from(app.querySelectorAll<HTMLButtonElement>(".mode-rail__item")).find(
      (button) => button.textContent?.includes("CHAT"),
    );
    chatButton?.click();

    await app.updateComplete;
    expect(app.tab).toBe("chat");
    expect(shell?.classList.contains("shell--chat-focus")).toBe(true);
  });
});
