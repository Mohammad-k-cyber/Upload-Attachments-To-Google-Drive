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
  EXPECTED_EMAIL: 'cybermohammad2025@gmail.com',
  
  FILES_TO_UPLOAD: [
    '/home/cyberai/Downloads/📑 Phase 2.2.3 – Report.pdf',
    '/home/cyberai/Downloads/16mb.pdf',
    '/home/cyberai/Downloads/L3_Information_Technology_Volume2.pdf',
  ],
  
  SCOPES: ['https://www.googleapis.com/auth/drive'],
  PORT: 3000,
};

// ================================
// Browser Launcher (Cross-platform)
// ================================
function openBrowser(targetUrl) {
  const commands = {
    linux: `xdg-open "${targetUrl}"`,
    darwin: `open "${targetUrl}"`,
    win32: `start "" "${targetUrl}"`
  };
  
  const command = commands[process.platform];
  if (!command) return;
  
  exec(command, (error) => {
    if (!error) console.log('✅ Browser opened automatically');
  });
}

// ================================
// OAuth2 Authorization
// ================================
async function authorize() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CONFIG.CREDENTIALS_PATH, 'utf8'));
    
    let client_id, client_secret, redirect_uris;
    
    if (credentials.installed) {
      ({ client_id, client_secret, redirect_uris } = credentials.installed);
    } else if (credentials.web) {
      ({ client_id, client_secret, redirect_uris } = credentials.web);
      redirect_uris = redirect_uris?.length ? redirect_uris : [`http://localhost:${CONFIG.PORT}`];
    } else {
      throw new Error('Invalid credentials format');
    }
    
    const redirect_uri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    
    // Check for existing token
    if (fs.existsSync(CONFIG.TOKEN_PATH)) {
      try {
        const token = JSON.parse(fs.readFileSync(CONFIG.TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);
        await oAuth2Client.getAccessToken();
        console.log('✅ Loaded saved token');
        return oAuth2Client;
      } catch (tokenError) {
        console.log('⚠️  Token expired, re-authenticating...');
        fs.unlinkSync(CONFIG.TOKEN_PATH);
      }
    }
    
    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error('❌ Error reading credentials:', error.message);
    throw error;
  }
}

