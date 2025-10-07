const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const readline = require('readline');

// ================================
// Configuration
// ================================
const CONFIG = {
  CREDENTIALS_PATH: '/home/cyberai/Downloads/WebCyberMachineCredentialsOuth.json',
  TOKEN_PATH: 'token.json',
  
  // ⚠️ Important: Expected account for upload
  EXPECTED_EMAIL: 'cybermohammad2025@gmail.com',
  
  // List of files to upload
  FILES_TO_UPLOAD: [
    '/home/cyberai/Downloads/📑 Phase 2.2.3 – Report.pdf',
    '/home/cyberai/Downloads/16mb.pdf',
    '/home/cyberai/Downloads/L3_Information_Technology_Volume2.pdf',
    // Add more files here
  ],
  
  SCOPES: ['https://www.googleapis.com/auth/drive'],
  PORT: 3000,
};

// ================================
// Copy to clipboard (optional)
// ================================
function copyToClipboard(text) {
  const platform = process.platform;
  let command;
  
  if (platform === 'linux') {
    command = `echo "${text}" | xclip -selection clipboard 2>/dev/null || echo "${text}" | xsel --clipboard 2>/dev/null`;
  } else if (platform === 'darwin') {
    command = `echo "${text}" | pbcopy`;
  } else if (platform === 'win32') {
    command = `echo ${text} | clip`;
  }
  
  if (command) {
    exec(command, (error) => {
      if (!error) {
        console.log('📋 Link copied to clipboard!');
      }
    });
  }
}

// ================================
// Open browser (works on Linux/Mac/Windows)
// ================================
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'linux') {
    command = `xdg-open "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  }
  
  if (command) {
    exec(command, (error) => {
      if (error) {
        console.log('⚠️  Browser did not open automatically');
      } else {
        console.log('✅ Browser opened');
      }
    });
  }
}

// ================================
// Load or create OAuth token
// ================================
async function authorize() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CONFIG.CREDENTIALS_PATH, 'utf8'));
    
    let client_id, client_secret, redirect_uris;
    
    if (credentials.installed) {
      ({ client_id, client_secret, redirect_uris } = credentials.installed);
    } else if (credentials.web) {
      ({ client_id, client_secret, redirect_uris } = credentials.web);
      if (!redirect_uris || redirect_uris.length === 0) {
        redirect_uris = [`http://localhost:${CONFIG.PORT}`];
      }
    } else {
      throw new Error('Invalid credentials format - must contain "installed" or "web"');
    }
    
    const redirect_uri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );
    
    if (fs.existsSync(CONFIG.TOKEN_PATH)) {
      try {
        const token = JSON.parse(fs.readFileSync(CONFIG.TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);
        
        try {
          await oAuth2Client.getAccessToken();
          console.log('✅ Loaded saved token');
          return oAuth2Client;
        } catch (tokenError) {
          console.log('⚠️  Token error:', tokenError.message);
          console.log('🔄 Re-authenticating...');
          fs.unlinkSync(CONFIG.TOKEN_PATH);
        }
      } catch (error) {
        console.log('⚠️  Invalid token, getting new token...');
      }
    }
    
    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error('❌ Error reading credentials:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Credentials file exists at:', CONFIG.CREDENTIALS_PATH);
    console.log('   2. OAuth 2.0 Client (Web Application) is created');
    console.log('   3. Redirect URI is added: http://localhost:' + CONFIG.PORT);
    throw error;
  }
}

