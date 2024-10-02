FROM python:3.10.5-slim-buster

RUN apt-get update && apt-get install -y curl

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH "/app"

CMD ["python3", "transfer_citizen_worker.py"]
