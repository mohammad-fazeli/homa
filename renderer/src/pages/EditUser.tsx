import { useNavigate } from "react-router-dom";
import UserForm from "../components/forms/UserForm";

export default function EditUser() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <UserForm
        onCancel={() => {
          navigate("/users");
        }}
      />
    </div>
  );
}
