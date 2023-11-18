const schedule = require('node-schedule');
const sddrctpr = require("./sddrctpr");

async function sctythPr() {
    //daybook
    // const bkjson1 = {
    //     bknm: "예약이름",
    //     sw: "daybook",
    //     dayweek: "", //sw-daywk
    //     date: "2023-11-18", //sw-daybook
    //     hour: 13,
    //     minute: 52,
    // }
    // const daybkA = await scResult(bkjson1, function scfunc() {
    //     bkmailalram(bkjson1, etcval);
    // });

    //wkrepeat
    const bkjson2 = {
        bknm: "sddoorchk",
        sw: "daywk",
        dayweek: [0, 1, 2, 3, 4, 5, 6], //sw-daywk
        //date: "2023-11-18",  //sw-daybook
        hour: 15,
        minute: 20,
    }
    const weekbkB = await scResult(bkjson2, async function scfunc() {
        const drstatechk = await sddrctpr.smtbgdlstatePr();
        const etcjson = {
            prfuncnm: "drstatechk",
            prfuncrst: drstatechk,
        }
        bkmailalram(bkjson2, etcjson);
    });
    if(weekbkB==true){
        console.log("schedule book Success! Run...")
    }else{
        console.log("Schedule Book Failed!")
    }

}

async function scResult(bkjson, func) {
    const rule = new schedule.RecurrenceRule();
    if (bkjson.sw == "daybook") {
        const targetDateA = new Date(bkjson.date); //원하는 날짜에!
        rule.year = targetDateA.getFullYear();
        rule.month = targetDateA.getMonth();
        rule.date = targetDateA.getDate();
        rule.hour = bkjson.hour;
        rule.minute = bkjson.minute;
        rule.tz = 'Asia/Seoul';
    } else if (bkjson.sw == "daywk") {
        rule.dayOfWeek = bkjson.dayweek;  //요일반복주기!
        rule.hour = bkjson.hour;
        rule.minute = bkjson.minute;
        rule.tz = 'Asia/Seoul';
    }

    const job = schedule.scheduleJob(rule, () => func());
    if (job) {
        //console.log("*[예약성공] bkname:" + bkjson.bknm);
        //console.log(bkjson);
        //console.log("/예약함수:" + func.name);
        //console.log("/----------------");
        return true;
    } else {
        //console.log("*[예약실패] bkname:" + bkjson.bknm + "(시간 지났을 수 있음)");
        //console.log(bkjson);
        //console.log("/예약함수:" + func.name);
        //console.log("/----------------");
        return false;
    }
}

async function bkmailalram(ipjson, etcjson) {
    let bkdateWkStr = "";
    let rpweekday = await dayweekcv(ipjson.dayweek);
    if (ipjson.sw == "daywk") {
        bkdateWkStr = "/반복요일 : " + rpweekday + "\n";
    } else if (ipjson.sw == "daybook") {
        bkdateWkStr = "/예약일자 : " + ipjson.date + "\n";
    }
    let bkhour = ipjson.hour;
    let bkmin = ipjson.minute;
    var sendemjson = {
        to: process.env.sdadminnvml,
        subject: "[" + ipjson.bknm + "] 시간예약 실행test!",
        message: "[" + ipjson.bknm + "] 시간예약 실행test!--------\n" +
            "/실행함수명: " + etcjson.prfuncnm + "\n" +
            "/실행함수결과: " + etcjson.prfuncrst + "\n" +
            "\n" +
            "*예약내역 --------- \n" +
            "/예약이름 : " + ipjson.bknm + "\n" +
            bkdateWkStr +
            "/예약시간 : " + addLeadingZero(bkhour) + ":" + addLeadingZero(bkmin) + "\n"
    }
    sddrctpr.sendemailPr(sendemjson);
}

function addLeadingZero(number) {
    return number < 10 ? '0' + number : '' + number;
}
async function dayweekcv(weekarray) {
    const hgDayWeek = ["일", "월", "화", "수", "목", "금", "토"]
    let newdayweek = [];
    for (let i = 0; i < weekarray.length; i++) {
        newdayweek.push(hgDayWeek[weekarray[i]]);
    }
    return newdayweek;
}

//sctythPr();

module.exports = {sctythPr}