import requests
from django.conf import settings
from twilio.rest import Client

def send_telegram(text: str) -> bool:
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        print("❌ TELEGRAM: token ou chat_id manquant")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    try:
        r = requests.post(
            url,
            json={
                "chat_id": chat_id,
                "text": text
            },
            timeout=10
        )

        print("📲 TELEGRAM STATUS:", r.status_code)
        print("📲 TELEGRAM RESPONSE:", r.text)

        return r.ok

    except Exception as e:
        print("❌ TELEGRAM ERROR:", e)
        return False




def make_voice_call(temp, date):
    """
    Appel vocal automatique en cas d'incident
    """
    try:
        client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )

        message = (
            f"Alerte température. "
            f"La température mesurée est de {temp} degrés. "
            f"Merci de vérifier immédiatement le réfrigérateur."
        )

        call = client.calls.create(
            to=settings.ALERT_PHONE_NUMBER,
            from_=settings.TWILIO_PHONE_NUMBER,
            twiml=f'<Response><Say language="fr-FR">{message}</Say></Response>'
        )

        return True

    except Exception as e:
        print("Erreur appel vocal:", e)
        return False
