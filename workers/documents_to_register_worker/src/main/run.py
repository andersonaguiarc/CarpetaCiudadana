import os
import pika

from src.consumer.consumer import Consumer


def create_amqp_connection():
    """Create and return an AMQP connection."""
    amqp_user = os.environ.get("AMQP_USER", "")
    if not amqp_user:
        raise ValueError("AMQP_USER environment variable is required.")
    amqp_password = os.environ.get("AMQP_PASSWORD", "")
    if not amqp_password:
        raise ValueError("AMQP_PASSWORD environment variable is required.")
    amqp_host = os.environ.get("AMQP_HOST", "")
    if not amqp_host:
        raise ValueError("AMQP_HOST environment variable is required.")
    amqp_port = os.environ.get("AMQP_PORT", "")
    if not amqp_port:
        raise ValueError("AMQP_PORT environment variable is required.")
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

    documents_url = os.getenv("DOCUMENTS_URL")
    if not documents_url:
        raise ValueError("DOCUMENTS_URL environment variable is required.")

    input_queue_name = os.getenv("QUEUE_NAME_DOCUMENTS_TO_REGISTER")
    if not input_queue_name:
        raise ValueError(
            "QUEUE_NAME_DOCUMENTS_TO_REGISTER environment variable is required."
        )

    output_queue_name = os.getenv("QUEUE_NAME_DOCUMENTS_TO_REGISTER_REPLIER")
    if not output_queue_name:
        raise ValueError(
            "QUEUE_NAME_DOCUMENTS_TO_REGISTER_REPLIER environment variable is required."
        )

    consumer = Consumer(
        amqp_connection,
        documents_url,
        input_queue_name,
        output_queue_name,
    )

    consumer.consume()


if __name__ == "__main__":
    main()
