import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function ProductDetailsPage() {
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

    loadProduct();
  }, [id]);

  return (
    <div className="page">
      <h1>Информация о товаре</h1>
      {message && <p>{message}</p>}
      {product && (
        <div className="card">
          <p><strong>ID:</strong> {product.id}</p>
          <p><strong>Название:</strong> {product.title}</p>
          <p><strong>Категория:</strong> {product.category}</p>
          <p><strong>Описание:</strong> {product.description}</p>
          <p><strong>Цена:</strong> {product.price}</p>
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;