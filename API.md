# API Specification for SafetyCCTV AI Server

This document defines the API contract between the Spring Boot web server and the Python/Django AI analysis server.

---

### **Process Camera Frame**

- **Endpoint:** `POST /api/v1/analysis/process-camera`
- **Description:**
  Triggers the full process of frame capture, AI analysis, and result storage for a specific camera. The Spring server's scheduler will periodically call this API to trigger the AI server's main task.

#### **Server-Side Process**

Upon receiving this request, the AI server performs the following actions:
1.  Captures a frame from the specified camera's video stream.
2.  Performs object detection and density analysis on the frame.
3.  Generates two image files:
    -   **Raw Image:** The original captured frame.
    -   **Annotated Image:** The frame with bounding boxes drawn on detected objects.
4.  Saves these two images to a shared storage system (e.g., a local folder in development, Google Cloud Storage in production).
5.  Saves the analysis results (person count, density, etc.) along with the **paths** to the two saved images into the `analysis_logs` table in the database.

#### **Request Body**

```json
{
  "cameraId": 123
}
```

- `cameraId` (number, required): The unique ID of the camera to be analyzed.

#### **Success Response (`200 OK`)**

Returned when the analysis is successfully completed. The response includes a summary of the analysis and the paths to the generated images.

```json
{
  "status": "SUCCESS",
  "cameraId": 123,
  "cameraName": "Main Lobby",
  "personCount": 15,
  "density": 0.45,
  "rawImagePath": "/storage/captures/raw_123_1678886400.jpg",
  "annotatedImagePath": "/storage/captures/annotated_123_1678886400.jpg",
  "message": "Analysis was successfully completed."
}
```

#### **Error Response (e.g., `404 Not Found`, `500 Internal Server Error`)**

Returned if the camera cannot be found, or if an error occurs during the stream capture or analysis process.

```json
{
  "status": "ERROR",
  "cameraId": 123,
  "message": "Camera with ID 123 could not be found or stream processing failed."
}
```

#### **Security Note**

In a production environment, this endpoint must be secured (e.g., with an API key or via internal network policies) to ensure that only the Spring server can call it.
