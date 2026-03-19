import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function ProductDetailsPage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        setMessage(error.response?.data?.error || "Ошибка загрузки товара");
      }
    };

    if (currentUser) {
      loadProduct();
    }
  }, [id]);

  if (!currentUser) {
    return (
      <div className="page">
        <h1>Информация о товаре</h1>
        <p className="message-error">Необходимо войти в систему.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Информация о товаре</h1>
      </div>

      {message && <p className="message-error">{message}</p>}

      {product && (
        <div className="card">
          {product.image && (
            <img
              src={`http://localhost:3000${product.image}`}
              alt={product.title}
              className="product-image"
            />
          )}

          <p><strong>ID:</strong> {product.id}</p>
          <p><strong>Название:</strong> {product.title}</p>
          <p><strong>Категория:</strong> {product.category}</p>
          <p><strong>Описание:</strong> {product.description}</p>
          <p><strong>Цена:</strong> {product.price} ₽</p>
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;