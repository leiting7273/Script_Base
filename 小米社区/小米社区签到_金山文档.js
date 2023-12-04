// 随机字符
function random_str(length) {
  let result = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()-=_+~`{}[]|:<>?/.'
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// AES加密
function aes_encrypt(key, data) {
  const iv = Buffer.from('0102030405060708', 'utf-8');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let encrypted = cipher.update(data, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// RSA加密
function rsa_encrypt(key, data) {
  //还未实现
}

// 获取Token
function get_token() {
  // 生成随机字符串
  const key = random_str(16)
  // 获取公钥
  const public_key = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArxfNLkuAQ/BYHzkzVwtug+0abmYRBVCEScSzGxJIOsfxVzcuqaKO87H2o2wBcacD3bRHhMjTkhSEqxPjQ/FEXuJ1cdbmr3+b3EQR6wf/cYcMx2468/QyVoQ7BADLSPecQhtgGOllkC+cLYN6Md34Uii6U+VJf0p0q/saxUTZvhR2ka9fqJ4+6C6cOghIecjMYQNHIaNW+eSKunfFsXVU+QfMD0q2EM9wo20aLnos24yDzRjh9HJc6xfr37jRlv1/boG/EABMG9FnTm35xWrVR0nw3cpYF7GZg13QicS/ZwEsSd4HyboAruMxJBPvK3Jdr4ZS23bpN0cavWOJsBqZVwIDAQAB\n-----END PUBLIC KEY-----"
  // 加密数据
  var time = Math.round((new Date()).getTime());
  var data = {
    "type": 0,
    "startTs": time,
    "endTs": time,
    "env": {
      "p1": "",
      "p2": "",
      "p3": "",
      "p4": "",
      "p5": "",
      "p6": "",
      "p7": "",
      "p8": "",
      "p9": "",
      "p10": "",
      "p11": "",
      "p12": "",
      "p13": "",
      "p14": "",
      "p15": "",
      "p16": "",
      "p17": "",
      "p18": "",
      "p19": 5,
      "p20": "",
      "p21": "",
      "p22": 5,
      "p23": "",
      "p24": "",
      "p25": "",
      "p26": "",
      "p28": "",
      "p29": "",
      "p30": "",
      "p31": "",
      "p32": "",
      "p33": "",
      "p34": ""
    },
    "action": {
      "a1": [],
      "a2": [],
      "a3": [],
      "a4": [],
      "a5": [],
      "a6": [],
      "a7": [],
      "a8": [],
      "a9": [],
      "a10": [],
      "a11": [],
      "a12": [],
      "a13": [],
      "a14": []
    },
    "force": false,
    "talkBack": false,
    "uid": random_str(27),
    "nonce": {
      "t": Math.round((new Date()).getTime() / 1000),
      "r": Math.round((new Date()).getTime() / 1000)
    },
    "version": "2.0",
    "scene": "GROW_UP_CHECKIN"
  };
  const s = rsa_encrypt(public_key, key)
  const d = aes_encrypt(key, data)
  // 设置请求的url链接
  const url = 'https://verify.sec.xiaomi.com/captcha/v2/data?k=3dc42a135a8d45118034d1ab68213073&locale=zh_CN'
  // 发送post请求
  const postResponse = HTTP.post(
    url,
    {
      s: s,
      d: d,
      a: 'GROW_UP_CHECKIN'
    }
  )
  // 判断请求是否成功
  if (postResponse.status !== 200) {
    throw new Error("token请求失败，状态码为：" + postResponse.status)
  }
  // 将响应数据转换为json格式并获取token
  const responseData = postResponse.json()
  return responseData.data.token
}

// 用户信息
function info() {
  let url = 'https://api.vip.miui.com/mtop/planet/vip/homepage/mineInfo'
  let resp = HTTP.get(url, { headers: { 'cookie': user.cookie } })
  let text = resp.text()
  if (resp.status != 200 || JSON.parse(text)["entity"]["userInfo"]['userId'] == '-1') {
    if (JSON.parse(text)["entity"]["userInfo"]['userId'] == '-1') {
      login_community()
      return false
    }
    console.error('获取用户信息异常，状态码：', resp.status)
    console.error('获取用户信息异常，响应结果：', resp.text())
    return false
  } else {
    user.miui_vip_ph = getCookie(user.cookie, 'miui_vip_ph')
    let json = JSON.parse(text)
    // console.log('获取到的用户信息JSON：', json)
    let msg = `昵称：${user.name = json["entity"]["userInfo"]["userName"]} 等级：${json["entity"]["userInfo"]["userGrowLevelInfo"]["showLevel"]} 积分：${json["entity"]["userInfo"]["userGrowLevelInfo"]["point"]}`
    addMsg(msg)
    user.statu++
    return true
  }
}

// 签到
function check_in() {
  let url = `https://api.vip.miui.com/mtop/planet/vip/user/getUserCheckinInfo`
  let headers = { 'cookie': user.cookie }
  let resp = HTTP.get(url, { headers })
  if (resp.status != 200) {
    console.error('查询签到信息异常，状态码：', resp.status)
    console.error('查询签到信息异常，响应结果：', resp.text())
    return
  } else {
    let json = resp.json()
    let exp = json['entity']['checkin7DaysDetail'][now.getDay() - 1]
    let token = getCookie(user.cookie, 'miui_vip_serviceToken')  //get_token()//
    // console.log(token)
    if (exp == 0) {
      let url = `https://api.vip.miui.com/mtop/planet/vip/user/checkinV2`
      let data = {
        'miui_vip_ph': getCookie(user.cookie, 'miui_vip_ph'),
        'token': token
      }

      let resp = HTTP.post(url, data, { headers: { 'cookie': user.cookie } })

      if (resp.status != 200) {
        console.error('执行签到异常，状态码：', resp.status)
        console.error('执行签到异常，响应结果：', resp.text())
        return
      } else {
        let json = resp.json()
        if (json['message'] == 'success') {
          addMsg('签到成功，经验+' + json.entity)//成功
        } else {
          addMsg(json.message)
          if (json.message == '人机校验失败') {
            // {"time":0,"message":"人机校验失败","status":640}
            xmSheet.Range('K' + user.row).Value = ''
          }
        }
      }
    } else {
      addMsg('今日已签到，经验+' + exp)
    }
  }
}

