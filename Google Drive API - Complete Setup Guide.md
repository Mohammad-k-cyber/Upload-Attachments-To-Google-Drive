# 🚀 Google Drive API - Complete Setup Guide

This guide will walk you through setting up Google Drive API from scratch.

---

## 📋 Table of Contents
1. [Create Google Cloud Project](#1-create-google-cloud-project)
2. [Enable Google Drive API](#2-enable-google-drive-api)
3. [Configure OAuth Consent Screen](#3-configure-oauth-consent-screen)
4. [Create OAuth 2.0 Credentials](#4-create-oauth-20-credentials)
5. [Download Credentials File](#5-download-credentials-file)
6. [Add Test Users](#6-add-test-users)

---

## 1. Create Google Cloud Project

### Step 1: Go to Google Cloud Console
🔗 Visit: https://console.cloud.google.com

### Step 2: Create New Project
1. Click **Select a project** (top left)
2. Click **NEW PROJECT**
3. Fill in details:
   - **Project name**: `CyberMachine Drive Uploader`
   - **Organization**: Leave as default
   - **Location**: Leave as default
4. Click **CREATE**
5. Wait 10-20 seconds for project creation
6. Select the new project from the dropdown

✅ **Result**: You now have a Google Cloud Project!

---

## 2. Enable Google Drive API

### Step 1: Navigate to API Library
1. From the left menu: **APIs & Services** → **Library**
2. Or visit directly: https://console.cloud.google.com/apis/library

### Step 2: Search and Enable
1. In the search box, type: `Google Drive API`
2. Click on **Google Drive API** from results
3. Click the **ENABLE** button
4. Wait for the API to be enabled (5-10 seconds)

✅ **Result**: Google Drive API is now active for your project!

---

## 3. Configure OAuth Consent Screen

### Step 1: Navigate to OAuth Consent Screen
1. From the left menu: **APIs & Services** → **OAuth consent screen**
2. Or visit: https://console.cloud.google.com/apis/credentials/consent

### Step 2: Choose User Type
- Select: **External**
- Click **CREATE**

### Step 3: Fill App Information
**Page 1: OAuth consent screen**
- **App name**: `CyberMachine Drive Uploader`
- **User support email**: Select your email from dropdown
- **App logo**: Skip (optional)
- **App domain**: Skip (optional)
- **Authorized domains**: Skip (optional)
- **Developer contact information**: Enter your email

Click **SAVE AND CONTINUE**

**Page 2: Scopes**
- Click **SAVE AND CONTINUE** (leave empty)

**Page 3: Test users** (Important!)
- Click **+ ADD USERS**
- Enter your email: `cybermohammad2025@gmail.com`
- Click **ADD**
- Click **SAVE AND CONTINUE**

**Page 4: Summary**
- Review and click **BACK TO DASHBOARD**

✅ **Result**: OAuth consent screen is configured!

---

## 4. Create OAuth 2.0 Credentials

### Step 1: Navigate to Credentials
1. From the left menu: **APIs & Services** → **Credentials**
2. Or visit: https://console.cloud.google.com/apis/credentials

### Step 2: Create OAuth Client ID
1. Click **+ CREATE CREDENTIALS**
2. Select **OAuth client ID**

### Step 3: Configure Application Type
Select **Application type**: `Web application`

**Important**: Do NOT select "Desktop app"!

### Step 4: Fill Details
- **Name**: `CyberMachine Web Client`

**Authorized redirect URIs**:
- Click **+ ADD URI**
- Enter: `http://localhost:3000`
- Click **+ ADD URI** (add another)
- Enter: `urn:ietf:wg:oauth:2.0:oob`

### Step 5: Create
- Click **CREATE**
- A popup will appear with Client ID and Client Secret
- Click **OK** (we'll download the full JSON file next)

✅ **Result**: OAuth 2.0 Client created successfully!

---

## 5. Download Credentials File

### Method 1: From Creation Popup
- After creating, click **DOWNLOAD JSON**

### Method 2: From Credentials Page
1. Go to **APIs & Services** → **Credentials**
2. Under **OAuth 2.0 Client IDs**, find your client
3. Click the **Download** icon (⬇️) on the right
4. Save the file

### Step 3: Rename and Move File
```bash
# Rename the downloaded file
mv ~/Downloads/client_secret_*.json ~/Downloads/WebCyberMachineCredentialsOuth.json
```

✅ **Result**: You now have the credentials JSON file!

---

## 6. Add Test Users

### Why Add Test Users?
Your app is in "Testing" mode, so only specified users can authenticate.

### Step 1: Navigate to OAuth Consent Screen
1. **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users
1. Click **EDIT APP**
2. Navigate to **Test users** section (page 3)
3. Click **+ ADD USERS**
4. Enter email: `cybermohammad2025@gmail.com`
5. Click **ADD**
6. Click **SAVE AND CONTINUE** until the end

✅ **Result**: Your email is now authorized to use the app!

---

## 📝 Quick Summary

After completing all steps, you should have:

✅ Google Cloud Project created
✅ Google Drive API enabled
✅ OAuth consent screen configured
✅ OAuth 2.0 Client (Web application) created
✅ Credentials JSON file downloaded
✅ Test user added (your email)

---

## 🔍 Troubleshooting

### Issue: "Access blocked: App hasn't been verified"
**Solution**: This is normal! Your app is in Testing mode.
1. Click **Advanced**
2. Click **Go to [Your App Name] (unsafe)**
3. Click **Allow**

### Issue: "invalid_grant: Bad Request"
**Solution**: Token expired or corrupted
```bash
# Delete token and re-authenticate
rm token.json
node Test_Google_Drive.JS
```

### Issue: "redirect_uri_mismatch"
**Solution**: Add the correct redirect URI
1. Go to **Credentials** → Edit your OAuth Client
2. Add: `http://localhost:3000`
3. Save and wait 1 minute

### Issue: "API has not been used before"
**Solution**: Enable Google Drive API
- Visit: https://console.developers.google.com/apis/api/drive.googleapis.com
- Click **ENABLE**

---

## 🎯 Next Steps

After setup:
1. Update `CONFIG.CREDENTIALS_PATH` in the code
2. Update `CONFIG.EXPECTED_EMAIL` to your email
3. Run: `npm install googleapis`
4. Run: `node Test_Google_Drive.JS`

