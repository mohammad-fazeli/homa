import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import CreateUser from "../pages/CreateUser";
import EditUser from "../pages/EditUser";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/user/new" element={<CreateUser />} />
      <Route path="/users/edit" element={<EditUser />} />
    </Routes>
  );
}
