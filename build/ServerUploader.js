var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class ServerUploader {
    upload(filetsone, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formData = new FormData();
                formData.append("file", file);
                const response = yield fetch(filetsone.url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (response.ok) {
                    const result = yield response.json(); // Assuming the server responds with JSON
                    return result;
                }
                else {
                    console.error("File upload failed.", response.statusText);
                }
            }
            catch (error) {
                console.error("Error during file upload:", error);
            }
            throw new Error('Upload failed');
        });
    }
}
