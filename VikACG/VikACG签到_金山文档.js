const myDate = new Date() //获取当前时间
const year = myDate.getFullYear()//年
const month = myDate.getMonth() + 1//月
const day = myDate.getDate()//日
const today = year + "-" + month + "-" + day
const sheet = Application.Sheets('其它')//表格
if (sheet == null) {
  console.error('未找到表格“其它”')
  return
}
const domains = ['www.vikacg.com', 'www.vikacg.xyz', 'vikacg.moe.mov']
var domain = domains[sheet.Range('C4').Value - 1]

const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}
var msgResult = ''
var msgContent = ''

checkIn()

//写入消息日志
msgSheet.Range('B5').Value = msgResult;
msgSheet.Range('C5').Value = msgContent;
msgSheet.Range('D5').Value = myDate.getFullYear() + '-' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '-' + myDate.getDate().toString().padStart(2, '0');


/*单账户签到
**输出 -2：请求失败 -1：不签到 0：已签到 1：签到失败 2：签到成功
**
*/
function checkIn() {
  let cookie = sheet.Range('B4').Text
  if (cookie == "") return
  let flag = 999
  let msg = '签到异常，请检查日志'  //待发送的信息
  let b2_token = getCookie(cookie, 'b2_token')

  //检查积分
  let resp = HTTP.post(`https://${domain}/wp-json/b2/v1/getUserMission`,
    {
      'count': 0,
      'paged': 1
    },
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': `https://${domain}/mission/today`
      }
    })
  if (resp.status != 200) {
    console.log('发送请求失败')
    addMsg('签到失败，服务器响应异常')
    flag = -2  //请求失败
  }

  let json = resp.json()
  let data = json.mission
  let checkinDate = data.date//服务器上次签到时间yyyy-mm-dd hh:MM:ss
  let credit = data.credit
  let my_credit = data.my_credit//目前积分
  let always = data.always
  // console.log(data)

  if (credit != 0) {  //请求返回异常
    msgResult = '❓'
    msg = "今日获得积分：" + credit + '已连签：' + always + "天，目前积分：" + my_credit
    console.log(msg)
    console.log('今天已经签到，如有问题请尝试手动签到')
    msgContent = msg;
    addMsg('|今天已经签到，如有问题请尝试手动签到')
    flag = 0
    return
  }
  console.log("目前积分：" + my_credit)
  addMsg("目前积分：" + my_credit)

  resp = HTTP.post(`https://${domain}/wp-json/b2/v1/userMission`,
    {},
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': `https://${domain}/mission/today`
      }
    })
  if (resp.status != 200) {
    console.log('签到失败')
    addMsg('|签到失败，服务器响应异常')
    flag = 1  //签到失败
  }

  let json2 = resp.json()
  let date2 = json2.date
  let credit2 = json2.credit
  let my_credit2 = json2.mission.my_credit
  if (flag == 999) {
    msg = "签到成功，获得积分：" + credit2 + " 目前积分：" + my_credit2
    msgResult = '✅';
    msgContent = msg;
  }
}

//根据name获取cookie
function getCookie(allCookie, nm) {
  let cookieR = allCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = cookieR[i].split('=') //纵向切割
    let name = cookieC[0]
    let value = cookieC[1]
    if (name == nm) {
      return value
    }
  }
  return null
}

/**
 * 添加通知消息内容
 * 传入参数：内容
 */
function addMsg(content) {
  if (msgContent == '') {
    msgContent = content
  } else {
    msgContent += ' \n' + content
  }
}