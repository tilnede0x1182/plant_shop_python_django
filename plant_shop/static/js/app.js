window.Cart = {
  get: function () {
    try {
      return JSON.parse(localStorage.getItem("cart") || "{}");
    } catch (e) {
      return {};
    }
  },

  save: function (cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  },

  add: function (id, name, price, stock) {
    const cart = this.get();
    if (cart[id]) {
      if (cart[id].quantity < stock) {
        cart[id].quantity += 1;
      }
    } else {
      cart[id] = { id, name, price, quantity: 1, stock };
    }
    this.save(cart);
    this.updateNavbarCount();
  },

  update: function (id, value) {
    let qty = parseInt(value);
    if (isNaN(qty)) return;

    const cart = this.get();
    if (!cart[id]) return;

    const input = document.querySelector(`input[data-cart-id='${id}']`);
    const stock = parseInt(input.dataset.stock || "1");

    if (qty < 1) qty = 1;
    if (qty > stock) qty = stock;

    cart[id].quantity = qty;
    input.value = qty;
    this.save(cart);
    this.render();
    this.updateNavbarCount();
  },

  remove: function (id) {
    const cart = this.get();
    delete cart[id];
    this.save(cart);
    this.render();
  },

  clear: function () {
    localStorage.removeItem("cart");
    this.render();
    this.updateNavbarCount();
  },

  updateNavbarCount: function () {
    const cart = this.get();
    let count = 0;
    for (const id in cart) {
      count += cart[id].quantity;
    }
    const link = document.getElementById("cart-link");
    if (link) {
      link.innerText = "Mon Panier" + (count > 0 ? ` (${count})` : "");
    }
  },

  renderOrderReview: function (containerId = "order-review-container", inputId = "order-items-input") {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    const cart = this.get();
    let total = 0;

    if (!container || !input) return;

    if (Object.keys(cart).length === 0) {
      container.innerHTML = '<p class="alert alert-warning">Votre panier est vide.</p>';
      input.value = "";
      return;
    }

    let html = `
      <table class="table shadow">
        <thead class="table-dark">
          <tr>
            <th>Plante</th>
            <th>Quantité</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    const items = [];

    for (const id in cart) {
      const item = cart[id];
      const subtotal = item.quantity * item.price;
      total += subtotal;

      html += `
        <tr>
          <td><a href='/plants/${item.id}' class='cart-plant-link confirmed'>${item.name}</a></td>
          <td>${item.quantity}</td>
          <td>${subtotal} €</td>
        </tr>
      `;

      items.push({ plant_id: parseInt(id), quantity: item.quantity });
    }

    html += `
        </tbody>
      </table>
      <p class='text-end fw-bold'>Total : ${total} €</p>
    `;

    container.innerHTML = html;
    input.value = JSON.stringify(items);
  },

  render: function () {
    const container = document.getElementById("cart-container");
    if (!container) return;

    const cart = this.get();
    let html = "";
    let total = 0;

    if (Object.keys(cart).length === 0) {
      html = "<p class='alert alert-info'>Votre panier est vide.</p>";
    } else {
      html += `
        <table class="table">
          <thead class="table-dark">
            <tr>
              <th>Plante</th>
              <th>Quantité</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const id in cart) {
        const item = cart[id];
        total += item.price * item.quantity;

        html += `
          <tr>
            <td><a href="/plants/${id}" class="text-decoration-none">${item.name}</a></td>
            <td>
              <input
                type="number"
                min="1"
                class="form-control form-control-sm"
                style="max-width: 70px;"
                value="${item.quantity}"
                data-cart-id="${id}"
                data-stock="${item.stock}"
                oninput="Cart.delayedUpdate(${id}, this)"
                onblur="Cart.update(${id}, this.value)">
            </td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="Cart.remove(${id})">Retirer</button>
            </td>
          </tr>
        `;
      }

      html += `
          </tbody>
        </table>
        <p class="text-end fw-bold">Total : ${total} €</p>
        <div class="d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" onclick="Cart.clear()">Vider le panier</button>
          <a href="/orders/new" class="btn btn-primary">Passer la commande</a>
        </div>
      `;
    }

    container.innerHTML = html;
  },
};

document.addEventListener("DOMContentLoaded", function () {
  Cart.renderOrderReview();
  Cart.updateNavbarCount();
  Cart.render();
});
