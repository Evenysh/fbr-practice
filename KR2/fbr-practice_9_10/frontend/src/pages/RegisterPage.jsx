import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/register", form);
      setMessage("Пользователь успешно зарегистрирован");
      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="page">
      <h1>Регистрация</h1>
      <form className="form" onSubmit={handleSubmit}>
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
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">Зарегистрироваться</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default RegisterPage;