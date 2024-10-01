import pika
from circuitbreaker import circuit
import requests
import json
from typing import Dict
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties


class Consumer:
    def __init__(
        self,
        connection: pika.BlockingConnection,
        documents_url: str,
        input_queue_name: str,
        output_queue_name: str,
    ) -> None:
        self.connection = connection
        self.channel = connection.channel()
        self.documents_url = documents_url
        self.input_queue_name = input_queue_name
        self.output_queue_name = output_queue_name

    @circuit(failure_threshold=2)
    def transfer(self, message: bytes) -> None:
        body = json.loads(message)
        documents_response = requests.post(
            f"{self.documents_url}/api/v1/documents/transfer_documents/", json=body
        )
        documents_response.raise_for_status()
        print(
            f"saved documents: {documents_response.json()}",
            flush=True,
        )

        self.channel.basic_publish(
            exchange=self.output_queue_name,
            routing_key=self.output_queue_name,
            body=message,
        )
        print(
            "Published to confirm transfer",
            flush=True,
        )

    def callback(
        self,
        ch: BlockingChannel,
        method: Basic.Deliver,
        _: BasicProperties,
        message: bytes,
    ) -> None:
        try:
            print(f"Received message: {message}", flush=True)
            self.transfer(message)
        except Exception as e:
            print(f"Error: {e}", flush=True)
            ch.basic_nack(
                delivery_tag=method.delivery_tag, requeue=False, multiple=False
            )

            self.channel.basic_publish(
                exchange=f"delayed_{self.input_queue_name}",
                routing_key=f"delayed_{self.input_queue_name}",
                body=message,
            )
        else:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def consume(self) -> None:

        self.channel.basic_consume(
            queue=self.input_queue_name,
            on_message_callback=self.callback,
            auto_ack=False,
        )

        try:
            print("Consuming messages...", flush=True)
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("Execution interrupted by the user.", flush=True)
            self.channel.stop_consuming()
        except Exception as e:
            print(f"Error occurred while consuming: {e}", flush=True)
        finally:
            self.connection.close()
            print("Connection closed.", flush=True)
