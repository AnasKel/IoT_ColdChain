
# views.py
from django.shortcuts import render
from django.http import JsonResponse
from .models import Dht11
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView

class OperateurLoginView(LoginView):
    template_name = "login.html"

class OperateurLogoutView(LogoutView):
    next_page = "/login/"

@login_required
def dashboard(request):
    # Rend juste la page; les données sont chargées via JS
    return render(request, "dashboard.html")

def latest_json(request):
    # Fournit la dernière mesure en JSON (sans passer par api.py)
    last = Dht11.objects.order_by('-dt').values('temp', 'hum', 'dt').first()
    if not last:
        return JsonResponse({"detail": "no data"}, status=404)
    return JsonResponse({
        "temperature": last["temp"],
        "humidity":    last["hum"],
        "timestamp":   last["dt"].isoformat()
    })
@login_required
def graph_temp(request):
    return render(request, "graph_temp.html")

@login_required
def graph_hum(request):
    return render(request, "graph_hum.html")
from django.shortcuts import render, get_object_or_404
from .models import Incident
@login_required
def incident_archive(request):
    # Tous les incidents : ouverts + fermés
    incidents = Incident.objects.all().order_by("-start_at")
    return render(request, "incident_archive.html", {"incidents": incidents})
@login_required
def incident_detail(request, pk):
    # Détails d’un incident précis
    incident = get_object_or_404(Incident, pk=pk)
    return render(request, "incident_detail.html", {"incident": incident})

