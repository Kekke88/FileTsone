var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class S3Uploader {
    constructor() {
        this.CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    }
    upload(filetsone, file) {
        return __awaiter(this, void 0, void 0, function* () {
            const chunks = this.splitFile(file);
            const key = yield this.initiateUpload(file);
            const presignedUrls = yield this.getPresignedUrls(key, chunks.length);
            const parts = yield this.uploadChunks(presignedUrls, chunks);
            return this.finalizeUpload(key, parts);
        });
    }
    /** Step 1: Split file into 5MB chunks */
    splitFile(file) {
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            chunks.push(file.slice(i * this.CHUNK_SIZE, (i + 1) * this.CHUNK_SIZE));
        }
        console.log(`File split into ${totalChunks} chunks.`);
        return chunks;
    }
    /** Step 2: Initiate the multipart upload and get the key */
    initiateUpload(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("/api/upload/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, size: file.size }),
            });
            if (!response.ok) {
                throw new Error("Failed to initiate upload");
            }
            const { key } = yield response.json();
            console.log("Upload initiated, key:", key);
            return key;
        });
    }
    /** Step 3: Request presigned URLs for each chunk */
    getPresignedUrls(key, totalChunks) {
        return __awaiter(this, void 0, void 0, function* () {
            const urls = [];
            for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
                const response = yield fetch(`/api/upload/presign?requestId=${key}&partNumber=${partNumber}`);
                if (!response.ok) {
                    throw new Error(`Failed to get presigned URL for part ${partNumber}`);
                }
                const { url } = yield response.json();
                urls.push(url);
            }
            console.log("Presigned URLs fetched.");
            return urls;
        });
    }
    /** Step 4: Upload each chunk and collect part numbers & ETags */
    uploadChunks(presignedUrls, chunks) {
        return __awaiter(this, void 0, void 0, function* () {
            const parts = [];
            for (let i = 0; i < chunks.length; i++) {
                const response = yield fetch(presignedUrls[i], {
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
                console.log(`Uploaded part ${i + 1}, ETag: ${eTag}`);
            }
            return parts;
        });
    }
    /** Step 5: Finalize the upload */
    finalizeUpload(key, parts) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("/api/upload/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ request_id: key, parts }),
            });
            if (!response.ok) {
                throw new Error("Failed to finalize upload");
            }
            const { url } = yield response.json();
            console.log("Upload finalized, file available at:", url);
            return url;
        });
    }
}