// 点赞
function like() {
  getTask();
  if (user.tasks['点赞他人帖子'] && user.tasks['点赞他人帖子'].jumpText == '已完成') {
    user.statu++
    addMsg('点赞任务完成')
  } else if(user.tasks['点赞他人帖子']) {
    for (let i = 2; i < user.posts.length; i++) {
      let title = user.posts[i].title != '' ? user.posts[i].title : '无标题'
      let lk = user.posts[i].like
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
          'postId': user.posts[i].id,
          'timestamp': new Date().getTime()
        })

        let data = {
          'postId': user.posts[i].id,  //帖子id
          'environment': '',
          'requestTime': sign[1],
          'sign': sign[0],
          'miui_vip_ph': user.miui_vip_ph
        }

        let resp = HTTP.post(url, data, { headers: { 'cookie': user.cookie, 'User-Agent': user.ua } })
        if (resp.status != 200) {
          console.error('点赞异常，状态码：', resp.status)
          console.error('点赞异常，响应：', resp.text())
          return
        }
        res = resp.json()
        if (res.message == 'ok') {
          addMsg('点赞任务完成')
          user.statu++
        } else {
          console.error('点赞响应', res)
          addMsg('点赞任务异常')
        }
        return
      }
    }
    get_posts() //重新执行点赞
    like()
  }

  //生成sign签名
  function postSign(data) {
    let s_data = [];
    for (let d in data) {
      s_data.push(d + '=' + data[d]);
    }
    let s_str = s_data.join('&');
    // console.log('签名原文：' + s_str);
    let s_sign = hash(hash(s_str) + '067f0q5wds4');
    // console.log('签名结果：' + s_sign);
    return [s_sign, data['timestamp']];
    function hash(data) {
      return Crypto.createHash('md5').update(Buffer.from(data, 'utf8')).digest('hex');
    }
  }
}

