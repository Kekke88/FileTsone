# FileTsone 🚀

FileTsone is a lightweight and flexible JavaScript library that enables seamless file uploads to Amazon S3 using **multipart uploads with presigned URLs**.

## 🌟 Features

- **Drag & Drop Support**: Easily add file uploads via a drag-and-drop interface.
- **Multipart Uploads**: Splits large files into **chunks** for efficient S3 uploads.
- **Customizable Hooks**: Tap into key upload events with powerful hooks.
- **Backend Agnostic**: You control the backend implementation for flexibility.
- **Your own styling**: Make the drag'n'drop div look and feels like you want.

---

## 📌 Installation

Simply include the **FileTsone** bundle in your project:

```html
<script type="module">
    import FileTsone from "./path/to/filetsone.bundle.js";
</script>
```

---

## 🚀 Usage

### Basic Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FileTsone Example</title>
</head>
<body>
    <div id="filetsone"></div>
    <div class="submitButton">Upload files</div>
    
    <script type="module">
        import FileTsone from "./path/to/filetsone.bundle.js";

        document.addEventListener("DOMContentLoaded", () => {
            let filetsone = new FileTsone("#filetsone");
            filetsone.setUploadMode('s3');
            filetsone.s3Settings.initiateMultipartUrl = 'http://localhost:8080/api/upload/initiate';
            filetsone.s3Settings.fetchPresignUrl = 'http://localhost:8080/api/upload/presign';
            filetsone.s3Settings.finalizeMultipartUrl = 'http://localhost:8080/api/upload/finalize';
            
            document.querySelector(".submitButton").addEventListener("click", () => filetsone.process());
        });
    </script>
</body>
</html>
```

---

## 🔥 Available Hooks

FileTsone provides a set of hooks that allow you to tap into different stages of the upload process.

| Hook Name                    | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `processing`                 | Triggered when the dropped files are being processed. |
| `dropped`                    | Triggered whenever a file is dropped into the tsone.  |
| `initiate_multipart_upload`  | Triggered when initiating a multipart upload.         |
| `get_multipart_presign_urls` | Triggered when fetching the presigned URLs.           |
| `upload_multipart_chunk`     | Triggered when uploading a multipart chunk.           |

### Registering Hooks

```js
filetsone.registerHook('processing', (queue) => {
    console.log("Processing queue", queue);
});

filetsone.registerHook('dropped', (file) => {
    console.log("Dropped file", file);
});
```

---

## 🏗️ Backend API Requirements

Your backend needs to implement the following **API endpoints**:

### 1️⃣ Initiate Multipart Upload

**Endpoint:** `POST /api/upload/initiate`

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| `name`    | string | The name of the file being uploaded. |

- **Headers:**
  - `Content-Type: application/json`
- **Response:** JSON object containing a `key` to identify the upload.

### 2️⃣ Get Presigned URL

**Endpoint:** `GET /api/upload/presign?requestId={key}&partNumber={partNumber}`

| Query Parameter | Type   | Description                                         |
| --------------- | ------ | --------------------------------------------------- |
| `requestId`     | string | The unique key returned from the initiate endpoint. |
| `partNumber`    | number | The chunk number being uploaded.                    |

- **Response:** JSON object containing a `url` to upload the chunk.

### 3️⃣ Finalize Multipart Upload

**Endpoint:** `POST /api/upload/finalize`

| Parameter    | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| `request_id` | string | The key received from the initiate endpoint. |
| `parts`      | array  | An array of `{ PartNumber, ETag }` pairs.    |

- **Headers:**
  - `Content-Type: application/json`
- **Response:** Success confirmation.

---

## 🎨 Styling FileTsone

```css
#filetsone {
    max-width: 400px;
    height: 200px;
    padding: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: "Quicksand", sans-serif;
    font-size: 20px;
    cursor: pointer;
    color: #cccccc;
    border: 4px dashed #009578;
    border-radius: 10px;
}
```

---

## 📜 License

This project is licensed under the MIT License.

