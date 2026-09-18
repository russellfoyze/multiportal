/**
 * Comprehensive Automated Security Audit & Verification Suite
 * Tests all authorization barriers, rate limiting, IDOR prevention, upload security, and headers.
 */

const BASE_URL = "http://localhost:3000";

async function runAudit() {
  console.log("==================================================================");
  console.log("  MA HOSSAIN Private Document Portal - Production Security Audit  ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = "") {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Category 1: Unauthenticated Public Access Barriers
  // -------------------------------------------------------------
  console.log("\n--- 1. Testing Unauthenticated Access to Protected APIs ---");

  try {
    const resFiles = await fetch(`${BASE_URL}/api/drive/files`);
    assert("GET /api/drive/files returns 401 Unauthorized without session", resFiles.status === 401, `Got ${resFiles.status}`);

    const resDownload = await fetch(`${BASE_URL}/api/drive/download/mock-1`);
    assert("GET /api/drive/download/mock-1 returns 401 Unauthorized without session", resDownload.status === 401, `Got ${resDownload.status}`);

    const resPreview = await fetch(`${BASE_URL}/api/drive/preview/mock-1`);
    assert("GET /api/drive/preview/mock-1 returns 401 Unauthorized without session", resPreview.status === 401, `Got ${resPreview.status}`);

    const resStatus = await fetch(`${BASE_URL}/api/drive/status`);
    assert("GET /api/drive/status returns 401 Unauthorized without session", resStatus.status === 401, `Got ${resStatus.status}`);

    const resUpload = await fetch(`${BASE_URL}/api/drive/upload`, { method: "POST" });
    assert("POST /api/drive/upload returns 401 Unauthorized without session", resUpload.status === 401, `Got ${resUpload.status}`);

    const resPatch = await fetch(`${BASE_URL}/api/drive/files/mock-1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Hacked" }),
    });
    assert("PATCH /api/drive/files/mock-1 returns 401 Unauthorized without session", resPatch.status === 401, `Got ${resPatch.status}`);

    const resDelete = await fetch(`${BASE_URL}/api/drive/files/mock-1`, { method: "DELETE" });
    assert("DELETE /api/drive/files/mock-1 returns 401 Unauthorized without session", resDelete.status === 401, `Got ${resDelete.status}`);

    const resGoogleAuth = await fetch(`${BASE_URL}/api/auth/google`, { redirect: "manual" });
    assert(
      "GET /api/auth/google denies unauthenticated OAuth trigger (redirect to login or 401)",
      resGoogleAuth.status === 307 || resGoogleAuth.status === 302 || resGoogleAuth.status === 401,
      `Got ${resGoogleAuth.status}`
    );
  } catch (err) {
    console.error("Error in Category 1 tests:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Category 2: HTTP Security Headers
  // -------------------------------------------------------------
  console.log("\n--- 2. Testing HTTP Defense-in-Depth Security Headers ---");

  try {
    const resHeaders = await fetch(`${BASE_URL}/login`);
    const xContentType = resHeaders.headers.get("x-content-type-options");
    const xFrame = resHeaders.headers.get("x-frame-options");
    const referrerPolicy = resHeaders.headers.get("referrer-policy");

    assert("X-Content-Type-Options: nosniff is enforced", xContentType === "nosniff", `Got ${xContentType}`);
    assert("X-Frame-Options is set (SAMEORIGIN or DENY)", xFrame === "SAMEORIGIN" || xFrame === "DENY", `Got ${xFrame}`);
    assert("Referrer-Policy is strict-origin-when-cross-origin", referrerPolicy === "strict-origin-when-cross-origin", `Got ${referrerPolicy}`);
  } catch (err) {
    console.error("Error in Category 2 tests:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Category 3: Authentication & 2FA Flow
  // -------------------------------------------------------------
  console.log("\n--- 3. Testing Authentication & Session Cookie Creation ---");

  let sessionCookie = "";
  try {
    // Step 1: Password step (requires 2FA)
    const loginStep1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "akter@mahossain.com",
        password: "PortalPass2026!",
      }),
    });
    const step1Data = await loginStep1.json();
    assert("Step 1 with correct password demands 2FA verification", step1Data.requires2FA === true, JSON.stringify(step1Data));

    // Step 2: Invalid 2FA code is rejected
    const invalid2FA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "akter@mahossain.com",
        password: "PortalPass2026!",
        totpCode: "000000",
      }),
    });
    assert("Invalid 2FA code is rejected with 401", invalid2FA.status === 401, `Got ${invalid2FA.status}`);

    // Step 3: Valid demo 2FA code succeeds in dev mode
    const validLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "akter@mahossain.com",
        password: "PortalPass2026!",
        totpCode: "123456",
      }),
    });
    assert("Valid 2FA succeeds with 200 OK", validLogin.status === 200, `Got ${validLogin.status}`);

    const rawCookies = validLogin.headers.get("set-cookie");
    if (rawCookies && rawCookies.includes("mah_portal_session=")) {
      const match = rawCookies.match(/mah_portal_session=([^;]+)/);
      sessionCookie = match ? match[1] : "";
    }
    assert("Encrypted session cookie 'mah_portal_session' is issued", Boolean(sessionCookie), "Cookie was empty");
  } catch (err) {
    console.error("Error in Category 3 tests:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Category 4: IDOR, BOLA & Scoping Protections (Authenticated)
  // -------------------------------------------------------------
  console.log("\n--- 4. Testing IDOR, Folder Scoping & Invalid ID Protections ---");

  if (sessionCookie) {
    const authHeaders = {
      Cookie: `mah_portal_session=${sessionCookie}`,
    };

    try {
      // Test 4.1: Access valid mock file
      const validMock = await fetch(`${BASE_URL}/api/drive/download/mock-1`, { headers: authHeaders });
      assert("Authenticated user can download authorized vault file (mock-1)", validMock.status === 200, `Got ${validMock.status}`);

      // Test 4.2: IDOR - Request non-existent or out-of-scope file ID
      const idorMock = await fetch(`${BASE_URL}/api/drive/download/mock-999999`, { headers: authHeaders });
      assert("IDOR request for non-existent file ID returns 404 (no synthetic leak)", idorMock.status === 404, `Got ${idorMock.status}`);

      // Test 4.3: Path traversal attempt in fileId
      const traversal = await fetch(`${BASE_URL}/api/drive/download/..%2F..%2Fetc%2Fpasswd`, { headers: authHeaders });
      assert("Path traversal in fileId returns 400 or 404", traversal.status === 400 || traversal.status === 404, `Got ${traversal.status}`);

      // Test 4.4: Malformed characters in fileId
      const malformedEncoded = await fetch(`${BASE_URL}/api/drive/download/%3Cscript%3Ealert(1)`, { headers: authHeaders });
      assert("XSS / special characters in fileId rejected with 400 Bad Request", malformedEncoded.status === 400, `Got ${malformedEncoded.status}`);

      const malformedSlash = await fetch(`${BASE_URL}/api/drive/download/<script>alert(1)</script>`, { headers: authHeaders });
      assert("Malformed path with slashes rejected (400 or 404)", malformedSlash.status === 400 || malformedSlash.status === 404, `Got ${malformedSlash.status}`);

      // Test 4.5: PATCH on non-existent file returns 404
      const patchNonExistent = await fetch(`${BASE_URL}/api/drive/files/mock-nonexistent`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: "Test Rename" }),
      });
      assert("PATCH on non-existent or inaccessible file returns 404", patchNonExistent.status === 404, `Got ${patchNonExistent.status}`);

      // Test 4.6: DELETE on non-existent file returns 404
      const deleteNonExistent = await fetch(`${BASE_URL}/api/drive/files/mock-nonexistent`, {
        method: "DELETE",
        headers: authHeaders,
      });
      assert("DELETE on non-existent or inaccessible file returns 404", deleteNonExistent.status === 404, `Got ${deleteNonExistent.status}`);

      // Test 4.7: Status check masks sensitive folderId
      const statusRes = await fetch(`${BASE_URL}/api/drive/status`, { headers: authHeaders });
      const statusData = await statusRes.json();
      assert("Authenticated status endpoint succeeds", statusRes.status === 200, `Got ${statusRes.status}`);
      if (statusData.folderId) {
        assert("Folder ID is masked with bullets in status output", statusData.folderId.includes("••••"), `folderId was: ${statusData.folderId}`);
      }
    } catch (err) {
      console.error("Error in Category 4 tests:", err);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Category 5: Malicious File Upload Rejection
  // -------------------------------------------------------------
  console.log("\n--- 5. Testing Upload Validation & Executable Blacklist ---");

  if (sessionCookie) {
    const authHeaders = {
      Cookie: `mah_portal_session=${sessionCookie}`,
    };

    try {
      // Test 5.1: Attempt to upload an executable file (.exe)
      const formExe = new FormData();
      const exeBlob = new Blob(["MZ...executable binary payload"], { type: "application/x-msdownload" });
      formExe.append("file", exeBlob, "malware.exe");
      formExe.append("displayName", "Trojan Payload");

      const exeRes = await fetch(`${BASE_URL}/api/drive/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formExe,
      });
      assert("Executable file upload (.exe) is rejected with 400 Bad Request", exeRes.status === 400, `Got ${exeRes.status}`);

      // Test 5.2: Attempt to upload a bash script (.sh)
      const formSh = new FormData();
      const shBlob = new Blob(["#!/bin/bash\nrm -rf /"], { type: "application/x-sh" });
      formSh.append("file", shBlob, "exploit.sh");

      const shRes = await fetch(`${BASE_URL}/api/drive/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formSh,
      });
      assert("Shell script upload (.sh) is rejected with 400 Bad Request", shRes.status === 400, `Got ${shRes.status}`);

      // Test 5.3: Attempt to upload a PHP script (.php)
      const formPhp = new FormData();
      const phpBlob = new Blob(["<?php phpinfo(); ?>"], { type: "application/x-php" });
      formPhp.append("file", phpBlob, "backdoor.php");

      const phpRes = await fetch(`${BASE_URL}/api/drive/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formPhp,
      });
      assert("PHP script upload (.php) is rejected with 400 Bad Request", phpRes.status === 400, `Got ${phpRes.status}`);

      // Test 5.4: Empty 0-byte file upload
      const formEmpty = new FormData();
      const emptyBlob = new Blob([], { type: "application/pdf" });
      formEmpty.append("file", emptyBlob, "empty.pdf");

      const emptyRes = await fetch(`${BASE_URL}/api/drive/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formEmpty,
      });
      assert("Empty (0-byte) file upload is rejected with 400 Bad Request", emptyRes.status === 400, `Got ${emptyRes.status}`);
    } catch (err) {
      console.error("Error in Category 5 tests:", err);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Category 6: Rate Limiting & Brute Force Lockout
  // -------------------------------------------------------------
  console.log("\n--- 6. Testing Rate Limiting & Lockout Defense ---");

  try {
    let received429 = false;
    let retryAfterHeader = null;

    // Send 7 rapid failed login attempts with invalid credentials
    for (let i = 1; i <= 7; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "198.51.100.42", // Simulate unique attacker IP
        },
        body: JSON.stringify({
          email: "attacker@random.com",
          password: `BadPass_${i}`,
        }),
      });

      if (res.status === 429) {
        received429 = true;
        retryAfterHeader = res.headers.get("retry-after");
        break;
      }
    }

    assert("Brute force attacker receives 429 Too Many Requests lockout", received429, "Never received 429");
    assert("Rate limiter provides valid Retry-After header", Boolean(retryAfterHeader), `Retry-After: ${retryAfterHeader}`);
  } catch (err) {
    console.error("Error in Category 6 tests:", err);
    failed++;
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  Security Audit Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