// 浏览帖子
function browse() {
  getTask();
  if (user.tasks['浏览帖子超过10秒'].showType == 0) {
    user.statu++
    addMsg('浏览帖子任务完成')
  } else {
    let url = `https://api.vip.miui.com/mtop/planet/vip/member/addCommunityGrowUpPointByActionV2?miui_vip_ph=${encodeURIComponent(user.miui_vip_ph)}`
    let data = { 'action': '', 'miui_vip_ph': user.miui_vip_ph }
    let resp = null
    let action = ['BROWSE_POST_10S']//['BROWSE_POST_10S', 'BROWSE_SPECIAL_PAGES_SPECIAL_PAGE', 'BROWSE_SPECIAL_PAGES_USER_HOME']
    for (let i = 0; i < action.length; i++) {
      data.action = action[i];
      resp = HTTP.post(url, data, { headers: { 'cookie': user.cookie } })
      if (resp.status != 200) {
        console.error('浏览帖子' + data.action + '异常，状态码：', resp.status)
        console.error('浏览帖子' + data.action + '异常，响应：', resp.text())
        console.error('浏览帖子' + data.action + '异常，URL：', url)
        console.error('浏览帖子' + data.action + '异常，请求参数：', data)
        return
      } else {
        //TODO：处理响应
        //{"time":0,"message":"加分失败","status":-1} //重复做任务
        //{"time":0,"message":"success","entity":{"score":"1","title":"+1","desc":"浏览帖子"},"status":200}
        let json = resp.json()
        if (json.status == '200') {
          addMsg('浏览帖子任务完成')
          user.statu++
        } else if (json.status == -1) { //重复执行
          addMsg('浏览帖子任务完成')
          user.statu++
        } else {
          addMsg('浏览帖子任务异常')
          console.error('浏览帖子' + data.action + '异常，响应：', json)
        }
      }
    }
  }
}

// 拔萝卜
function carrot() {
  let url = `https://api.vip.miui.com/api/carrot/pull?miui_vip_ph=${encodeURIComponent(user.miui_vip_ph)}`
  let resp = HTTP.post(url, {}, { headers: { 'cookie': user.cookie } })
  if (resp.status != 200) {
    console.error('拔萝卜异常，状态码：', resp.status)
    console.error('拔萝卜异常，响应：', resp.text())
    return
  } else {
    let json = resp.json()
    if (json.message == 'ok') {
      addMsg('拔萝卜完成')
      user.statu++
    } else {
      console.error('拔萝卜异常，响应：', json)
    }
  }
}

