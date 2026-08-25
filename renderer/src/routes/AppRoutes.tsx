import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import CreateUser from "../pages/CreateUser";
import EditUser from "../pages/EditUser";
import Sessions from "../pages/Sessions";
import Billing from "../pages/Billing";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/user/new" element={<CreateUser />} />
      <Route path="/users/edit/:id" element={<EditUser />} />
      <Route path="/users/edit" element={<Navigate to="/users" replace />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/billing" element={<Billing />} />
    </Routes>
  );
}
