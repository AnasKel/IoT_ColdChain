from rest_framework import generics
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import Dht11, Incident
from .serializers import Dht11Serializer, IncidentSerializer
from .utils import send_telegram

from .utils import make_voice_call

MIN_OK = 2
MAX_OK = 8


class DList(generics.ListAPIView):
    queryset = Dht11.objects.all()
    serializer_class = Dht11Serializer


class Dhtviews(generics.CreateAPIView):
    queryset = Dht11.objects.all()
    serializer_class = Dht11Serializer

    def perform_create(self, serializer):
        obj = serializer.save()
        t = obj.temp

        if t is None:
            return

        is_incident = (t < MIN_OK or t > MAX_OK)

        # incident ouvert ?
        incident = Incident.objects.filter(is_open=True).order_by("-start_at").first()

        if is_incident:

            # 🔴 NOUVEL INCIDENT
            if incident is None:
                incident = Incident.objects.create(
                    is_open=True,
                    counter=1,
                    max_temp=t,
                    min_temp=t
                )

                # Twilio Phone Call

                make_voice_call(
                    temp=t,
                    date=obj.dt
                )

                # 📧 EMAIL
                try:
                    send_mail(
                        subject="⚠️ Incident Température DHT11",
                        message=(
                            f"Un incident a été détecté.\n\n"
                            f"Température mesurée : {t:.1f} °C\n"
                            f"Date : {obj.dt}\n"
                            f"Seuil autorisé : [{MIN_OK}°C – {MAX_OK}°C]"
                        ),
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=["anaskelouch@gmail.com"],
                        fail_silently=True,
                    )
                except Exception:
                    pass

                # 📲 TELEGRAM
                send_telegram(
                    f"🚨 INCIDENT DHT11\n"
                    f"Température : {t:.1f} °C\n"
                    f"Date : {obj.dt}\n"
                    f"Seuil : {MIN_OK}–{MAX_OK} °C"
                )

            # 🔁 INCIDENT DÉJÀ OUVERT
            else:
                incident.counter += 1
                incident.max_temp = max(incident.max_temp, t)
                incident.min_temp = t if incident.min_temp is None else min(incident.min_temp, t)
                incident.save()

        else:
            # 🟢 TEMPÉRATURE NORMALE → fermer incident
            if incident is not None:
                incident.is_open = False
                incident.end_at = timezone.now()
                incident.save()

# ---- API incident: état courant ----
from rest_framework.views import APIView

class IncidentStatus(APIView):
    def get(self, request):
        incident = Incident.objects.filter(is_open=True).order_by("-start_at").first()
        if not incident:
            return Response({"is_open": False, "counter": 0})
        return Response(IncidentSerializer(incident).data)

# ---- API incident: valider ACK + commentaire (op1/op2/op3) ----
class IncidentUpdateOperator(APIView):
    def post(self, request):
        """
        body:
        {
          "op": 1,
          "ack": true,
          "comment": "..."
        }
        """
        op = int(request.data.get("op", 1))
        ack = bool(request.data.get("ack", False))
        comment = request.data.get("comment", "")

        incident = Incident.objects.filter(is_open=True).order_by("-start_at").first()
        if not incident:
            return Response({"error": "no open incident"}, status=400)

        now = timezone.now()

        if op == 1:
            incident.op1_ack = ack
            incident.op1_comment = comment
            incident.op1_saved_at = now
        elif op == 2:
            incident.op2_ack = ack
            incident.op2_comment = comment
            incident.op2_saved_at = now
        else:
            incident.op3_ack = ack
            incident.op3_comment = comment
            incident.op3_saved_at = now

        incident.save()
        return Response(IncidentSerializer(incident).data)
