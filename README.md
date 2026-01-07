# 🌡️ IoT Cold Chain Monitoring System

Système **IoT de supervision de la chaîne du froid** permettant la collecte en temps réel de la **température** et de l'**humidité**, la **détection automatique des incidents**, et l'envoi d'**alertes multi-canaux** (appel vocal, email, Telegram), avec un **dashboard web d'administration**.


---

## 📌 Fonctionnalités principales

- 📡 **Collecte IoT en temps réel**
  - Capteur **DHT11** (Température & Humidité)
  - Envoi des mesures via API REST

- 🚨 **Gestion intelligente des incidents**
  - Détection automatique hors seuil (2°C – 8°C)
  - Ouverture et fermeture automatique des incidents
  - Historique et suivi des alertes

- 🔔 **Alertes multi-canaux**
  - 📞 Appel vocal automatique (**Twilio**)
  - 📧 Email transactionnel (**Brevo**)
  - 📲 Notification instantanée (**Telegram**)

- 👨‍💼 **Validation des opérateurs**
  - Accusé de réception (ACK)
  - Commentaires par opérateur
  - Traçabilité des actions

- 📊 **Dashboard Web**
  - Visualisation en temps réel
  - Historique des mesures
  - Export CSV
  - Interface d'administration sécurisée

---

## 🏗️ Architecture du système
```
Capteur DHT11 (ESP8266)
        ↓
    API REST (Django)
        ↓
Base de données (SQLite)
        ↓
Alertes (Email / Telegram / Appel vocal)
        ↓
    Dashboard Web
```

---

## 🧰 Technologies utilisées

### Backend
- Python
- Django
- Django REST Framework
- Gunicorn
- Whitenoise

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Chart.js

### IoT
- ESP8266
- Capteur DHT11
- Arduino (C++)

### Services externes
- Twilio (appel vocal)
- Brevo (email transactionnel)
- Telegram Bot API

### Déploiement
- Railway
- GitHub

---

## ⚙️ Variables d'environnement

Exemple de configuration `.env` :
```env
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=*
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_password
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
ALERT_PHONE_NUMBER=your_phone_number
```

---

## 🚀 Lancer le projet en local
```bash
git clone https://github.com/AnasKel/IoT_ColdChain.git
cd IoT_ColdChain
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Accès :**
- Application : http://127.0.0.1:8000/
- Admin Django : http://127.0.0.1:8000/admin/
