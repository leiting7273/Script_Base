/**
 * 序言：本脚本为实现阿里云盘自动每日签到脚本，可月底统一领取奖励
 */
const aliSheet = Application.Sheets("阿里云盘") //阿里云盘工作表
if (aliSheet == null) {
  console.error('未找到表格“阿里云盘”')
  return
}

const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}
var msgResult = ''
var msgContent = ''

const currentDate = new Date()
const data_time = currentDate.toLocaleDateString() //当前时间
const currentDay = currentDate.getDate(); // 获取当前日期的天数
const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // 获取当月的最后一天的日期

//执行签到
signIn()

//写入消息日志
msgSheet.Range('B2').Value = msgResult;
msgSheet.Range('C2').Value = msgContent;
msgSheet.Range('D2').Value = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + currentDate.getDate().toString().padStart(2, '0');

//遍历签到
function signIn() {
  let aliToken  //refresh_token
  let isSignIn  //是否签到
  let isGetRewards //是否领取奖励

  for (let row = 2; "" != (isSignIn = aliSheet.Range("E" + row).Text); row++) {
    aliToken = aliSheet.Range("A" + row).Text
    // isSignIn = aliSheet.Range("E" + row).Text
    isGetRewards = aliSheet.Range("G" + row).Text

    if (isSignIn == "是" && aliToken != "") {
      let logMessage = ""
      let rewardMessage = ""
      let resp = HTTP.post("https://auth.aliyundrive.com/v2/account/token", //获取授权码access_token
        JSON.stringify({
          "grant_type": "refresh_token",
          "refresh_token": aliToken
        })
      )
      if (resp.status != 200) {
        console.error("fetch err! status is " + resp.status)
      }//服务器响应错误
      let data = resp.json() // 将响应数据解析为 JSON 格式
      let access_token = data['access_token']; // 获取访问令牌
      let phone = data["user_name"]; // 获取用户名
      let new_refresh_token = data['refresh_token']  //获取访问令牌的时候能拿到一个新的refresh_token，写回表格

      if (new_refresh_token != aliToken) {
        aliSheet.Range("A" + row).Value = new_refresh_token  //回写新的refresh_token
      }
      if (access_token == undefined) { // 如果访问令牌未定义
        console.log("单元格【A" + row + "】内的token值错误，程序执行失败，请重新复制正确的token值")
        //通知
        msgResult = '❌'
        addMsg('token无效，请及时更新')
        continue // 跳过当前行的后续操作
      }

      data.avatar = null
      data.user_data = null
      data.access_token = null
      console.log('获取访问令牌：', data)


      let access_token2 = 'Bearer ' + access_token  // 构建包含访问令牌的请求头
      //签到
      let data2 = HTTP.post("https://member.aliyundrive.com/v1/activity/sign_in_list",
        JSON.stringify({ "_rx-s": "mobile" }),
        { headers: { "Authorization": access_token2 } }
      )
      if (data2.status !== 200) {

        throw new Error("fetch err! status is " + resp.status())
      }//服务器响应错误
      data2 = data2.json(); // 将响应数据解析为 JSON 格式
      let signin_count = data2['result']['signInCount']; // 获取签到次数

      let info = data2['result']
      info.signInLogs = null
      info.signInCover = null
      info.signInRemindCover = null
      info.rewardCover = null
      console.log('>>>>', info)

      logMessage = "账号：" + phone + " - 签到成功，本月累计签到 " + signin_count + " 天"
      msgResult = '✅'

      {
        let json = HTTP.post('https://member.aliyundrive.com/v2/activity/sign_in_list', {}, { headers: { "Authorization": access_token2 } }).json()
        let signInInfos = json['result']['signInInfos']

        for (let i = 0; signInInfos[i]; i += 6) {
          //签到情况 finished签到未领取 notStart未到时间 verification已领取
          let list = []
          for (let j = 0; list.length < 7 && i + j < lastDayOfMonth; j++) {
            if (i + j == 0) {
              let day = currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' + signInInfos[i + j].date
              day = new Date(day).getDay()
              for (let n = 0; n < day; n++) {
                list.push('-')
              }
            }
            let status = signInInfos[i + j].rewards[0].status
            status = status == 'finished' ? 'O' : status == 'notStart' ? '*' : status == 'verification' ? '√' : 'X'
            list.push(status)
          }
          for (; list.length < 7; list.push('-')) { }
          // console.log(list)
          console.log(list[0] + '\t\t' + list[1] + '\t\t' + list[2] + '\t\t' + list[3] + '\t\t' + list[4] + '\t\t' + list[5] + '\t\t' + list[6])
        }

        let rewards = signInInfos[currentDay - 1]['rewards']
        for (let i in rewards) {
          let reward = rewards[i]
          try {
            if (reward.type == 'vipDay' && reward.status == 'unfinished') {
              //会员日领取奖励
              let json = HTTP.post('https://member.aliyundrive.com/v2/activity/vip_day_reward?_rx-s=mobile', {}, { headers: { "Authorization": access_token2 } }).json()
              let success = json.success
              console.log('会员日: ', reward.name, success ? '::领取成功' : '::领取失败')
            }
          } catch (error) {
            console.error('会员日奖励领取异常')
          }
        }
      }

      if (isGetRewards == "是") {
        try {// 领取奖励
          let data3 = HTTP.post(
            "https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile",
            JSON.stringify({ "signInDay": signin_count }),
            { headers: { "Authorization": access_token2 } }
          );
          data3 = data3.json(); // 将响应数据解析为 JSON 格式
          console.log('奖励信息：', data3)
          let rewardName = data3["result"]["name"]; // 获取奖励名称
          let rewardDescription = data3["result"]["description"]; // 获取奖励描述
          rewardMessage = " " + rewardName + " - " + rewardDescription;
        } catch (error) {
          if (error.response && error.response.data && error.response.data.error) {
            let errorMessage = error.response.data.error; // 获取错误信息
            if (errorMessage.includes(" - 今天奖励已领取")) {
              rewardMessage = " - 今天奖励已领取";
              console.log("账号：" + phone + " - " + rewardMessage);
            } else {
              console.log("账号：" + phone + " - 奖励领取失败：" + errorMessage);
            }
          } else {
            console.log("账号：" + phone + " - 奖励领取失败");
          }
        }
      } else { rewardMessage = " - 奖励待领取" }
      var lastMsg = ''
      //领取月末奖励
      let bool = currentDay == lastDayOfMonth
      lastMsg = getAllRewards(row, bool)//月末领取所有未领取签到奖励
      if (!bool) lastMsg = '';
      console.log(logMessage + rewardMessage)

      //通知
      addMsg(logMessage + rewardMessage + lastMsg)

    }
  }
}

