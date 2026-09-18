# How to Run MA HOSSAIN Vault on Another Machine

You can copy this project to any other computer (Windows, macOS, or Linux) and run it with 1-click.

---

## Quick 1-Click Method (Recommended)

### On Windows:
1. Copy the `PORTAL` folder (or extract `MA_HOSSAIN_PORTAL_PORTABLE.zip`) onto your new computer.
2. Double-click **`run-portal.bat`**.
3. It will automatically:
   - Check if Node.js is installed (provides a download link if missing).
   - Install all required libraries (`npm install`).
   - Start the portal server.
   - Open **`http://localhost:3000`** in your default web browser automatically!

### On macOS / Linux:
1. Open Terminal in the portal folder.
2. Run:
   ```bash
   chmod +x run-portal.sh
   ./run-portal.sh
   ```
3. The portal will start and open in your browser at `http://localhost:3000`.

---

## Manual Method (Terminal / Command Prompt)

If you prefer running via terminal:

1. Open **Terminal** (Mac/Linux) or **PowerShell / Command Prompt** (Windows) inside the folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## Default Login Credentials

- **Email**: `akter@mahossain.com`
- **Password**: `PortalPass2026!`
- **2FA Verification Code**: `123456` (or check your configured Authenticator app)

---

## Google Drive Setup on New Machine

Your `.env.local` file is already pre-configured with your Google Drive OAuth and Service Account credentials.
- If you need to change the Google Drive folder, simply edit `GOOGLE_DRIVE_FOLDER_ID` in `.env.local`.
- If you run in Demo Mode without Google Drive configured, the portal will automatically use the local simulated vault so you can still view, upload, search, and manage files seamlessly.
