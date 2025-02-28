import FileTsone from "./Filetsone";
import { S3Settings } from "./S3Settings";
import { Uploader } from "./Uploader";

interface Part {
    PartNumber: number;
    ETag: string;
}

export class S3MultipartUploader implements Uploader {
    private settings: S3Settings = new S3Settings();
    private filetsone?: FileTsone;

    async upload(filetsone: FileTsone, file: File): Promise<string> {
        this.settings = filetsone.s3Settings;
        this.filetsone = filetsone;

        if (!this.settings.valid()) {
            throw new Error('Settings invalid');
        }

        const chunks = this.splitFile(file);
        const key = await this.initiateUpload(file);
        const presignedUrls = await this.getPresignedUrls(key, chunks.length);
        const parts = await this.uploadChunks(presignedUrls, chunks, file);
        return this.finalizeUpload(key, parts);
    }

    private splitFile(file: File): Blob[] {
        const totalChunks = Math.ceil(file.size / this.settings.chunkSize);
        const chunks: Blob[] = [];

        for (let i = 0; i < totalChunks; i++) {
            chunks.push(file.slice(i * this.settings.chunkSize, (i + 1) * this.settings.chunkSize));
        }

        return chunks;
    }

    private async initiateUpload(file: File): Promise<string> {
        if (this.filetsone) {
            this.filetsone.triggerHook('initiate_multipart_upload', file, this.settings.initiateMultipartUrl);
        }
        const response = await fetch(this.settings.initiateMultipartUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name }),
        });

        if (!response.ok) {
            throw new Error("Failed to initiate upload");
        }

        const { key } = await response.json();
        return key;
    }

    private async getPresignedUrls(key: string, totalChunks: number): Promise<string[]> {
        if (this.filetsone) {
            this.filetsone.triggerHook('get_multipart_presign_urls', key, totalChunks);
        }
        const urls: string[] = [];

        for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
            const response = await fetch(`${this.settings.fetchPresignUrl}?requestId=${key}&partNumber=${partNumber}`);
            if (!response.ok) {
                throw new Error(`Failed to get presigned URL for part ${partNumber}`);
            }
            const { url } = await response.json();
            urls.push(url);
        }

        return urls;
    }

    private async uploadChunks(presignedUrls: string[], chunks: Blob[], file: File): Promise<Part[]> {
        if (this.filetsone) {
            this.filetsone.triggerHook('upload_multipart_chunk', presignedUrls, chunks);
        }
        const parts: Part[] = [];
        let uploads: number[] = [];

        for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", presignedUrls[i], true);
        
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        uploads[i] = event.loaded;
                        this.filetsone?.triggerHook('multipart_upload_progress', file, uploads.reduce((a, b) => a + b, 0));
                    }
                };
        
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const eTag = xhr.getResponseHeader("ETag");
                        if (!eTag) {
                            reject(new Error(`Missing ETag for part ${i + 1}`));
                            return;
                        }
                        parts.push({ PartNumber: i + 1, ETag: eTag });
                        uploads[i] = chunks[i].size;
                        resolve(undefined);
                    } else {
                        reject(new Error(`Failed to upload part ${i + 1}, status: ${xhr.status}`));
                    }
                };
        
                xhr.onerror = () => reject(new Error(`Network error while uploading part ${i + 1}`));
        
                xhr.send(chunks[i]);
            });
        }
        

        return parts;
    }

    private async finalizeUpload(key: string, parts: Part[]): Promise<any> {
        const response = await fetch(this.settings.finalizeMultipartUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: key, parts }),
        });

        if (!response.ok) {
            throw new Error("Failed to finalize upload");
        }

        const result = await response.json();

        if (this.filetsone) {
            this.filetsone.triggerHook('finalize_multipart_upload', key, parts, result);
        }

        return result;
    }
}