// ================================
// Get new token with local server
// ================================
async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CONFIG.SCOPES,
      prompt: 'consent',
    });
    
    console.log('\n🔐 Login required!');
    console.log('🌐 Opening browser for authentication...\n');
    console.log('If it doesn\'t open automatically, open this link:');
    console.log(authUrl);
    console.log('\n⏳ Waiting for login...\n');
    
    let serverStarted = false;
    
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = new url.URL(req.url, `http://localhost:${CONFIG.PORT}`);
        
        if (parsedUrl.pathname === '/') {
          const code = parsedUrl.searchParams.get('code');
          
          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>Authorization Successful</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    text-align: center;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                  }
                  h1 { color: #4CAF50; margin: 0 0 20px 0; }
                  p { color: #666; font-size: 18px; }
                  .success { font-size: 60px; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success">✅</div>
                  <h1>Login Successful!</h1>
                  <p>You can close this window now</p>
                  <p style="font-size: 14px; color: #999; margin-top: 20px;">
                    Returning to Terminal...
                  </p>
                </div>
              </body>
              </html>
            `);
            
            server.close();
            
            try {
              const { tokens } = await oAuth2Client.getToken(code);
              oAuth2Client.setCredentials(tokens);
              
              fs.writeFileSync(CONFIG.TOKEN_PATH, JSON.stringify(tokens, null, 2));
              console.log('✅ Token saved successfully in:', CONFIG.TOKEN_PATH);
              console.log('✅ Google Drive authenticated successfully\n');
              
              resolve(oAuth2Client);
            } catch (error) {
              console.error('❌ Error getting token:', error.message);
              reject(error);
            }
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>❌ Error: No authorization code received</h1>');
            reject(new Error('No authorization code received'));
          }
        }
      } catch (error) {
        console.error('❌ Error processing request:', error);
        reject(error);
      }
    });
    
    server.listen(CONFIG.PORT, () => {
      serverStarted = true;
      console.log(`🌐 Server listening on http://localhost:${CONFIG.PORT}`);
      
      setTimeout(() => {
        openBrowser(authUrl);
      }, 1000);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${CONFIG.PORT} is already in use!`);
        console.log('💡 Try changing PORT in settings');
      } else {
        console.error('❌ Server error:', error.message);
      }
      reject(error);
    });
    
    setTimeout(() => {
      if (serverStarted) {
        server.close();
        reject(new Error('Timeout: Login not completed within 5 minutes'));
      }
    }, 5 * 60 * 1000);
  });
}

// ================================
// Ask to continue
// ================================
async function askToContinue(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// ================================
// Get user info
// ================================
async function getUserInfo(auth) {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const userInfo = await oauth2.userinfo.get();
    return {
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
    };
  } catch (error) {
    console.error('⚠️  Error getting user info:', error.message);
    return null;
  }
}

// ================================
// Create unique folder with timestamp
// ================================
async function createUniqueFolder(auth) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    
    // Create folder name with date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const folderName = `CyberMachine_${year}/${month}/${day}/${hours}/${minutes}/${seconds}`;
    
    console.log(`📁 Creating new folder: ${folderName}`);
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink',
    });
    
    console.log(`✅ Folder created successfully!`);
    console.log(`📂 Folder name: ${folder.data.name}`);
    
    // 🔥 Make folder public (anyone can access)
    console.log(`⏳ Making folder public...`);
    await drive.permissions.create({
      fileId: folder.data.id,
      requestBody: {
        role: 'reader',  // Can read/view only
        type: 'anyone',  // Anyone on the internet
      },
    });
    console.log(`✅ Folder is now public - anyone can access it!`);
    
    console.log(`🔗 Folder link: ${folder.data.webViewLink}`);
    
    // Create direct share link
    const shareLink = `https://drive.google.com/drive/folders/${folder.data.id}?usp=sharing`;
    
    return {
      id: folder.data.id,
      name: folder.data.name,
      link: folder.data.webViewLink,
      shareLink: shareLink,  // Direct share link
    };
  } catch (error) {
    console.error('❌ Error creating folder:', error.message);
    throw error;
  }
}

// ================================
// Upload single file
// ================================
async function uploadFile(auth, filePath, folderId) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   📤 Uploading: ${fileName} (${fileSizeMB} MB)`);
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType: getMimeType(fileName),
      body: fs.createReadStream(filePath),
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });
    
    // Make file public
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
    
    console.log(`   ✅ Uploaded: ${fileName}`);
    
    return {
      id: file.data.id,
      name: file.data.name,
      viewLink: file.data.webViewLink,
      downloadLink: `https://drive.google.com/uc?id=${file.data.id}&export=download`,
    };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

// ================================
// Upload multiple files
// ================================
async function uploadMultipleFiles(auth, filePaths, folderId) {
  const results = {
    successful: [],
    failed: [],
    total: filePaths.length,
  };
  
  console.log(`\n📦 Uploading ${filePaths.length} file(s)...\n`);
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    console.log(`[${i + 1}/${filePaths.length}]`);
    
    const result = await uploadFile(auth, filePath, folderId);
    
    if (result) {
      results.successful.push(result);
    } else {
      results.failed.push(filePath);
    }
    
    console.log(''); // Empty line
  }
  
  return results;
}

// ================================
// Get MIME type
// ================================
function getMimeType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// ================================
// Save upload log
// ================================
function saveUploadLog(folderInfo, results) {
  const logFileName = 'CYBER_MACHINE_UPLOAD_HISTORY.txt';
  
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Amman',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  let logContent = `\n${'='.repeat(70)}\n`;
  logContent += `📅 Date: ${timestamp}\n`;
  logContent += `📁 Folder: ${folderInfo.name}\n`;
  logContent += `🔗 Share Link: ${folderInfo.shareLink}\n`;
  logContent += `🔗 View Link: ${folderInfo.link}\n`;
  logContent += `${'='.repeat(70)}\n\n`;
  
  logContent += `✅ Successfully uploaded files (${results.successful.length}):\n`;
  results.successful.forEach((file, index) => {
    logContent += `   ${index + 1}. ${file.name}\n`;
    logContent += `      📥 Download Link: ${file.downloadLink}\n`;
    logContent += `      🔗 View Link: ${file.viewLink}\n`;
  });
  
  if (results.failed.length > 0) {
    logContent += `\n❌ Failed to upload files (${results.failed.length}):\n`;
    results.failed.forEach((filePath, index) => {
      logContent += `   ${index + 1}. ${path.basename(filePath)}\n`;
    });
  }
  
  logContent += `\n${'='.repeat(70)}\n`;
  
  fs.appendFileSync(logFileName, logContent);
  console.log(`📝 Log saved to: ${logFileName}`);
}

