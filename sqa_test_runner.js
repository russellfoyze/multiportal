const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

let sessionCookie = '';
let uploadedFiles = [];
let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${testName}] ${details}`);
    results.push({ testName, status: 'PASS', details });
  } else {
    failCount++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m [${testName}] ${details}`);
    results.push({ testName, status: 'FAIL', details });
  }
}

async function runSQASuite() {
  console.log('\n================================================================');
  console.log('       MA HOSSAIN — PRIVATE DOCUMENT PORTAL SQA TEST SUITE      ');
  console.log('================================================================');
  console.log(`Target Environment: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // =================================================================
  // SUITE 1: AUTHENTICATION & SECURITY
  // =================================================================
  console.log('--- SUITE 1: Authentication & Two-Factor Verification ---');

  // Test 1.1: Unauthenticated API Access Protection
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files`);
    assert(res.status === 401, 'Auth Guard', 'Unauthenticated request to /api/drive/files rejected with HTTP 401');
  } catch (err) {
    assert(false, 'Auth Guard', err.message);
  }

  // Test 1.2: Invalid Password Rejection
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'russellfoyze007@gmail.com', password: 'WrongPassword999!' }),
    });
    assert(res.status === 401, 'Invalid Password', 'Incorrect credentials rejected with HTTP 401');
  } catch (err) {
    assert(false, 'Invalid Password', err.message);
  }

  // Test 1.3: 2FA Challenge Trigger
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'russellfoyze007@gmail.com', password: 'PortalPass2026!' }),
    });
    const data = await res.json();
    assert(data.requires2FA === true, '2FA Challenge', 'Password passed, 2FA challenge correctly requested');
  } catch (err) {
    assert(false, '2FA Challenge', err.message);
  }

  // Test 1.4: Complete Login with 2FA TOTP
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'russellfoyze007@gmail.com',
        password: 'PortalPass2026!',
        totpCode: '123456',
      }),
    });
    assert(res.status === 200, '2FA Completion', 'Login with valid 2FA code returned HTTP 200');
    sessionCookie = res.headers.get('set-cookie') || '';
    assert(sessionCookie.includes('mah_portal_session'), 'Session Cookie', 'Secure HTTP-only session cookie issued');
  } catch (err) {
    assert(false, '2FA Completion', err.message);
  }

  // Test 1.5: Current Session Validation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(data.authenticated === true && data.user.name === 'Russell Foyze', 'Session Info', `Authenticated user: ${data.user?.name} (${data.user?.email})`);
  } catch (err) {
    assert(false, 'Session Info', err.message);
  }

  // =================================================================
  // SUITE 2: FILE UPLOADS WITH CUSTOM METADATA
  // =================================================================
  console.log('\n--- SUITE 2: Multi-Type File Uploads ---');

  const demoDir = path.join(__dirname, 'demo_files');

  // Test 2.1: Upload PDF Passport
  try {
    const passportBuffer = fs.readFileSync(path.join(demoDir, 'UK_Passport_Russell_Foyze.pdf'));
    const formData = new FormData();
    formData.append('file', new Blob([passportBuffer], { type: 'application/pdf' }), 'UK_Passport_Russell_Foyze.pdf');
    formData.append('displayName', 'Passport - Russell Foyze.pdf');
    formData.append('category', 'Passport');
    formData.append('tags', 'passport,uk,identity');
    formData.append('description', 'Official British/BD passport identity copy');

    const res = await fetch(`${BASE_URL}/api/drive/upload`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: formData,
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Upload PDF', `Uploaded: ${data.file?.name} (ID: ${data.file?.id})`);
    if (data.file) uploadedFiles.push(data.file);
  } catch (err) {
    assert(false, 'Upload PDF', err.message);
  }

  // Test 2.2: Upload JPEG Photo (BRP Card)
  try {
    const imgBuffer = fs.readFileSync(path.join(demoDir, 'Skilled_Worker_BRP_Card.jpg'));
    const formData = new FormData();
    formData.append('file', new Blob([imgBuffer], { type: 'image/jpeg' }), 'Skilled_Worker_BRP_Card.jpg');
    formData.append('displayName', 'Skilled Worker BRP Card.jpg');
    formData.append('category', 'Immigration');
    formData.append('tags', 'visa,brp,uk,home-office');
    formData.append('description', 'UK Skilled Worker biometric residence permit photo');

    const res = await fetch(`${BASE_URL}/api/drive/upload`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: formData,
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Upload Image', `Uploaded: ${data.file?.name} (${data.file?.formattedSize})`);
    if (data.file) uploadedFiles.push(data.file);
  } catch (err) {
    assert(false, 'Upload Image', err.message);
  }

  // Test 2.3: Upload DOCX Resume
  try {
    const docBuffer = fs.readFileSync(path.join(demoDir, 'Software_Engineer_CV_2026.docx'));
    const formData = new FormData();
    formData.append('file', new Blob([docBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'Software_Engineer_CV_2026.docx');
    formData.append('displayName', 'Software Engineer Master CV.docx');
    formData.append('category', 'CV');
    formData.append('tags', 'cv,resume,tech,employment');

    const res = await fetch(`${BASE_URL}/api/drive/upload`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: formData,
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Upload DOCX', `Uploaded: ${data.file?.name}`);
    if (data.file) uploadedFiles.push(data.file);
  } catch (err) {
    assert(false, 'Upload DOCX', err.message);
  }

  // =================================================================
  // SUITE 3: SEARCH, FILTERING & METRICS
  // =================================================================
  console.log('\n--- SUITE 3: Search, Categorization & Filtering ---');

  // Test 3.1: Fetch all files and verify metrics
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.files) && data.files.length > 0, 'List All Files', `Total files loaded: ${data.files?.length} items`);
    assert(data.stats?.totalFiles >= data.files.length, 'Stat Metrics', `Stats computed - Total: ${data.stats?.totalFiles}, Documents: ${data.stats?.documentsCount}, Photos: ${data.stats?.photosCount}`);
  } catch (err) {
    assert(false, 'List All Files', err.message);
  }

  // Test 3.2: Keyword Search Filter
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files?search=Passport`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    const allMatch = data.files.every((f) => f.name.toLowerCase().includes('passport') || f.category.toLowerCase().includes('passport'));
    assert(data.files.length > 0 && allMatch, 'Search Filter', `Query 'Passport' returned ${data.files.length} matching files`);
  } catch (err) {
    assert(false, 'Search Filter', err.message);
  }

  // Test 3.3: Category Filter
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files?category=Immigration`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    const allCategoryMatch = data.files.every((f) => f.category === 'Immigration');
    assert(data.files.length > 0 && allCategoryMatch, 'Category Filter', `Category 'Immigration' returned ${data.files.length} files`);
  } catch (err) {
    assert(false, 'Category Filter', err.message);
  }

  // Test 3.4: File Type Filter (Images)
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files?typeFilter=Images`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    const allImages = data.files.every((f) => f.mimeType.startsWith('image/'));
    assert(data.files.length > 0 && allImages, 'Type Filter (Images)', `Images filter returned ${data.files.length} image files`);
  } catch (err) {
    assert(false, 'Type Filter (Images)', err.message);
  }

  // Test 3.5: Tab Filter (Documents)
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files?tab=Documents`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(data.files.length > 0, 'Tab Filter (Documents)', `Documents tab filter returned ${data.files.length} items`);
  } catch (err) {
    assert(false, 'Tab Filter (Documents)', err.message);
  }

  // =================================================================
  // SUITE 4: INLINE PREVIEW & ATTACHMENT DOWNLOAD
  // =================================================================
  console.log('\n--- SUITE 4: File Preview & Download Streaming ---');

  const pdfFile = uploadedFiles.find((f) => f.name.endsWith('.pdf')) || { id: 'mock-1', name: 'mock.pdf' };
  const imgFile = uploadedFiles.find((f) => f.name.endsWith('.jpg')) || { id: 'mock-4', name: 'mock.jpg' };

  // Test 4.1: Stream Inline PDF Preview
  try {
    const res = await fetch(`${BASE_URL}/api/drive/preview/${pdfFile.id}`, {
      headers: { Cookie: sessionCookie },
    });
    const disposition = res.headers.get('content-disposition') || '';
    const contentType = res.headers.get('content-type') || '';
    const buffer = await res.arrayBuffer();

    assert(res.status === 200 && disposition.includes('inline') && buffer.byteLength > 0, 'PDF Inline Preview', `Status: 200, Content-Type: ${contentType}, Size: ${buffer.byteLength} bytes`);
  } catch (err) {
    assert(false, 'PDF Inline Preview', err.message);
  }

  // Test 4.2: Stream Image Preview
  try {
    const res = await fetch(`${BASE_URL}/api/drive/preview/${imgFile.id}`, {
      headers: { Cookie: sessionCookie },
    });
    const contentType = res.headers.get('content-type') || '';
    const buffer = await res.arrayBuffer();

    assert(res.status === 200 && buffer.byteLength > 0, 'Image Preview', `Status: 200, Content-Type: ${contentType}, Size: ${buffer.byteLength} bytes`);
  } catch (err) {
    assert(false, 'Image Preview', err.message);
  }

  // Test 4.3: Secure Attachment Download
  try {
    const res = await fetch(`${BASE_URL}/api/drive/download/${pdfFile.id}`, {
      headers: { Cookie: sessionCookie },
    });
    const disposition = res.headers.get('content-disposition') || '';
    const buffer = await res.arrayBuffer();

    assert(res.status === 200 && disposition.includes('attachment') && buffer.byteLength > 0, 'Attachment Download', `Header: ${disposition}, Received: ${buffer.byteLength} bytes`);
  } catch (err) {
    assert(false, 'Attachment Download', err.message);
  }

  // =================================================================
  // SUITE 5: METADATA UPDATES & FILE DELETION
  // =================================================================
  console.log('\n--- SUITE 5: File Management (Rename, Edit & Delete) ---');

  const targetFile = uploadedFiles[0] || { id: 'mock-1' };

  // Test 5.1: Update Metadata & Toggle Favorite
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files/${targetFile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        displayName: 'Passport - Russell Foyze (Updated).pdf',
        category: 'Immigration',
        isFavorite: true,
        tags: ['passport', 'russell', 'verified'],
      }),
    });
    const data = await res.json();
    assert(data.success === true && data.file.isFavorite === true, 'Edit Metadata & Favorite', `Updated: ${data.file?.name}, Favorite: ${data.file?.isFavorite}`);
  } catch (err) {
    assert(false, 'Edit Metadata & Favorite', err.message);
  }

  // Test 5.2: Delete File
  try {
    const res = await fetch(`${BASE_URL}/api/drive/files/${targetFile.id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(data.success === true, 'Delete File', `Successfully removed file ID: ${targetFile.id}`);

    // Verify file is gone
    const checkRes = await fetch(`${BASE_URL}/api/drive/files`, {
      headers: { Cookie: sessionCookie },
    });
    const checkData = await checkRes.json();
    const stillExists = checkData.files.some((f) => f.id === targetFile.id);
    assert(!stillExists, 'Verify Deletion', 'File successfully removed from active vault index');
  } catch (err) {
    assert(false, 'Delete File', err.message);
  }

  // =================================================================
  // SQA SUMMARY REPORT
  // =================================================================
  const total = passCount + failCount;
  const passRate = ((passCount / total) * 100).toFixed(1);

  console.log('\n================================================================');
  console.log('                     SQA TEST EXECUTION SUMMARY                 ');
  console.log('================================================================');
  console.log(`  Total Tests Run : ${total}`);
  console.log(`  Passed          : \x1b[32m${passCount}\x1b[0m`);
  console.log(`  Failed          : ${failCount > 0 ? `\x1b[31m${failCount}\x1b[0m` : '0'}`);
  console.log(`  Success Rate    : \x1b[32m${passRate}%\x1b[0m`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSQASuite();
