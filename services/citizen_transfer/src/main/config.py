import os
from dotenv import load_dotenv

# Cargar las variables de entorno de CitizenTransfer desde el archivo .env
load_dotenv()

class Config:
    CITIZEN_API_URL = os.getenv('CITIZEN_API_URL')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
