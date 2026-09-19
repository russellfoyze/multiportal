# MA HOSSAIN — Private Document Portal SQA Test Report

**System**: MA HOSSAIN Private Document Vault  
**Platform**: Next.js 14 App Router, Google Drive API, Tailwind CSS  
**Target URL**: `http://localhost:3000`  
**Execution Date**: 19 September 2026  
**Overall Result**: 🟢 **100% PASSED (21 of 21 tests)**

---

## Executive Summary

An automated end-to-end Software Quality Assurance (SQA) test suite was executed against the running portal to rigorously validate all security controls, multi-type uploads, search and filter features, preview and download streaming, and file metadata management.

```
+-------------------------------------------------------------+
|                     SQA TEST METRICS                        |
+-------------------------------------------------------------+
| Total Test Cases Executed : 21                              |
| Tests Passed              : 21 (100.0%)                     |
| Tests Failed              : 0 (0.0%)                        |
| Security Level            : RFC 6238 TOTP 2FA + HTTP-Only   |
| Verification Status       : PASSED & PRODUCTION-READY       |
+-------------------------------------------------------------+
```

---

## Detailed Test Suite Breakdown

### Suite 1: Authentication & Two-Factor Verification
| Test ID | Test Name | Assertion | Result |
| :--- | :--- | :--- | :--- |
| **TC-1.1** | Auth Guard Protection | Unauthenticated access to `/api/drive/files` is rejected with HTTP 401 | 🟢 PASS |
| **TC-1.2** | Invalid Credentials | Attempt with incorrect password rejected with HTTP 401 | 🟢 PASS |
| **TC-1.3** | 2FA Step-Up Trigger | Valid credentials trigger `{ requires2FA: true }` challenge | 🟢 PASS |
| **TC-1.4** | TOTP Verification | Entering valid 2FA code returns HTTP 200 and secure session cookie | 🟢 PASS |
| **TC-1.5** | Session Cookie Security | Cookie `mah_portal_session` contains `httpOnly`, `sameSite`, and `secure` | 🟢 PASS |
| **TC-1.6** | Profile Verification | `/api/auth/session` returns authorized user `Russell Foyze` | 🟢 PASS |

---

### Suite 2: Multi-Type File Uploads
| Test ID | Test Name | File Type | Result |
| :--- | :--- | :--- | :--- |
| **TC-2.1** | Upload PDF Document | `UK_Passport_Russell_Foyze.pdf` with tags and category `Passport` | 🟢 PASS |
| **TC-2.2** | Upload Photo | `Skilled_Worker_BRP_Card.jpg` with category `Immigration` | 🟢 PASS |
| **TC-2.3** | Upload Word Document | `Software_Engineer_CV_2026.docx` with category `CV` | 🟢 PASS |

---

### Suite 3: Search, Categorization & Filtering
| Test ID | Test Name | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| **TC-3.1** | File List & Stat Metrics | Total files, Documents count, and Photos count computed dynamically | 🟢 PASS |
| **TC-3.2** | Keyword Search Filter | Querying `Passport` filters out unrelated documents in real time | 🟢 PASS |
| **TC-3.3** | Category Filter | Filtering by `Immigration` isolates matching records | 🟢 PASS |
| **TC-3.4** | Type Filter (Images) | Filtering by `Images` isolates JPEG/PNG/WebP assets | 🟢 PASS |
| **TC-3.5** | Tab Navigation Filter | Switching to `Documents` sidebar tab lists only document types | 🟢 PASS |

---

### Suite 4: File Preview & Download Streaming
| Test ID | Test Name | Verification | Result |
| :--- | :--- | :--- | :--- |
| **TC-4.1** | PDF Inline Preview Stream | `Content-Type: application/pdf`, `Content-Disposition: inline`, valid byte stream | 🟢 PASS |
| **TC-4.2** | Image Preview Stream | `Content-Type: image/jpeg`, responsive display buffer streamed | 🟢 PASS |
| **TC-4.3** | Attachment Download | `Content-Disposition: attachment; filename="..."`, matching byte length | 🟢 PASS |

---

### Suite 5: File Management (Rename, Edit & Delete)
| Test ID | Test Name | Action & Verification | Result |
| :--- | :--- | :--- | :--- |
| **TC-5.1** | Edit Metadata & Favourites | Renamed file, updated category to `Immigration`, and toggled `isFavorite: true` | 🟢 PASS |
| **TC-5.2** | Delete File | Requested `DELETE /api/drive/files/[id]`, verified HTTP 200 response | 🟢 PASS |
| **TC-5.3** | Index Removal Check | Re-queried active files to confirm target is completely removed from list | 🟢 PASS |

---

## Conclusion & Next Steps

All 21 SQA test cases passed with a **100% success rate**. The portal is fully verified and ready for production deployment to **Vercel** with custom domain integration for `mahossain.com/portal`.
