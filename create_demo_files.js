const fs = require('fs');
const path = require('path');

const demoDir = path.join(__dirname, 'demo_files');
if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

// 1. Valid Minimal PDF for Passport
const passportPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 205 >>
stream
BT
/F1 20 Tf
70 720 Td
(BRITISH & BANGLADESH PASSPORT VAULT) Tj
0 -35 Td
/F1 12 Tf
(Holder Name: Russell Foyze) Tj
0 -20 Td
(Document Type: Official Passport Copy) Tj
0 -20 Td
(Status: Verified & Confidential) Tj
0 -20 Td
(Vault Access ID: MAH-VAULT-2026) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000501 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
580
%%EOF`;

fs.writeFileSync(path.join(demoDir, 'UK_Passport_Russell_Foyze.pdf'), Buffer.from(passportPdf));

// 2. Valid Minimal JPEG Image (Single pixel JPEG or valid binary)
// 1x1 base64 transparent/black JPEG header
const minimalJpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
fs.writeFileSync(path.join(demoDir, 'Skilled_Worker_BRP_Card.jpg'), Buffer.from(minimalJpgBase64, 'base64'));

// 3. Realistic Demo Document (DOCX dummy)
const docxDummy = `PK\x03\x04\x14\x00\x00\x00\x08\x00word/document.xml\nRussell Foyze Curriculum Vitae - Lead Software Engineer\nUniversity of Hertfordshire Graduate`;
fs.writeFileSync(path.join(demoDir, 'Software_Engineer_CV_2026.docx'), Buffer.from(docxDummy));

// 4. Car Insurance Certificate PDF
const insurancePdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 160 >>
stream
BT
/F1 18 Tf
70 720 Td
(CERTIFICATE OF MOTOR INSURANCE) Tj
0 -30 Td
/F1 12 Tf
(Vehicle: Nissan Leaf Acenta) Tj
0 -20 Td
(Policy Holder: Russell Foyze) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000456 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
535
%%EOF`;

fs.writeFileSync(path.join(demoDir, 'Nissan_Leaf_Insurance_Policy.pdf'), Buffer.from(insurancePdf));

console.log('Successfully generated 4 demo test files in:', demoDir);