//查任务
function getTask() {
  let data = `ref=vipAccountShortcut&pathname=%2Fmio%2FcheckIn
  &version=dev.231026&miui_version=G9700FXXU1APFO
  &android_version=9&device=gracelte&model=SM-N9760&androidVersion=9
  &miui_vip_ph=${encodeURIComponent(user.miui_vip_ph)}
  &fromPop=0`
  let url = 'https://api.vip.miui.com/mtop/planet/vip/member/getCheckinPageCakeList?' + data
  let resp = HTTP.get(url, { headers: { 'cookie': user.cookie, 'User-Agent': user.ua } });
  if (resp.status != 200) {
    console.error('查任务异常，status: ', resp.status)
    console.error('查任务异常，headers: ', resp.headers)
    console.error('查任务异常，text: ', resp.text())
    return
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
  user.tasks = task
}

//获取帖子序列
function get_posts() {
  let data = `country=CN
  &vip-gzip=1
  &language=zh
  &android_version=9
  &ref=vipAccountShortcut
  &dark_mode=false
  &requestId=${requestId()}
  &model=SM-N9760
  &miui_version=G9700FXXU1APFO
  &miui_vip_ph=${encodeURIComponent(user.miui_vip_ph)}
  &product=SM-N9760
  &sim_operator=1
  &offset=0
  &pageNum=5
  &version=dev.231026
  &withComment=true
  &requestTime=${new Date().getTime()}
  &app_name=com.xiaomi.vipaccount
  &fast=true
  &fastEntryKey=DISCOVER_FAST_ENTRY_NEW_CONF
  &device=gracelte`
  let url = 'https://api.vip.miui.com/mtop/planet/vip/home/discover?' + data
  let resp = HTTP.get(url, { headers: { "Cookie": user.cookie, 'User-Agent': user.ua } })
  if (resp.status != 200) {
    console.error('获取帖子异常，状态码: ', resp.status)
    console.error('获取帖子异常，headers: ', resp.headers)
    console.error('获取帖子异常，text: ', resp.text())
    return
  }
  let res = resp.json()
  res = res.entity.recommend.records
  user.posts = res;
}

// 登录小米社区，获取cookie
function login_community() {
  let resp = HTTP.get('https://api.vip.miui.com/page/login?destUrl=https%3A%2F%2Fweb.vip.miui.com%2Fpage%2Finfo%2Fmio%2Fmio%2FuserDevPlatform%3FisHideTitle%3D1%26app_version%3Ddev.220218&time=' + now.getTime(),
    { headers: { 'Referer': 'https://web.vip.miui.com/', 'User-Agent': user.ua } })  //发送请求1
  url = resp.headers.location

  resp = HTTP.get(url, {  //请求2
    headers: {
      'cookie': user.accountCookie,
      'Referer': 'https://web.vip.miui.com/',
      'User-Agent': user.ua
    }
  })
  url = resp.headers.location
  resp = HTTP.get(url, { headers: { 'User-Agent': user.ua } })  //发送请求3，获取新的签到Cookie

  if (resp.status != 302) {
    console.error('用户小米账号登录cookie已过期，请到以下网址重新抓取：https://account.xiaomi.com/')
    // login_acct()  //社区登录失效，重新登录账号
    // login()
    return false
  } else {
    user.cookie = getRespCookie(resp.headers)
    info()  //用cookie获取用户信息
    return true
  }
}

//获取一个随机请求id
function requestId() {
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

//登录小米账号，获取cookie
function login_acct() {

  let hash = Crypto.createHash("md5").update(Buffer.from(user.pwd)).digest('hex').toUpperCase();

  let url = 'https://account.xiaomi.com/pass/serviceLoginAuth2';

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
    'Cookie': 'deviceId=; pass_ua=web; uLocale=zh_CN'
  }

  let data = {
    'bizDeviceType': '',
    'needTheme': 'false',
    'theme': '',
    'showActiveX': 'false',
    'serviceParam': '{"checkSafePhone":false,"checkSafeAddress":false,"lsrp_score":0.0}',
    'callback': 'https://api.vip.miui.com/sts',
    'sid': 'miui_vip',
    '_sign': 'ZJxpm3Q5cu0qDOMkKdWYRPeCwps=',
    'user': user.uid,
    'cc': '+86',
    'hash': hash,
    '_json': 'true'
  }

  let response = HTTP.post(url, data, { headers });
  let text = response.text()

  console.log(user.uid)
  console.log(hash)

  // try {

  let auth = JSON.parse(text.replace('&&&START&&&', ''));
  if (auth.description == '登录验证失败') {
    console.error('请到以下地址手动抓取账号cookie：https://account.xiaomi.com/')
    return false;
  }

  // let clientSign = Crypto.createHash("sha1").update(Buffer.from((`nonce=${auth.nonce}&${auth.ssecurity}`))).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const sha1 = Crypto.createHash('sha1')
  sha1.update(`nonce=${auth.nonce}&${auth.ssecurity}`)
  const sha1Digest = sha1.digest()
  const base64EncodedDigest = Buffer.from(sha1Digest).toString('base64')
  const clientSign = base64EncodedDigest.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  console.error('pwd', "=", auth['pwd'])
  console.error('clientSign: ', clientSign)

  // 构建新的 URL
  let nurl = auth.location + '&_userIdNeedEncrypt=true&clientSign=' + clientSign
  let resp = HTTP.get(nurl)

  user.accountCookie = getRespCookie(resp.headers)
  xmSheet.Range('I' + user.row).Value = user.accountCookie
  if (user.accountCookie.length < 100) {
    console.error('账号登录异常，获得新的账号cookie：', user.accountCookie)
    console.error(resp.text())
    return false
  }

  login_community() //登录社区
  return true;

  // } catch (error) {
  //   if (/<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/.test(text)) {
  //     console.error('账号登录：Error!')
  //     console.log('响应头Cookie：', getRespCookie(response.headers))
  //   } else {
  //     console.error('登录账号时错误响应：', text)
  //   }
  // }

}

function login() {
  let hash = Crypto.createHash("md5").update(Buffer.from(user.pwd)).digest('hex').toUpperCase();
  let url = 'https://account.xiaomi.com/pass/serviceLoginAuth2'
  let data = `bizDeviceType=
  &needTheme=false
  &theme=
  &showActiveX=false
  &serviceParam=%7B%22checkSafePhone%22%3Afalse%2C%22checkSafeAddress%22%3Afalse%2C%22lsrp_score%22%3A0.0%7D
  &callback=https%3A%2F%2Faccount.xiaomi.com%2Fsts%3Fsign%3DZvAtJIzsDsFe60LdaPa76nNNP58%253D%26followup%3Dhttps%253A%252F%252Faccount.xiaomi.com%252Fpass%252Fauth%252Fsecurity%252Fhome%26sid%3Dpassport
  &qs=%253Fcallback%253Dhttps%25253A%25252F%25252Faccount.xiaomi.com%25252Fsts%25253Fsign%25253DZvAtJIzsDsFe60LdaPa76nNNP58%2525253D%252526followup%25253Dhttps%2525253A%2525252F%2525252Faccount.xiaomi.com%2525252Fpass%2525252Fauth%2525252Fsecurity%2525252Fhome%252526sid%25253Dpassport%2526sid%253Dpassport%2526_group%253DDEFAULT
  &sid=passport
  &_sign=2%26V1_passport%26BUcblfwZ4tX84axhVUaw8t6yi2E%3D
  &user=${user.uid}
  &cc=%2B86
  &hash=${hash}
  &_json=true
  &policyName=miaccount
  &captCode=`
  let options = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Eui': 'I7xA4qmjEEa6QZXRMQKcrRqIzyT1N9kKR2+fqT5ZLcvIVZscdI6cDSZa+5V5pStOwzDfYYomcqzE4cNRT9rmA6B5DordmPKu6RnIwY0D+18jTAbMswZkT8z15HowB6L0kD1AtjHpgjh4UZEfHM1PGScKiVP3Dlo/XfqjMqHIZF4=.dXNlcg==',
      'Referer': `https://account.xiaomi.com/fe/service/login/password?_locale=zh_CN`,
      'User-Agent': user.ua
    }
  }
  let resp = HTTP.post(url, data, options)
  let newCookie = getRespCookie(resp.headers)
  console.log(newCookie)
  console.log(resp.text())
}



