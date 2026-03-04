from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

"""
	Gestionnaire personnalisé pour le modèle User.
	Gère la création des utilisateurs standard et superutilisateurs.
"""
class UserManager(BaseUserManager):
    """
	Crée et retourne un utilisateur standard.

	@param email Adresse email de l'utilisateur (identifiant unique)
	@param password Mot de passe en clair (sera hashé)
	@param name Nom de l'utilisateur
	@param admin Indique si l'utilisateur est administrateur
	@return Instance User créée et sauvegardée
    """
    def create_user(self, email, password=None, name="", admin=False):
        if not email:
            raise ValueError("L'email est requis")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, admin=admin)
        user.set_password(password)
        user.save(using=self._db)
        return user

    """
	Crée et retourne un superutilisateur avec tous les privilèges.

	@param email Adresse email du superutilisateur
	@param password Mot de passe en clair
	@param name Nom du superutilisateur
	@return Instance User avec admin=True
    """
    def create_superuser(self, email, password, name=""):
        return self.create_user(email=email, password=password, name=name, admin=True)

"""
	Modèle utilisateur personnalisé utilisant l'email comme identifiant.
	Hérite de AbstractBaseUser et PermissionsMixin pour la gestion des permissions.
"""
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    """
	Retourne la représentation textuelle de l'utilisateur.

	@return Adresse email de l'utilisateur
    """
    def __str__(self):
        return self.email

    """
	Propriété indiquant si l'utilisateur est membre du staff.

	@return True si admin, False sinon
    """
    @property
    def is_staff(self):
        return self.admin

"""
	Modèle représentant une plante en vente.
	Contient nom, prix, description et stock.
"""
class Plant(models.Model):
    name        = models.CharField(max_length=100)
    price       = models.PositiveIntegerField()
    description = models.TextField()
    stock       = models.PositiveIntegerField()
    """
	Retourne le nom de la plante.

	@return Nom de la plante
    """
    def __str__(self): return self.name

"""
	Modèle représentant une commande client.
	Liée à un utilisateur, contient items et statut.
"""
class Order(models.Model):
    STATUS = [("confirmed","confirmed"),("pending","pending"),
              ("shipped","shipped"),("delivered","delivered")]
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    total_price = models.PositiveIntegerField(default=0)
    status      = models.CharField(max_length=10, choices=STATUS)
    created_at  = models.DateTimeField(auto_now_add=True)

"""
	Modèle représentant un item dans une commande.
	Lie une plante à une commande avec une quantité.
"""
class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    plant    = models.ForeignKey(Plant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
