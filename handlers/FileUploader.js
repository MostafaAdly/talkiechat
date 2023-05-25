import fs from "fs";
import fetch from "node-fetch";

export default class FileUploader {
    constructor(EventEmitter) {
        this.EventEmitter = EventEmitter;
        this.host = "https://dev-adly.tk";
    }
    uploadFile(connection, filename, path) {
        if (!filename || !path) return;
        const buffer = fs.readFileSync(path);
        const strBuffer = buffer.toString("base64url"); // BUFFER TO STRING
        const body = { filename, file: strBuffer };
        try {
            fetch(`${this.host}/file-uploader`, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "content-type": "application/json",
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.status == "saved") {
                        this.EventEmitter.emit(
                            "file-uploaded",
                            connection,
                            `${this.host}/file-download/${filename}`,
                            filename
                        );
                    }
                })
                .catch((err) => console.log(err));
        } catch (error) {
            console.log(error);
        }
    }
}
