# ⚡ Quick Start Guide - All Commands

Complete setup in under 10 minutes!

---

## 📦 Step 1: Project Setup (2 minutes)

```bash
# Navigate to project directory
cd ~/cyber\ machine\ project/telegram-bot/

# Install dependencies
npm install googleapis

# Create required files (copy content from artifacts)
nano Test_Google_Drive.JS      # Main code
nano package.json               # Dependencies
nano .gitignore                # Git ignore rules
nano README.md                 # Documentation
nano SETUP_GUIDE.md           # API setup guide
nano LICENSE                  # MIT License
```

---

## 🔧 Step 2: Google API Setup (5 minutes)

### Quick Links:
1. **Create Project**: https://console.cloud.google.com
2. **Enable API**: https://console.cloud.google.com/apis/library
3. **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent
4. **Create Credentials**: https://console.cloud.google.com/apis/credentials

### Quick Steps:
```
1. Create Google Cloud Project
2. Enable "Google Drive API"
3. Configure OAuth Consent Screen (External)
   - Add test user: cybermohammad2025@gmail.com
4. Create OAuth 2.0 Client (Web Application)
   - Add redirect URI: http://localhost:3000
5. Download JSON credentials
```

---

## 🎯 Step 3: Configuration (1 minute)

```bash
# Move credentials file
mv ~/Downloads/client_secret_*.json ~/Downloads/WebCyberMachineCredentialsOuth.json

# Edit Test_Google_Drive.JS
nano Test_Google_Drive.JS
```

Update these lines:
```javascript
const CONFIG = {
  CREDENTIALS_PATH: '/home/cyberai/Downloads/WebCyberMachineCredentialsOuth.json',
  EXPECTED_EMAIL: 'cybermohammad2025@gmail.com',
  
  FILES_TO_UPLOAD: [
    '/path/to/file1.pdf',
    '/path/to/file2.jpg',
  ],
};
```

---

## 🚀 Step 4: First Run (1 minute)

```bash
# Run the program
node Test_Google_Drive.JS

# Follow browser prompts:
# 1. Select your Google account
# 2. Click "Advanced" → "Go to app (unsafe)"
# 3. Click "Allow"
# 4. Return to terminal
```

Expected output:
```
🤖 Starting CyberMachine Upload Process...
🔐 Authenticating with Google Drive...
🌐 Opening browser for authorization...
✅ Token saved successfully
👤 Logged in as: cybermohammad2025@gmail.com
✅ Correct account!
📁 Creating folder: CyberMachine_2025/10/07/15/30/45
✅ Folder created successfully!
📦 Uploading 2 files...
✅ Processing complete!
```

---

## 📤 Step 5: Upload to GitHub (2 minutes)

```bash
# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: CyberMachine Drive Uploader v1.0.0"

# Create GitHub repository at: https://github.com/new

# Add remote (replace USERNAME)
git remote add origin https://github.com/USERNAME/cybermachine-drive-uploader.git

# Push
git branch -M main
git push -u origin main
```

---

## ✅ Verification Checklist

- [ ] Google Drive API enabled
- [ ] OAuth Client created (Web Application)
- [ ] Test user added (your email)
- [ ] Credentials file downloaded
- [ ] Code configured with correct paths
- [ ] First authentication successful
- [ ] Files uploaded successfully
- [ ] .gitignore prevents sensitive files
- [ ] Repository pushed to GitHub

---

## 🔄 Daily Usage

```bash
# Update file list in Test_Google_Drive.JS
nano Test_Google_Drive.JS

# Run upload
node Test_Google_Drive.JS

# Reset authentication (if needed)
node Test_Google_Drive.JS --reset
```

---

## 📝 File Structure

```
your-project/
├── Test_Google_Drive.JS          # ✅ Main program
├── package.json                  # ✅ Dependencies
├── README.md                     # ✅ Documentation
├── SETUP_GUIDE.md               # ✅ API setup guide
├── LICENSE                      # ✅ MIT License
├── .gitignore                   # ✅ Git rules
├── token.json                   # 🔒 Auto-generated (not committed)
├── node_modules/                # 📦 Auto-installed (not committed)
└── CYBER_MACHINE_UPLOAD_HISTORY.txt  # 📊 Auto-generated log
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "API not enabled" | Visit: https://console.developers.google.com/apis/api/drive.googleapis.com → Enable |
| "redirect_uri_mismatch" | Add `http://localhost:3000` to OAuth Client |
| "invalid_grant" | Run: `node Test_Google_Drive.JS --reset` |
| "Port 3000 in use" | Change `PORT: 3001` in CONFIG |
| Wrong Google account | Run: `rm token.json` then re-run |

---

## 🎓 Learning Resources

- **Full Tutorial**: See `SETUP_GUIDE.md`
- **GitHub Guide**: See GitHub artifact above
- **Google API Docs**: https://developers.google.com/drive/api/v3/about-sdk
- **Node.js Docs**: https://nodejs.org/docs

---

## 🏆 Success Metrics

After setup, you should be able to:
- ✅ Upload multiple files in one command
- ✅ Generate timestamped folders automatically
- ✅ Create public shareable links
- ✅ View upload history
- ✅ Re-authenticate when needed
- ✅ Track all uploads in log file

---

## 💡 Pro Tips

```bash
# Upload specific files quickly
FILES_TO_UPLOAD: [
  '/home/cyberai/Downloads/*.pdf',  # All PDFs
]

# Change folder naming format
const folderName = `MyFolder_${Date.now()}`;

# Disable public sharing
// Comment out the permissions.create() call

# Upload to existing folder
FOLDER_ID: '1ABC...',  // Use specific folder ID
```

---

## 🎉 You're Done!

Your CyberMachine Drive Uploader is ready!

**Next time:**
```bash
node Test_Google_Drive.JS
```

That's it! 🚀
