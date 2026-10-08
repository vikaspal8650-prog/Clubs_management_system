const fs = require('fs');
const path = require('path');

function searchInDir(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ldb') || entry.name.endsWith('.log'))) {
      try {
        const buf = fs.readFileSync(fullPath);
        // Chromium leveldb encodes string keys/values as UTF-8 or UTF-16LE.
        const utf8 = buf.toString('utf8');
        const utf16 = buf.toString('utf16le');
        
        for (const [encoding, str] of [['utf8', utf8], ['utf16', utf16]]) {
          if (str.includes('ccms_users_v1') || str.includes('usr_dsw') || str.includes('saurabhsrmscet123@gmail.com') || str.includes('usr_student_')) {
            console.log(`FOUND IN ${fullPath} (${encoding}):`);
            
            // Extract substrings that look like JSON arrays or objects containing usr_ or ccms
            const matches = str.match(/\[\s*\{\s*"id"\s*:\s*"usr_[^\]]+\]/g) || [];
            for (const m of matches) {
              console.log('Match len:', m.length, m.substring(0, 100));
            }
          }
        }
      } catch (e) {}
    }
  }
}

console.log('Searching Edge...');
searchInDir('C:\\Users\\vikas\\AppData\\Local\\Microsoft\\Edge\\User Data');

console.log('Searching Chrome...');
searchInDir('C:\\Users\\vikas\\AppData\\Local\\Google\\Chrome\\User Data');
