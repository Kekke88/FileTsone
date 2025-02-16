import { Settings } from "./Settings";

export class S3Settings extends Settings {
    initiateMultipartUrl: string = '';
    fetchPresignUrl: string = '';
    finalizeMultipartUrl: string = '';

    valid() {
        if (this.initiateMultipartUrl === '') {
            return false;
        }

        if (this.fetchPresignUrl === '') {
            return false;
        }

        if (this.finalizeMultipartUrl === '') {
            return false;
        }

        return true;
    }
}