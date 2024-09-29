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
        queue_name: str,
    ) -> None:
        self.connection = connection
        self.channel = connection.channel()
        self.documents_url = documents_url
        self.queue_name = queue_name

    @circuit(failure_threshold=2)
    def transfer(self, body: Dict) -> None:
        user_id = body["id"]
        documents_response = requests.post(f"{self.documents_url}/api/v1/documents/files/{user_id}")
        documents_response.raise_for_status()
        print(
            f"Retrieved documents: {documents_response.json()}",
            flush=True,
        )

        third_party_operator_url = body["operatorUrl"]

        third_party_operator_response = requests.post(third_party_operator_url, json={
            **documents_response.json(),
            "citizenName": body["name"],
            "citizenEmail": body["email"]
        })

        third_party_operator_response.raise_for_status()
        print(
            f"Transferred documents: {documents_response.json()}",
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
            body = json.loads(message)
            self.transfer(body)
        except Exception as e:
            print(f"Error: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False, multiple=False)

            self.channel.basic_publish(
                exchange=f"delayed_{self.queue_name}",
                routing_key=f"delayed_{self.queue_name}",
                body=message,
            )
        else:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def consume(self) -> None:

        self.channel.basic_consume(
            queue=self.queue_name,
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
