const express = require('express');
const bodyParser = require('body-parser');
const sddrctpr = require("./sddrctpr");
const app = express();
const port = 3000;
require("dotenv").config();


const dynamicRoute = '/';
const AMPNM = process.env.AMPNM;

app.use(express.static('node_modules/bootstrap/dist'));
app.use(bodyParser.json());

app.get(dynamicRoute, (req, res) => {
  const path = require('path');
  const htmlFilePath = path.join(__dirname, 'sdbgdlprcs.html');
  res.sendFile(htmlFilePath);
});

app.post('/submit', async (req, res) => {
  const { body } = req;
  const pcchkinput = body.enteredCode;
  const pschkrst = await sddrctpr.chkpasscd("시간", pcchkinput); //큐알로 방금 접속했는지도 확인해보기.. 위치는 어떻게..

  if (pschkrst.chkrst == true) {
    var rstmsg = "";
    var admsg = "";
    var msgsw = "";
    var drstate = "";

    const drctrst = await sddrctpr.smtbgdldvcPr("open");
    if (drctrst.result == "0001") {
      rstmsg = "이미 도어락이 열려있습니다."
      msgsw = "precheck";
      drstate = drctrst.state;
    } else if (drctrst.result == "0002") {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `[관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctrst.state;
    } else if (drctrst.result == "0000") {
      rstmsg = "도어락이 열렸습니다!!";
      msgsw = "check";
      drstate = drctrst.state;
    } else {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `[관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctrst.state;
    }

    res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: drstate });

  } else {
    const drchkstate = await sddrctpr.smtbgdlstatePr();
    res.json({ message: `비밀번호가 틀렸습니다. `, admsg: `[관리자_문의-${AMPNM}]`, msgsw: "errorchk", drstate: drchkstate });
    //로그 준비
  }
});

app.post('/sddlstate', async (req, res) => {
  const drstatechk = await sddrctpr.smtbgdlstatePr();
    res.json({ drstatechk: drstatechk });
});

app.listen(port, () => {
  console.log(`sddlpr 서버 실행 중...`);
});