/**
 * 解析响应头中的get-cookie
 */
function getRespCookie(headers) {
  set_cookie = parseCookies(headers['set-cookie'])
  let newCookie = ''

  for (let i = 0; i < set_cookie.length; i++) {
    if (newCookie == '') newCookie = set_cookie[i][0]
    else newCookie += ';' + set_cookie[i][0]
  }

  return newCookie

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

//获取指定名称cookie
function getCookie(allCookie, name) {
  let cookieR = allCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = splitStringByFirstEqual(cookieR[i]) //纵向切割
    if (name == cookieC[0]) return cookieC[1]
  }
  return null

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

// 主程序
function main() {
  user.statu = 0 //执行成功的任务数
  let trgt = 0  //需完成的任务
  info()  //获取用户基本信息
  get_posts() //获取一篇帖子序列
  // if (user.isSignIn == '是' && user.token != '') { check_in(); trgt++; }      //签到，任务目标+1
  if (user.likePost == '是') { like(); trgt++; }          //点赞，任务目标+1
  if (user.browsePost == '是') { browse(); trgt++; }        //看帖，任务目标+1
  if (user.carrot == '是') { carrot(); trgt++; }        //拔萝卜，任务目标+1

  if (user.statu == 0) {
    msgResult += msgResult == '' ? '❌' : '❌'
  } else if (user.statu < trgt) {
    msgResult += msgResult == '' ? '❓' : '❓'
  } else {
    msgResult += msgResult == '' ? '✅' : '✅'
  }
}














const now = new Date() //获取当前时间
const currentDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();  //提取当日日期
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

var user = {  //用户信息
  name: null,
  cookie: null,
  isSignIn: null,
  accountCookie: null,
  statu: null,
  ua: null,
  miui_vip_ph: null,
  deviceId: null,
  uid: null,
  pwd: null,
  token: null,
  row: null,
  likePost: null,
  browsePost: null,
  carrot: null,
  posts: null,
  tasks: null
}

var msgResult = ''  //写入通知的执行结果
var msgContent = '' //写入通知的消息内容
function addMsg(content) {
  console.log(content)
  if (msgContent == '') {
    msgContent = content
  } else {
    msgContent += ' \n' + content
  }
}

for (let row = 2; "" != xmSheet.Range("E" + row).Text; row++) {
  user.row = row  //第row行账号
  user.isSignIn = xmSheet.Range("E" + user.row).Text  //是否签到
  user.likePost = xmSheet.Range("G" + user.row).Text  //是否点赞
  user.browsePost = xmSheet.Range("H" + user.row).Text  //是否浏览帖子
  user.carrot = xmSheet.Range("F" + user.row).Text  //是否拔萝卜
  user.token = xmSheet.Range("K" + user.row).Text //人机验证token
  user.ua = xmSheet.Range("L" + user.row).Text  //浏览器ua
  user.uid = xmSheet.Range("M" + user.row).Text //账号
  user.pwd = xmSheet.Range("N" + user.row).Text //密码
  user.accountCookie = xmSheet.Range("I" + user.row).Text   //登录信息Cookie
  user.cookie = xmSheet.Range("A" + user.row).Text  //用户签到凭据
  user.deviceId = getCookie(user.accountCookie, 'deviceId')

  main(user.uid, user.pwd)
}

console.log('通知：', msgResult, '|', msgContent)
//写入消息日志
msgSheet.Range('B4').Value = msgResult;
msgSheet.Range('C4').Value = msgContent;
msgSheet.Range('D4').Value = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
