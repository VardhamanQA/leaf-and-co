const PRODUCTS = [
  { id: "monstera", name: "Monstera", emoji: "🌿", category: "Indoor", price: 24.0, inStock: true },
  { id: "snake-plant", name: "Snake Plant", emoji: "🪴", category: "Indoor", price: 18.5, inStock: true },
  { id: "lavender", name: "Lavender", emoji: "💐", category: "Outdoor", price: 12.0, inStock: true },
  { id: "rosemary", name: "Rosemary", emoji: "🌱", category: "Outdoor", price: 9.5, inStock: true },
  { id: "aloe-vera", name: "Aloe Vera", emoji: "🌵", category: "Succulents", price: 11.0, inStock: true },
  { id: "jade-plant", name: "Jade Plant", emoji: "🍀", category: "Succulents", price: 15.0, inStock: false }
];

const $ = (id) => document.getElementById(id);
const money = (n) => "$" + n.toFixed(2);
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
}
const getCart = () => load("cart", []).filter((i) => findProduct(i.id));
const cartTotal = (cart) => cart.reduce((s, i) => s + findProduct(i.id).price * i.qty, 0);

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCount();
}

function updateCount() {
  $("cart-count").textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

/* Shop */
function initShop() {
  $("products").innerHTML = PRODUCTS.map((p) => `
    <article class="card" id="card-${p.id}" data-category="${p.category}">
      <div class="emoji">${p.emoji}</div>
      <h2>${p.name}</h2>
      <p class="muted">${p.category}</p>
      <p class="price" id="price-${p.id}">${money(p.price)}</p>
      ${p.inStock ? "" : `<p class="stock" id="stock-${p.id}">Out of stock</p>`}
      <button type="button" id="add-${p.id}"${p.inStock ? "" : " disabled"}>Add to cart</button>
    </article>`).join("");

  $("products").addEventListener("click", (e) => {
    if (!e.target.id.startsWith("add-")) return;
    const id = e.target.id.slice(4);
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) item.qty += 1; else cart.push({ id, qty: 1 });
    saveCart(cart);
  });

  $("category").addEventListener("change", (e) => {
    document.querySelectorAll("#products .card").forEach((card) => {
      card.hidden = e.target.value !== "All" && card.dataset.category !== e.target.value;
    });
  });
}

/* Cart */
function renderCart() {
  const cart = getCart();
  $("cart-items").innerHTML = cart.map((i) => {
    const p = findProduct(i.id);
    return `
    <article class="card cart-row" id="item-${p.id}">
      <h2>${p.emoji} ${p.name}</h2>
      <p>Price: <span id="price-${p.id}">${money(p.price)}</span></p>
      <div class="qty">
        <button type="button" class="secondary" id="minus-${p.id}">-</button>
        <span>Quantity: <strong id="qty-${p.id}">${i.qty}</strong></span>
        <button type="button" class="secondary" id="plus-${p.id}">+</button>
        <button type="button" class="secondary" id="remove-${p.id}">Remove</button>
      </div>
      <p>Line total: <strong id="line-total-${p.id}">${money(p.price * i.qty)}</strong></p>
    </article>`;
  }).join("");
  $("empty-msg").hidden = cart.length > 0;
  $("cart-summary").hidden = cart.length === 0;
  $("subtotal").textContent = money(cartTotal(cart));
}

function initCart() {
  renderCart();
  $("cart-items").addEventListener("click", (e) => {
    const match = e.target.id.match(/^(plus|minus|remove)-(.+)$/);
    if (!match) return;
    const [, action, id] = match;
    let cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (action === "plus") item.qty += 1;
    if (action === "minus") item.qty -= 1;
    if (action === "remove") item.qty = 0;
    cart = cart.filter((i) => i.qty > 0);
    saveCart(cart);
    renderCart();
  });
  $("checkout-btn").addEventListener("click", () => { location.href = "checkout.html"; });
}

/* Checkout */
function initCheckout() {
  if (getCart().length === 0) { location.replace("cart.html"); return; }
  $("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const required = { name: "Full name is required", email: "Email is required", address: "Address is required" };
    let valid = true;
    for (const field in required) {
      const value = $(field).value.trim();
      let error = value ? "" : required[field];
      if (field === "email" && value && !(value.includes("@") && value.includes("."))) error = "Enter a valid email";
      $(field + "-error").textContent = error;
      if (error) valid = false;
    }
    if (!valid) return;

    const cart = getCart();
    const order = {
      number: String(Math.floor(100000 + Math.random() * 900000)),
      items: cart.map((i) => {
        const p = findProduct(i.id);
        return { id: p.id, name: p.name, price: p.price, qty: i.qty };
      }),
      total: cartTotal(cart)
    };
    localStorage.setItem("lastOrder", JSON.stringify(order));
    localStorage.removeItem("cart");
    location.href = "confirmation.html";
  });
}

/* Confirmation */
function initConfirmation() {
  const order = load("lastOrder", null);
  if (!order) { location.replace("index.html"); return; }
  $("order-number").textContent = order.number;
  $("order-items").innerHTML = order.items.map((i) =>
    `<li id="order-item-${i.id}">${i.name} × ${i.qty} — ${money(i.price * i.qty)}</li>`).join("");
  $("order-total").textContent = money(order.total);
}

updateCount();
const page = document.body.dataset.page;
if (page === "shop") initShop();
if (page === "cart") initCart();
if (page === "checkout") initCheckout();
if (page === "confirmation") initConfirmation();
