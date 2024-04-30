var sheet = Application.Sheets("其它");
var msgSheet = Application.Sheets("【通知消息】");
var user = {
  cookie: sheet.Range("B2").Text,
  auth: sheet.Range("C2").Text,
  msgResult: '',
  msgContent: ''
}

//执行结果
function setResult(r) {
  switch (r) {
    case 0:
      user.msgResult = '✅'
      break;
    case -1:
      user.msgResult = '❌'
      break;
    default:
      user.msgResult = '❓'
  }
}

if (user.auth == null || user.cookie == null) {
  console.error("请填写完整信息")
  return
}

let resp = HTTP.post("https://www.binfoo.com/wp-json/b2/v1/userMission", null, {
  headers: {
    "Authorization": user.auth,
    "Cookie": user.cookie
  }
});

let result = resp.text();
if (resp.status == 200) {
  try {
    result = JSON.parse(result);
    let checkDate = result.date;
    let credit = result.credit;
    let always = result.mission.always;
    user.msgContent += "签到时间：" + checkDate + "\n财富值：" + credit + "\n已连签：" + always + "天";
  } catch (error) {
    let msg = "今日已签到，财富值：" + result;
    console.log(msg)
  }
  setResult(0);
}else{
  console.error(result);
  setResult(-1);
}


//写入消息日志
msgSheet.Range('B6').Value = user.msgResult;
msgSheet.Range('C6').Value = user.msgContent;
var myDate = new Date();
msgSheet.Range('D6').Value = myDate.getFullYear() + '-' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '-' + myDate.getDate().toString().padStart(2, '0');
