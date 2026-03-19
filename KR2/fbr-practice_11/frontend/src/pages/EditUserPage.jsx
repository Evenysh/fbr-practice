import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

function EditUserPage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
    isBlocked: false,
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get(`/api/users/${id}`);
        setForm({
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          role: response.data.role,
          isBlocked: response.data.isBlocked,
        });
      } catch (error) {
        setMessage(error.response?.data?.error || "Ошибка загрузки пользователя");
      }
    };

    if (currentUser?.role === "admin") {
      loadUser();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/users/${id}`, form);
      navigate("/users");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка обновления пользователя");
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="page">
        <h1>Редактирование пользователя</h1>
        <p className="message-error">Доступ только для администратора.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Редактирование пользователя</h1>
      </div>

      <form className="form card-form" onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="first_name"
          placeholder="Имя"
          value={form.first_name}
          onChange={handleChange}
        />
        <input
          name="last_name"
          placeholder="Фамилия"
          value={form.last_name}
          onChange={handleChange}
        />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">user</option>
          <option value="seller">seller</option>
          <option value="admin">admin</option>
        </select>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="isBlocked"
            checked={form.isBlocked}
            onChange={handleChange}
          />
          Пользователь заблокирован
        </label>

        <button type="submit">Сохранить</button>
      </form>

      {message && <p className="message-error">{message}</p>}
    </div>
  );
}

export default EditUserPage;