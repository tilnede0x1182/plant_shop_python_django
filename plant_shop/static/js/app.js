// # Classe Cart

class Cart {
	// ## Fonctions de persistance

	/**
	 * Récupère l'état du panier depuis le localStorage.
	 * Gère les erreurs de parsing JSON.
	 * @returns {Object} Objet représentant le panier
	 */
	static get() {
		try {
			const rawCart = localStorage.getItem("cart") || "{}";
			return JSON.parse(rawCart);
		} catch (jsonException) {
			return {};
		}
	}

	/**
	 * Enregistre l'état du panier dans le localStorage.
	 * @param {Object} currentCart Objet contenant les articles du panier
	 */
	static save(currentCart) {
		localStorage.setItem("cart", JSON.stringify(currentCart));
	}

	/**
	 * Sauvegarde l'état et met à jour la barre de navigation.
	 * @param {Object} currentCart Objet représentant le panier
	 */
	static #commit(currentCart) {
		this.save(currentCart);
		this.updateNavbarCount();
	}

	// ## Fonctions de modification

	/**
	 * Ajoute un produit dans le panier ou incrémente sa quantité.
	 * Affiche une alerte si le stock est dépassé.
	 * @param {number} productId Identifiant du produit
	 * @param {string} productName Nom du produit
	 * @param {number} unitPrice Prix unitaire du produit
	 * @param {number} maxStock Quantité maximale autorisée
	 */
	static add(productId, productName, unitPrice, maxStock) {
		const currentCart = this.get();
		if (!currentCart[productId]) {
			currentCart[productId] = {
				id: productId,
				name: productName,
				price: unitPrice,
				quantity: 0,
				stock: maxStock,
			};
		}
		const item = currentCart[productId];
		if (item.quantity >= item.stock) {
			showStockAlert(productName, maxStock);
			setTimeout(() => {
				item.quantity = maxStock;
				Cart.#commit(currentCart);
			}, 300);
		} else {
			item.quantity++;
			Cart.#commit(currentCart);
		}
	}

	/**
	 * Met à jour la quantité d’un article.
	 * Force les bornes entre 1 et stock maximum.
	 * @param {number} productId Identifiant du produit
	 * @param {number} newValue Nouvelle quantité saisie
	 */
	static update(productId, newValue) {
		let quantity = parseInt(newValue);
		if (isNaN(quantity)) return;

		const currentCart = this.get();
		if (!currentCart[productId]) return;

		const inputField = document.querySelector(
			`input[data-cart-id='${productId}']`
		);
		const stockLimit = parseInt(inputField.dataset.stock || "1");

		if (quantity < 1) quantity = 1;
		if (quantity > stockLimit) quantity = stockLimit;

		currentCart[productId].quantity = quantity;
		inputField.value = quantity;
		this.save(currentCart);
		this.render();
		this.updateNavbarCount();
	}

	/**
	 * Déclenche une mise à jour différée (300ms).
	 * Empêche la surcharge par saisie rapide.
	 * @param {number} productId Identifiant du produit
	 * @param {HTMLInputElement} inputField Champ input concerné
	 */
	static delayedUpdate(productId, inputField) {
		clearTimeout(inputField._cartTimer);
		inputField._cartTimer = setTimeout(() => {
			Cart.update(productId, inputField.value);
		}, 300);
	}

	/**
	 * Supprime un article du panier.
	 * @param {number} productId Identifiant de l’article à supprimer
	 */
	static remove(productId) {
		const currentCart = this.get();
		delete currentCart[productId];
		this.save(currentCart);
		this.render();
	}

	/**
	 * Vide totalement le panier.
	 * Supprime la clé "cart" du localStorage.
	 */
	static clear() {
		localStorage.removeItem("cart");
		this.render();
		this.updateNavbarCount();
	}

	// ## Fonctions d'affichage

	/**
	 * Met à jour l'affichage du compteur de panier dans la navbar.
	 * Calcule la somme des quantités.
	 */
	static updateNavbarCount() {
		const currentCart = this.get();
		let totalCount = 0;
		for (const productId in currentCart) {
			totalCount += currentCart[productId].quantity;
		}
		const cartLink = document.getElementById("cart-link");
		if (cartLink) {
			cartLink.textContent =
				"Mon Panier" + (totalCount > 0 ? ` (${totalCount})` : "");
		}
	}

	/**
	 * Affiche le résumé de commande dans le conteneur cible.
	 * Génère aussi un input caché avec le détail des articles.
	 * @param {string} containerId ID du conteneur d'affichage
	 * @param {string} inputId ID du champ caché
	 */
	static renderOrderReview(
		containerId = "order-review-container",
		inputId = "order-items-input"
	) {
		const container = document.getElementById(containerId);
		const hiddenInput = document.getElementById(inputId);
		const currentCart = this.get();
		if (!container || !hiddenInput) return;

		container.innerHTML = "";
		if (Object.keys(currentCart).length === 0) {
			Cart.#displayEmptyMessage(container, "Votre panier est vide.");
			hiddenInput.value = "";
			return;
		}

		const { tableElement, totalAmount, orderItems } =
			Cart.#buildOrderReviewTable(currentCart);
		container.appendChild(tableElement);

		const totalParagraph = document.createElement("p");
		totalParagraph.className = "text-end fw-bold";
		totalParagraph.textContent = `Total : ${totalAmount} €`;
		container.appendChild(totalParagraph);

		hiddenInput.value = JSON.stringify(orderItems);
	}

	/**
	 * Affiche l'état du panier avec les boutons d'action.
	 * Recharge le DOM associé au panier.
	 */
	static render() {
		const container = document.getElementById("cart-container");
		if (!container) return;

		const currentCart = this.get();
		container.innerHTML = "";
		if (Object.keys(currentCart).length === 0) {
			Cart.#displayEmptyMessage(container, "Votre panier est vide.");
			return;
		}

		const { tableElement, totalAmount } = Cart.#buildCartTable(currentCart);
		container.appendChild(tableElement);

		const totalParagraph = document.createElement("p");
		totalParagraph.className = "text-end fw-bold";
		totalParagraph.textContent = `Total : ${totalAmount} €`;
		container.appendChild(totalParagraph);

		const controlGroup = Cart.#buildControls();
		container.appendChild(controlGroup);
	}

	// ## Fonctions internes privées

	/**
	 * Affiche un message si le panier est vide.
	 * @param {HTMLElement} container Conteneur d'affichage
	 * @param {string} messageText Texte à afficher
	 */
	static #displayEmptyMessage(container, messageText) {
		const message = document.createElement("p");
		message.className = "alert alert-info";
		message.textContent = messageText;
		container.appendChild(message);
	}

	/**
	 * Construit un tableau HTML pour l’aperçu de commande.
	 * @param {Object} currentCart Panier actuel
	 * @returns {Object} Table, total et liste de commande
	 */
	static #buildOrderReviewTable(currentCart) {
		let totalAmount = 0;
		const tableElement = document.createElement("table");
		tableElement.className = "table shadow";

		const headerRow = ["Plante", "Quantité", "Total"];
		const thead = document.createElement("thead");
		thead.className = "table-dark";
		const trHead = document.createElement("tr");
		headerRow.forEach((text) => {
			const th = document.createElement("th");
			th.textContent = text;
			trHead.appendChild(th);
		});
		thead.appendChild(trHead);
		tableElement.appendChild(thead);

		const tbody = document.createElement("tbody");
		const orderItems = [];

		for (const productId in currentCart) {
			const item = currentCart[productId];
			const subtotal = item.quantity * item.price;
			totalAmount += subtotal;

			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td><a href="/plants/${item.id}" class="cart-plant-link confirmed">${item.name}</a></td>
				<td>${item.quantity}</td>
				<td>${subtotal} €</td>
			`;
			tbody.appendChild(tr);
			orderItems.push({
				plant_id: parseInt(productId),
				quantity: item.quantity,
			});
		}

		tableElement.appendChild(tbody);
		return { tableElement, totalAmount, orderItems };
	}

	/**
	 * Construit le tableau du panier pour l'affichage principal.
	 * @param {Object} currentCart
	 * @returns {Object} Table HTML + total
	 */
	static #buildCartTable(currentCart) {
		let totalAmount = 0;
		const tableElement = document.createElement("table");
		tableElement.className = "table";

		const headerRow = ["Plante", "Quantité", "Action"];
		const thead = document.createElement("thead");
		thead.className = "table-dark";
		const trHead = document.createElement("tr");
		headerRow.forEach((text) => {
			const th = document.createElement("th");
			th.textContent = text;
			trHead.appendChild(th);
		});
		thead.appendChild(trHead);
		tableElement.appendChild(thead);

		const tbody = document.createElement("tbody");

		for (const productId in currentCart) {
			const item = currentCart[productId];
			totalAmount += item.price * item.quantity;

			const inputField = document.createElement("input");
			inputField.type = "number";
			inputField.min = "1";
			inputField.className = "form-control form-control-sm";
			inputField.style.maxWidth = "70px";
			inputField.value = item.quantity;
			inputField.dataset.cartId = productId;
			inputField.dataset.stock = item.stock;
			inputField.addEventListener("input", () =>
				Cart.delayedUpdate(productId, inputField)
			);
			inputField.addEventListener("blur", () =>
				Cart.update(productId, inputField.value)
			);

			const removeBtn = document.createElement("button");
			removeBtn.className = "btn btn-danger btn-sm";
			removeBtn.textContent = "Retirer";
			removeBtn.addEventListener("click", () => {
				Cart.remove(productId);
        this.updateNavbarCount();
			});

			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td><a href="/plants/${productId}" class="text-decoration-none">${item.name}</a></td>
			`;
			const tdInput = document.createElement("td");
			tdInput.appendChild(inputField);
			const tdButton = document.createElement("td");
			tdButton.appendChild(removeBtn);

			tr.appendChild(tdInput);
			tr.appendChild(tdButton);
			tbody.appendChild(tr);
		}

		tableElement.appendChild(tbody);
		return { tableElement, totalAmount };
	}

	/**
	 * Construit les boutons de contrôle sous le panier.
	 * @returns {HTMLElement} Groupe de boutons
	 */
	static #buildControls() {
		const controlsDiv = document.createElement("div");
		controlsDiv.className = "d-flex justify-content-between";

		const clearBtn = document.createElement("button");
		clearBtn.className = "btn btn-outline-secondary btn-sm";
		clearBtn.textContent = "Vider le panier";
		clearBtn.addEventListener("click", () => Cart.clear());

		const orderBtn = document.createElement("a");
		orderBtn.href = "/orders/new";
		orderBtn.className = "btn btn-primary";
		orderBtn.textContent = "Passer la commande";

		controlsDiv.appendChild(clearBtn);
		controlsDiv.appendChild(orderBtn);

		return controlsDiv;
	}
}

