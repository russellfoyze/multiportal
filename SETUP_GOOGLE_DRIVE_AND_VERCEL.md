# MA HOSSAIN — Private Document Portal Setup Guide
### Google Drive API & Vercel Deployment

This guide explains how to connect your personal Google Drive to the portal and deploy it live to **Vercel** with zero monthly hosting costs.

---

## Part 1: Setting Up Google Drive API (Takes ~3 minutes)

The portal connects to Google Drive through a secure Google Cloud **Service Account**. This means your personal Google account password is never used or exposed.

### Step 1: Create a Google Cloud Project & Enable Google Drive API
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., **"MA Hossain Vault"**).
3. In the search bar at the top, type **"Google Drive API"** and click on it.
4. Click **Enable**.

### Step 2: Create a Service Account
1. In the left navigation menu, go to **IAM & Admin** &rarr; **Service Accounts**.
2. Click **+ Create Service Account**.
3. Enter a name (e.g., `vault-service-account`) and click **Create and Continue**.
4. You can leave the optional permissions blank and click **Done**.
5. Copy the generated Service Account Email address (e.g., `vault-service-account@your-project.iam.gserviceaccount.com`).

### Step 3: Generate a Private Key
1. In the Service Accounts list, click on the three dots (&vellip;) next to your newly created service account &rarr; **Manage keys**.
2. Click **Add Key** &rarr; **Create new key**.
3. Choose **JSON** and click **Create**.
4. A JSON file will automatically download to your computer.
5. Open this JSON file in a text editor (Notepad, VS Code):
   - Copy `client_email` &rarr; this will be your `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - Copy `private_key` &rarr; this will be your `GOOGLE_PRIVATE_KEY`.

### Step 4: Create a Dedicated Folder in Google Drive & Share It
1. Open [Google Drive](https://drive.google.com/).
2. Create a new folder (e.g. `MA HOSSAIN Vault`).
3. Right-click the folder &rarr; **Share** &rarr; **Share**.
4. In the "Add people" field, paste your **Service Account Email** from Step 2.
5. Ensure the permission is set to **Editor** and click **Send** (uncheck "Notify people" if prompted).
6. Open the folder in Google Drive and look at the browser URL:
   ```
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```
   The string of letters and numbers after `/folders/` (e.g. `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`) is your `GOOGLE_DRIVE_FOLDER_ID`.

---

## Part 2: Testing Locally

In the root of the project directory (`d:\PORTAL`), edit or create `.env.local`:

```env
# Google Drive API
GOOGLE_SERVICE_ACCOUNT_EMAIL="vault-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"

# Admin Authentication
PORTAL_ADMIN_EMAIL="akter@mahossain.com"
PORTAL_ADMIN_PASSWORD="YourSecurePassword2026!"

# Two-Factor Authentication (TOTP)
PORTAL_2FA_SECRET="JBSWY3DPEHPK3PXP"
PORTAL_2FA_ENABLED="true"

# Session Security (Any 32+ character random string)
SESSION_SECRET="mah-vault-production-secure-session-key-random-chars-12345"
```

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

> **Note:** If Google Drive credentials are not yet configured, the app will automatically run in **Demo Mode**, displaying sample files matching your design screenshot (Passport, Visa, CV, Graduation photo, etc.), allowing you to test all navigation, search, and preview controls immediately!

---

## Part 3: Deploying to Vercel

1. Push this project to your GitHub, GitLab, or Bitbucket account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MA HOSSAIN Private Document Portal"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
3. Import your repository.
4. In the **Environment Variables** section, add the following variables:

| Name | Value | Description |
| :--- | :--- | :--- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `vault-service@...iam.gserviceaccount.com` | Service account email |
| `GOOGLE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Full private key with quotes |
| `GOOGLE_DRIVE_FOLDER_ID` | `1aBcDeFg...` | ID of your shared Google Drive folder |
| `PORTAL_ADMIN_EMAIL` | `akter@mahossain.com` | Your portal login email |
| `PORTAL_ADMIN_PASSWORD` | `[Your Vault Password]` | Your secure login password |
| `PORTAL_2FA_SECRET` | `JBSWY3DPEHPK3PXP` | 16-char Base32 Authenticator secret |
| `PORTAL_2FA_ENABLED` | `true` | Enables/disables TOTP verification |
| `SESSION_SECRET` | `[32+ random characters]` | Secret for signing session cookies |

5. Click **Deploy**.
6. In ~60 seconds, your portal is live with free HTTPS and global CDN on Vercel!

---

## Part 4: Two-Factor Authentication (2FA) Details

- The portal implements standard RFC 6238 TOTP two-factor authentication compatible with:
  - **Google Authenticator**
  - **Microsoft Authenticator**
  - **Authy**
  - **1Password / Apple Keychain**
- To set up in your authenticator app, create a new manual account:
  - Account Name: `MA HOSSAIN Vault`
  - Secret Key: `JBSWY3DPEHPK3PXP` (or your custom `PORTAL_2FA_SECRET`)
  - Type: Time-based (TOTP)
- During local testing and demo mode, entering the bypass code `123456` will also grant access.
