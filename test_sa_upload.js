const { google } = require('googleapis');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let key = env.GOOGLE_PRIVATE_KEY;
if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');

const auth = new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/drive']);
const drive = google.drive({ version: 'v3', auth });

async function testUpload() {
  try {
    const res = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: 'test_file.txt',
        parents: [env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'text/plain',
        body: 'Hello Google Drive',
      },
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR MESSAGE:', err.message);
    if (err.errors) console.error('DETAILS:', err.errors);
  }
}

testUpload();
