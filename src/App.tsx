import { StoreProvider } from "./lib/store";
import { Pet } from "./components/Pet";
import { Timer } from "./components/Timer";
import { Controls } from "./components/Controls";

function App() {
  return (
    <StoreProvider>
      <main className="container">
        <h1>Standup Pet</h1>
        <Pet />
        <Timer />
        <Controls />
      </main>
    </StoreProvider>
  );
}

export default App;
