import FileTsone from "./Filetsone";
import { Uploader } from "./Uploader";

export class ServerUploader implements Uploader {
    async upload(filetsone: FileTsone, file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(filetsone.url, {
                method: "POST",
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json(); // Assuming the server responds with JSON
                return result
            } else {
                console.error("File upload failed.", response.statusText);
            }
        } catch (error) {
            console.error("Error during file upload:", error);
        }

        throw new Error('Upload failed');
    }
}