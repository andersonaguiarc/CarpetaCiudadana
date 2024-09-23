import botocore
from flask import (
    request,
    jsonify,
    make_response,
    g,
)
import os
from src.middleware.authenticate import token_required


class Handler:

    def __init__(self, client, fs, bucket):
        self.client = client
        self.fs = fs
        self.bucket = bucket

    @token_required
    def set_file(self, file_name):
        file_data = request.get_data()

        user_id = str(g.user_id)

        path = os.path.join(user_id, file_name)

        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=path,
                Body=file_data,
            )
            return make_response("", 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def delete_file(self, file_name):

        user_id = str(g.user_id)

        path = os.path.join(user_id, file_name)

        try:
            if not self._file_exists(path):
                return jsonify({"error": "file not found"}), 404

            self.client.delete_object(
                Bucket=self.bucket,
                Key=path,
            )

            return make_response("Deleted", 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def delete_all_files(self, user_id):

        try:
            path = os.path.join("/", self.bucket, user_id)

            self.fs.delete(path, recursive=True)

            return make_response("Deleted", 201)
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    @token_required
    def get_signed_url(self, file_name):

        prefix = str(g.user_id)

        path = os.path.join(prefix, file_name)

        try:

            if not self._file_exists(path):
                return jsonify({"error": "file not found"}), 404

            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": path,
                },
                ExpiresIn=604800,  # one hour in seconds, increase if needed
            )

            return jsonify({"url": url}), 201
        except Exception:
            return jsonify({"error": "internal server error"}), 500

    def ping(self):
        return jsonify({"message": "This is working!", "path": "/api/info"}), 500

    def _file_exists(self, path):
        try:
            self.client.head_object(Bucket=self.bucket, Key=path)
        except botocore.exceptions.ClientError:
            return False
        else:
            return True
