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

        for( let i: number = 0; i < files.length; i++) {
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

    private setupEventListeners() {
        ["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
            this.element.addEventListener(event, e => e.preventDefault());
        });
        
        this.element.addEventListener("drop", async (event: DragEvent) => {            
            const files = event.dataTransfer?.files;

            if (files && files.length > 0) {
                for(let i: number = 0; i < files.length; i++) {
                    this.triggerHook('dropped', files[i]);

                    this.files.add(files[i]);
                    if (this.settings.uploadOnDrop) {
                        this.uploader.upload(this, files[i]);
                    }
                }
            }
        });
    }
}
