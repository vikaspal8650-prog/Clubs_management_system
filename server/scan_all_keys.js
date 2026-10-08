const fs = require('fs');
const path = require('path');

const leveldbDir = 'C:\\Users\\vikas\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb';
const files = fs.readdirSync(leveldbDir);

for (const file of files) {
  const filePath = path.join(leveldbDir, file);
  try {
    const buf = fs.readFileSync(filePath);
    const str = buf.toString('utf8');
    const latin = buf.toString('latin1');
    
    ['ccms_users_v1', 'ccms_clubs_v1', 'ccms_events_v1', 'ccms_attendance_v1', 'ccms_certificates_v1', 'ccms_current_user_v1'].forEach(key => {
      let countUtf8 = (str.match(new RegExp(key, 'g')) || []).length;
      let countLatin = (latin.match(new RegExp(key, 'g')) || []).length;
      if (countUtf8 > 0 || countLatin > 0) {
        console.log(`File ${file}: key ${key} found (utf8: ${countUtf8}, latin1: ${countLatin})`);
      }
    });
  } catch (e) {}
}
