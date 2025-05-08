// Copie littérale du application.js Rails
window.Cart = {
	get: function () {
		try {
			return JSON.parse(localStorage.getItem("cart") || "{}");
		} catch (t) {
			return {};
		}
	},
	save: function (t) {
		localStorage.setItem("cart", JSON.stringify(t));
	},
	add: function (t, e, r) {
		const a = this.get();
		a[t]
			? (a[t].quantity += 1)
			: (a[t] = { id: t, name: e, price: r, quantity: 1 }),
			this.save(a),
			this.updateNavbarCount();
	},
	update: function (t, e) {
		const r = parseInt(e);
		if (isNaN(r) || r < 1) return alert("Quantité invalide");
		const a = this.get();
		a[t] && ((a[t].quantity = r), this.save(a), this.render());
	},
	remove: function (t) {
		const e = this.get();
		delete e[t], this.save(e), this.render();
	},
  clear: function () {
    localStorage.removeItem("cart"),
    this.render(),
    this.updateNavbarCount();
  },
	updateNavbarCount: function () {
		const t = this.get();
		let e = 0;
		for (const r in t) e += t[r].quantity;
		const a = document.getElementById("cart-link");
		a && (a.innerText = "Mon Panier" + (e > 0 ? " (" + e + ")" : ""));
	},
	renderOrderReview: function (
		t = "order-review-container",
		e = "order-items-input"
	) {
		const r = document.getElementById(t),
			a = document.getElementById(e),
			n = this.get();
		let i = 0;
		if (!r || !a) return;
		if (0 === Object.keys(n).length)
			return (
				(r.innerHTML =
					'<p class="alert alert-warning">Votre panier est vide.</p>'),
				void (a.value = "")
			);
		let l =
			'<table class="table shadow"><thead class="table-dark"><tr><th>Plante</th><th>Quantité</th><th>Total</th></tr></thead><tbody>';
		const o = [];
		for (const t in n) {
			const e = n[t],
				r = e.quantity * e.price;
			i += r;
			const a =
				"order-review-container" === t
					? "cart-plant-link confirmed"
					: "cart-plant-link";
			(l +=
				"<tr><td><a href='/plants/" +
				e.id +
				"' class='" +
				a +
				"'>" +
				e.name +
				"</a></td><td>" +
				e.quantity +
				"</td><td>" +
				r +
				" €</td></tr>"),
				o.push({ plant_id: parseInt(t), quantity: e.quantity });
		}
		(l += "</tbody></table>"),
			(l += "<p class='text-end fw-bold'>Total : " + i + " €</p>"),
			(r.innerHTML = l),
			(a.value = JSON.stringify(o));
	},
	render: function () {
		const t = document.getElementById("cart-container");
		if (!t) return;
		const e = this.get();
		let r = "",
			a = 0;
		if (0 === Object.keys(e).length)
			r = "<p class='alert alert-info'>Votre panier est vide.</p>";
		else {
			r += `\n        <table class="table">\n          <thead class="table-dark">\n            <tr>\n              <th>Plante</th>\n              <th>Quantité</th>\n              <th>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n      `;
			for (const t in e) {
				const n = e[t];
				(a += n.price * n.quantity),
					(r +=
						`\n          <tr>\n            <td><a href="/plants/` +
						t +
						`" class="text-decoration-none">` +
						n.name +
						`</a></td>\n            <td>\n              <input type="number" min="1" class="form-control form-control-sm" style="max-width:44px;" value="` +
						n.quantity +
						`" onchange="Cart.update(` +
						t +
						`, this.value)">\n            </td>\n            <td>\n              <button class="btn btn-danger btn-sm" onclick="Cart.remove(` +
						t +
						`)">Retirer</button>\n            </td>\n          </tr>\n        `);
			}
			r +=
				`\n          </tbody>\n        </table>\n        <p class="text-end fw-bold">Total : ` +
				a +
				` €</p>\n        <div class="d-flex justify-content-between">\n          <button class="btn btn-outline-secondary btn-sm" onclick="Cart.clear()">Vider le panier</button>\n          <a href="/orders/new" class="btn btn-primary">Passer la commande</a>\n        </div>\n      `;
		}
		t.innerHTML = r;
	},
};
document.addEventListener("DOMContentLoaded", function () {
	Cart.renderOrderReview(), Cart.updateNavbarCount(), Cart.render();
});

document.addEventListener("DOMContentLoaded", function () {
  Cart.renderOrderReview();
  Cart.updateNavbarCount();
  Cart.render();
});
