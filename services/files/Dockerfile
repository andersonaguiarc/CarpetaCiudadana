FROM python:3.10.5-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH "/app"

CMD ["python3", "src/main/files.py"]
