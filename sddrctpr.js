const { SmartThingsClient, BearerTokenAuthenticator } = require('@smartthings/core-sdk')
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require("nodemailer");

require("dotenv").config();

const SMTPSTK = process.env.SMTPSTK;
const client = new SmartThingsClient(new BearerTokenAuthenticator(SMTPSTK))

const sdbgdrsr_dvId = process.env.sdbgdrsr_dvId;  //별관도어락센서
const sdbgdrfbon_dvId = process.env.sdbgdrfbon_dvId; //별관도어락fbt ON
const sdbgdrfboff_dvId = process.env.sdbgdrfboff_dvId; //별관도어락fbt OFF

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REFRESH_TOKEN2 = process.env.REFRESH_TOKEN2;
const SHEET_ID = process.env.SHEET_ID;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function smtbgdldvcPr(drctval) {     //
    if (drctval == "open" || drctval == "closed") {
    } else {
        console.log("제어 value가 유효하지않음 종료!")
        return;
    }
    var devicesget = await client.devices.get(sdbgdrsr_dvId)
    const doorctval = drctval;
    //console.log(devicesget.label+" "+doorctval + " 실행중..."); //장치이름 조회하기

    try {
        const rtgetstatus = await client.devices.getStatus(sdbgdrsr_dvId);  //현재상태 확인 위해 한번검사!
        const rtgetresult = rtgetstatus.components.main.contactSensor.contact.value;
        console.log("현재상태확인:" + rtgetresult);

        //return;
        if (rtgetresult == doorctval) {
            console.log("현재상태가 '" + doorctval + "' 이므로 실행없이 종료!");
            return { result: "0001" };
        }
        return { result: "0000" };
        //return;
        var totalct = 6  //fbt 최대 실행 횟수
        for (let i = 1; i <= totalct; i++) {
            var fbrunrst = await sdbgfbonoffPr();
            //console.log("fbt on/off " + i + "번째 요청결과_ on : " + fbrunrst.on + ", off : " + fbrunrst.off);
            if (fbrunrst.on == "0000" && fbrunrst.off == "0000") {
                await sleep(1500);  //딜레이 있을 수 있으니 1초 후 검사!
                const result = await retryUntilValue_dltb(sdbgdrsr_dvId, 10, doorctval);
                console.log(`-장치 요청결과 : '${result}' 확인.`);
                if (result === doorctval) {
                    console.log(i + "/" + totalct + "번만에 원하는 값 " + doorctval + " 나왔음! 종료합니다.");
                    return { result: "0000" };
                } else {
                    console.log(i + "/" + totalct + "번째 실행 후 상태 확인실패 다시시도!");
                }
            } else {
                console.log(i + "번째 요청실패! 다시시도!");
            }
            if (i === totalct) {
                console.log(`문열기를 못했습니다. 원하는 상태(${doorctval})를 받아오지 못했습니다. 최대 시도 횟수 초과`);
                return { result: "0002" };
            }
        }
    } catch (error) {
        console.error(error.message);
        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: "sdbgdl 실행중 error",
            message: "----errormsg----\n" +
                error.message + "\n" +
                "----errorstack----\n" +
                error.stack + "\n"
        }
        sendemailPr(sendemjson);
    }
}

async function retryUntilValue_dltb(dvid, maxAttempts, targetValue) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const getstatus = await client.devices.getStatus(dvid);
        const result = getstatus.components.main.contactSensor.contact.value;

        if (result === targetValue) {
            return result;
        }

        if (attempt === maxAttempts) {
            return "";
        }

        await sleep(100);
    }
}

async function sdbgfbonoffPr() {
    const cmdstr = "on"  //ON 제어스위치
    const cmdstr2 = "on"  //OFF 제어스위치

    const deviceConfig = {
        component: 'main',
        capability: "switch",
        command: cmdstr
    }
    const deviceConfig2 = {
        component: 'main',
        capability: "switch",
        command: cmdstr2
    }

    var ectecmd = await client.devices.executeCommand(sdbgdrfbon_dvId, deviceConfig);
    var ectecmdrst = ectecmd.results[0].status;
    await sleep(1000);

    var ectecmd2 = await client.devices.executeCommand(sdbgdrfboff_dvId, deviceConfig2);
    var ectecmd2rst = ectecmd2.results[0].status;
    if (ectecmdrst == "ACCEPTED" && ectecmd2rst == "ACCEPTED") {
        return { on: "0000", off: "0000" }; //
    } else if (ectecmdrst == "ACCEPTED" && ectecmd2rst != "ACCEPTED") {
        return { on: "0000", off: "0001" };
    } else if (ectecmdrst != "ACCEPTED" && ectecmd2rst == "ACCEPTED") {
        return { on: "0001", off: "0000" };
    } else {
        return { on: "0001", off: "0001" };
    }
}

async function sendemailPr(sendemjson) {
    const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN });

    var to = sendemjson.to;
    var subject = sendemjson.subject;
    var message = sendemjson.message;

    const accessToken = await authClient.getAccessToken();
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.sdadmingmml,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
        },
    });
    const mailOptions = {
        from: '"테스트" <' + process.env.sdadminnvml + '>', // 발신자 정보
        to: to, // 수신자 정보
        subject: subject, // 제목
        text: message, // 내용 (텍스트)
        //html: "<b>html-이메일 테스트중</b>", // 내용 (HTML)
    };
    const result = await transport.sendMail(mailOptions);
    //console.log(result);
}


async function chkpasscd(timechk, pcchk) {
    // //스프레드시트 ID, 시트 이름, 가져올 범위를 설정합니다.
    const sheetName = process.env.DCSTNM;
    const range = 'A2:L';

    const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN2 });
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const response = await sheets.spreadsheets.values.get({  //sheet get!
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!${range}`,
    });
    const values = response.data.values;
    let chkrst = false;
    let chkrstnm = "";
    for (var i = 0; i < values.length; i++) {
        if (values[i][2] == pcchk) {
            chkrst = true;
            chkrstnm = values[i][1];
            //console.log("일치항목 체크확인!:"+values[0][2]);

        }
    }
    return { chkrst: chkrst, chkrstnm: chkrstnm };
}

//smtbgdldvcPr("open");
//chkpasscd();
module.exports = { smtbgdldvcPr, sendemailPr, chkpasscd };