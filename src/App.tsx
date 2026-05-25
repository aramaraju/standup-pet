import { StoreProvider } from "./lib/store";
import { Preferences } from "./components/Preferences";
import { FocusHUD } from "./components/FocusHUD";
import { FlashOverlay } from "./components/FlashOverlay";
import { WaterPanel } from "./components/WaterPanel";
import "./App.css";

type AppView = "main" | "focus_hud" | "flash_overlay";

function getAppView(): AppView {
  if (typeof window === "undefined") return "main";
  const params = new URLSearchParams(window.location.search);
  const v = params.get("view");
  if (v === "focus_hud" || v === "flash_overlay") return v;
  return "main";
}

function MainShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-header__title">Standup Pet</h1>
      </header>
      <main className="app-main">
        <WaterPanel />
        <Preferences />
      </main>
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
    return <FlashOverlay />;
  }

  return (
    <StoreProvider>
      <MainShell />
    </StoreProvider>
  );
}

export default App;
