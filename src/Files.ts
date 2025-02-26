export class Files {
    private queue: File[] = [];

    public add(file: File) {
        this.queue.push(file);
    }

    public remove(index: number) {
        if (index > -1 && index < this.queue.length) {
            this.queue.splice(index, 1);
        }
    }

    public clear() {
        this.queue = [];
    }

    public get(): File[] {
        return this.queue;
    }
}
