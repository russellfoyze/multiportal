# portal

# MA HOSSAIN — Private Document Portal

A secure, private document vault and management portal built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Google Drive API v3. Designed for personal document storage, preview, and categorization with 2FA protection, deployable seamlessly on Vercel.

## Features
- **Direct Google Drive Integration**: Store, retrieve, preview, and download documents and photos directly via Google Drive API v3.
- **Windows Explorer-Style Grid & List Views**:
  - Live photo and image thumbnails
  - Dedicated PDF, DOCX, and Video preview cards
  - Collapsible category / type sections
- **Dynamic Category Management**: Create and save custom document categories on the fly with immediate filtering.
- **Security & 2FA**:
  - JWT session cookies
  - TOTP-based Two-Factor Authentication (RFC 6238)
  - Protected API routes and security headers
- **Format Integrity**: Automatic MIME type detection and RFC 6266 `Content-Disposition` encoding to prevent file extension corruption across operating systems.
- **Vercel Ready**: Full edge and serverless compatibility with zero external database dependencies.

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- Google Cloud Project with Drive API enabled (OAuth 2.0 or Service Account)

### Installation
```bash
npm install
```

### Environment Setup
Copy `.env.example` to `.env.local` and fill in your Google Drive credentials and admin password:
```bash
cp .env.example .env.local
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel
1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables from `.env.local` in the Vercel Project Settings.
4. Deploy!
