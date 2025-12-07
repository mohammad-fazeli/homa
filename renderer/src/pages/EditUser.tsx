import { useNavigate } from "react-router-dom";
import UserForm from "../components/forms/UserForm";
import { useUsersStore } from "../store/users";

export default function EditUser() {
  const navigate = useNavigate();
  const { setEditingUser } = useUsersStore();

  return (
    <div className="p-6">
      <UserForm
        onCancel={() => {
          navigate("/users");
          setEditingUser(false);
        }}
      />
    </div>
  );
}