// ================================
// Quick command to reset token (before main)
// ================================
// To delete old token and re-authenticate, run:
// node TEST_GOOGLE_DRIVE.JS --reset
if (process.argv.includes('--reset')) {
  if (fs.existsSync(CONFIG.TOKEN_PATH)) {
    fs.unlinkSync(CONFIG.TOKEN_PATH);
    console.log('✅ token.json deleted');
    console.log('💡 Run the program again to authenticate with a new account\n');
  } else {
    console.log('⚠️  No token to delete\n');
  }
  process.exit(0);
}

// ================================
// Main function
// ================================
async function main() {
  console.log('🤖 Starting CyberMachine Upload Process...\n');
  console.log('='.repeat(70));
  
  try {
    // 1. Authentication
    console.log('🔐 Authenticating with Google Drive...');
    const auth = await authorize();
    
    // Display user account info
    const userInfo = await getUserInfo(auth);
    if (userInfo) {
      console.log(`\n👤 Logged in as: ${userInfo.email}`);
      if (userInfo.name) {
        console.log(`👋 Hello, ${userInfo.name}!`);
      }
      
      // Warning if different account
      if (userInfo.email !== CONFIG.EXPECTED_EMAIL) {
        console.log(`\n${'⚠️'.repeat(35)}`);
        console.log(`⚠️  Warning: You are logged in with wrong account!`);
        console.log(`⚠️`);
        console.log(`⚠️  Current account: ${userInfo.email}`);
        console.log(`⚠️  Required account: ${CONFIG.EXPECTED_EMAIL}`);
        console.log(`${'⚠️'.repeat(35)}`);
        
        console.log(`\n💡 To change account:`);
        console.log(`   1. Press Ctrl+C to stop the program`);
        console.log(`   2. Delete old token: rm token.json`);
        console.log(`   3. Run the program again`);
        console.log(`   4. Login with ${CONFIG.EXPECTED_EMAIL}\n`);
        
        const answer = await askToContinue('❓ Do you want to continue with current account? (yes/no): ');
        
        if (answer !== 'yes' && answer !== 'y') {
          console.log('\n🛑 Program stopped');
          console.log('💡 Delete token.json and try again\n');
          process.exit(0);
        }
        
        console.log('\n⏩ Continuing with current account...\n');
      } else {
        console.log(`✅ Correct account!\n`);
      }
    }
    
    // 2. Create unique folder
    console.log('\n' + '='.repeat(70));
    console.log('📂 Creating unique folder...');
    console.log('='.repeat(70));
    const folder = await createUniqueFolder(auth);
    
    // 3. Filter existing files only
    const existingFiles = CONFIG.FILES_TO_UPLOAD.filter(file => {
      const exists = fs.existsSync(file);
      if (!exists) {
        console.log(`⚠️  File not found: ${path.basename(file)}`);
      }
      return exists;
    });
    
    if (existingFiles.length === 0) {
      throw new Error('No files to upload!');
    }
    
    // 4. Upload files
    console.log('\n' + '='.repeat(70));
    console.log('☁️ Uploading to Google Drive...');
    console.log('='.repeat(70));
    const results = await uploadMultipleFiles(auth, existingFiles, folder.id);
    
    // 5. Display results
    console.log('\n' + '='.repeat(70));
    console.log('✅ Processing complete!');
    console.log('='.repeat(70));
    console.log(`📊 Statistics:`);
    console.log(`   📤 Total files: ${results.total}`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log('='.repeat(70));
    
    // 6. Display file links
    if (results.successful.length > 0) {
      console.log('\n📋 Uploaded files:');
      results.successful.forEach((file, index) => {
        console.log(`\n${index + 1}. ${file.name}`);
        console.log(`   🔗 View: ${file.viewLink}`);
        console.log(`   📥 Download: ${file.downloadLink}`);
      });
    }
    
    // 7. Folder links
    console.log('\n' + '='.repeat(70));
    console.log('📁 Folder links:');
    console.log('='.repeat(70));
    console.log(`📤 Share link (copy this): ${folder.shareLink}`);
    console.log(`🔗 Alternative link: ${folder.link}`);
    console.log('='.repeat(70));
    
    // Try to copy link automatically
    copyToClipboard(folder.shareLink);
    
    // 8. Save log
    saveUploadLog(folder, results);
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.error('❌ Processing failed!');
    console.log('='.repeat(70));
    console.error('Reason:', error.message);
    console.log('='.repeat(70));
  }
}

main();

module.exports = { authorize, uploadFile, uploadMultipleFiles, createUniqueFolder, getUserInfo };
