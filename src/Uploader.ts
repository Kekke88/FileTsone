import FileTsone from "./Filetsone";

export interface Uploader {
    upload(filetsone: FileTsone, file: File): Promise<string>;
}