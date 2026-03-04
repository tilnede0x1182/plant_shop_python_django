from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from plant_shop.forms import CustomUserCreationForm
from .models import User, Plant, Order, OrderItem
from django.contrib.auth import login
from django.contrib import messages
from unidecode import unidecode
import json

admin_required = user_passes_test(lambda u: u.is_authenticated and u.admin,
                                  login_url="/admin/")

"""
	Affiche la liste des plantes disponibles en stock.
	Triées par nom (sans accents) ordre alphabétique.

	@param request Requête HTTP
	@return Réponse HTML avec liste des plantes
"""
def plant_index(request):
    plants = sorted(
        Plant.objects.filter(stock__gt=0),
        key=lambda p: unidecode(p.name.lower())
    )
    return render(request, "plants/index.html", {"plants": plants})

"""
	Affiche le détail d'une plante spécifique.

	@param request Requête HTTP
	@param pk Identifiant de la plante
	@return Réponse HTML avec détails de la plante
"""
def plant_show(request, pk):
    return render(request, "plants/show.html", {"plant": get_object_or_404(Plant, pk=pk)})

"""
	Affiche le panier de l'utilisateur.

	@param request Requête HTTP
	@return Réponse HTML avec contenu du panier
"""
def cart_index(request):
    return render(request, "carts/index.html")

