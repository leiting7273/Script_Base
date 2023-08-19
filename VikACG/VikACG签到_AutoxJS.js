const myDate = new Date() //获取当前时间
const year = myDate.getFullYear()//年
const month = myDate.getMonth() + 1//月
const day = myDate.getDate()//日
const today = year + "-" + month + "-" + day

//信息
var cookie = 'wpcc_variant_f43f0782b8316b4e5ae70619d05a28eb=zh-cn; session_prefix=33cedf1908b575d7ec4bc6a3ada1c6e6; wpdiscuz_hide_bubble_hint=1; b2_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvd3d3LnZpa2FjZy5jb20iLCJpYXQiOjE2OTIwNzc4MDYsIm5iZiI6MTY5MjA3NzgwNiwiZXhwIjoxNzIzNjEzODA2LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIyOTg3NDUifX19.elhz_oEL4n_I8DkoeTBej3931HCGivIiJSjAq4penwA; _gid=GA1.2.162413569.1692078375; _ga=GA1.1.534065656.1692077467; _ga_XP5QKF3XBH=GS1.1.1692084463.1.1.1692084480.43.0.0; _clck=wgtweq|2|fe6|0|1322; cf_clearance=4nl6uHm42TNCkNqTIXOaBVUebf1XE3mdtO9RUWKlPG4-1692089073-0-1-989ed102.726bf186.cf9f8ee2-0.2.1692089073; _clsk=10oo1wz|1692091443821|1|1|x.clarity.ms/collect; _ga_6BRRXJ5S7F=GS1.1.1692088687.4.1.1692091492.0.0.0; _ga_0EBQJT2CGX=GS1.1.1692088687.3.1.1692091492.0.0.0; _ga_801TFF6N89=GS1.1.1692088687.4.1.1692091492.0.0.0'
var isCheckIn = ''
var lastDate = ''
var isWeChat = ''
var pushToken = '6d5e7c15d78246f19ce62132bff5b65e'


//执行签到,行号2
checkIn()


/*单账户签到
**输入行号
**输出 -2：请求失败 -1：不签到 0：已签到 1：签到失败 2：签到成功
**
*/
function checkIn() {
  let flag = 999
  let msg = '签到异常，请检查日志'  //待发送的信息
  let b2_token = getCookie(cookie, 'b2_token')

  if (isCheckIn != '是') {
    console.log('用户A' + row + '不签到')
    flag = -1 //不签到
  }
  if (today == lastDate) {
    console.log('用户A' + row + '今日已签到')
    flag = 0  //已签到
  }

  //检查积分
  let resp = HTTP.post('https://www.vikacg.com/wp-json/b2/v1/getUserMission',
    {
      'count': 0,
      'paged': 1
    },
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': 'https://www.vikacg.com/mission/today'
      }
    })
  if (resp.status != 200) {
    console.log('用户A' + row + '发送请求失败')
    flag = -2  //请求失败
  }

  let json = resp.json()
  let data = json.mission
  let checkinDate = data.date//服务器上次签到时间yyyy-mm-dd hh:MM:ss
  let my_credit = data.my_credit//目前积分
  let always = data.always

  if (checkGetMission != 0) {  //请求返回异常
    console.log('用户A' + row + "签到时间：" + checkinDate + "，签到获得积分：" + checkGetMission + "，目前积分：" + my_credit)
    console.log('用户A' + row + '今天已经签到，如有问题请尝试手动签到')
    flag = 0
  }
  console.log('用户A' + row + "目前积分：" + my_credit)

  resp = HTTP.post('https://www.vikacg.com/wp-json/b2/v1/userMission',
    {},
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': 'https://www.vikacg.com/mission/today'
      }
    })
  if (resp.status != 200) {
    console.log('用户A' + row + '签到失败')
    flag = 1  //签到失败
  }

  let json2 = resp.json()
  let date2 = json.date
  let credit2 = json.credit
  let my_credit2 = json.mission.my_credit
  if (flag == 999) {
    msg = date + " 签到成功，获得积分：" + credit + " 目前积分：" + my_credit
  }

  //发送微信
  if (isWeChat == '是') {
    console.log(sendWeChat('VikACG签到', msg))
  } else { console.log("用户A" + row + "不发送微信通知") }
}

//微信通知
function sendWeChat(title, content) {
    var url = "http://www.pushplus.plus/send"; // 请求地址
    var data = {
        "token": pushToken,
        "title": title,
        "content": content
    }; // 将消息内容装入data
    var headers = {
        "Content-Type": "application/json"
    }; // headers

    var result = http.post(url, JSON.stringify(data), {
        headers: headers
    }); // 发送请求

    if (result.statusCode !== 200) {
        throw new Error("err! status is " + result.statusCode);
    }

    var responseJson = result.body.json(); // 返回json
    return responseJson;
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