import os
from flask import Flask
from pymongo import MongoClient
import pika
from src.handlers.documents import Handler


def create_amqp_connection():
    """Create and return an AMQP connection."""
    # url = os.environ.get("AMQP_URL", "")
    # if not url:
    #     raise ValueError("AMQP_URL environment variable is required.")
    # params = pika.URLParameters(url)
    # return pika.BlockingConnection(params)
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
            heartbeat=0,
        )
    )
    return connection


def create_mongo_client():
    """Create and return a MongoDB client."""
    mongo_url = os.getenv("MONGO_URL", "")
    if not mongo_url:
        raise ValueError("MONGO_URL environment variable is required.")
    return MongoClient(mongo_url)


def create_app(handler):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    base_path = "/api/v1/documents"

    app.add_url_rule(
        f"{base_path}/certify/internal/",
        view_func=handler.certify_internal,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/certify/<path:file_name>",
        view_func=handler.certify_document,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/file/<path:file_name>",
        view_func=handler.get_file,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/files/<user_id>",
        view_func=handler.get_all_files,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/",
        view_func=handler.get_all_documents,
        methods=["GET"],
    )
    app.add_url_rule(
        f"{base_path}/<path:file_name>",
        view_func=handler.create_document,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/transfer_documents/",
        view_func=handler.transfer_documents,
        methods=["POST"],
    )
    app.add_url_rule(
        f"{base_path}/<path:file_name>",
        view_func=handler.get_document,
        methods=["GET"],
    )
    app.add_url_rule(
        f"{base_path}/<path:file_name>",
        view_func=handler.update_document,
        methods=["PUT"],
    )
    app.add_url_rule(
        f"{base_path}/<path:file_name>",
        view_func=handler.delete_document,
        methods=["DELETE"],
    )
    app.add_url_rule(
        f"{base_path}/all/<user_id>",
        view_func=handler.delete_all_documents,
        methods=["DELETE"],
    )
    app.add_url_rule(
        "/api/info",
        view_func=handler.ping,
        methods=["GET"],
    )

    return app


def main():
    """Main entry point for the application."""
    amqp_connection = create_amqp_connection()
    # amqp_connection = None
    mongo_client = create_mongo_client()
    db = mongo_client["db"]

    files_url = os.getenv("FILES_URL")
    if not files_url:
        raise ValueError("FILES_URL environment variable is required.")

    govcarpeta_url = os.getenv("GOVCARPETA_URL")
    if not govcarpeta_url:
        raise ValueError("GOVCARPETA_URL environment variable is required.")

    amqp_exchange = os.getenv("AMQP_EXCHANGE")
    if not amqp_exchange:
        raise ValueError("AMQP_EXCHANGE environment variable is required.")

    amqp_routing_key = os.getenv("AMQP_ROUTING_KEY")
    if not amqp_routing_key:
        raise ValueError("AMQP_ROUTING_KEY environment variable is required.")

    amqp_queue_to_certify_email = os.getenv("AMQP_QUEUE_TO_CERTIFY_EMAIL")
    if not amqp_queue_to_certify_email:
        raise ValueError(
            "AMQP_QUEUE_TO_CERTIFY_EMAIL environment variable is required."
        )

    handler = Handler(
        db,
        amqp_connection.channel(),
        amqp_exchange,
        amqp_routing_key,
        files_url,
        govcarpeta_url,
        amqp_queue_to_certify_email,
    )

    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("DEBUG", "FALSE").upper().startswith("T")

    app = create_app(handler)

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
    )


if __name__ == "__main__":
    main()