// # Fonctions utilitaires

/**
 * Affiche une alerte de stock insuffisant.
 * @param {string} plantName Nom de la plante
 * @param {number} stockLeft Quantité restante
 */
function showStockAlert(plantName, stockLeft) {
	const alertBox = document.createElement("div");
	alertBox.className =
		"alert alert-warning fade position-absolute top-0 start-50 translate-middle-x mt-3 shadow";
	alertBox.role = "alert";
	alertBox.style.zIndex = "1055";
	alertBox.style.maxWidth = "600px";
	alertBox.style.pointerEvents = "none";

	alertBox.appendChild(
		document.createTextNode("Stock insuffisant pour pour cette plante (")
	);
	const strongText = document.createElement("strong");
	strongText.textContent = plantName;
	alertBox.appendChild(strongText);
	alertBox.appendChild(
		document.createTextNode(`), actuellement, il en reste ${stockLeft}.`)
	);

	document.body.appendChild(alertBox);
	setTimeout(() => alertBox.classList.add("show"), 10);
	setTimeout(() => {
		alertBox.classList.remove("show");
		alertBox.classList.add("fade");
		setTimeout(() => alertBox.remove(), 300);
	}, 3000);
}

// # Lancement du programme

/**
 * Initialise l’affichage du panier au chargement.
 */
document.addEventListener("DOMContentLoaded", function () {
	Cart.renderOrderReview();
	Cart.updateNavbarCount();
	Cart.render();
});
