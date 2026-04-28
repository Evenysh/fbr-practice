import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setForm({
          title: response.data.title,
          category: response.data.category,
          description: response.data.description,
          price: response.data.price,
        });
      } catch (error) {
        setMessage(error.response?.data?.error || "Ошибка загрузки товара");
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/products/${id}`, {
        ...form,
        price: Number(form.price),
      });

      navigate("/products");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка обновления товара");
    }
  };

  return (
    <div className="page">
      <h1>Редактирование товара</h1>
      <form className="form" onSubmit={handleSubmit}>
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
        <button type="submit">Сохранить</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default EditProductPage;