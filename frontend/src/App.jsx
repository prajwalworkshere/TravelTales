import { useLocation } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const location = useLocation();

  // Identify whether the current page belongs to Admin.
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Public Navbar should not appear on Admin pages */}
      {!isAdminRoute && <Navbar />}

      <main>
        <AppRoutes />
      </main>
    </>
  );
}

export default App;
