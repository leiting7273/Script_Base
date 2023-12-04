//在线工具id.tool.lu签到

Time.sleep(3000)

var user = {
  cookie_location: 'B8',//cookie位置
  msgResult_location: 'B11',//消息结果位置
  msgContent_location: 'C11',//消息内容位置
  today_location: 'D11',//更新日期位置
  cookie: '',
  msgResult: '',
  msgContent: ''
}

const myDate = new Date() //获取当前时间
const year = myDate.getFullYear()//年
const month = myDate.getMonth() + 1//月
const day = myDate.getDate()//日
const today = year + "-" + month + "-" + day

const sheet = Application.Sheets('其它')//表格
if (sheet == null) {
  console.error('未找到表格“其它”')
  return
} else {
  user.cookie = sheet.Range(user.cookie_location).Text
}

const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}

checkIn()//执行签到

//写入消息日志
msgSheet.Range(user.msgResult_location).Value = user.msgResult;
msgSheet.Range(user.msgContent_location).Value = user.msgContent;
msgSheet.Range(user.today_location).Value = today

//签到函数
function checkIn() {
  let headers = {
    'cookie': user.cookie,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586"
  }

  //签到
  resp = HTTP.get('https://id.tool.lu/sign', { headers })
  updateCookie(resp.headers)
  sheet.Range(user.cookie_location).Value = user.cookie

  try {
    const Reg = /你已经连续签到(.*?)天，再接再厉！/i;
    let html = resp.text();
    let flagTrue = Reg.test(html); // 判断是否存在字符串
    if (resp.status == 200 && flagTrue == true) {
      let result = Reg.exec(html); // 提取匹配的字符串，["你已经连续签到 1 天，再接再厉！"," 1 "]
      result = result[0];
      addMsg(result + "签到成功")
      setResult(0)
    } else {
      addMsg("签到失败")
      setResult(-1)
    }
  } catch {
    addMsg("签到异常")
      setResult(-1)
  }
}

//添加消息
function addMsg(msg) {
  console.log(msg)
  if (user.msgContent == '') {
    user.msgContent = msg;
  } else {
    user.msgContent += '\n' + msg
  }
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

/**
 * 获取所有Cookie
 */
function getCookies(cookie) {
  let cookies = cookie ? cookie : user.cookie;
  let cookieR = cookies.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  let res = '{'
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = splitStringByFirstEqual(cookieR[i]) //纵向切割
    if (res == '{') {
      res += '"' + cookieC[0] + '":"' + cookieC[1] + '"'
    } else {
      res += ',"' + cookieC[0] + '":"' + cookieC[1] + '"'
    }
    // console.log(i+1,': '+cookieC[0],'==',cookieC[1])
  }
  res += '}'
  res = JSON.parse(res);
  res = { 'string': cookies, 'json': res }
  return res;

  function splitStringByFirstEqual(inputString) {
    const index = inputString.indexOf('=');
    if (index === -1) {
      return [inputString, ''];
    }
    const part1 = inputString.substring(0, index);
    const part2 = inputString.substring(index + 1);
    return [part1, part2];
  }
}

/**
 * 解析更新响应头中的set-cookie
 */
function updateCookie(headers) {
  // console.log(headers)
  if (headers['set-cookie']) {
    console.log('设置新cookie')
    let set_cookie = parseCookies(headers['set-cookie'])
    let newCookie = ''
    for (let i = 0; i < set_cookie.length; i++) {
      // console.log('cookie ' + (i + 1) + ' : ' + set_cookie[i][0])
      if (newCookie == '') newCookie = set_cookie[i][0]
      else newCookie += ';' + set_cookie[i][0]
    }

    let json = getCookies(newCookie).json
    for (let key in json) {
      user.cookie = removeCookie(key)
    }

    user.cookie += newCookie
  }

  //将响应头set_cookie转化为二元数组
  function parseCookies(set_cookie) {
    const parsedCookies = [];
    for (const header of set_cookie) {
      const cookies = header.split(';').map(cookie => cookie.trim());
      parsedCookies.push(cookies);
    }
    return parsedCookies;
  }
}

//根据name移除cookie
function removeCookie(name) {
  let newCookie = ""
  let cookieR = user.cookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length//cookie长度
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = cookieR[i].split('=') //纵向切割
    if (cookieC[0] == name) { //找到同名cookie
      continue  //不填入
    }
    if (i == 0) {  //填入新cookie
      newCookie = cookieC[0] + "=" + cookieC[1]
    } else {
      newCookie += "; " + cookieC[0] + "=" + cookieC[1]
    }
  }
  return newCookie
}