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
  //console.log(body);
  const pcchkinput = body.enteredCode;
  const pschkrst = await sddrctpr.chkpasscd("시간", pcchkinput); //큐알로 방금 접속했는지도 확인해보기.. 위치는 어떻게..
  // console.log(pschkrst.chkrst);
  // console.log(pschkrst.chkrstnm);

  if (pschkrst.chkrst == true) {
    var rstmsg = "";
    var admsg = ""; 
    const drctrst = await sddrctpr.smtbgdldvcPr("open");
    if (drctrst.result == "0001") {
      rstmsg = "이미 도어락이 열려있습니다."
    }else if(drctrst.result == "0002"){
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `[관리자_문의-${AMPNM}]`;
    }else if(drctrst.result == "0000"){
      rstmsg = pschkrst.chkrstnm + "님 도어락열기 실행성공!!.";
    }
    
    res.json({ message: rstmsg, admsg: admsg});

  } else {
    res.json({ message: `비밀번호가 틀렸습니다. `, admsg:`[관리자_문의-${AMPNM}]` });
    //로그 준비
  }
});

app.listen(port, () => {
  console.log(`sddlpr 서버 실행 중...`);
});

