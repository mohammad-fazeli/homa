import { useEffect, useState } from "react";

export default function App() {
  const [users, setUsers] = useState<
    {
      id: number;
      firstName: string;
      lastName: string;
      phone: string;
      nationalId: string;
      sessions: number;
    }[]
  >([]);

  useEffect(() => {
    window.electronAPI?.getUsers().then((data) => {
      setUsers(data);
    });
  }, []);

  const add =
    () =>
    (user: {
      firstName: string;
      lastName: string;
      phone: string;
      nationalId: string;
      sessions: number;
    }) => {
      window.electronAPI?.addUser(user);
    };

  return <div></div>;
}
