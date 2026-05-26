# Postman Testing Guide

This guide covers all backend endpoints in the File Sharing Web Application.

## Base URL

Use this as the collection base URL:

```text
http://localhost:3000
```

## Postman Environment Variables

Create a Postman environment with these variables:

```text
baseUrl = http://localhost:3000
token =
fileId =
shareToken =
```

## Recommended Test Flow

1. Register a user.
2. Login and save the JWT token.
3. Upload one or more files.
4. Copy the returned `fileId`.
5. Create a share link for that file.
6. Test the public share info endpoint.
7. Test the public download endpoint.
8. Test file listing, download, and delete.

## Authentication APIs

### 1) Register User

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/register`

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "firstName": "Locisi",
  "lastName": "Forexzig",
  "email": "locisi@forexzig.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "dateOfBirth": "1995-01-01"
}
```

**Expected:**

- `201 Created`
- JWT token
- user details

---

### 2) Login User

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/login`

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "email": "locisi@forexzig.com",
  "password": "Password123!"
}
```

**Expected:**

- `200 OK`
- JWT token
- user details

**Save token:**

- Use the response token value and store it in the Postman variable `token`.

---

### 3) Forgot Password

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/forgot-password`

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "email": "locisi@forexzig.com"
}
```

**Expected:**

- `200 OK`
- Generic success message
- Reset email sent if SMTP is configured correctly

---

### 4) Reset Password

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/reset-password`

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Expected:**

- `200 OK`
- Password updated successfully

---

### 5) Change Password

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/change-password`

**Headers:**

- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

**Body:**

```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Expected:**

- `200 OK`
- Password changed successfully

## File APIs

### 6) Upload Files

**Method:** `POST`
**URL:** `{{baseUrl}}/api/files/upload`

**Headers:**

- `Authorization: Bearer {{token}}`

**Body type:** `form-data`

**Field:**

- `files` = select one or more files

**Notes:**

- The backend accepts multiple files.
- File size limit is 100 MB per file.
- Total storage limit per user is 1 GB.

**Expected:**

- `201 Created`
- Uploaded file metadata in response

**Suggested test file:**

- Use the image file already in `server/uploads` if you want to test with an image.

---

### 7) List Files

**Method:** `GET`
**URL:** `{{baseUrl}}/api/files?page=1&limit=20&q=image`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- Only files owned by the logged-in user
- Pagination metadata

---

### 8) Download File

**Method:** `GET`
**URL:** `{{baseUrl}}/api/files/{{fileId}}/download`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- File downloads from Cloudinary
- `Content-Disposition` header is set

---

### 9) Delete File

**Method:** `DELETE`
**URL:** `{{baseUrl}}/api/files/{{fileId}}`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- File removed from database and Cloudinary

## Search APIs

### 10) Search Files

This endpoint now matches against both the file name and the extracted file content.

**Method:** `GET`
**URL:** `{{baseUrl}}/api/search?q=invoice&page=1&limit=20`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- Files whose name matches the query, files whose content matches the query, or files that match both
- Each result includes `matchCount` and `matches`
- `matches` entries may have `type: "fileName"` or `type: "content"`

**Example queries:**

- Search by file name: `q=report`
- Search by extracted content: `q=invoice`
- Search by both: `q=pdf`

---

### 11) Search Inside a File

**Method:** `GET`
**URL:** `{{baseUrl}}/api/files/{{fileId}}/search?q=invoice`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- Returns the file metadata plus matching snippets
- `matches` may include a file-name match and/or content matches

## Sharing APIs

### 12) Create Share

**Method:** `POST`
**URL:** `{{baseUrl}}/api/shares`

**Headers:**

- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

**Body:**

```json
{
  "fileId": "{{fileId}}",
  "recipientEmail": "rosoj86576@marineso.com",
  "expirationHours": 1,
  "message": "Test share from Postman"
}
```

To send the same share link to multiple people, you can also use:

```json
{
  "fileId": "{{fileId}}",
  "recipientEmails": ["rosoj86576@marineso.com", "someone.else@example.com"],
  "expirationHours": 1,
  "message": "Test share from Postman"
}
```

or a comma-separated string:

```json
{
  "fileId": "{{fileId}}",
  "recipientEmail": "rosoj86576@marineso.com, someone.else@example.com",
  "expirationHours": 1,
  "message": "Test share from Postman"
}
```

**Expected:**

- `201 Created`
- Unique share URL returned
- Share email sent to the recipient

---

### 13) List Shares

**Method:** `GET`
**URL:** `{{baseUrl}}/api/shares`

**Headers:**

- `Authorization: Bearer {{token}}`

**Expected:**

- `200 OK`
- Shares created by the logged-in user
- Includes recipient email and timestamps

---

### 12) Public Share Info

**Method:** `GET`
**URL:** `{{baseUrl}}/public/share/{{shareToken}}`

**Expected:**

- `200 OK`
- Shared file metadata
- Recipient email
- Expiry information

---

### 13) Public Share Download

**Method:** `GET`
**URL:** `{{baseUrl}}/public/share/{{shareToken}}/download`

**Expected:**

- `200 OK`
- File downloads without authentication if the token is valid and not expired

## Quick Postman Tips

- After login, save the token into the `token` environment variable.
- After upload, save the returned file `id` into `fileId`.
- After share creation, save the returned share token into `shareToken`.
- Use `Authorization: Bearer {{token}}` for protected routes.

## Example Test Sequence

1. Register user.
2. Login user.
3. Upload the image file.
4. Copy `fileId` from the upload response.
5. Create a share for `rosoj86576@marineso.com`.
6. Copy the returned `shareToken` from the share URL.
7. Open the public share info endpoint.
8. Open the public download endpoint.

## Expected Response Summary

- Register: `201 Created`
- Login: `200 OK`
- Upload: `201 Created`
- List files: `200 OK`
- Download: `200 OK`
- Delete: `200 OK`
- Create share: `201 Created`
- List shares: `200 OK`
- Public share info: `200 OK`
- Public download: `200 OK`
