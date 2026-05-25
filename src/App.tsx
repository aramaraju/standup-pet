import { useState } from "react";
import { StoreProvider } from "./lib/store";
import { Pet } from "./components/Pet";
import { Timer } from "./components/Timer";
import { Controls } from "./components/Controls";
import { Preferences } from "./components/Preferences";
import { ReminderBar } from "./components/ReminderBar";
import "./App.css";

type View = "home" | "settings";

function AppShell() {
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
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}

export default App;
