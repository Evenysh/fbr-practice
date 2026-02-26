import { useEffect, useState } from "react";
import "./App.scss";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./api";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  stock: "",
};

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false); // Для отслеживания редактирования
  const [currentProductId, setCurrentProductId] = useState(null); // ID редактируемого товара

  const load = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreate = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    await createProduct(payload);
    setForm(emptyForm);
    await load();
  };

  const onIncStock = async (id, currentStock) => {
    await updateProduct(id, { stock: currentStock + 1 });
    await load();
  };

  const onDecStock = async (id, currentStock) => {
    const next = Math.max(0, currentStock - 1);
    await updateProduct(id, { stock: next });
    await load();
  };

  const onDelete = async (id) => {
    await deleteProduct(id);
    await load();
  };

  const onEdit = (product) => {
    setIsEditing(true);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
    });
    setCurrentProductId(product.id);
  };

  const onSave = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    await updateProduct(currentProductId, payload);
    setIsEditing(false);
    setForm(emptyForm);
    await load();
  };

  return (
    <div className="page">
      <header className="header">
        <h1>LEGO Store</h1>
      </header>

      <section className="card formCard">
        <h2>{isEditing ? "Редактировать товар" : "Добавить товар"}</h2>

        <form className="form" onSubmit={isEditing ? onSave : onCreate}>
          <label>
            Название
            <input name="name" value={form.name} onChange={onChange} required />
          </label>

          <label>
            Категория
            <input
              name="category"
              value={form.category}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Описание
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              required
            />
          </label>

          <div className="row">
            <label>
              Цена
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={onChange}
                required
              />
            </label>

            <label>
              На складе
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <button className="btn" type="submit">
            {isEditing ? "Сохранить изменения" : "Добавить"}
          </button>
        </form>
      </section>

      <section className="grid">
        {products.map((p) => (
          <article className="card product" key={p.id}>
            <div className="top">
              <h3>{p.name}</h3>
              <span className="badge">{p.category}</span>
            </div>

            <p className="desc">{p.description}</p>

            <div className="meta">
              <div>
                <div className="label">Цена</div>
                <div className="value">{p.price} ₽</div>
              </div>
              <div>
                <div className="label">Склад</div>
                <div className="value">{p.stock}</div>
              </div>
            </div>

            <div className="actions">
              <button className="btn ghost" onClick={() => onDecStock(p.id, p.stock)}>
                -1
              </button>
              <button className="btn ghost" onClick={() => onIncStock(p.id, p.stock)}>
                +1
              </button>
              <button className="btn danger" onClick={() => onDelete(p.id)}>
                Удалить
              </button>
              <button className="btn edit" onClick={() => onEdit(p)}>
                Редактировать
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default App;