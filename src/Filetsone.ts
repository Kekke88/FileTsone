import { S3Settings } from "./S3Settings";
import { S3MultipartUploader } from "./S3MultipartUploader";
import { ServerUploader } from "./ServerUploader";
import { Uploader } from "./Uploader";
import { Settings } from "./Settings";
import { Files } from "./Files";

type UploadMode = 's3' | 'server'

type HookMap = Map<string, ((...args: any[]) => void)[]>;

export default class FileTsone {
    element: HTMLElement;
    uploadOnDrop: boolean = false;
    mode: UploadMode = 'server';
    url: string = '';
    uploader: Uploader = new ServerUploader();
    s3Settings: S3Settings;
    settings: Settings;
    files: Files = new Files();

    hooks: HookMap = new Map();

    constructor(selector: string) {
        this.element = this.getElement<HTMLElement>(selector);
        this.s3Settings = new S3Settings();
        this.settings = new Settings();

        this.setupEventListeners();
    }

    public setUploadMode(uploader: UploadMode) {
        this.mode = uploader;

        if (this.mode == 's3') {
            this.uploader = new S3MultipartUploader();
        } else if (this.mode == 'server') {
            this.uploader = new ServerUploader();
        }
    }

    public process() {
        let files = this.files.get();
        if (files === null) return;

        this.triggerHook('processing', files);

        for (let i: number = 0; i < files.length; i++) {
            this.uploader.upload(this, files[i]);
        }
    }

    public registerHook(name: string, action: ((...args: any[]) => void)) {
        if (!this.hooks.has(name)) {
            this.hooks.set(name, []);
        }
        this.hooks.get(name)!.push(action);
    }

    public triggerHook(name: string, ...args: any[]) {
        this.hooks.get(name)?.forEach(action => action(...args));
    }

    private getElement<T extends Element>(selector: string): T {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element as T;
    }

    private supportsFolderDrop() {
        return (
            "DataTransferItem" in window &&
            "webkitGetAsEntry" in DataTransferItem.prototype
        );
    }

    private addFilesFromFolder(entry: FileSystemDirectoryEntry, path: string) {
        let reader = entry.createReader();

        reader.readEntries((entries) => {
            for (let entry of entries) {
                if (entry.isFile) {
                    //@ts-expect-error
                    entry.file((file) => {
                        file.dirPath = `${path}/${file.name}`;
                        this.triggerHook('dropped', file);
                        this.files.add(file);
                    });
                } else if (entry.isDirectory) {
                    this.addFilesFromFolder(entry as FileSystemDirectoryEntry, `${path}/${entry.name}`);
                }
            }
        })
    }

    private addFilesFromItems(items: DataTransferItemList) {
        for (const item of items) {
            const entry = item.webkitGetAsEntry();
            if (entry && entry.isDirectory) {
                this.addFilesFromFolder(entry as FileSystemDirectoryEntry, entry.name);
            } else if (entry && entry.isFile) {
                const file = item.getAsFile();
                if (!file) continue;

                this.triggerHook('dropped', file);
                this.files.add(file);
                if (this.settings.uploadOnDrop) {
                    this.uploader.upload(this, file);
                }
            }
        }
    }

    private setupEventListeners() {
        ["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
            this.element.addEventListener(event, e => e.preventDefault());
        });

        this.element.addEventListener("drop", async (event: DragEvent) => {
            const files = event.dataTransfer?.files;
            let items = event.dataTransfer?.items;

            if (this.supportsFolderDrop() && items) {
                this.addFilesFromItems(items);
            } else if (files && files.length > 0) {
                for (let i: number = 0; i < files.length; i++) {
                    this.files.add(files[i]);
                    this.triggerHook('dropped', files[i]);
                    if (this.settings.uploadOnDrop) {
                        this.uploader.upload(this, files[i]);
                    }
                }
            }
        });
    }
}
