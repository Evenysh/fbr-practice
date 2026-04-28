import { Link, Route, Routes, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import EditProductPage from "./pages/EditProductPage";
import UsersPage from "./pages/UsersPage";
import EditUserPage from "./pages/EditUserPage";

function App() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="app-container">
      <nav className="nav">
        <Link to="/register">Регистрация</Link>
        <Link to="/login">Вход</Link>
        <Link to="/products">Товары</Link>
        {currentUser?.role === "admin" && <Link to="/users">Пользователи</Link>}
        <button onClick={handleLogout}>Выйти</button>
      </nav>

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id/edit" element={<EditUserPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;