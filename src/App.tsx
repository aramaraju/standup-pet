import { useState } from "react";
import { StoreProvider } from "./lib/store";
import { Pet } from "./components/Pet";
import { Timer } from "./components/Timer";
import { Controls } from "./components/Controls";
import { Preferences } from "./components/Preferences";
import { ReminderBar } from "./components/ReminderBar";
import { FocusHUD } from "./components/FocusHUD";
import { FlashOverlay } from "./components/FlashOverlay";
import { WaterPanel } from "./components/WaterPanel";
import "./App.css";

type View = "home" | "settings";

type AppView = "main" | "focus_hud" | "flash_overlay";

function getAppView(): AppView {
  if (typeof window === "undefined") return "main";
  const params = new URLSearchParams(window.location.search);
  const v = params.get("view");
  if (v === "focus_hud" || v === "flash_overlay") return v;
  return "main";
}

function MainShell() {
  const [view, setView] = useState<View>("home");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-header__title">Standup Pet</h1>
        <button
          type="button"
          className="app-header__settings"
          aria-label={view === "home" ? "Open settings" : "Back to timer"}
          data-testid="view-toggle"
          onClick={() => setView(view === "home" ? "settings" : "home")}
        >
          {view === "home" ? "⚙" : "←"}
        </button>
      </header>

      <main className="app-main">
        {view === "home" ? (
          <>
            <Pet />
            <Timer />
            <Controls />
            <WaterPanel />
          </>
        ) : (
          <Preferences />
        )}
      </main>

      <ReminderBar />
    </div>
  );
}

function App() {
  const appView = getAppView();

  if (appView === "focus_hud") {
    return (
      <StoreProvider>
        <FocusHUD />
      </StoreProvider>
    );
  }

  if (appView === "flash_overlay") {
    // No store needed — overlay just listens for events.
    return <FlashOverlay />;
  }

  return (
    <StoreProvider>
      <MainShell />
    </StoreProvider>
  );
}

export default App;
