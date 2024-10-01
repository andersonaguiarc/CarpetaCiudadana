import os
from dotenv import load_dotenv

# Cargar las variables de entorno de CitizenTransfer desde el archivo .env
load_dotenv()

class Config:
    CITIZEN_API_URL = os.getenv('CITIZEN_API_URL')
    CITIZEN_TRANSFER_API_URL = os.getenv('CITIZEN_TRANSFER_API_URL')
    DOCUMENT_API_URL = os.getenv('DOCUMENT_API_URL')
    REGISTER_TRANSFERED_CITIZEN_API_URL = os.getenv('REGISTER_TRANSFERED_CITIZEN_API_URL')
    REGISTER_TRANSFER_DOCUMENT_API_URL = os.getenv('REGISTER_TRANSFER_DOCUMENT_API_URL')
    EXCHANGE_NAME_TRANSER_TO_CITIZEN = os.getenv('EXCHANGE_NAME_TRANSER_TO_CITIZEN')
    EXCHANGE_NAME_TRANSER_TO_DOCUMENT = os.getenv('XCHANGE_NAME_TRANSER_TO_DOCUMENT')
    ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN = os.getenv('ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN')
    ROUTINGKEY_NAME_TRANSFER_TO_DOCUMENT = os.getenv('ROUTINGKEY_NAME_TRANSFER_TO_DOCUMENT')
    QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER = os.getenv('QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER')
    QUEUE_NAME_EXTERNAL_CITIZEN_TO_REGISTER = os.getenv('QUEUE_NAME_EXTERNAL_CITIZEN_TO_REGISTER')
    QUEUE_NAME_REGISTER_TRANSFER_TO_CITIZEN = os.getenv('QUEUE_NAME_REGISTER_TRANSFER_TO_CITIZEN')
    HOST_RABBITMQ = os.getenv('HOST_RABBITMQ')
    PORT_RABBITMQ = os.getenv('PORT_RABBITMQ')
    USER_RABBITMQ = os.getenv('USER_RABBITMQ')
    PASS_RABBITMQ = os.getenv('PASS_RABBITMQ')
    PORT = int(os.getenv('PORT'))
