from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

"""
	Backend d'authentification personnalisé utilisant l'email.
	Permet la connexion avec email au lieu du username Django standard.
"""
class EmailBackend(ModelBackend):
    """
	Authentifie un utilisateur par email et mot de passe.

	@param request Requête HTTP
	@param username Email de l'utilisateur (paramètre nommé username pour compatibilité)
	@param password Mot de passe en clair
	@param kwargs Arguments additionnels ignorés
	@return Instance User si authentification réussie, None sinon
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=username)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
