import os
from src.handlers.files import Handler
from flask import Flask
import boto3
import s3fs


def main():

    port = int(os.getenv("PORT", "8080"))

    debug = os.getenv("DEBUG", "FALSE").upper().startswith("T")

    access_key_id = os.getenv("AWS_SERVER_ACCESS_KEY_ID")

    secret_key = os.getenv("AWS_SERVER_SECRET_KEY")

    bucket = os.getenv("AWS_SERVER_BUCKET")

    client = boto3.client(
        "s3",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_key,
    )

    fs = s3fs.S3FileSystem(
        key=access_key_id,
        secret=secret_key,
    )

    handler = Handler(client, fs, bucket)

    app = Flask(__name__)

    base_path = "/api/v1/files"

    app.route(
        f"{base_path}/<path:file_name>",
        methods=["POST"],
    )(handler.set_file)

    app.route(
        f"{base_path}/transfer/<path:file_name>",
        methods=["POST"],
    )(handler.set_transfer_file)

    app.route(
        f"{base_path}/<path:file_name>",
        methods=["DELETE"],
    )(handler.delete_file)

    app.route(
        f"{base_path}/all/<user_id>",
        methods=["DELETE"],
    )(handler.delete_all_files)

    app.route(
        f"{base_path}/sign_url/<path:file_name>",
        methods=["POST"],
    )(handler.get_signed_url)

    app.route(
        f"{base_path}/sign_all_url/",
        methods=["POST"],
    )(handler.get_all_signed_urls)

    app.route(
        "/api/info/",
        methods=["GET"],
    )(handler.ping)

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
    )


if __name__ == "__main__":
    main()
