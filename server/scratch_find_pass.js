const { execSync } = require('child_process');

const passwords = ['postgres', 'root', 'admin', '123456', 'password', '1234', 'vikas', 'centralclubs', 'ccms', ''];

for (const p of passwords) {
  try {
    const out = execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres -h 127.0.0.1 -c "\\l"`, {
      env: { ...process.env, PGPASSWORD: p },
      encoding: 'utf8'
    });
    console.log('WORKING PASSWORD FOR POSTGRES:', JSON.stringify(p));
    console.log(out);
    break;
  } catch (err) {
    // continue
  }
}