"""
	Gère l'inscription d'un nouvel utilisateur.
	Affiche le formulaire ou traite la soumission.

	@param request Requête HTTP (GET ou POST)
	@return Réponse HTML formulaire ou redirection vers profil
"""
def signup(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("profile")
    else:
        form = CustomUserCreationForm()
    return render(request, "users/signup.html", {"form": form})

"""
	Affiche l'historique des commandes de l'utilisateur connecté.
	Triées par date décroissante avec numéro d'affichage.

	@param request Requête HTTP
	@return Réponse HTML avec liste des commandes
"""
@login_required
def order_index(request):
    orders = list(request.user.orders.order_by("-created_at"))
    for i, order in enumerate(orders):
        order.display_number = len(orders) - i
    return render(request, "orders/index.html", {"orders": orders})

"""
	Affiche le formulaire de création de commande.

	@param request Requête HTTP
	@return Réponse HTML formulaire nouvelle commande
"""
@login_required
def order_new(request):
    return render(request, "orders/new.html")

"""
	Traite la création d'une nouvelle commande.
	Valide le stock, crée la commande et ses items.

	@param request Requête HTTP POST avec items JSON
	@return Redirection vers liste commandes ou panier si erreur
"""
@login_required
def order_create(request):
    items = json.loads(request.POST.get("items", "[]"))
    plants = {p.id: p for p in Plant.objects.filter(id__in=[i["plant_id"] for i in items])}

    for it in items:
        plant = plants.get(it["plant_id"])
        if not plant:
            messages.error(request, "Plante introuvable.")
            return redirect("cart_index")
        qty = int(it["quantity"])
        if qty > plant.stock:
            messages.error(request, f"Stock insuffisant pour {plant.name}.")
            return redirect("cart_index")

    order = Order.objects.create(user=request.user, status="confirmed")
    total = 0
    for it in items:
        plant = plants[it["plant_id"]]
        qty = int(it["quantity"])
        OrderItem.objects.create(order=order, plant=plant, quantity=qty)
        plant.stock -= qty
        plant.save(update_fields=["stock"])
        total += plant.price * qty

    order.total_price = total
    order.save(update_fields=["total_price"])
    messages.success(request, "Commande confirmée.")
    return redirect("/orders/?cleared=1")

"""
	Affiche le profil de l'utilisateur connecté.

	@param request Requête HTTP
	@return Réponse HTML avec informations utilisateur
"""
@login_required
def profile_view(request):
    return render(request, "users/profile.html", {"user": request.user})

"""
	Affiche la liste admin de toutes les plantes.

	@param request Requête HTTP
	@return Réponse HTML avec liste des plantes
"""
@admin_required
def admin_plants_index(request):
    plants = sorted(Plant.objects.all(), key=lambda p: unidecode(p.name.lower()))
    return render(request, "admin/plants/index.html", {"plants": plants})
"""
	Formulaire de création de plante (admin).

	@param request Requête HTTP (GET ou POST)
	@return Réponse HTML formulaire ou redirection
"""
@admin_required
def admin_plants_new(request):
    from django.forms import modelform_factory
    PlantForm = modelform_factory(Plant, fields="__all__")
    if request.method == "POST" and (form := PlantForm(request.POST)).is_valid():
        form.save(); messages.success(request, "Plante créée."); return redirect("admin_plants")
    return render(request, "admin/plants/new.html", {"form": PlantForm()})

"""
	Formulaire d'édition d'une plante (admin).

	@param request Requête HTTP (GET ou POST)
	@param pk Identifiant de la plante
	@return Réponse HTML formulaire ou redirection
"""
@admin_required
def admin_plants_edit(request, pk):
    plant = get_object_or_404(Plant, pk=pk)
    from django.forms import modelform_factory
    PlantForm = modelform_factory(Plant, fields="__all__")
    if request.method == "POST" and (form := PlantForm(request.POST, instance=plant)).is_valid():
        form.save(); messages.success(request, "Plante mise à jour."); return redirect("admin_plants")
    return render(request, "admin/plants/edit.html", {"form": PlantForm(instance=plant), "plant": plant})

"""
	Supprime une plante (admin, POST uniquement).

	@param request Requête HTTP POST
	@param pk Identifiant de la plante
	@return Redirection vers liste admin
"""
@admin_required
def admin_plants_delete(request, pk):
    plant = get_object_or_404(Plant, pk=pk)
    if request.method == "POST":
        plant.delete()
        messages.success(request, "Plante supprimée.")
        return redirect("admin_plants")
    return redirect("plants_index")

"""
	Affiche la liste admin de tous les utilisateurs.

	@param request Requête HTTP
	@return Réponse HTML avec liste des utilisateurs
"""
@admin_required
def admin_users_index(request):
    users = sorted(User.objects.all(), key=lambda u: (not u.admin, unidecode(u.name.lower())))
    return render(request, "admin/users/index.html", {"users": users})

"""
	Affiche le détail d'un utilisateur (admin).

	@param request Requête HTTP
	@param pk Identifiant de l'utilisateur
	@return Réponse HTML avec détails utilisateur
"""
@admin_required
def admin_users_show(request, pk):
    user = get_object_or_404(User, pk=pk)
    return render(request, "admin/users/show.html", {"user": user})

"""
	Formulaire de création d'utilisateur (admin).

	@param request Requête HTTP (GET ou POST)
	@return Réponse HTML formulaire ou redirection
"""
@admin_required
def admin_users_new(request):
    from django.forms import modelform_factory
    UserForm = modelform_factory(User, fields=["email", "name", "admin"])
    if request.method == "POST" and (form := UserForm(request.POST)).is_valid():
        user = form.save(commit=False)
        user.set_password("password")
        user.save()
        messages.success(request, "Utilisateur créé.")
        return redirect("admin_users")
    return render(request, "admin/users/new.html", {"form": UserForm()})

"""
	Formulaire d'édition d'un utilisateur (admin).

	@param request Requête HTTP (GET ou POST)
	@param pk Identifiant de l'utilisateur
	@return Réponse HTML formulaire ou redirection
"""
@admin_required
def admin_users_edit(request, pk):
    user = get_object_or_404(User, pk=pk)
    from django.forms import modelform_factory
    UserForm = modelform_factory(User, fields=["email", "name", "admin"])
    if request.method == "POST" and (form := UserForm(request.POST, instance=user)).is_valid():
        form.save()
        messages.success(request, "Utilisateur mis à jour.")
        return redirect("admin_users")
    return render(request, "admin/users/edit.html", {"form": UserForm(instance=user), "user": user})

"""
	Supprime un utilisateur (admin, POST uniquement).

	@param request Requête HTTP POST
	@param pk Identifiant de l'utilisateur
	@return Redirection vers liste admin
"""
@admin_required
def admin_users_delete(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        user.delete()
        messages.success(request, "Utilisateur supprimé.")
    return redirect("admin_users")

from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView as DjangoLoginView

"""
	Vue de connexion personnalisée avec logs de debug.
	Hérite de LoginView Django avec formulaire AuthenticationForm.
"""
class LoginView(DjangoLoginView):
    form_class = AuthenticationForm
    template_name = "users/login.html"

    """
	Appelée quand le formulaire de connexion est invalide.
	Log les erreurs pour debug.

	@param form Formulaire AuthenticationForm invalide
	@return Réponse HTTP avec erreurs
    """
    def form_invalid(self, form):
        print("Formulaire invalide")
        print("Erreurs : ", form.errors)
        return super().form_invalid(form)

    """
	Appelée quand le formulaire de connexion est valide.
	Log la connexion réussie pour debug.

	@param form Formulaire AuthenticationForm valide
	@return Réponse HTTP redirection
    """
    def form_valid(self, form):
        print("Connexion réussie pour :", form.get_user())
        return super().form_valid(form)
