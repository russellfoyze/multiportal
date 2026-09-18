# MA HOSSAIN — Private Document Portal

## Project Goal

Build a secure private portal connected to the MA HOSSAIN website where an authorised user can sign in, search for documents or photos by name, preview them in the browser, and download them when needed.

Suggested portal URL:

`https://mahossain.com/portal`

The portal is intended for files such as:

- Passport and identity documents
- UK visa and immigration documents
- University documents and certificates
- CVs and employment documents
- Bills and personal records
- Car documents
- Business documents
- Portfolio files
- Personal photos
- Other private files

## Important Security Principle

The private documents must **not** be stored in a publicly accessible website folder such as:

`https://mahossain.com/uploads/passport.pdf`

The website should only provide the portal interface. The actual files should be stored in private cloud storage and only made available after successful authentication and authorisation.

## Recommended Architecture

```text
MA HOSSAIN Website
        |
        v
 /portal Login
        |
        v
 Authentication + 2FA
        |
        v
 Private Dashboard
        |
        +-------------------+
        |                   |
        v                   v
 Search Database      Private File Storage
        |                   |
        +---------+---------+
                  |
                  v
          Preview / Download
```

## Recommended Technology

### Front End

- Existing MA HOSSAIN HTML/CSS/JavaScript design
- Responsive portal interface for desktop, tablet and mobile
- Dark visual style matching the existing MA HOSSAIN portfolio

### Authentication

- Supabase Auth or an equivalent secure authentication service
- Email and password login
- Multi-factor authentication (2FA/MFA)
- Authenticator-app support preferred
- Secure session handling
- Automatic session expiry

### File Storage

- Private Supabase Storage bucket or equivalent private object storage
- Never use a public bucket for personal documents
- Every preview/download request must be authorised
- Temporary signed links can be used when appropriate

### Database

Use PostgreSQL/Supabase to store file metadata and search information. The database does not need to contain the large file itself.

Example metadata:

```text
File ID: 1052
Owner: user-id
Display Name: Jannatul - Skilled Worker Visa.pdf
Original Name: skilled_worker_visa.pdf
Category: Immigration
File Type: PDF
Tags: visa, jannatul, skilled-worker, uk
Storage Path: private/user-id/immigration/...
File Size: 1.8 MB
Uploaded: 18 September 2026
```

## Portal Pages

### 1. Login

Features:

- Email address
- Password
- 2FA/MFA verification
- Forgot password
- Secure sign-in
- Logout

### 2. Dashboard

Dashboard should show:

- Search bar
- Total files
- Documents count
- Photos count
- Recent files
- File categories
- Upload button

### 3. Search

The main search box should search:

- File name
- Category
- Tags
- Description

Examples:

`passport`

Could return:

- Passport - Md Akter Hossain.pdf
- Passport - Jannatul Ferdous.pdf
- Old Passport.jpg

`visa`

Could return:

- Jannatul - Skilled Worker Visa.pdf
- FLR Application.pdf
- Visa Decision Letter.pdf

### 4. Filters

Recommended filters:

- All Files
- PDF
- Images
- Word Documents
- Other

Additional category filters can include:

- Immigration
- Passport
- Visa
- University
- Employment
- CV
- Certificates
- Bills
- Car
- Business
- Photos
- Portfolio
- Other

### 5. File Preview

Where supported, the user should be able to preview a file before downloading it.

Examples:

- JPG/PNG/WebP photos — image preview
- PDF — embedded PDF preview
- Other formats — file information plus download option

### 6. Download

Downloads should only work for an authenticated user who is authorised to access that file.

Files should never rely on permanent publicly accessible URLs.

### 7. Upload

The portal should support:

- Drag-and-drop upload
- File picker
- File name
- Category
- Tags
- Description
- Upload progress
- File-type validation
- Maximum file-size validation

### 8. File Management

Owner controls should include:

- Rename
- Change category
- Add/edit tags
- Preview
- Download
- Replace file
- Delete
- Add/remove favourite

## Security Requirements

Because the portal may contain passports, visa documents and other sensitive information, security should be treated as a core feature rather than an optional extra.

### Required Controls

1. **Private storage** — personal files must never be placed in a public storage bucket.
2. **Authentication** — a user must sign in before accessing the portal.
3. **Multi-factor authentication** — enable 2FA/MFA for the account.
4. **Row Level Security (RLS)** — database/storage rules must limit a user to files they are authorised to access.
5. **HTTPS only** — production access should always use HTTPS.
6. **Temporary access** — use authenticated access or short-lived signed links for previews/downloads when appropriate.
7. **No secret keys in browser code** — privileged/service credentials must never be exposed in public JavaScript.
8. **Upload validation** — restrict allowed file types and sizes.
9. **Login protection** — use rate limiting and other available account-takeover protections.
10. **Session security** — provide logout and sensible session expiry.
11. **Backups/recovery** — plan for accidental deletion or account problems.
12. **Activity records** — optionally log uploads, downloads, deletes and important account events.

