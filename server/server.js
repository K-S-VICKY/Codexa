const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/run', (req, res) => {
  const { code, language } = req.body;
  const id = Date.now();
  let filename, command;

  if (language === 'c') {
    filename = `temp_${id}.c`;
    fs.writeFileSync(filename, code);
    command = `gcc ${filename} -o temp_${id} && ./temp_${id}`;
  } else if (language === 'python') {
    filename = `temp_${id}.py`;
    fs.writeFileSync(filename, code);
    command = `python ${filename}`;
  } else if (language === 'javascript') {
    filename = `temp_${id}.js`;
    fs.writeFileSync(filename, code);
    command = `node ${filename}`;
  } else {
    return res.json({ output: 'Unsupported language' });
  }

  exec(command, { timeout: 5000 }, (err, stdout, stderr) => {
    // Clean up files
    try {
      fs.unlinkSync(filename);
      if (language === 'c') fs.unlinkSync(`temp_${id}`);
    } catch {}
    if (err) return res.json({ output: stderr || err.message });
    res.json({ output: stdout });
  });
});

app.listen(3001, () => console.log('Code runner listening on port 3001'));
