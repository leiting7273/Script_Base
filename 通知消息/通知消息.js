/**
 * 序言：本脚本功能为获取【通知消息】表格中的消息内容，并将获取到的消息按指定推送方式发送给用户
 * 
 */
var msgSheet = Application.Sheets('【通知消息】');
var myDate = new Date();
myDate = myDate.getFullYear() + '/' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '/' + myDate.getDate().toString().padStart(2, '0');
var msg = getNotifyMsg();
if (msg == '') return
var typ = msgSheet.Range('F2').Value; //推送平台类型
var auth = msgSheet.Range('G2').Text; //推送平台授权码（或webHook）
sndNotify(typ, '签到通知', msg, auth);



/**以下为函数 */



/**
 * 功能：向用户发送消息推送
 * 传入参数1：typ（提醒类型：1（pushplus），2（方糖key），3（企微机器人webhook），4（pushdeer））
 * 传入参数2：titl（消息标题）
 * 传入参数3：content（消息内容）
 * 传入参数4：auth（用户在消息推送平台的授权码，如pushToken、key、webhook链接）
 * 返回值：打印并返回推送平台的响应结果，一般为JSON对象
 */

function sndNotify(typ, titl, content, auth) {
  const pushName = ['pushPlus', '方糖', '企微机器人', 'pushdeer'] // 新增 pushdeer
  const urls = ["http://www.pushplus.plus/send", "https://sctapi.ftqq.com/" + auth + ".send", auth, "https://api2.pushdeer.com/message/push"] // 新增 pushdeer api url
  let headers = { "content-type": "application/json" }
  let datas = [
    { "token": auth, "title": titl, "content": content },  //pushplus
    { 'title': titl, 'desp': content },  //方糖
    {
      "msgtype": "text",
      "text": {
        "content": '>>>' + titl + '<<<' + content,
        // "mentioned_mobile_list": ["@all"]
      }
    }, //企微机器人
    {
      "text": titl,
      "desp": content,
      "type": "text",
      "pushkey": auth
    } // 新增 pushdeer 请求 data
  ]
  let json = HTTP.post(urls[typ - 1], datas[typ - 1], { 'headers': headers }).text()
  console.log(pushName[typ - 1] + "推送结果：", json)
  return JSON.parse(json)
}

/**
 * 获取推送消息
 */
function getNotifyMsg() {
  let msg = '';
  let row = 2
  let rowName = msgSheet.Range('A' + row).Text;
  let confirm = msgSheet.Range('E' + row).Text;
  let updataDate = msgSheet.Range('D' + row).Text;
  console.log("开始获取信息")
  while (rowName) {
    console.log("名称: ", rowName)
    console.log(confirm + '&' + myDate + '===' + updataDate)
    let c1 = msgSheet.Range('B' + row).Text;
    if ((confirm == '是' || c1 != '✅') && myDate == updataDate) {
      let titl = '【' + rowName + '】'
      let c2 = msgSheet.Range('C' + row).Text;
      msg += '\n\n' + titl + '：' + c1 + '\n' + c2
      console.log("签到结果：", c1)
      console.log("消息内容：", c2)
    } else if (confirm == '是' && myDate != updataDate && updataDate != '') {
      let titl = '【' + rowName + '】'
      let c1 = '❓'
      let c2 = '今日未签到？'
      msgSheet.Range('B' + row).Value = c1;
      msgSheet.Range('C' + row).Value = c2;
      msg += '\n\n' + titl + '：' + c1 + ' ' + c2
      console.log("签到结果：", c1)
      console.log("消息内容：", c2)
    }
    rowName = msgSheet.Range('A' + (++row)).Text;
    confirm = msgSheet.Range('E' + row).Text;
    updataDate = msgSheet.Range('D' + row).Text;
  }
  console.log(msg)
  return msg
}