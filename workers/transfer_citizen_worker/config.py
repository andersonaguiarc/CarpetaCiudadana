import os
from dotenv import load_dotenv

# Cargar las variables de entorno de CitizenTransfer desde el archivo .env
load_dotenv()

class Config:
    CITIZEN_API_URL = os.getenv('CITIZEN_API_URL')
    CITIZEN_TRANSFER_API_URL = os.getenv('CITIZEN_TRANSFER_API_URL')
    DOCUMENT_API_URL = os.getenv('DOCUMENT_API_URL')
    REGISTER_CITIZEN_API_URL = os.getenv('REGISTER_CITIZEN_API_URL')
    REGISTER_DOCUMENTS_API_URL = os.getenv('REGISTER_DOCUMENTS_API_URL')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    EXCHANGE_NAME_TRANSER_TO_CITIZEN = os.getenv('EXCHANGE_NAME_TRANSER_TO_CITIZEN')
    EXCHANGE_NAME_TRANSER_TO_DOCUMENT = os.getenv('XCHANGE_NAME_TRANSER_TO_DOCUMENT')
    EXCHANGE_NAME_REGISTER_TRANSFER_TO_CITIZEN = os.getenv('EXCHANGE_NAME_REGISTER_TRANSFER_TO_CITIZEN')
    EXCHANGE_NAME_REGISTER_TRANSFER_TO_DOCUMENTS = os.getenv('EXCHANGE_NAME_REGISTER_TRANSFER_TO_DOCUMENTS')
    EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD = os.getenv('EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD')
    ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN = os.getenv('ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN')
    ROUTINGKEY_NAME_TRANSFER_TO_DOCUMENT = os.getenv('ROUTINGKEY_NAME_TRANSFER_TO_DOCUMENT')
    ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_CITIZEN = os.getenv('ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_CITIZEN')
    ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_DOCUMENTS = os.getenv('ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_DOCUMENTS')
    ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_THIRD = os.getenv('ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_THIRD')
    QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER = os.getenv('QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER')
    QUEUE_NAME_EXTERNAL_CITIZEN_TO_REGISTER = os.getenv('QUEUE_NAME_EXTERNAL_CITIZEN_TO_REGISTER')
    HOST_RABBITMQ = os.getenv('HOST_RABBITMQ')
    PORT_RABBITMQ = os.getenv('PORT_RABBITMQ')
    USER_RABBITMQ = os.getenv('USER_RABBITMQ')
    PASS_RABBITMQ = os.getenv('PASS_RABBITMQ')
    PORT = int(os.getenv('PORT'))
