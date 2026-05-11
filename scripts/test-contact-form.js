#!/usr/bin/env node

/**
 * Contact Form Test Script
 * Tests the contact form endpoint with sample data
 * Usage: node scripts/test-contact-form.js
 */

const http = require("http");

const BACKEND_HOST = "localhost";
const BACKEND_PORT = 3000;

const testPayload = {
  name: "ismail",
  email: "ismailbelhoula711@gmail.com",
  subject: "Testing SmartProperty Contact Form",
  message:
    "This is a test message to verify that the contact form is working correctly and emails are being sent to both the support inbox and the client confirmation address.",
};

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testPayload);

    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: "/api/contact",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log("🚀 Starting Contact Form Test...\n");
  console.log("📧 Test Payload:");
  console.log(JSON.stringify(testPayload, null, 2));
  console.log(
    "\n📤 Sending request to:",
    `http://${BACKEND_HOST}:${BACKEND_PORT}/api/contact`,
  );
  console.log("");

  try {
    const response = await makeRequest();

    console.log(`✅ Response Status: ${response.statusCode}`);
    console.log(`📋 Response Headers:`, response.headers);
    console.log(`\n📝 Response Body:`);

    try {
      const parsed = JSON.parse(response.body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(response.body);
    }

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log("\n✨ SUCCESS! Contact form submitted successfully.");
      console.log("\n📬 Expected email delivery:");
      console.log(
        `   1. Support inbox: smartproperty.tn@gmail.com (contains client message with reply-to: ${testPayload.email})`,
      );
      console.log(
        `   2. Client confirmation: ${testPayload.email} (confirmation of message receipt)`,
      );
      console.log("\n⏳ Check your email inboxes (may take a few seconds).");
    } else {
      console.log(
        "\n⚠️  Unexpected response code. Please verify backend is running and contact endpoint is working.",
      );
    }
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.error("\nℹ️  Make sure:");
    console.error(
      "   • Backend is running (npm run start:dev --prefix backend)",
    );
    console.error("   • Backend is running on port 3000");
    console.error("   • SMTP configuration is correct in .env");
  }
}

runTest();
