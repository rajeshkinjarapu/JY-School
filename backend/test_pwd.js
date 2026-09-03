const bcrypt = require('bcryptjs');
async function run() {
  const hash = '$2b$10$/Fqejnn5HfQkQrzNnGzPw.TRXTTT/rkcEGbiBPy69q2IYqxQGwisq';
  const attempts = ['Student2026', 'student2026', 'student@123', 'password', '123456', 'JY26-0103', '7382094047'];
  for (const pw of attempts) {
    if (await bcrypt.compare(pw, hash)) {
      console.log('MATCH FOUND:', pw);
      return;
    }
  }
  console.log('NO MATCH');
}
run();
