const express = require('express');
const bodyParser = require('body-parser');
const sddrctpr = require("./sddrctpr");
const app = express();
const port = 3000;
require("dotenv").config();
const rturl = process.env.rturl;
const rturlad = "/" + rturl;

app.use(express.static('node_modules/bootstrap/dist'));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  const path = require('path');
  const htmlFilePath = path.join(__dirname, 'sdbgdlprcs.html');
  res.sendFile(htmlFilePath);
});

app.post('/submit', (req, res) => {
  const { body } = req;
  //console.log(body);
  if (body.enteredCode == "123456") {
    res.json({ message: '비밀번호 일치!.' });
    try {
      sddrctpr.smtbgdldvcPr("open");
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
    }

  } else {
    res.json({ message: '비밀번호 불일치!.' });
  }
});

app.listen(port, () => {
  console.log(`sddlpr 서버 실행 중...`);
});