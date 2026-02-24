import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

export const getProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};

export const createProduct = async (product) => {
  const res = await api.post("/products", product);
  return res.data;
};

export const updateProduct = async (id, patch) => {
  const res = await api.patch(`/products/${id}`, patch);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};