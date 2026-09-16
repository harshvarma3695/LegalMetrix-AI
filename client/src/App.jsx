import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import ScanProduct from "./pages/ScanProduct";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Enforcement from "./pages/Enforcement";

export default function App() {

  return (
    <BrowserRouter>

      <div className="min-h-screen bg-[#f6f8fb]">

        <Sidebar />

        <div className="ml-64">

          <Topbar />

          <main className="p-8">

            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/scan"
                element={<ScanProduct />}
              />

              <Route
                path="/history"
                element={<History />}
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

              <Route
                path="/enforcement"
                element={<Enforcement />}
              />

            </Routes>

          </main>

        </div>

      </div>

    </BrowserRouter>
  );
}