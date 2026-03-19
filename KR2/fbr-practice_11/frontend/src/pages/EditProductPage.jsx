import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

function EditProductPage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    image: null,
  });

  const [currentImage, setCurrentImage] = useState("");
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
          image: null,
        });
        setCurrentImage(response.data.image || "");
      } catch (error) {
        setMessage(error.response?.data?.error || "Ошибка загрузки товара");
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm({
      ...form,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
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

      await api.put(`/api/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/products");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка обновления товара");
    }
  };

  const canEdit =
    currentUser?.role === "seller" || currentUser?.role === "admin";

  if (!canEdit) {
    return (
      <div className="page">
        <h1>Редактирование товара</h1>
        <p className="message-error">
          У вас нет прав для редактирования товара.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Редактирование товара</h1>
      </div>

      <form className="form card-form" onSubmit={handleSubmit}>
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

        {currentImage && (
          <img
            src={`http://localhost:3000${currentImage}`}
            alt="Текущее изображение"
            className="product-image"
          />
        )}

        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={handleChange}
        />

        <button type="submit">Сохранить</button>
      </form>

      {message && <p className="message-error">{message}</p>}
    </div>
  );
}

export default EditProductPage;