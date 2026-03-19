import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

function UsersPage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await api.get("/api/users");
      setUsers(response.data);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка загрузки пользователей");
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, []);

  const handleBlock = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      setIsError(false);
      setMessage("Пользователь заблокирован");
      loadUsers();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка блокировки пользователя");
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="page">
        <h1>Пользователи</h1>
        <p className="message-error">Доступ только для администратора.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Пользователи</h1>
        <p>Раздел доступен только администратору.</p>
      </div>

      {message && (
        <p className={isError ? "message-error" : "message-success"}>
          {message}
        </p>
      )}

      <div className="section-card">
        <ul className="product-list">
          {users.map((user) => (
            <li key={user.id} className="product-item">
              <div className="product-main">
                <strong>{user.first_name} {user.last_name}</strong>
                <span>{user.email}</span>
                <span>Роль: {user.role}</span>
                <span>{user.isBlocked ? "Заблокирован" : "Активен"}</span>
              </div>

              <div className="actions">
                <Link to={`/users/${user.id}/edit`}>Редактировать</Link>
                {!user.isBlocked && (
                  <button onClick={() => handleBlock(user.id)}>
                    Заблокировать
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UsersPage;