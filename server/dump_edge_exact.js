const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\vikas\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb\\019781.ldb';
const buf = fs.readFileSync(filePath);

// Let's scan for strings starting with _ccms_ or ccms_
// Chromium leveldb stores local storage keys as e.g. _http://localhost:5173\x01ccms_users_v1
// The value is prefixed by a byte \x01 followed by the string value.

const str = buf.toString('latin1');

const keys = ['ccms_users_v1', 'ccms_clubs_v1', 'ccms_events_v1', 'ccms_attendance_v1', 'ccms_certificates_v1', 'ccms_current_user_v1'];

const results = {};

for (const k of keys) {
  let idx = 0;
  while ((idx = str.indexOf(k, idx)) !== -1) {
    console.log(`Found key ${k} at offset ${idx}`);
    // Search forward for [ or {
    let jsonStart = -1;
    for (let i = idx + k.length; i < idx + k.length + 100 && i < str.length; i++) {
      if (str[i] === '[' || str[i] === '{') {
        jsonStart = i;
        break;
      }
    }
    if (jsonStart !== -1) {
      const openChar = str[jsonStart];
      const closeChar = openChar === '[' ? ']' : '}';
      let depth = 0;
      let jsonEnd = -1;
      let inString = false;
      let escape = false;

      for (let i = jsonStart; i < str.length; i++) {
        const char = str[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === openChar) depth++;
          else if (char === closeChar) {
            depth--;
            if (depth === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
      }

      if (jsonEnd !== -1) {
        const rawJson = str.substring(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(rawJson);
          results[k] = parsed;
          console.log(`Successfully parsed ${k}:`, Array.isArray(parsed) ? `Array[${parsed.length}]` : typeof parsed);
        } catch (e) {
          console.log(`Failed to parse candidate for ${k}:`, e.message);
        }
      }
    }
    idx += k.length;
  }
}

fs.writeFileSync('c:\\Users\\vikas\\OneDrive\\ドキュメント\\Desktop\\centralclubs\\server\\edge_dump.json', JSON.stringify(results, null, 2));
console.log('Saved edge_dump.json with keys:', Object.keys(results));
