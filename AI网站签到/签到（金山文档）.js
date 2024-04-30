//脚本名：阿水AI、AIGC+、提示语AI 综合签到

var ashui_user = {
    token_location: "C2",
    msgResult_location: 'B6',//消息结果位置
    msgContent_location: 'C6',//消息内容位置
    today_location: 'D6',//更新日期位置
    msgResult: '',
    msgContent: '',
    uname: '',
    token: '',
    totalValue: 0,
    availableValue: 0
  }
  
  var aigc_user = {
    token_location: "C5",
    msgResult_location: 'B9',//消息结果位置
    msgContent_location: 'C9',//消息内容位置
    today_location: 'D9',//更新日期位置
    msgResult: '',
    msgContent: '',
    uname: '',
    token: '',
    total: 0,
    usable: 0
  }
  
  var xiaoyu_user = {
    'nikeName': '',
    'leftPower': 0,
    token_location: 'c7',//cookie位置
    msgResult_location: 'B10',//消息结果位置
    msgContent_location: 'C10',//消息内容位置
    today_location: 'D10',//更新日期位置
    token: '',
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
  }
  
  const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
  if (msgSheet == null) {
    console.error('未找到表格“【通知消息】”')
    return
  }
  
  checkIn()//执行签到
  
  //写入消息日志
  function setLog(user) {
    msgSheet.Range(user.msgResult_location).Value = user.msgResult;
    msgSheet.Range(user.msgContent_location).Value = user.msgContent;
    msgSheet.Range(user.today_location).Value = today
  }
  
  //签到函数
  function checkIn() {
    ashui()
    aigc()
    xiaoyu()
  }
  
  
  
  function ashui() {
    console.log("阿水AI 开始签到>>>")
  
    //获取登录token
    ashui_user.token = sheet.Range(ashui_user.token_location).Text
    if (ashui_user.token == '') return
  
    //签到请求
    let url = 'https://api.xiabb.chat/chatapi/marketing/signin'
    let auth = 'Bearer ' + ashui_user.token
    let resp = HTTP.post(url, {}, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Referer': 'https://ai.xiabb.chat/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    })
  
    if (resp.status != 200) {
      console.error('签到请求发生异常，状态码：', resp.status)
      console.error('签到请求发生异常，响应：', resp.text)
    } else {
      let json = resp.json()
      if (json.code != 200 && json.code != 400 && json.code != 500) {
        if (json.code == 401) {
          setResult(ashui_user, -1)
          addMsg(ashui_user, '登录token过期，请重新登录')
        } else {
          setResult(ashui_user, 1)
          console.log('签到请求响应异常，code：', json.code)
          addMsg(ashui_user, '签到请求响应异常：' + JSON.stringify(json))
        }
      } else {
        setResult(ashui_user, 0)
        if (json.code == 200) {
          ashui_user.checkNum = json.result
          addMsg(ashui_user, '签到成功,连续签到 ' + ashui_user.checkNum + '+天')
        } else {
          addMsg(ashui_user, json.message)
        }
  
        getInfo() //更新信息
        addMsg(ashui_user, '用户：' + ashui_user.uname)
  
        let perc = ashui_user.availableValue * 100 / ashui_user.totalValue
        addMsg(ashui_user, '对话余额：' + perc.toFixed(1) + '%(' + ashui_user.availableValue + '/' + ashui_user.totalValue + ')')
      }
    }
  
    setLog(ashui_user)
  
    //获取用户信息
    function getInfo() {
      let url = 'https://api.xiabb.chat/chatapi/auth/memberInfo'
      let auth = 'Bearer ' + ashui_user.token
      let resp = HTTP.get(url, { headers: { 'Authorization': auth } })
      if (resp.status != 200) {
        console.error('获取信息请求发生异常，状态码：', resp.status)
        console.error('获取信息请求发生异常，响应：', resp.text)
      } else {
        let info = resp.json()
        ashui_user.uname = info.result.nickName
        ashui_user.totalValue = info.result.wallets[1].totalValue
        ashui_user.availableValue = info.result.wallets[1].availableValue
      }
    }
  }
  
  function aigc() {
    console.log("AIGC+ 开始签到>>>")
  
    //获取登录token
    aigc_user.token = sheet.Range(aigc_user.token_location).Text
    if (aigc_user.token == '') return
  
    //签到请求
    // let url = 'https://my.aigcplus.org/chatapi/marketing/signin'
    let url = 'https://my.aigcplus.org/api/gift_sign'
    let auth = '' + aigc_user.token
    let resp = HTTP.post(url, {}, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Referer': 'https://my.aigcplus.org/me/gift',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    })
  
    if (resp.status != 200) {
      console.error('签到请求发生异常，状态码：', resp.status)
      console.error('签到请求发生异常，响应：', resp.text)
    } else {
      let json = resp.json()
      if (json.code != 0 && json.code != 400 && json.code != 500 && json.code != 1) {
        if (json.code == 401) {
          setResult(aigc_user, -1)
          addMsg(aigc_user, '登录token过期，请重新登录')
        } else {
          setResult(aigc_user, 1)
          console.log('签到请求响应异常，code：', json.code)
          addMsg(aigc_user, '签到请求响应异常：' + JSON.stringify(json))
        }
      } else {
        setResult(aigc_user, 0)
        if (json.code == 0) {
          // aigc_user.checkNum = json.result
          addMsg(aigc_user, '签到成功')
        } else {
          addMsg(aigc_user, json.msg)
        }
  
        getInfo() //更新信息
        let usable0 = '限时算力余额：' + aigc_user.usable[0] + '/' + aigc_user.total[0]
        let usable1 = '签到算力余额：' + aigc_user.usable[1] + '/' + aigc_user.total[1]
        addMsg(xiaoyu_user, usable0)
        addMsg(xiaoyu_user, usable1)
      }
    }
  
    setLog(aigc_user)
    //获取用户信息
    function getInfo() {
      // let url = 'https://my.aigcplus.org/chatapi/auth/memberInfo'
      let url = 'https://my.aigcplus.org/api/user_plan?page=1'
      let auth = aigc_user.token
      let resp = HTTP.get(url, { headers: { 'Authorization': auth } })
      if (resp.status != 200) {
        console.error('获取信息请求发生异常，状态码：', resp.status)
        console.error('获取信息请求发生异常，响应：', resp.text)
      } else {
        let info = resp.json()
        // aigc_user.uname = info.result.nickName
        let records = info.data.records
        aigc_user.total = [records[0].total, records[1].total]
        aigc_user.usable = [records[0].usable, records[1].usable]
      }
    }
  }
  
  function xiaoyu() {
    console.log("提示语AI 开始签到>>>")
  
    xiaoyu_user.token = sheet.Range(xiaoyu_user.token_location).Text
    let url = "https://api.tishi.top/graphql"
    let headers = {
      "Authorization": xiaoyu_user.token
    }
    let body = [
      {
        "operationName": "checkIn",
        "variables": {},
        "query": "mutation checkIn {\n  checkIn {\n    id\n    lastCheckInTime\n    isCheckInAvailable\n    __typename\n  }\n}"
      }
    ]
  
    //发送签到请求
    let resp = HTTP.post(url, body, { headers })
  
    if (resp.status != 200) {
      setResult(xiaoyu_user, -1);
      addMsg(xiaoyu_user, "签到失败，响应异常" + JSON.stringify(json));
      return
    }
  
    let json = resp.json()
    let result = json[0]["data"]["checkIn"]["isCheckInAvailable"]
  
    if (result) {
      setResult(xiaoyu_user, 0);
      addMsg(xiaoyu_user, "签到成功")
      console.log("响应JOSN：", json)
    } else {
      if (json[0]["data"]["checkIn"]["__typename"] == "User") {
        setResult(xiaoyu_user, 0);
        addMsg(xiaoyu_user, "今日已签到")
        console.log("响应JOSN：", json)
      } else {
        setResult(xiaoyu_user, -1);
        addMsg(xiaoyu_user, "签到失败:" + JSON.stringify(json));
        return
      }
    }
  
    body = [
      {
        "operationName": "getUserVIPStatus",
        "variables": {},
        "extensions": {
          "persistedQuery": {
            "version": 1,
            "sha256Hash": "cd2f89c8ee6bdb4efe0d5b0fe0ac32be7299cc3a1acccd928270fbdd4641fa36"
          }
        }
      },
      {
        "operationName": "getComputingPowerObtains",
        "variables": {
          "input": {
            "pagination": {
              "page": 1,
              "pageSize": 10
            }
          }
        },
        "extensions": {
          "persistedQuery": {
            "version": 1,
            "sha256Hash": "78fa06f6202b8411760c560b17733b0a44e795cf024287f09046a2b50a4faf41"
          }
        }
      }
    ]
    resp = HTTP.post('https://api.tishi.top/graphql', body, { headers })
  
    if (resp.status == 200) {
      json = resp.json()
      xiaoyu_user.nikeName = '用户'
      // console.log(json[0]['data'])
      xiaoyu_user.leftPower = json[0]['data']['getUserVIPStatus']['vipLeftPower']
      addMsg(xiaoyu_user, "昵称：" + xiaoyu_user.nikeName)
      addMsg(xiaoyu_user, "剩余电力：" + xiaoyu_user.leftPower)
    } else {
      addMsg(xiaoyu_user, "获取信息失败，响应异常" + JSON.stringify(json));
      return
    }
  
    setLog(xiaoyu_user)
  }
  
  //添加消息
  function addMsg(user, msg) {
    console.log(msg)
    if (user.msgContent == '') {
      user.msgContent = msg;
    } else {
      user.msgContent += '\n' + msg
    }
  }
  
  //执行结果
  function setResult(user, r) {
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