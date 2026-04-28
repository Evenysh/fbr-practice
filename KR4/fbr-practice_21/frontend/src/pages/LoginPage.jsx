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
  const [isError, setIsError] = useState(false);

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

      const meResponse = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      localStorage.setItem("currentUser", JSON.stringify(meResponse.data));

      setIsError(false);
      setMessage("Успешный вход");
      setTimeout(() => {
        navigate("/products");
        window.location.reload();
      }, 500);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div className="page auth-page">
      <div className="page-header">
        <h1>Вход</h1>
        <p>Войдите в систему под своей ролью.</p>
      </div>

      <form className="form card-form" onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
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

      <div className="hint-box">
        <p><strong>Тестовые аккаунты:</strong></p>
        <p>Админ: admin@mail.com / admin123</p>
        <p>Продавец: seller@mail.com / seller123</p>
      </div>

      {message && (
        <p className={isError ? "message-error" : "message-success"}>
          {message}
        </p>
      )}
    </div>
  );
}

export default LoginPage;