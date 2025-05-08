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

def plant_index(request):
    return render(request, "plants/index.html", {"plants": Plant.objects.order_by("name")})

def plant_show(request, pk):
    return render(request, "plants/show.html", {"plant": get_object_or_404(Plant, pk=pk)})

def cart_index(request):
    return render(request, "carts/index.html")

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

@login_required
def order_index(request):
    orders = list(request.user.orders.order_by("-created_at"))
    for i, order in enumerate(orders):
        order.display_number = len(orders) - i
    return render(request, "orders/index.html", {"orders": orders})

@login_required
def order_new(request):
    return render(request, "orders/new.html")

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

@login_required
def profile_view(request):
    return render(request, "users/profile.html", {"user": request.user})

@admin_required
def admin_plants_index(request):
    plants = sorted(Plant.objects.all(), key=lambda p: unidecode(p.name.lower()))
    return render(request, "admin/plants/index.html", {"plants": plants})
@admin_required
def admin_plants_new(request):
    from django.forms import modelform_factory
    PlantForm = modelform_factory(Plant, fields="__all__")
    if request.method == "POST" and (form := PlantForm(request.POST)).is_valid():
        form.save(); messages.success(request, "Plante créée."); return redirect("admin_plants")
    return render(request, "admin/plants/new.html", {"form": PlantForm()})

@admin_required
def admin_plants_edit(request, pk):
    plant = get_object_or_404(Plant, pk=pk)
    from django.forms import modelform_factory
    PlantForm = modelform_factory(Plant, fields="__all__")
    if request.method == "POST" and (form := PlantForm(request.POST, instance=plant)).is_valid():
        form.save(); messages.success(request, "Plante mise à jour."); return redirect("admin_plants")
    return render(request, "admin/plants/edit.html", {"form": PlantForm(instance=plant), "plant": plant})

@admin_required
def admin_plants_delete(request, pk):
    plant = get_object_or_404(Plant, pk=pk)
    if request.method == "POST":
        plant.delete()
        messages.success(request, "Plante supprimée.")
        return redirect("admin_plants")
    return redirect("plants_index")

@admin_required
def admin_users_index(request):
    users = sorted(User.objects.all(), key=lambda u: (not u.admin, unidecode(u.name.lower())))
    return render(request, "admin/users/index.html", {"users": users})

@admin_required
def admin_users_show(request, pk):
    user = get_object_or_404(User, pk=pk)
    return render(request, "admin/users/show.html", {"user": user})

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

@admin_required
def admin_users_delete(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        user.delete()
        messages.success(request, "Utilisateur supprimé.")
    return redirect("admin_users")

from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView as DjangoLoginView

class LoginView(DjangoLoginView):
    form_class = AuthenticationForm
    template_name = "users/login.html"

    def form_invalid(self, form):
        print("Formulaire invalide")
        print("Erreurs : ", form.errors)
        return super().form_invalid(form)

    def form_valid(self, form):
        print("Connexion réussie pour :", form.get_user())
        return super().form_valid(form)
