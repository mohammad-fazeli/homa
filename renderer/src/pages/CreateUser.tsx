import { useNavigate } from "react-router-dom";
import UserForm from "../components/forms/UserForm";
import { useUsersStore } from "../store/users";
import { useEffect } from "react";

export default function CreateUser() {
  const navigate = useNavigate();
  const { setEditingUser } = useUsersStore();

  useEffect(() => {
    setEditingUser(false);
  }, [setEditingUser]);

  return <UserForm onCancel={() => navigate("/users")} />;
}
