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
        const parts = await this.uploadChunks(presignedUrls, chunks);
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

    private async uploadChunks(presignedUrls: string[], chunks: Blob[]): Promise<Part[]> {
        if (this.filetsone) {
            this.filetsone.triggerHook('upload_multipart_chunk', presignedUrls, chunks);
        }
        const parts: Part[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const response = await fetch(presignedUrls[i], {
                method: "PUT",
                body: chunks[i],
            });

            if (!response.ok) {
                throw new Error(`Failed to upload part ${i + 1}`);
            }

            const eTag = response.headers.get("ETag");
            if (!eTag) {
                throw new Error(`Missing ETag for part ${i + 1}`);
            }

            parts.push({ PartNumber: i + 1, ETag: eTag });
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
