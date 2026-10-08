const fs = require('fs');
const path = require('path');

const leveldbDir = 'C:\\Users\\vikas\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb';
const files = fs.readdirSync(leveldbDir);

const keys = ['ccms_users_v1', 'ccms_clubs_v1', 'ccms_events_v1', 'ccms_attendance_v1', 'ccms_certificates_v1', 'ccms_current_user_v1'];

const extracted = {};

for (const file of files) {
  const filePath = path.join(leveldbDir, file);
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;
    const buf = fs.readFileSync(filePath);
    const str = buf.toString('latin1');
    
    for (const k of keys) {
      let searchIdx = 0;
      while ((searchIdx = str.indexOf(k, searchIdx)) !== -1) {
        const startBr = str.indexOf('[', searchIdx);
        const startObj = str.indexOf('{', searchIdx);
        
        // try array first
        if (startBr !== -1 && (startObj === -1 || startBr < startObj)) {
          let depth = 0;
          let endBr = -1;
          for (let i = startBr; i < str.length; i++) {
            if (str[i] === '[') depth++;
            else if (str[i] === ']') {
              depth--;
              if (depth === 0) {
                endBr = i;
                break;
              }
            }
          }
          if (endBr !== -1) {
            const candidate = str.substring(startBr, endBr + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (Array.isArray(parsed)) {
                if (!extracted[k] || parsed.length > extracted[k].length) {
                  extracted[k] = parsed;
                  console.log(`Extracted key ${k} (array len ${parsed.length}) from ${file}`);
                }
              }
            } catch (e) {}
          }
        }
        
        searchIdx += k.length;
      }
    }
  } catch (err) {}
}

for (const [k, val] of Object.entries(extracted)) {
  fs.writeFileSync(`c:\\Users\\vikas\\OneDrive\\ドキュメント\\Desktop\\centralclubs\\server\\edge_extracted_${k}.json`, JSON.stringify(val, null, 2));
}

console.log('Finished extraction. Keys found:', Object.keys(extracted));
