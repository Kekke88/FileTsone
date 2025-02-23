export class Files {
    private queue: File[] = [];

    public add(file: File) {
        this.queue.push(file);
    }

    public clear() {
        this.queue = [];
    }

    public get(): File[] {
        return this.queue;
    }
}
