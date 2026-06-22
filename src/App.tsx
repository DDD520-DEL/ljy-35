import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RoleSelect from "@/pages/RoleSelect";
import PassengerHome from "@/pages/PassengerHome";
import RouteDetail from "@/pages/RouteDetail";
import DriverConsole from "@/pages/DriverConsole";
import AdminDashboard from "@/pages/AdminDashboard";
import Toaster from "@/components/Toaster";
import { useAppStore } from "@/store";

function RequireRole({ children, role }: { children: React.ReactNode; role: string[] }) {
  const userRole = useAppStore((s) => s.userRole);
  if (!userRole || !role.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route
          path="/passenger"
          element={
            <RequireRole role={["passenger", "driver", "admin"]}>
              <PassengerHome />
            </RequireRole>
          }
        />
        <Route
          path="/passenger/route/:id"
          element={
            <RequireRole role={["passenger", "driver", "admin"]}>
              <RouteDetail />
            </RequireRole>
          }
        />
        <Route
          path="/driver"
          element={
            <RequireRole role={["driver", "admin"]}>
              <DriverConsole />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role={["admin"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
