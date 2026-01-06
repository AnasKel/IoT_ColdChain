from django.contrib import admin
from .models import Utilisateur, Dht11, Incident

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ("user", "nom", "prenom", "role", "telephone")
    list_filter = ("role",)
    search_fields = ("user__username", "nom", "prenom", "telephone")

@admin.register(Dht11)
class Dht11Admin(admin.ModelAdmin):
    list_display = ("dt", "temp", "hum")

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "id", "is_open", "start_at", "end_at",
        "counter", "min_temp", "max_temp"
    )
    list_filter = ("is_open",)
