from django.db import models
from django.contrib.auth.models import User

class Utilisateur(models.Model):
    ROLE_CHOICES = (
        ("ADMIN", "Administrateur"),
        ("OPERATEUR", "Opérateur"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    nom = models.CharField(max_length=60)
    prenom = models.CharField(max_length=60)
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField()

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="OPERATEUR"
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Dht11(models.Model):
    temp = models.FloatField(null=True, blank=True)
    hum = models.FloatField(null=True, blank=True)
    dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-dt"]

    def __str__(self):
        return f"{self.dt} -> T={self.temp}°C, H={self.hum}%"


class Incident(models.Model):
    start_at = models.DateTimeField(auto_now_add=True)
    end_at = models.DateTimeField(null=True, blank=True)
    is_open = models.BooleanField(default=True)

    counter = models.IntegerField(default=0)
    min_temp = models.FloatField(null=True, blank=True)
    max_temp = models.FloatField(default=0)

    # opérateurs (ACK + commentaires)
    op1_ack = models.BooleanField(default=False)
    op2_ack = models.BooleanField(default=False)
    op3_ack = models.BooleanField(default=False)

    op1_comment = models.TextField(blank=True)
    op2_comment = models.TextField(blank=True)
    op3_comment = models.TextField(blank=True)

    op1_saved_at = models.DateTimeField(null=True, blank=True)
    op2_saved_at = models.DateTimeField(null=True, blank=True)
    op3_saved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Incident #{self.id} ({'OPEN' if self.is_open else 'CLOSED'})"
