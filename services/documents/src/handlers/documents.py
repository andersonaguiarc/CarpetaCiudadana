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
import json


class Handler:

    def __init__(
        self,
        db: Database,
        amqp_channel,
        amqp_exchange,
        amqp_routing_key,
        files_url,
        govcarpeta_url,
    ):
        self.db = db
        self.amqp_channel = amqp_channel
        self.amqp_exchange = amqp_exchange
        self.amqp_routing_key = amqp_routing_key
        self.documents = db.documents
        self.files_url = files_url
        self.govcarpeta_url = govcarpeta_url

    @circuit(failure_threshold=2)
    def certify(self, response, user_id, file_name):
        govcarpeta_response = requests.put(
            f"{self.govcarpeta_url}/apis/authenticateDocument",
            json={
                "idCitizen": user_id,
                "UrlDocument": response.json()["url"],
                "documentTitle": file_name,
            },
        )
        govcarpeta_response.raise_for_status()
        print(govcarpeta_response.json(), flush=True)

    @token_required
    def certify_document(self, file_name):
        user_id = g.user_id
        if not self._document_exists(file_name, user_id):
            return jsonify({"error": "document not found"}), 404

        try:
            response = requests.post(
                f"{self.files_url}/api/v1/files/sign_url/{file_name}",
                headers={
                    "Authorization": request.headers.get("Authorization"),
                },
            )

        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

        def fallback():
            body = {
                "user_id": user_id,
                "file_name": file_name,
                "url": response.json()["url"],
            }
            message = json.dumps(body)
            self.amqp_channel.basic_publish(
                exchange=self.amqp_exchange,
                routing_key=self.amqp_routing_key,
                body=message,
            )

        try:
            self.certify(response, user_id, file_name)
            return jsonify({"message": "document certification successful"}), 200
        except Exception as err:
            print(err, flush=True)
            try:
                fallback()
            except Exception as err:
                print(err, flush=True)
                return jsonify({"error": "internal server error"}), 500

        # except Exception as err:
        return jsonify({"message": "document certification in progress"}), 200

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

        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
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

        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

    def transfer_documents(self):

        class Transfer(BaseModel):
            id: int
            Documents: Dict[str, List[str]]

        body = request.get_json()

        if body is None:
            return jsonify({"error": "no body provided"}), 400

        try:
            transfer = Transfer(**body)
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "invalid body"}), 400

        results = []
        user_id = transfer.id

        for key, val in transfer.Documents.items():

            url = val[0]
            path = key

            response = requests.get(url)
            data = response.content

            document_record = {
                "_id": f"{user_id}/{path}",
                "path": path,
                "user_id": user_id,
                "last_modified": datetime.datetime.now(),
                "size": len(data),
            }
            if self._document_exists(path, user_id):
                self.documents.update_one(
                    {"_id": f"{user_id}/{path}"},
                    {
                        "$set": {
                            "last_modified": datetime.datetime.now(),
                            "size": len(data),
                        }
                    },
                )
            else:
                self.documents.insert_one(document_record)

            response = requests.post(
                f"{self.files_url}/api/v1/files/transfer/{user_id}/{path}",
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

        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def delete_document(self, file_name):

        user_id = g.user_id

        query = {"_id": f"{user_id}/{file_name}"}

        try:
            if not self._document_exists(file_name, user_id):
                return jsonify({"error": "document does not exist"}), 404

            self.documents.delete_one(query)
        except Exception as err:
            print(err, flush=True)
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
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

    def delete_all_documents(self, user_id):

        query = {
            "user_id": user_id,
        }

        try:
            self.documents.delete_many(query)
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

        try:
            response = requests.delete(
                f"{self.files_url}/api/v1/files/all/{user_id}",
            )

            if response.status_code != 201:
                return jsonify({"error": "internal server error"}), 500

            return make_response("Deleted", 201)
        except Exception as err:
            print(err, flush=True)
            return jsonify({"error": "internal server error"}), 500

    def ping(self):
        return jsonify({"message": "This is working!", "path": "/api/info"}), 200

    def _document_exists(self, file_name, user_id):
        query = {
            "_id": f"{user_id}/{file_name}",
        }

        return self.documents.count_documents(query, limit=1) > 0
