import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Users = lazy(() => import("../pages/Users"));
const CreateUser = lazy(() => import("../pages/CreateUser"));
const EditUser = lazy(() => import("../pages/EditUser"));
const Sessions = lazy(() => import("../pages/Sessions"));
const Billing = lazy(() => import("../pages/Billing"));
const Settings = lazy(() => import("../pages/Settings"));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-muted">
          در حال آماده‌سازی صفحه...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<CreateUser />} />
        <Route path="/user/new" element={<Navigate to="/users/new" replace />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
        <Route path="/users/edit" element={<Navigate to="/users" replace />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
