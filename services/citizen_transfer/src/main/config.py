import os
from dotenv import load_dotenv

# Cargar las variables de entorno de CitizenTransfer desde el archivo .env
load_dotenv()

class Config:
    CITIZEN_API_URL = os.getenv('CITIZEN_API_URL')
    CITIZEN_TRANSFER_API_URL = os.getenv('CITIZEN_TRANSFER_API_URL')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    EXCHANGE_NAME_TRANSER_TO_CITIZEN = os.getenv('EXCHANGE_NAME_TRANSER_TO_CITIZEN')
    ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN = os.getenv('ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN')
    QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER = os.getenv('QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER')
    HOST_RABBITMQ = os.getenv('HOST_RABBITMQ')
    PORT_RABBITMQ = os.getenv('PORT_RABBITMQ')
    USER_RABBITMQ = os.getenv('USER_RABBITMQ')
    PASS_RABBITMQ = os.getenv('PASS_RABBITMQ')
