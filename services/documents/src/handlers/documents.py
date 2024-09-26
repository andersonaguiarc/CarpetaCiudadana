from flask import (
    request,
    jsonify,
    make_response,
    g,
)
import requests
from src.middleware.authenticate import token_required
from pymongo.database import Database
import datetime
from circuitbreaker import circuit
from pydantic import BaseModel
from typing import List, Dict


class Handler:

    def __init__(
        self,
        db: Database,
        amqp_connection,
        amqp_exchange,
        amqp_routing_key,
        files_url,
        govcarpeta_url,
    ):
        self.db = db
        self.amqp_connection = amqp_connection
        self.amqp_exchange = amqp_exchange
        self.amqp_routing_key = amqp_routing_key
        self.documents = db.documents
        self.files_url = files_url
        self.govcarpeta_url = govcarpeta_url

    @token_required
    def certify_document(self, file_name):
        user_id = g.user_id
        if not self._document_exists(file_name, user_id):
            return jsonify({"error": "document not found"}), 404

        response = requests.post(
            f"{self.files_url}/api/v1/files/sign_url/{file_name}",
            headers={
                "Authorization": request.headers.get("Authorization"),
            },
        )

        # @circuit(fallback_function=fallback)
        response = requests.post(self.govcarpeta_url, json=response.json())

    @token_required
    def create_document(self, file_name):

        data = request.data

        if not data:
            return jsonify({"error": "no file provided"}), 400

        user_id = g.user_id

        document = {
            "_id": f"{user_id}/{file_name}",
            "path": file_name,
            "user_id": user_id,
            "last_modified": datetime.datetime.now(),
            "size": len(data),
        }

        try:

            if self._document_exists(file_name, user_id):
                return jsonify({"error": "document already exists"}), 409

            self.documents.insert_one(document)

        except Exception:
            return jsonify({"error": "internal server error"}), 500

        try:
            response = requests.post(
                f"{self.files_url}/api/v1/files/{file_name}",
                data=data,
                headers={
                    "Authorization": request.headers.get("Authorization"),
                },
            )

            if response.status_code != 201:
                # TODO: circuit break
                print(response.json(), flush=True)
                return jsonify({"error": "could not create document"}), 500

            return jsonify(document), 201
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def get_file(self, file_name):
        # puede no recibir token depende de caso
        user_id = g.user_id

        try:
            if not self._document_exists(file_name, user_id):
                return jsonify({"error": "document not found"}), 404

            response = requests.post(
                f"{self.files_url}/api/v1/files/sign_url/{file_name}",
                headers={
                    "Authorization": request.headers.get("Authorization"),
                },
            )
            return make_response(response.json(), response.status_code)

        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def get_document(self, file_name):

        user_id = g.user_id

        query = {"_id": f"{user_id}/{file_name}"}
        if not self._document_exists(file_name, user_id):
            return jsonify({"error": "document not found"}), 404

        try:
            document = self.documents.find_one(query)
            return jsonify(document), 200
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def get_all_documents(self):

        user_id = g.user_id

        query = {
            "user_id": user_id,
        }

        try:
            documents = self.documents.find(query)

            results = list(documents)

            response = {
                "count": len(results),
                "results": results,
            }

            return jsonify(response), 200
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def get_all_files(self, user_id):

        query = {
            "user_id": int(user_id),
        }

        try:
            documents = self.documents.find(query)

            results = list(map(lambda x: x["_id"], documents))
            body = {"paths": results}
            response = requests.post(
                f"{self.files_url}/api/v1/files/sign_all_url/",
                json=body,
            )

            return make_response(response.json(), 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def transfer_documents(self):
        class Document(BaseModel):
            path: str
            url: str

        class Transfer(BaseModel):
            user_id: int
            documents: List[Document]

        body = request.get_json()

        if body is None:
            return jsonify({"error": "no body provided"}), 400

        try:
            transfer = Transfer(**body)
        except Exception:
            return jsonify({"error": "invalid body"}), 400

        results = []

        for document in transfer.documents:

            response = requests.get(document.url)
            data = response.content

            document_record = {
                "_id": f"{transfer.user_id}/{document.path}",
                "path": document.path,
                "user_id": transfer.user_id,
                "last_modified": datetime.datetime.now(),
                "size": len(data),
            }
            self.documents.insert_one(document_record)

            response = requests.post(
                f"{self.files_url}/api/v1/files/transfer/{transfer.user_id}/{document.path}",
                data=data,
            )

            results.append(document_record)

        return jsonify({"count": len(results), "results": results}), 201

    @token_required
    def update_document(self, file_name):

        data = request.data

        user_id = g.user_id

        try:
            if not self._document_exists(file_name, user_id):
                return jsonify({"error": "document not found"}), 404

            self.documents.update_one(
                {"_id": f"{user_id}/{file_name}"},
                {
                    "$set": {
                        "last_modified": datetime.datetime.now(),
                        "size": len(data),
                    }
                },
            )

        except Exception:
            return jsonify({"error": "internal server error"}), 500

        document = self.documents.find_one({"_id": f"{user_id}/{file_name}"})

        try:
            # post overwrites the file
            response = requests.post(
                f"{self.files_url}/api/v1/files/{file_name}",
                data=data,
                headers={
                    "Authorization": request.headers.get("Authorization"),
                },
            )

            if response.status_code != 201:
                # TODO: circuit break
                return jsonify({"error": "internal server error"}), 500

            return jsonify(document), 200
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def delete_document(self, file_name):

        user_id = g.user_id

        query = {"_id": f"{user_id}/{file_name}"}

        try:
            if not self._document_exists(file_name, user_id):
                return jsonify({"error": "document does not exist"}), 404

            self.documents.delete_one(query)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

        try:
            print(file_name, flush=True)
            response = requests.delete(
                f"{self.files_url}/api/v1/files/{file_name}",
                headers={
                    "Authorization": request.headers.get("Authorization"),
                },
            )

            if response.status_code != 201:
                # TODO: circuit break
                return jsonify({"error": "could not delete document"}), 500

            return make_response("Deleted", 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def delete_all_documents(self, user_id):

        query = {
            "user_id": user_id,
        }

        try:
            self.documents.delete_many(query)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

        try:
            response = requests.delete(
                f"{self.files_url}/api/v1/files/all/{user_id}",
            )

            if response.status_code != 201:
                return jsonify({"error": "internal server error"}), 500

            return make_response("Deleted", 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def ping(self):
        return jsonify({"message": "This is working!", "path": "/api/info"}), 200

    def _document_exists(self, file_name, user_id):
        query = {
            "_id": f"{user_id}/{file_name}",
        }

        return self.documents.count_documents(query, limit=1) > 0