function getAllRewards(row, receive) {
  // 发起网络请求-获取token
  let data = HTTP.post("https://auth.aliyundrive.com/v2/account/token",
    JSON.stringify({
      "grant_type": "refresh_token",
      "refresh_token": aliSheet.Range('A' + row).Text
    })
  );
  data = data.json(); // 将响应数据解析为 JSON 格式
  let access_token = data['access_token']; // 获取访问令牌

  if (access_token === undefined) { // 如果访问令牌未定义
    console.log("单元格【A" + row + "】内的token值错误，程序执行失败，请重新复制正确的token值");
    return; // 跳过当前行的后续操作
  }

  access_token = 'Bearer ' + access_token; // 构建包含访问令牌的请求头

  let b = 0 //总未领天数
  let a = 0 //成功领取天数
  let rewardsList
  let rewardsResp = HTTP.post('https://member.aliyundrive.com/v2/activity/sign_in_list', {}, { headers: { "Authorization": access_token } })
  if (rewardsResp.status == 200) {
    let json = rewardsResp.json()
    let signInCount = json.result.signInCount //签到日期
    console.log('签到日期: ', signInCount)
    rewardsList = json.result.signInInfos //奖励列表
    // console.log('奖励列表: ', rewardsList)
    if (receive) {
      for (let i = 0; i < signInCount; i++) {
        if (rewardsList[i].rewards[0].status == 'finished') {
          b++
          let day = rewardsList[i].day
          //领取当天奖励
          console.log('领取' + day + '号奖励')
          let response = HTTP.post(
            "https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile",
            JSON.stringify({ "signInDay": day }),
            { headers: { "Authorization": access_token } }
          );
          response = response.json(); // 将响应数据解析为 JSON 格式
          var claimStatus = response["success"]; // 获取奖励状态
          if (claimStatus) {
            a++
            console.log('A' + row + " - 第 " + day + " 天奖励" + "领取成功, " + response["result"]["notice"]);
          } else {
            console.log('A' + row + " - 第 " + day + " 天奖励领取失败");
            console.log(response)
          }
        }
      }
      let r = { "a": a, "b": b }
      return r.b > 0 ? '自动领取本月未领' + r.a + '/' + r.b + '个,请查看脚本日志' : '';
    }
    for (let i = 1; rewardsList[signInCount - 1].rewards[i]; i++) {
      if (rewardsList[signInCount - 1].rewards[i].status == 'finished') {
        let response = HTTP.post(
          "https://member.aliyundrive.com/v2/activity/sign_in_task_reward",
          JSON.stringify({ "signInDay": signInCount }),
          { headers: { "Authorization": access_token } }
        );
        response = response.json(); // 将响应数据解析为 JSON 格式
        console.log(signInCount + '日奖励领取详情：', response)
      }
    }
  } else {
    console.error('A' + row + '月底领取所有奖励检测响应异常')
    console.error(rewardsResp.text())
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