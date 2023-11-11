
/*
//小米账号登录
function mi_login() {
  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://account.xiaomi.com/fe/service/login/password?sid=miui_vip&qs=%253Fcallback%253Dhttp'
      + '%25253A%25252F%25252Fapi.vip.miui.com%25252Fsts%25253Fsign%25253D4II4ABwZkiJzkd2YSkyEZukI4Ak'
      + '%2525253D%252526followup%25253Dhttps%2525253A%2525252F%2525252Fapi.vip.miui.com%2525252Fpage'
      + '%2525252Flogin%2525253FdestUrl%2525253Dhttps%252525253A%252525252F%252525252Fweb.vip.miui.com'
      + '%252525252Fpage%252525252Finfo%252525252Fmio%252525252Fmio%252525252FinternalTest%252525253Fref'
      + '%252525253Dhomepage%2526sid%253Dmiui_vip&callback=http%3A%2F%2Fapi.vip.miui.com%2Fsts%3Fsign'
      + '%3D4II4ABwZkiJzkd2YSkyEZukI4Ak%253D%26followup%3Dhttps%253A%252F%252Fapi.vip.miui.com%252Fpage'
      + '%252Flogin%253FdestUrl%253Dhttps%25253A%25252F%25252Fweb.vip.miui.com%25252Fpage%25252Finfo'
      + '%25252Fmio%25252Fmio%25252FinternalTest%25253Fref%25253Dhomepage&_sign=L%2BdSQY6sjSQ%2FCRjJs4p'
      + '%2BU1vNYLY%3D&serviceParam=%7B%22checkSafePhone%22%3Afalse%2C%22checkSafeAddress%22%3Afalse%2C'
      + '%22lsrp_score%22%3A0.0%7D&showActiveX=false&theme=&needTheme=false&bizDeviceType=',
    'User-Agent': user.ua,
    'Origin': 'https://account.xiaomi.com',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': 'deviceId=' + user.deviceId + '; pass_ua=web; uLocale=zh_CN'
  }
  let data = {
    'bizDeviceType': '',
    'needTheme': 'false',
    'theme': '',
    'showActiveX': 'false',
    'serviceParam': '{"checkSafePhone":false,"checkSafeAddress":false,"lsrp_score":0.0}',
    'callback': 'http://api.vip.miui.com/sts?sign=4II4ABwZkiJzkd2YSkyEZukI4Ak%3D&followup=https%3A%2F%2Fapi.vip'
      + '.miui.com%2Fpage%2Flogin%3FdestUrl%3Dhttps%253A%252F%252Fweb.vip.miui.com%252Fpage%252Finfo'
      + '%252Fmio%252Fmio%252FinternalTest%253Fref%253Dhomepage',
    'qs': '%3Fcallback%3Dhttp%253A%252F%252Fapi.vip.miui.com%252Fsts%253Fsign%253D4II4ABwZkiJzkd2YSkyEZukI4Ak'
      + '%25253D%2526followup%253Dhttps%25253A%25252F%25252Fapi.vip.miui.com%25252Fpage%25252Flogin'
      + '%25253FdestUrl%25253Dhttps%2525253A%2525252F%2525252Fweb.vip.miui.com%2525252Fpage%2525252Finfo'
      + '%2525252Fmio%2525252Fmio%2525252FinternalTest%2525253Fref%2525253Dhomepage%26sid%3Dmiui_vip',
    'sid': 'miui_vip',
    '_sign': 'L+dSQY6sjSQ/CRjJs4p+U1vNYLY=',
    'user': user.uid,
    'cc': '+86',
    'hash': user.pwd,
    '_json': 'true'
  }

  let resp = HTTP.post("https://account.xiaomi.com/pass/serviceLoginAuth2", data, { headers })
  let text = resp.text()
  console.log(text)
  let r_json = JSON.parse(text.replace(/^&&&START&&&/, ''))

  if (r_json.code == 70016) {
    console.log('小米账号登录失败：用户名或密码不正确');
    return false;
  }else if (r_json.code != 0) {
    console.log('小米账号登录失败：' + r_json.desc);
    return false;
  }

  if (r_json.pwd != 1) {
    console.log('当前账号需要短信验证码，请尝试修改UA或设备ID');
    return false;
  }

  // if (!get_vip_cookie(r_json.location)) {
  //   console.log('小米账号登录成功，社区获取 Cookie 失败');
  //   return false;
  // }
  console.log('location: ',r_json.location)

  console.log('账号登录完成');
  return true;
}

let user = {  //用户信息
  name: null,
  cookie: null,
  isSignIn: null,
  accountCookie: null,
  ua: null,
  miui_vip_ph: null,
  deviceId: null,
  uid: null,
  pwd: null
}
user.ua = Application.Range('I2').Text
user.uid = Application.Range('J2').Text
user.pwd = Application.Range('k2').Text
user.deviceId = getCookie(Application.Range('G2').Text,'deviceId')

user.uid = Crypto.createHash("md5").update(user.uid).digest("hex")
user.pwd = Crypto.createHash("md5").update(user.pwd).digest("hex")
console.log('uid: ',user.uid,'&pwd: ',user.pwd)

console.log(mi_login())

return
*/




