from django.urls import path
from . import views
from .api import DList, Dhtviews, IncidentStatus, IncidentUpdateOperator
from .views import OperateurLoginView, OperateurLogoutView

urlpatterns = [
    # pages
    path("", views.dashboard, name="dashboard"),
    path("graph_temp/", views.graph_temp, name="graph_temp"),
    path("graph_hum/", views.graph_hum, name="graph_hum"),
    path("incident/archive/", views.incident_archive, name="incident_archive"),
    path("incident/<int:pk>/", views.incident_detail, name="incident_detail"),

    # api mesures
    path("api/", DList.as_view(), name="api_list"),
    path("api/post/", Dhtviews.as_view(), name="api_post"),

    # api incidents
    path("incident/status/", IncidentStatus.as_view(), name="incident_status"),
    path("incident/update/", IncidentUpdateOperator.as_view(), name="incident_update"),

    # latest (dashboard)
    path("latest/", views.latest_json, name="latest"),

    path("login/", OperateurLoginView.as_view(), name="login"),
    path("logout/", OperateurLogoutView.as_view(), name="logout"),

]