// ================================
// Get New OAuth Token
// ================================
async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CONFIG.SCOPES,
      prompt: 'consent',
    });
    
    console.log('\n🔐 Authentication required!');
    console.log('🌐 Opening browser for authorization...\n');
    console.log('If browser does not open, visit this URL:');
    console.log(authUrl);
    console.log('\n⏳ Waiting for login...\n');
    
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
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
                    padding: 50px;
                    border-radius: 15px;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.3);
                  }
                  h1 { color: #4CAF50; margin: 0 0 20px 0; }
                  p { color: #666; font-size: 18px; }
                  .success { font-size: 80px; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success">✅</div>
                  <h1>Authentication Successful!</h1>
                  <p>You can close this window now</p>
                  <p style="font-size: 14px; color: #999; margin-top: 20px;">
                    Returning to terminal...
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
              console.log('✅ Token saved successfully');
              resolve(oAuth2Client);
            } catch (error) {
              console.error('❌ Error getting token:', error.message);
              reject(error);
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    });
    
    server.listen(CONFIG.PORT, () => {
      console.log(`🌐 Server listening on http://localhost:${CONFIG.PORT}`);
      setTimeout(() => openBrowser(authUrl), 1000);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${CONFIG.PORT} already in use!`);
      }
      reject(error);
    });
    
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout: Authentication not completed within 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

// ================================
// User Info Retrieval
// ================================
async function getUserInfo(auth) {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const userInfo = await oauth2.userinfo.get();
    return {
      email: userInfo.data.email,
      name: userInfo.data.name,
    };
  } catch (error) {
    return null;
  }
}

// ================================
// Prompt User for Confirmation
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
// Create Timestamped Folder
// ================================
async function createUniqueFolder(auth) {
  const drive = google.drive({ version: 'v3', auth });
  
  const now = new Date();
  const folderName = `CyberMachine_${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${String(now.getHours()).padStart(2, '0')}/${String(now.getMinutes()).padStart(2, '0')}/${String(now.getSeconds()).padStart(2, '0')}`;
  
  console.log(`📁 Creating folder: ${folderName}`);
  
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name, webViewLink',
  });
  
  console.log(`✅ Folder created successfully!`);
  console.log(`🔗 Folder link: ${folder.data.webViewLink}`);
  
  return {
    id: folder.data.id,
    name: folder.data.name,
    link: folder.data.webViewLink,
  };
}

// ================================
// Upload Single File
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
// Upload Multiple Files
// ================================
async function uploadMultipleFiles(auth, filePaths, folderId) {
  const results = {
    successful: [],
    failed: [],
    total: filePaths.length,
  };
  
  console.log(`\n📦 Uploading ${filePaths.length} files...\n`);
  
  for (let i = 0; i < filePaths.length; i++) {
    console.log(`[${i + 1}/${filePaths.length}]`);
    
    const result = await uploadFile(auth, filePaths[i], folderId);
    
    if (result) {
      results.successful.push(result);
    } else {
      results.failed.push(filePaths[i]);
    }
    
    console.log('');
  }
  
  return results;
}

// ================================
// MIME Type Detection
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
// Save Upload History
// ================================
function saveUploadLog(folderInfo, results) {
  const logFileName = 'CYBER_MACHINE_UPLOAD_HISTORY.txt';
  
  const timestamp = new Date().toLocaleString('en-US', { 
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
  logContent += `🔗 Link: ${folderInfo.link}\n`;
  logContent += `${'='.repeat(70)}\n\n`;
  
  logContent += `✅ Successfully uploaded (${results.successful.length}):\n`;
  results.successful.forEach((file, index) => {
    logContent += `   ${index + 1}. ${file.name}\n`;
    logContent += `      📥 Download: ${file.downloadLink}\n`;
    logContent += `      🔗 View: ${file.viewLink}\n`;
  });
  
  if (results.failed.length > 0) {
    logContent += `\n❌ Failed uploads (${results.failed.length}):\n`;
    results.failed.forEach((filePath, index) => {
      logContent += `   ${index + 1}. ${path.basename(filePath)}\n`;
    });
  }
  
  logContent += `\n${'='.repeat(70)}\n`;
  
  fs.appendFileSync(logFileName, logContent);
  console.log(`📝 Log saved to: ${logFileName}`);
}

// ================================
// Main Function
// ================================
async function main() {
  // Reset token if --reset flag is provided
  if (process.argv.includes('--reset')) {
    if (fs.existsSync(CONFIG.TOKEN_PATH)) {
      fs.unlinkSync(CONFIG.TOKEN_PATH);
      console.log('✅ Token deleted. Please re-authenticate.\n');
    }
    return;
  }

  console.log('🤖 Starting CyberMachine Upload Process...\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Authentication
    console.log('🔐 Authenticating with Google Drive...');
    const auth = await authorize();
    
    // Display current account
    const userInfo = await getUserInfo(auth);
    if (userInfo) {
      console.log(`\n👤 Logged in as: ${userInfo.email}`);
      if (userInfo.name) {
        console.log(`👋 Hello, ${userInfo.name}!`);
      }
      
      // Warn if wrong account
      if (userInfo.email !== CONFIG.EXPECTED_EMAIL) {
        console.log(`\n${'⚠️'.repeat(35)}`);
        console.log(`⚠️  WARNING: Wrong account detected!`);
        console.log(`⚠️`);
        console.log(`⚠️  Current account: ${userInfo.email}`);
        console.log(`⚠️  Expected account: ${CONFIG.EXPECTED_EMAIL}`);
        console.log(`${'⚠️'.repeat(35)}`);
        
        console.log(`\n💡 To change account:`);
        console.log(`   1. Press Ctrl+C to stop`);
        console.log(`   2. Run: node Test_Google_Drive.JS --reset`);
        console.log(`   3. Re-run and login with ${CONFIG.EXPECTED_EMAIL}\n`);
        
        const answer = await askToContinue('❓ Continue with current account? (yes/no): ');
        
        if (answer !== 'yes' && answer !== 'y') {
          console.log('\n🛑 Process stopped');
          console.log('💡 Run: node Test_Google_Drive.JS --reset\n');
          process.exit(0);
        }
      } else {
        console.log(`✅ Correct account!\n`);
      }
    }
    
    // Step 2: Create unique folder
    console.log('\n' + '='.repeat(70));
    console.log('📂 Creating unique folder...');
    console.log('='.repeat(70));
    const folder = await createUniqueFolder(auth);
    
    // Step 3: Filter existing files
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
    
    // Step 4: Upload files
    console.log('\n' + '='.repeat(70));
    console.log('☁️ Uploading to Google Drive...');
    console.log('='.repeat(70));
    const results = await uploadMultipleFiles(auth, existingFiles, folder.id);
    
    // Step 5: Display results
    console.log('\n' + '='.repeat(70));
    console.log('✅ Processing complete!');
    console.log('='.repeat(70));
    console.log(`📊 Statistics:`);
    console.log(`   📤 Total files: ${results.total}`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log('='.repeat(70));
    
    // Step 6: Display file links
    if (results.successful.length > 0) {
      console.log('\n📋 Uploaded files:');
      results.successful.forEach((file, index) => {
        console.log(`\n${index + 1}. ${file.name}`);
        console.log(`   🔗 View: ${file.viewLink}`);
        console.log(`   📥 Download: ${file.downloadLink}`);
      });
    }
    
    // Step 7: Folder link
    console.log('\n' + '='.repeat(70));
    console.log(`📁 Folder Link: ${folder.link}`);
    console.log('='.repeat(70));
    
    // Step 8: Save log
    saveUploadLog(folder, results);
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.error('❌ Processing failed!');
    console.log('='.repeat(70));
    console.error('Reason:', error.message);
    console.log('='.repeat(70));
  }
}

// Run main function
main();

module.exports = { 
  authorize, 
  uploadFile, 
  uploadMultipleFiles, 
  createUniqueFolder, 
  getUserInfo 
};
