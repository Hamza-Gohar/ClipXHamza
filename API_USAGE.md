# ClipXHamza API Usage Guide

## 1. Creating Your API Key
The API Key is simply a password you define yourself. To "create" it:

1.  Open the `.env` file in the root directory (create one if it doesn't exist).
2.  Add a line `API_KEY=my_secure_password`.
    *   Example: `API_KEY=n8n_secret_123`
3.  Save the file and **restart the server** (`npm run dev` or `npm run server`).

## 2. Authentication
Pass your key via Header (recommended) or Query Parameter.
*   **Header Name**: `x-api-key`
*   **Value**: Your password from step 1.

---

## 3. n8n Integration Guide

To use this with n8n, use the **HTTP Request** node.

### Step 1: Configure the HTTP Request Node
*   **Method**: `POST`
*   **URL**: `http://your-server-ip:3000/api/clip?wait=true`
    *   *Note*: The `?wait=true` parameter is crucial for n8n. It tells the API to wait until the video is ready before responding, instead of sending a stream of updates.
*   **Authentication**: Generic Credential Type -> Header Auth (or just add a Header manually).
    *   **Name**: `x-api-key`
    *   **Value**: `your_api_key_here`

### Step 2: Set Body Parameters
*   **Send Body**: Toggle ON
*   **Body Content Type**: JSON
*   **JSON Body**:
    ```json
    {
      "url": "https://www.youtube.com/watch?v=EXAMPLE",
      "start": "00:00",
      "end": "00:30",
      "quality": "1080",
      "isVertical": false
    }
    ```

### Step 3: Handle the Output
The node will output a JSON object like this:
```json
{
  "status": "complete",
  "filePath": "...",
  "downloadUrl": "/api/download?path=...&filename=..."
}
```
You can then use the `downloadUrl` in a subsequent **HTTP Request** node (GET) to actually download the binary file and upload it to Google Drive, Telegram, etc.

---

## 4. Standard API Usage (Python/cURL)

### Get Video Metadata
**endpoint**: `GET /api/metadata`

```bash
curl "http://localhost:3000/api/metadata?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  -H "x-api-key: your_key"
```

### Create Clip (Streaming Mode)
**endpoint**: `POST /api/clip`
*Default behavior is Server-Sent Events (SSE) for real-time progress bars.*

```python
import requests

# ... (see previous guide for streaming example)
```

### Create Clip (Synchronous Mode)
**endpoint**: `POST /api/clip?wait=true`
*Use this for scripts where you don't need a progress bar.*

```python
import requests

response = requests.post(
    "http://localhost:3000/api/clip",
    params={"wait": "true"},
    headers={"x-api-key": "your_key"},
    json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "start": "00:00",
        "end": "00:15"
    }
)
print(response.json())
```
