# api/celery

from celery import Celery

clery_app = Celery("api")

clery_app.config_from_object("api.celery_config")


if __name__ == "__main__":
    clery_app.start()
