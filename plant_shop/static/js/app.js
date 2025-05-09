/**
 * Classe représentant un panier client.
 */
class Cart {
  /**
   * Récupère le panier depuis le localStorage.
   * @returns {Object} Panier
   */
  static get() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "{}");
    } catch (e) {
      return {};
    }
  }

  /**
   * Sauvegarde le panier dans le localStorage.
   * @param {Object} cart Panier à sauvegarder
   */
  static save(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  /**
   * Ajoute un article au panier.
   * @param {number} id Identifiant de l’article
   * @param {string} name Nom de l’article
   * @param {number} price Prix de l’article
   * @param {number} stock Stock disponible
   */
  static add(id, name, price, stock) {
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
  }

  /**
   * Met à jour la quantité d’un article.
   * @param {number} id Identifiant de l’article
   * @param {number} value Quantité saisie
   */
  static update(id, value) {
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
  }

  /**
   * Met à jour avec un délai pour éviter le blocage de la saisie.
   * @param {number} id Identifiant article
   * @param {HTMLInputElement} input Champ input de quantité
   */
  static delayedUpdate(id, input) {
    clearTimeout(input._cartTimer);
    input._cartTimer = setTimeout(() => {
      Cart.update(id, input.value);
    }, 300);
  }

  /**
   * Supprime un article du panier.
   * @param {number} id Identifiant de l’article
   */
  static remove(id) {
    const cart = this.get();
    delete cart[id];
    this.save(cart);
    this.render();
  }

  /**
   * Vide entièrement le panier.
   */
  static clear() {
    localStorage.removeItem("cart");
    this.render();
    this.updateNavbarCount();
  }

  /**
   * Met à jour le compteur du panier dans la barre de navigation.
   */
  static updateNavbarCount() {
    const cart = this.get();
    let count = 0;
    for (const id in cart) {
      count += cart[id].quantity;
    }
    const link = document.getElementById("cart-link");
    if (link) {
      link.textContent = "Mon Panier" + (count > 0 ? ` (${count})` : "");
    }
  }

  /**
   * Affiche le résumé de commande.
   * @param {string} containerId ID du conteneur
   * @param {string} inputId ID du champ caché de données
   */
  static renderOrderReview(containerId = "order-review-container", inputId = "order-items-input") {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    const cart = this.get();
    let total = 0;

    if (!container || !input) return;

    container.innerHTML = "";

    if (Object.keys(cart).length === 0) {
      const msg = document.createElement("p");
      msg.className = "alert alert-warning";
      msg.textContent = "Votre panier est vide.";
      container.appendChild(msg);
      input.value = "";
      return;
    }

    const table = document.createElement("table");
    table.className = "table shadow";

    const thead = document.createElement("thead");
    thead.className = "table-dark";
    const headerRow = document.createElement("tr");
    ["Plante", "Quantité", "Total"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const items = [];

    for (const id in cart) {
      const item = cart[id];
      const subtotal = item.quantity * item.price;
      total += subtotal;

      const row = document.createElement("tr");

      const td1 = document.createElement("td");
      const link = document.createElement("a");
      link.href = `/plants/${item.id}`;
      link.className = "cart-plant-link confirmed";
      link.textContent = item.name;
      td1.appendChild(link);

      const td2 = document.createElement("td");
      td2.textContent = item.quantity;

      const td3 = document.createElement("td");
      td3.textContent = `${subtotal} €`;

      row.appendChild(td1);
      row.appendChild(td2);
      row.appendChild(td3);
      tbody.appendChild(row);

      items.push({ plant_id: parseInt(id), quantity: item.quantity });
    }

    table.appendChild(tbody);
    container.appendChild(table);

    const totalP = document.createElement("p");
    totalP.className = "text-end fw-bold";
    totalP.textContent = `Total : ${total} €`;
    container.appendChild(totalP);

    input.value = JSON.stringify(items);
  }

  /**
   * Affiche le contenu du panier dans l’interface.
   */
  static render() {
    const container = document.getElementById("cart-container");
    if (!container) return;

    const cart = this.get();
    container.innerHTML = "";
    let total = 0;

    if (Object.keys(cart).length === 0) {
      const msg = document.createElement("p");
      msg.className = "alert alert-info";
      msg.textContent = "Votre panier est vide.";
      container.appendChild(msg);
      return;
    }

    const table = document.createElement("table");
    table.className = "table";

    const thead = document.createElement("thead");
    thead.className = "table-dark";
    const headerRow = document.createElement("tr");
    ["Plante", "Quantité", "Action"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const id in cart) {
      const item = cart[id];
      total += item.price * item.quantity;

      const row = document.createElement("tr");

      const td1 = document.createElement("td");
      const link = document.createElement("a");
      link.href = `/plants/${id}`;
      link.className = "text-decoration-none";
      link.textContent = item.name;
      td1.appendChild(link);

      const td2 = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.className = "form-control form-control-sm";
      input.style.maxWidth = "70px";
      input.value = item.quantity;
      input.dataset.cartId = id;
      input.dataset.stock = item.stock;
      input.addEventListener("input", () => Cart.delayedUpdate(id, input));
      input.addEventListener("blur", () => Cart.update(id, input.value));
      td2.appendChild(input);

      const td3 = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "btn btn-danger btn-sm";
      btn.textContent = "Retirer";
      btn.addEventListener("click", () => Cart.remove(id));
      td3.appendChild(btn);

      row.appendChild(td1);
      row.appendChild(td2);
      row.appendChild(td3);
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    const totalP = document.createElement("p");
    totalP.className = "text-end fw-bold";
    totalP.textContent = `Total : ${total} €`;
    container.appendChild(totalP);

    const controls = document.createElement("div");
    controls.className = "d-flex justify-content-between";

    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-outline-secondary btn-sm";
    clearBtn.textContent = "Vider le panier";
    clearBtn.addEventListener("click", () => Cart.clear());

    const orderLink = document.createElement("a");
    orderLink.href = "/orders/new";
    orderLink.className = "btn btn-primary";
    orderLink.textContent = "Passer la commande";

    controls.appendChild(clearBtn);
    controls.appendChild(orderLink);

    container.appendChild(controls);
  }
}

// Appel au chargement de la page
document.addEventListener("DOMContentLoaded", function () {
  Cart.renderOrderReview();
  Cart.updateNavbarCount();
  Cart.render();
});
