import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
  });

  const loadProducts = async () => {
    try {
      const response = await api.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      setMessage("Ошибка загрузки товаров");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/products", {
        ...form,
        price: Number(form.price),
      });

      setForm({
        title: "",
        category: "",
        description: "",
        price: "",
      });

      setMessage("Товар создан");
      loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка создания товара");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка удаления товара");
    }
  };

  return (
    <div className="page">
      <h1>Товары</h1>

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
        <button type="submit">Создать товар</button>
      </form>

      {message && <p>{message}</p>}

      <ul className="product-list">
        {products.map((product) => (
          <li key={product.id} className="product-item">
            <div>
              <strong>{product.title}</strong> — {product.price}
            </div>
            <div className="actions">
              <Link to={`/products/${product.id}`}>Открыть</Link>
              <Link to={`/products/${product.id}/edit`}>Редактировать</Link>
              <button onClick={() => handleDelete(product.id)}>Удалить</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsPage;