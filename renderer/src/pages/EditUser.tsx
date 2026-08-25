import { useNavigate, useParams } from "react-router-dom";
import UserForm from "../components/forms/UserForm";
import { useUsersStore } from "../store/users";
import { useEffect } from "react";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setEditingUser, getUser, clearUser } = useUsersStore();

  useEffect(() => {
    setEditingUser(true);
    clearUser();
    if (id) {
      getUser(Number(id));
    }
    return () => {
      setEditingUser(false);
    };
  }, [id, getUser, setEditingUser, clearUser]);

  return (
    <div className="p-6">
      <UserForm
        onCancel={() => {
          clearUser();
          setEditingUser(false);
          navigate("/users");
        }}
      />
    </div>
  );
}
