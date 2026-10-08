const fs = require('fs');
const path = require('path');

const leveldbDir = 'C:\\Users\\vikas\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb';
const files = fs.readdirSync(leveldbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));

for (const file of files) {
  const filePath = path.join(leveldbDir, file);
  try {
    const buf = fs.readFileSync(filePath);
    const str = buf.toString('latin1'); // latin1 preserves binary bytes as char codes
    
    // Search for ccms keys or json arrays
    if (str.includes('ccms_users_v1') || str.includes('ccms_clubs_v1') || str.includes('ccms_events_v1')) {
      console.log('FOUND KEY IN FILE:', file);
      
      // Let's extract matches for ccms_users_v1, ccms_clubs_v1, ccms_events_v1
      const keys = ['ccms_users_v1', 'ccms_clubs_v1', 'ccms_events_v1', 'ccms_attendance_v1', 'ccms_certificates_v1'];
      for (const k of keys) {
        const idx = str.indexOf(k);
        if (idx !== -1) {
          console.log(`Key ${k} found at index ${idx}`);
          // Find closest json array bracket [ ... ]
          const startBr = str.indexOf('[', idx);
          if (startBr !== -1) {
            // let's try to extract valid json
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
                console.log(`Successfully parsed JSON for key ${k}: length = ${parsed.length}`);
                fs.writeFileSync(`c:\\Users\\vikas\\OneDrive\\ドキュメント\\Desktop\\centralclubs\\server\\extracted_${k}.json`, JSON.stringify(parsed, null, 2));
              } catch (e) {
                console.log(`JSON parse error for ${k}:`, e.message);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Err reading file:', file, err.message);
  }
}
