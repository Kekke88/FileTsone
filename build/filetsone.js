var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { S3Uploader } from "./S3Uploader";
import { ServerUploader } from "./ServerUploader";
export default class FileTsone {
    constructor(selector) {
        this.uploadOnDrop = false;
        this.mode = 'server';
        this.url = '';
        this.uploader = new ServerUploader();
        this.s3Settings = null;
        this.element = this.getElement(selector);
        this.setupEventListeners();
    }
    setUploadOnDrop(uploadOnDrop) {
        this.uploadOnDrop = uploadOnDrop;
    }
    setUploadMode(uploader) {
        this.mode = uploader;
        if (this.mode == 's3') {
            this.uploader = new S3Uploader();
        }
        else if (this.mode == 'server') {
            this.uploader = new ServerUploader();
        }
    }
    setUrl(url) {
        this.url = url;
    }
    getElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element;
    }
    setupEventListeners() {
        ["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
            this.element.addEventListener(event, e => e.preventDefault());
        });
        // Highlight when dragging over
        this.element.addEventListener("dragover", () => this.element.classList.add("dragover"));
        this.element.addEventListener("dragleave", () => this.element.classList.remove("dragover"));
        // Handle dropped files
        this.element.addEventListener("drop", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.element.classList.remove("dragover");
            const files = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.files;
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    if (this.uploadOnDrop) {
                        this.uploader.upload(this, files[i]);
                    }
                }
            }
        }));
    }
}
