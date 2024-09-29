import os
import pika

from src.consumer.consumer import Consumer


def create_amqp_connection():
    """Create and return an AMQP connection."""
    amqp_user = os.environ.get("USER_RABBITMQ", "")
    if not amqp_user:
        raise ValueError("USER_RABBITMQ environment variable is required.")
    amqp_password = os.environ.get("PASS_RABBITMQ", "")
    if not amqp_password:
        raise ValueError("PASS_RABBITMQ environment variable is required.")
    amqp_host = os.environ.get("HOST_RABBITMQ", "")
    if not amqp_host:
        raise ValueError("HOST_RABBITMQ environment variable is required.")
    amqp_port = os.environ.get("PORT_RABBITMQ", "")
    if not amqp_port:
        raise ValueError("PORT_RABBITMQ environment variable is required.")
    credentials = pika.PlainCredentials(amqp_user, amqp_password)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=amqp_host,
            credentials=credentials,
            port=amqp_port,
            # heartbeat=0,
        )
    )
    return connection


def main():
    """Main entry point for the application."""
    amqp_connection = create_amqp_connection()

    documents_url = os.getenv("DOCUMENT_API_URL")
    if not documents_url:
        raise ValueError("DOCUMENT_API_URL environment variable is required.")

    amqp_queue = os.getenv("QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER")
    if not amqp_queue:
        raise ValueError("QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER environment variable is required.")

    consumer = Consumer(
        amqp_connection,
        documents_url,
        amqp_queue,
    )

    consumer.consume()


if __name__ == "__main__":
    main()
