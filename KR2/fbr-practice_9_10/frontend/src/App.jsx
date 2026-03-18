import { Link, Route, Routes, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import EditProductPage from "./pages/EditProductPage";

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <div className="app-container">
      <nav className="nav">
        <Link to="/register">Регистрация</Link>
        <Link to="/login">Вход</Link>
        <Link to="/products">Товары</Link>
        <button onClick={handleLogout}>Выйти</button>
      </nav>

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;