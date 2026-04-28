import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
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
      const response = await api.post("/api/auth/login", form);
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setMessage("Успешный вход");
      navigate("/products");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div className="page">
      <h1>Вход</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">Войти</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default LoginPage;