//浏览帖子任务
function browse_post() {
  let browse_post = getTask(user.cookie)['浏览帖子超过10秒']
  console.log(browse_post)
  if (browse_post.showType == 0) return null;  //已完成，返回空值

}


/**
 * 序言：本脚本用于小米社区每日自动签到领取成长值
 */
const myDate = new Date() //获取当前时间
const currentDate = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate();  //提取当日日期
const xmSheet = Application.Sheets("小米社区")  //小米社区工作表
if (xmSheet == null) {
  console.error('未找到表格“小米社区”')
  return
}
const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}
var msgResult = ''
var msgContent = ''
var user = {  //用户信息
  name: null,
  cookie: null,
  isSignIn: null,
  accountCookie: null,
  ua: null,
  miui_vip_ph: null,
  deviceId: null,
  uid: null,
  pwd: null
}

var weekDay = myDate.getDay() - 1
weekDay = weekDay < 0 ? 6 : weekDay //今天周几，周一是0，周日是6
// const testCookie = xmSheet.Range("A2").Text

//执行签到、点赞
runByInfo();

//写入消息日志
msgSheet.Range('B4').Value = msgResult;
msgSheet.Range('C4').Value = msgContent;
msgSheet.Range('D4').Value = myDate.getFullYear() + '-' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '-' + myDate.getDate().toString().padStart(2, '0');


//遍历执行
function runByInfo() {
  for (let row = 2; "" != (user.isSignIn = xmSheet.Range("E" + row).Text); row++) {
    user.cookie = xmSheet.Range("A" + row).Text  //用户签到凭据
    user.accountCookie = xmSheet.Range("G" + row).Text   //登录信息Cookie
    user.ua = xmSheet.Range("I" + row).Text//浏览器ua
    user.deviceId = getCookie(user.accountCookie,'deviceId')

    user.name = getInfo(user.accountCookie).data.account.substring(4);  // 用户名
    if (user.isSignIn != "是") continue //不签到的用户跳过

    //{"time":0,"message":"success","entity":{"continueCheckInDays":2,"checkin7DaysDetail":[0,0,3,4,-1,-1,-1]},"status":200} 正确返回
    //{"code":401}  错误返回
    user.cookie = getNewCookie() //获取新的签到cooKie
    login_app()//登录
    user.miui_vip_ph = getCookie(user.cookie, 'miui_vip_ph');
    if (user.cookie == -1 || user.cookie == '') {
      msg = '账号登录cookie异常,请前往 https://account.xiaomi.com/ 登录后获取新的cookie'
      msgResult = '❌'
      addMsg(user.name + msg)
      console.error(user.name + msg)
      continue
    }
    xmSheet.Range('A' + row).Value = user.cookie  // 新签到Cookie自动写入表格
    let checkInfo = getCheckInfo(user.cookie)  //获取本周签到信息
    console.log(checkInfo)//打印
    let statu = checkInfo.entity.checkin7DaysDetail[weekDay]
    let week = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    if (statu > 0) { //今日已签到，跳过
      console.log("用户" + user.name + ' ' + week[weekDay] + "已签到，无需重复签到")
      msgResult = '❓'
      addMsg("用户" + user.name + ' ' + week[weekDay] + "已签到，无需重复签到")
      like()
      continue
    }

    //{"time":0,"message":"success","entity":4,"status":200}
    //{"time":0,"message":"今天已签到了哦，明天再来吧","status":500}
    let res = checkIn(user.cookie)  //执行用户签到
    if (res.message != 'success') {  //如果签到不成功
      msgResult = '❌'
      if (res.status == 500) {
        console.log("用户" + user.name + week[weekDay] + res.message)
        addMsg("用户" + user.name + week[weekDay] + res.message)
      } else {
        console.log("用户" + user.name + res.message)
        msg = res.message
        addMsg("用户" + user.name + msg)
      }
      continue;
    }
    msg = week[weekDay] + "签到成功，经验+" + res.entity
    msgResult = '✅'
    addMsg("用户" + user.name + msg)
    console.log("用户" + user.name + msg)
    like()

    //签到完成后点赞
    function like() {
      let res_like = like_post()
      addMsg(res_like.title + "," + res_like.jumpText)
    }
  }
}

//获取新的签到Cookie
//返回-1：用户账户登录Cookie已过期
//返回空字符串：响应头无set-cookie
// getNewCookie(,
//   xmSheet.Range("G2").Text)
function getNewCookie() {
  let newCookie = ''
  let resp = HTTP.get('https://api.vip.miui.com/page/login?destUrl=https%3A%2F%2Fweb.vip.miui.com%2Fpage%2Finfo%2Fmio%2Fmio%2FuserDevPlatform%3FisHideTitle%3D1%26app_version%3Ddev.220218&time=' + myDate.getTime(),
    { headers: { 'Referer': 'https://web.vip.miui.com/', 'User-Agent': user.ua } })  //发送请求1
  url = resp.headers.location

  resp = HTTP.fetch(url, {  //发送请求2，确认该账户已登录
    method: "GET",
    timeout: 2000,
    headers: {
      'cookie': user.accountCookie,
      'Referer': 'https://web.vip.miui.com/',
      'User-Agent': user.ua
    }
  })
  url = resp.headers.location
  resp = HTTP.get(url, { headers: { 'User-Agent': user.ua } })  //发送请求3，获取新的签到Cookie

  if (resp.status != 302) return -1 //如果响应码不是302，则用户账户登录Cookie已过期，返回-1
  for (let i = 0; i < resp.headers['set-cookie'].length; i++) { //拼接新签到Cookie
    str = resp.headers['set-cookie'][i]
    const indexEqual = str.indexOf('=');
    const indexSemicolon = str.indexOf(';');
    if (indexEqual === -1) continue;
    const name = str.substring(0, indexEqual);
    const value = indexSemicolon !== -1 ? str.substring(indexEqual + 1, indexSemicolon) : str.substring(indexEqual + 1);
    if (newCookie == '') {
      newCookie += name + '=' + value
    } else {
      newCookie += '; ' + name + '=' + value
    }
  }
  return newCookie
}

//查签到
// console.log(getCheckInfo(testCookie))
function getCheckInfo() {
  let url = 'https://api.vip.miui.com/mtop/planet/vip/user/getUserCheckinInfo' +
    "?miui_vip_ph=" + encodeURIComponent(user.miui_vip_ph)//将miui_vip_ph放进参数
  // 发起网络请求
  let resp = HTTP.fetch(url,
    {
      method: "GET",
      timeout: 2000,
      headers: { 'Cookie': user.cookie, 'User-Agent': user.ua }
    })
  let res = resp.json()
  return res
}

//执行签到
// console.log(checkIn(xmSheet.Range("A2").Text))
function checkIn() {
  let url = 'https://api.vip.miui.com/mtop/planet/vip/user/checkinV2'
  let data = {
    'ref': 'vipAccountShortcut',
    'pathname': '/mio/checkIn',
    'version': 'dev.231026',
    'miui_vip_ph': user.miui_vip_ph
  }
  let resp = HTTP.post(url, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'cookie': user.cookie,
      'User-Agent': user.ua
    }
  });

  let res = resp.json()
  console.log('签到响应：', res)
  return res
}



//获取指定名称cookie
// console.log(getCookie(xmSheet.Range("A2").Text,'miui_vip_ph'))
function getCookie(allCookie, name) {
  let cookieR = allCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = splitStringByFirstEqual(cookieR[i]) //纵向切割
    if (name == cookieC[0]) return cookieC[1]
  }
  return null
}

/*
  自定义字符串处理函数
  以'='切割字符串（仅第一个'='有效）
  返回数组
*/
function splitStringByFirstEqual(inputString) {
  const index = inputString.indexOf('=');
  if (index === -1) {
    return [inputString, ''];
  }
  const part1 = inputString.substring(0, index);
  const part2 = inputString.substring(index + 1);
  return [part1, part2];
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

/**
 * 查询用户信息
 * 传入：cookie
 * 返回：用户信息JSON
 */
function getInfo() {
  let userId = getCookie(user.accountCookie, 'userId');
  let cUserId = getCookie(user.accountCookie, 'cUserId');
  let url = 'https://account.xiaomi.com/pass2/security/home?userId=' + userId;

  let resp = HTTP.get(url, {
    headers: {
      'Cookie': user.accountCookie,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': 'https://account.xiaomi.com/fe/service/account?cUserId=' + cUserId + '&userId=' + userId + '&_locale=zh_CN',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': user.ua
    }
  });
  let text = resp.text();
  console.log('获取到用户信息：', text.substring(11));
  return JSON.parse(text.substring(11));
}

//查任务
function getTask() {
  let data = `ref=vipAccountShortcut
  &pathname=%2Fmio%2FcheckIn
  &version=dev.231026
  &miui_version=G9700FXXU1APFO
  &android_version=9
  &oaid=
  &device=gracelte
  &restrict_imei=
  &miui_big_version=
  &model=SM-N9760
  &androidVersion=9
  &miuiBigVersion=
  &miui_vip_ph=${user.miui_vip_ph}
  &fromPop=0`
  let url = 'https://api.vip.miui.com/mtop/planet/vip/member/getCheckinPageCakeList' + '?' + data

  let resp = HTTP.get(url, { headers: { 'cookie': user.cookie, 'User-Agent': user.ua } });
  if (resp.status != 200) {
    console.error('status: ', resp.status)
    console.error('headers: ', resp.headers)
    console.error('text: ', resp.text())
  }
  let entity = resp.json()['entity']
  let task = ''
  for (let i = 0; i < entity.length; i++) {
    if (entity[i].head.title == '每日任务') {
      task = entity[i].data
      let newTask = "{"
      for (let i = 0; i < task.length; i++) {
        if (newTask == '{') {
          newTask += '"' + task[i].title + '":' + JSON.stringify(task[i])
        } else {
          newTask += ',"' + task[i].title + '":' + JSON.stringify(task[i])
        }
      }
      newTask += "}"
      task = JSON.parse(newTask)
      break;
    } else {
      task = null;
    }
  }
  console.log('result: ', task)
  return task
}

//生成请求id
function generateRequestId() {
  const hexChars = "0123456789abcdef";
  let hexString = "";
  // 生成8位十六进制字符串
  for (let i = 0; i < 8; i++) {
    hexString += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  hexString += "-";
  // 生成4位十六进制字符串
  for (let i = 0; i < 4; i++) {
    hexString += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  hexString += "-";
  // 生成2位十六进制字符串
  for (let i = 0; i < 2; i++) {
    hexString += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return hexString;
}

//点赞任务
function like_post() {
  let like_post = getTask()['点赞他人帖子']
  console.log(like_post)
  if (like_post.jumpText == '已完成') return { title: '点赞任务', jumpText: '已完成' };  //已完成，返回空值
  let posts = get_post()
  let title = ''
  let res;
  for (let i = 0; i < posts.length; i++) {
    title = posts[i].title != '' ? posts[i].title : '无标题'
    let lk = posts[i].like
    console.log('帖子标题: ', title, lk == 1 ? '【已点赞】' : '【未点赞】')
    if (lk == 0) {
      console.log('点赞帖标题: ', title)
      //发现未点赞帖子，点赞
      let url = 'https://api.vip.miui.com/mtop/planet/vip/v2/content/announceThumbUp?miui_vip_ph=' + encodeURIComponent(user.miui_vip_ph)
        + '&ref=vipAccountShortcut'
        + '&pathname=%2Fmio%2Fdetail'
        + '&version=dev.231026'
        + '&miui_version=G9700FXXU1APFO'
        + '&android_version=9'
        + '&oaid='
        + '&device=gracelte'
        + '&restrict_imei='
        + '&miui_big_version='
        + '&model=SM-N9760'
        + '&androidVersion=9'
        + '&miuiBigVersion='
      let sign = postSign({
        'postId': posts[i].id,
        'timestamp': new Date().getTime()
      })
      let data = {
        'postId': posts[i].id,  //帖子id
        'environment': '',
        'requestTime': sign[1],
        'sign': sign[0],
        'miui_vip_ph': user.miui_vip_ph
      }

      let resp = HTTP.post(url, data, { headers: { 'cookie': user.cookie, 'User-Agent': user.ua } })
      if (resp.status != 200) {
        console.log(resp.status)
        // console.log(posts[i])
        console.log(resp.text())
        console.log(url)
        console.log(data)
        return res;
      }
      res = resp.json()
      console.log(res)
      return res;
    }
  }
  like_post(cookie_check) //重新刷新执行
  return res;

  //生成sign签名
  function postSign(data) {
    let s_data = [];
    for (let d in data) {
      s_data.push(d + '=' + data[d]);
    }
    let s_str = s_data.join('&');
    console.log('签名原文：' + s_str);
    let s_str_md5 = hash(s_str) + '067f0q5wds4';
    let s_sign = hash(s_str_md5);
    console.log('签名结果：' + s_sign);
    return [s_sign, data['timestamp']];
    function hash(data) {
      return Crypto.createHash('md5').update(Buffer.from(data, 'utf8')).digest('hex');
    }
  }
}

//获取随机32为16进制数
function getRandomHex() {
  var hex = '';
  var characters = '0123456789ABCDEF';
  for (var i = 0; i < 32; i++) {
    hex += characters[Math.floor(Math.random() * 16)];
  }
  return hex;
}

//获取token
function get_token() {
  function getRandomHex() {
    var hex = '';
    var characters = '0123456789ABCDEF';
    for (var i = 0; i < 32; i++) {
      hex += characters[Math.floor(Math.random() * 16)];
    }
    return hex;
  }
  let url = 'https://verify.sec.xiaomi.com/captcha/v2/data?'
    + 'k=' + getRandomHex()
    + '&locale=zh_CN'
    + '&_t=' + new Date().getTime()
  let s = ''
  let d = ''
  let data = {
    's': s,
    'd': d,
    'a': 'GROW_UP_CHECKIN'
  }

  let resp = HTTP.post(url, data, { headers: { 'User-Agent': user.ua } })
  console.log(resp.status)
  console.log(resp.text())
}

//获取帖子
function get_post() {
  let data = `country=CN
  &restrict_imei=
  &mi_os_name=
  &vip-gzip=1
  &language=zh
  &android_version=9
  &miui_big_version=
  &ref=vipAccountShortcut
  &dark_mode=false
  &requestId=${generateRequestId()}
  &model=SM-N9760
  &miui_version=G9700FXXU1APFO
  &mi_os_version=
  &miui_vip_ph=${user.miui_vip_ph}
  &product=SM-N9760
  &sim_operator=1
  &offset=0
  &mi_os_code=
  &history=
  &pageNum=5
  &version=dev.231026
  &withComment=true
  &requestTime=${new Date().getTime()}
  &device_oaid=
  &app_name=com.xiaomi.vipaccount
  &build_date=
  &fast=true
  &fastEntryKey=DISCOVER_FAST_ENTRY_NEW_CONF
  &device=gracelte`
  let url = 'https://api.vip.miui.com/mtop/planet/vip/home/discover?' + data

  let resp = HTTP.get(url, { headers: { "Cookie": user.cookie, 'User-Agent': user.ua } })
  if (resp.status != 200) {
    console.error('status: ', resp.status)
    console.error('headers: ', resp.headers)
    console.error('text: ', resp.text())
  }
  let res = resp.json()
  res = res.entity.recommend.records
  console.log('所有帖子: ', res)
  return res
}

//社区登录
function login_app() {
  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'cookie': user.cookie
  }

  let resp = HTTP.get('https://api.vip.miui.com/mtop/planet/vip/app/init/start/infos?miui_vip_ph=' + encodeURIComponent(user.miui_vip_ph), { headers })
  if (resp.status != 200) {
    console.log('resp.status: ', resp.status)
    if (resp.status == 401) console.log("登录社区失败：Cookie无效")
    else console.log("登录社区失败")
  } else {
    console.log("登录社区成功")
  }
  console.log('社区登录响应结果: ', resp.json())
}

