const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const { google } = require('googleapis');
let privateKey = process.env.GOOGLE_PRIVATE_KEY;
if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

async function fix() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, originalFilename, mimeType)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  console.log('Files found in Drive:', res.data.files.length);
  for (const f of res.data.files) {
    console.log(`Checking ${f.id}: name="${f.name}", orig="${f.originalFilename}", mime="${f.mimeType}"`);
    if (f.id === '1m6qcRR1HMQw1YxKa6RwK3ZEYkbbRHzd2') {
      console.log('Renaming 1m6qcRR1HMQw1YxKa6RwK3ZEYkbbRHzd2 to Introduction of Ethics.pdf');
      await drive.files.update({
        fileId: f.id,
        requestBody: { name: 'Introduction of Ethics.pdf' },
        supportsAllDrives: true
      });
    } else if (f.name === 'ethis') {
      console.log('Renaming ethis to ethis.pdf');
      await drive.files.update({
        fileId: f.id,
        requestBody: { name: 'ethis.pdf' },
        supportsAllDrives: true
      });
    }
  }
  console.log('Done fixing Drive files');
}
fix().catch(console.error);