## Access-Control Model

Initial version:

```text
User: Md Akter Hossain
        |
        +-- Can view own files
        +-- Can search own files
        +-- Can upload files
        +-- Can download files
        +-- Can edit file information
        +-- Can delete own files
```

The first version can be a personal vault with a single primary account. The database and storage structure should still use an owner ID so multi-user support can be added later without rebuilding the system.

## Future Multi-User Version

Later, the portal could support accounts for:

- Family members
- Clients
- Staff
- Business customers

Each user should only see files assigned to that account.

Example:

```text
Akter Account
  -> Akter's private files

Jannatul Account
  -> Jannatul's authorised files

Client A
  -> Client A project files only
```

## Secure Sharing Feature

All files should be private by default.

A later version can provide a deliberate **Share** action that creates an expiring link for a particular document.

Possible expiry choices:

- 15 minutes
- 1 hour
- 24 hours
- Custom expiry

Possible use cases:

- Send one document to a solicitor
- Send a CV to an employer
- Share a certificate temporarily
- Give a client access to a deliverable

For highly sensitive documents, additional safeguards should be considered before enabling external sharing.

## Suggested Database Structure

### `profiles`

```text
id
email
full_name
created_at
```

### `files`

```text
id
owner_id
display_name
original_name
storage_path
mime_type
size_bytes
category
description
created_at
updated_at
```

### `tags`

```text
id
name
```

### `file_tags`

```text
file_id
tag_id
```

### Optional `activity_log`

```text
id
user_id
file_id
action
created_at
```

## Search Version 1

The first release should use fast conventional search across:

- File names
- Categories
- Tags
- Descriptions

This keeps the first version simple, predictable and inexpensive.

## Smart Search — Future Version

A later release could extract text from PDFs and use OCR for scanned documents/images.

This could support searches such as:

`Show me Jannatul's 2026 visa documents`

or:

`Find my University of Hertfordshire certificate`

Smart/OCR search should only be added after evaluating the privacy implications of any additional text-processing service.

## Recommended MVP

Version 1 should include:

- Secure login
- 2FA/MFA
- Personal account
- Private storage
- Dashboard
- Upload
- Search by file name
- Search by tags/category
- File-type filter
- PDF/image preview
- Download
- Rename/edit metadata
- Delete
- Logout
- Responsive mobile layout

## Version 2 Ideas

- Multiple users
- Expiring share links
- Activity history
- Favourites
- Folder view
- Advanced search
- OCR
- PDF content search
- Duplicate-file detection
- File version history
- Admin dashboard

## Security References

Official Supabase documentation:

- Storage access control and Row Level Security: https://supabase.com/docs/guides/storage/security/access-control
- Private storage and signed URLs: https://supabase.com/docs/guides/storage/serving/downloads
- Multi-factor authentication: https://supabase.com/docs/guides/auth/auth-mfa

## Build Plan

### Phase 1 — Foundation

1. Prepare `/portal` UI.
2. Create authentication system.
3. Enable MFA.
4. Create private storage bucket.
5. Create database tables.
6. Configure access policies/RLS.

### Phase 2 — File Features

1. Add secure uploads.
2. Save searchable metadata.
3. Build filename/category/tag search.
4. Add filters.
5. Add file preview.
6. Add authenticated download.
7. Add edit/delete controls.

### Phase 3 — Security Testing

Verify that:

- Logged-out users cannot list files.
- Logged-out users cannot preview files.
- Logged-out users cannot download files.
- Guessing a file name/path does not provide access.
- A user cannot access another user's storage path.
- Privileged credentials are not present in browser source code.
- Sessions expire correctly.
- 2FA is enforced as designed.
- Invalid/dangerous uploads are rejected.

### Phase 4 — Production

1. Connect the portal to the MA HOSSAIN website.
2. Use the production domain and HTTPS.
3. Create the primary user account.
4. Enable 2FA.
5. Test upload/search/preview/download from desktop and mobile.
6. Confirm backup/recovery procedures.
7. Upload real private documents only after the security tests pass.

## Final Recommendation

Build the first release as a **Personal Private Document Vault** integrated with the MA HOSSAIN website. Keep the website interface and file storage separate, use private storage with strict user-level access policies, and require strong authentication plus 2FA.

The architecture should be designed for multiple users from the beginning even if only one account is initially active. That keeps Version 1 straightforward while making a future family/client portal much easier to add.

---

Project: **MA HOSSAIN Private Document Portal**  
Document version: **1.0**  
Prepared: **18 September 2026**
