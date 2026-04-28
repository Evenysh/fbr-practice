import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

function unwrapApiData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function ProductsPage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    image: null,
  });

  const canViewProducts =
    currentUser?.role === "user" ||
    currentUser?.role === "seller" ||
    currentUser?.role === "admin";

  const canCreateProducts =
    currentUser?.role === "seller" || currentUser?.role === "admin";

  const canEditProducts =
    currentUser?.role === "seller" || currentUser?.role === "admin";

  const canDeleteProducts = currentUser?.role === "admin";

  const loadProducts = async () => {
    if (!canViewProducts) return;

    try {
      const response = await api.get("/api/products");
      const list = unwrapApiData(response.data);
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка загрузки товаров");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm({
      ...form,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("price", form.price);

      if (form.image) {
        formData.append("image", form.image);
      }

      await api.post("/api/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({
        title: "",
        category: "",
        description: "",
        price: "",
        image: null,
      });

      setIsError(false);
      setMessage("Товар успешно создан");
      loadProducts();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка создания товара");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      setIsError(false);
      setMessage("Товар удалён");
      loadProducts();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.error || "Ошибка удаления товара");
    }
  };

  if (!currentUser) {
    return (
      <div className="page">
        <h1>Товары</h1>
        <p className="message-error">
          Для просмотра товаров необходимо войти в систему.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Товары</h1>
        <p>
          Текущая роль: <strong>{currentUser.role}</strong>
        </p>
      </div>

      {canCreateProducts && (
        <div className="section-card">
          <h2>Создать товар</h2>
          <form className="form" onSubmit={handleCreate}>
            <input
              name="title"
              placeholder="Название"
              value={form.title}
              onChange={handleChange}
            />
            <input
              name="category"
              placeholder="Категория"
              value={form.category}
              onChange={handleChange}
            />
            <input
              name="description"
              placeholder="Описание"
              value={form.description}
              onChange={handleChange}
            />
            <input
              name="price"
              type="number"
              placeholder="Цена"
              value={form.price}
              onChange={handleChange}
            />
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
            <button type="submit">Создать товар</button>
          </form>
        </div>
      )}

      {message && (
        <p className={isError ? "message-error" : "message-success"}>
          {message}
        </p>
      )}

      {!canViewProducts ? (
        <p className="message-error">
          У вашей роли нет доступа к просмотру товаров.
        </p>
      ) : (
        <div className="section-card">
          <h2>Список товаров</h2>
          <ul className="product-list">
            {products.map((product) => (
              <li key={product.id} className="product-item">
                <div className="product-left">
                  {product.image && (
                    <img
                      src={`http://localhost:3000${product.image}`}
                      alt={product.title}
                      className="product-thumb"
                    />
                  )}

                  <div className="product-main">
                    <strong>{product.title}</strong>
                    <span>{product.category}</span>
                    <span>{product.price} ₽</span>
                  </div>
                </div>

                <div className="actions">
                  <Link to={`/products/${product.id}`}>Открыть</Link>

                  {canEditProducts && (
                    <Link to={`/products/${product.id}/edit`}>
                      Редактировать
                    </Link>
                  )}

                  {canDeleteProducts && (
                    <button onClick={() => handleDelete(product.id)}>
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;