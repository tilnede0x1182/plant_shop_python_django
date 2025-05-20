from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from plant_shop.models import Plant, Order, OrderItem
from faker import Faker
import random
import pathlib

# # Variables globales
NB_ADMINS = 3
NB_USERS = 20
NB_PLANTS = 30
NOMS_PLANTES = [
	"Rose", "Tulipe", "Lavande", "Orchidée", "Basilic", "Menthe", "Pivoine", "Tournesol",
	"Cactus (Echinopsis)", "Bambou", "Camomille (Matricaria recutita)", "Sauge (Salvia officinalis)",
	"Romarin (Rosmarinus officinalis)", "Thym (Thymus vulgaris)", "Laurier-rose (Nerium oleander)",
	"Aloe vera", "Jasmin (Jasminum officinale)", "Hortensia (Hydrangea macrophylla)",
	"Marguerite (Leucanthemum vulgare)", "Géranium (Pelargonium graveolens)", "Fuchsia (Fuchsia magellanica)",
	"Anémone (Anemone coronaria)", "Azalée (Rhododendron simsii)", "Chrysanthème (Chrysanthemum morifolium)",
	"Digitale pourpre (Digitalis purpurea)", "Glaïeul (Gladiolus hortulanus)", "Lys (Lilium candidum)",
	"Violette (Viola odorata)", "Muguet (Convallaria majalis)", "Iris (Iris germanica)",
	"Lavandin (Lavandula intermedia)", "Érable du Japon (Acer palmatum)", "Citronnelle (Cymbopogon citratus)",
	"Pin parasol (Pinus pinea)", "Cyprès (Cupressus sempervirens)", "Olivier (Olea europaea)",
	"Papyrus (Cyperus papyrus)", "Figuier (Ficus carica)", "Eucalyptus (Eucalyptus globulus)",
	"Acacia (Acacia dealbata)", "Bégonia (Begonia semperflorens)", "Calathea (Calathea ornata)",
	"Dieffenbachia (Dieffenbachia seguine)", "Ficus elastica", "Sansevieria (Sansevieria trifasciata)",
	"Philodendron (Philodendron scandens)", "Yucca (Yucca elephantipes)", "Zamioculcas zamiifolia",
	"Monstera deliciosa", "Pothos (Epipremnum aureum)", "Agave (Agave americana)", "Cactus raquette (Opuntia ficus-indica)",
	"Palmier-dattier (Phoenix dactylifera)", "Amaryllis (Hippeastrum hybridum)", "Bleuet (Centaurea cyanus)",
	"Cœur-de-Marie (Lamprocapnos spectabilis)", "Croton (Codiaeum variegatum)", "Dracaena (Dracaena marginata)",
	"Hosta (Hosta plantaginea)", "Lierre (Hedera helix)", "Mimosa (Acacia dealbata)"
]

# # Fonctions utilitaires
def get_nom_plante(index):
	noms_taille = len(NOMS_PLANTES)
	if NB_PLANTS > noms_taille:
		return f"{NOMS_PLANTES[index % noms_taille]} {index // noms_taille + 1}"
	return NOMS_PLANTES[index % noms_taille]

def reset_database():
	OrderItem.objects.all().delete()
	Order.objects.all().delete()
	Plant.objects.all().delete()
	User = get_user_model()
	User.objects.all().delete()

def creer_admins(fake):
	User = get_user_model()
	admins = []
	for index in range(NB_ADMINS):
		admins.append(User.objects.create_user(
			email=f"admin{index+1}@plantshop.com", password="password",
			admin=True, name=fake.name()))
	return admins

def creer_users(fake):
	User = get_user_model()
	users = []
	for index in range(NB_USERS):
		users.append(User.objects.create_user(
			email=fake.unique.email(), password="password",
			admin=False, name=fake.name()))
	return users

def ecrire_fichier_credentials(admins, users):
	with pathlib.Path("users.txt").open("w", encoding="utf-8") as fichier:
		fichier.write("Liste des utilisateurs générés :\n\n")
		fichier.write("Admins\n\n")
		for admin in admins:
			fichier.write(f"{admin.email} password\n")
		fichier.write("\nUtilisateurs normaux\n\n")
		for user in users:
			fichier.write(f"{user.email} password\n")

def creer_plantes(fake):
	plants = []
	for index in range(NB_PLANTS):
		plants.append(Plant.objects.create(
			name=get_nom_plante(index),
			price=random.randint(5, 50),
			description=fake.sentence(nb_words=10),
			stock=random.randint(5, 30)))
	return plants

def creer_commandes(admins, users, plants):
	for utilisateur in admins + users:
		commande = Order.objects.create(
			user=utilisateur, total_price=0,
			status=random.choice(["confirmed","pending","shipped","delivered"]))
		total = 0
		for _ in range(2):
			plante = random.choice(plants)
			quantite = min(random.randint(1, 5), plante.stock)
			if quantite == 0:
				continue
			OrderItem.objects.create(order=commande, plant=plante, quantity=quantite)
			plante.stock -= quantite
			plante.save(update_fields=["stock"])
			total += plante.price * quantite
		commande.total_price = total
		commande.save(update_fields=["total_price"])

# # Main Commande
class Command(BaseCommand):
	help = "Initialisation de la seed (équivalent seeds.rb)"

	def handle(self, *args, **opts):
		self.stdout.write("🔄 Initialisation de la seed...")
		fake = Faker("fr_FR")
		self.stdout.write("🧹 Suppression des données existantes...")
		reset_database()
		self.stdout.write("👤 Création des administrateurs...")
		admins = creer_admins(fake)
		self.stdout.write("👥 Création des utilisateurs...")
		users = creer_users(fake)
		ecrire_fichier_credentials(admins, users)
		self.stdout.write("🌱 Création des plantes...")
		plants = creer_plantes(fake)
		self.stdout.write("🧾 Création des commandes...")
		creer_commandes(admins, users, plants)
		self.stdout.write("✅ Seed terminée.")
