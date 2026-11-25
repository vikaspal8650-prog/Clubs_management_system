// Run only against an isolated disposable test database.
// Example: LOAD_TEST_CONFIRM=YES LOAD_TEST_BASE_URL=http://localhost:3001/api LOAD_TEST_SECRET=... node scripts/load-test-auth.js
const baseUrl = (process.env.LOAD_TEST_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const secret = process.env.LOAD_TEST_SECRET;
if (process.env.LOAD_TEST_CONFIRM !== 'YES' || !secret || secret.length < 8) {
  console.error('Set LOAD_TEST_CONFIRM=YES and a dedicated LOAD_TEST_SECRET (8+ chars) before running.');
  process.exit(1);
}

const samples = [];
const results = [];
const dbErrors = [];

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
};

async function post(path, body, tag) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const elapsedMs = performance.now() - started;
    samples.push(elapsedMs);
    const payload = await response.json().catch(() => ({}));
    const result = { tag, status: response.status, elapsedMs, error: payload.error };
    results.push(result);
    if (response.status >= 500) dbErrors.push(result);
    return result;
  } catch (error) {
    const result = { tag, status: 0, elapsedMs: performance.now() - started, error: error.message };
    results.push(result);
    dbErrors.push(result);
    return result;
  }
}

const makeStudent = (batch, index) => {
  const suffix = `${Date.now()}${batch}${String(index).padStart(4, '0')}`.slice(-13);
  return {
    name: `Load Test ${batch}-${index}`,
    email: `load-${batch}-${index}-${Date.now()}@example.invalid`,
    rollNumber: suffix,
    branch: 'Computer Science',
    year: '1st Year',
    semester: 'Semester 1',
    password: secret,
  };
};

async function batch(size, label) {
  const startAt = performance.now();
  const batchResults = await Promise.all(Array.from({ length: size }, (_, index) => post('/auth/register', makeStudent(label, index), label)));
  const latencies = batchResults.map((result) => result.elapsedMs);
  const counts = batchResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ batch: label, attempted: size, counts, elapsedMs: Math.round(performance.now() - startAt), p95Ms: Math.round(percentile(latencies, 0.95)), p99Ms: Math.round(percentile(latencies, 0.99)) }));
}

(async () => {
  for (const size of [10, 50, 100, 500]) await batch(size, `concurrency-${size}`);

  const duplicateIdentity = makeStudent('duplicate', 1);
  const duplicate = await Promise.all(Array.from({ length: 10 }, () => post('/auth/register', duplicateIdentity, 'duplicate-email-and-roll')));
  console.log(JSON.stringify({ scenario: 'duplicate-email-and-roll', counts: duplicate.reduce((acc, item) => (acc[item.status] = (acc[item.status] || 0) + 1, acc), {}) }));

  for (let i = 0; i < 15; i += 1) {
    await post('/auth/login', { email: `failed-login-${Date.now()}@example.invalid`, password: 'WrongPassword@123' }, 'failed-login');
  }

  console.log(JSON.stringify({ summary: { attempted: results.length, successful: results.filter((r) => r.status >= 200 && r.status < 300).length, failed: results.filter((r) => r.status >= 400 || r.status === 0).length, rateLimited: results.filter((r) => r.status === 429).length, databaseErrors: dbErrors.length, p95Ms: Math.round(percentile(samples, 0.95)), p99Ms: Math.round(percentile(samples, 0.99)) } }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
