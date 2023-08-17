// ==UserScript==
// @name         VikACG 自动签到
// @description  打开任意网站时自动签到，第一次使用需弹窗填写pushplus_token
// @namespace    http://tampermonkey.net/
// @version      0.2.8
// @author       lei
// @match        https://*/*
// @icon         http://vikacg.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// ==/UserScript==


//执行签到
(function () {
    'use strict';
    let msg = ''
    const myDate = new Date() //获取当前时间
    const year = myDate.getFullYear()       //年
    const month = myDate.getMonth() + 1     //月
    const day = myDate.getDate()            //日
    const today = year + "-" + month + "-" + day
    var lastDay = GM_getValue('lastDay','')

    if(today==lastDay){
        msg = '今日已签到'
        log(msg)
        GM_log(msg,'info')
        return
    }

    var pushToken = GM_getValue('pushToken',null)
    if(pushToken==null){
        pushToken = prompt("请输入您pushToken:", "")
        GM_setValue('pushToken',pushToken)
    }
    // alert('你的pushToken：'+pushToken)

    var b2_token = GM_getValue('b2_token',null)
    if(b2_token==null) {
        b2_token = getCookies('b2_token')
        GM_setValue('b2_token',b2_token)
    }

    GM_xmlhttpRequest({
        "url": "https://www.vikacg.com/wp-json/b2/v1/getUserMission",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9",
            "authorization": "Bearer " + b2_token,
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"105\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"105\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin"
        },
        "referrer": "https://www.vikacg.com/mission/today",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "count=0&paged=1",
        "method": "POST",
        "mode": "cors",
        "credentials": "include",
        "onload": function (result) {
            if (result.status == 200) {
                const json = JSON.parse(result.response)
                var data = json.mission
                var checkinDate = data.date
                var checkGetMission = data.credit
                var my_credit = data.my_credit
                var always = data.always
                if (checkGetMission == 0) {
                    log("目前积分：" + my_credit)
                    GM_xmlhttpRequest({
                        "url": "https://www.vikacg.com/wp-json/b2/v1/userMission",
                        "headers": {
                            "accept": "application/json, text/plain, */*",
                            "accept-language": "zh-CN,zh;q=0.9",
                            "authorization": 'Bearer ' + b2_token,
                            "cache-control": "no-cache",
                            "pragma": "no-cache",
                            "sec-ch-ua": "\"Microsoft Edge\";v=\"105\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"105\"",
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": "\"Windows\"",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin"
                        },
                        "referrer": "https://www.vikacg.com/mission/today",
                        "referrerPolicy": "strict-origin-when-cross-origin",
                        "body": null,
                        "method": "POST",
                        "mode": "cors",
                        "credentials": "include",
                        "onload": function (result) {
                            if (result.status == 200) {
                                const json = JSON.parse(result.response)
                                var date = json.date
                                var credit = json.credit
                                var my_credit = json.mission.my_credit
                                msg = date + " 签到成功，获得积分：" + credit + " 目前积分：" + my_credit + " 请查看积分是否有变动"
                                log(msg)
                                GM_setValue('lastDay',today)
                                sendWeChat(pushToken,msg)
                            } else {
                                log("签到失败")
                            }
                        },
                    });
                } else {
                    msg = "今天已经签到，如有问题请尝试手动签到"
                    GM_setValue('lastDay',today)
                    sendWeChat(pushToken,msg)
                    log("签到时间：" + checkinDate + "，签到获得积分：" + checkGetMission + "，目前积分：" + my_credit)
                    log(msg);
                }
            } else {
                if(!compareDomains('www.vikacg.com')){
                    promptRedirect('https://www.vikacg.com')
                }
                log('请求失败，是否未登录？')
            }
        },
    });
})();

//获取cookie
//根据name获取cookie
function getCookie(nm) {
    if(!compareDomains('www.vikacg.com'))
    {
        //跳转页面
        promptRedirect('https://www.vikacg.com')
    }
    let allCookie = document.cookie
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

//微信通知
function sendWeChat(pushToken, content) {
    if(pushToken==''){
        log('不发送微信通知')
        return
    }
    GM_log('推送token：'+pushToken,'info')
    let url = "http://www.pushplus.plus/send" //请求地址
    let headers = { "content-type": "application/json" }  //headers
    let body = "{'token':'"+pushToken+"','title':'VikACG签到通知','content':'"+content+"'}"
    GM_xmlhttpRequest({'url':url,
            "method": "POST",
            "headers":headers,
            "data": body,
            // "token="+pushToken+"&title=VikACG签到通知&content="+content,
            "onload": function (result) {
                let json = JSON.parse(result.response)
                console.log('微信通知结果：')
                console.log(json)
                GM_log('微信通知结果：'+JSON.stringify(json),'info')
            }
        })
}

//域名比较
function compareDomains(domain) {
  var currentDomain = window.location.hostname;
  
  // 将当前域名和指定域名转换为小写，以便不区分大小写进行比较
  currentDomain = currentDomain.toLowerCase();
  domain = domain.toLowerCase();
  
  // 比较当前域名和指定域名是否相同
  if (currentDomain === domain) {
    return true;
  } else {
    return false;
  }
}

//页面跳转
function promptRedirect(url) {
  var answer = confirm("cookie已失效，页面即将跳转");
  if (answer) {
    window.location.href = url; 
  }
}

//输出日志
function log(msg){
    console.log(msg)
    GM_log(msg,'info')
    showMessage(msg)
}

//识别字符串中文数量
function countChineseAndNonChinese(str) {
    let chineseCount = 0; // 统计中文字符数量
    let nonChineseCount = 0; // 统计非中文字符数量

    for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);

        // 判断字符是否为中文（Unicode 范围：0x4E00 - 0x9FFF）
        if (/[\u4E00-\u9FFF]/.test(char)) {
            chineseCount++;
        } else {
            nonChineseCount++;
        }
    }

    return {
        chinese: chineseCount,
        nonChinese: nonChineseCount
    };
}

/***********************************以下是悬浮提示相关代码***********************************/

// 用于保存当前显示的悬浮窗的 div
var floatingContainer = null;
//是否第一次调用
var _flag = 1

// 用于保存当前正在显示的悬浮窗列表
const floatingBoxes = [];

// 创建初始的悬浮容器
function createFloatingContainer() {
    floatingContainer = document.createElement('div');
    floatingContainer.style.position = 'fixed';
    floatingContainer.style.top = '50px';
    floatingContainer.style.left = '20px';
    floatingContainer.style.width = 'auto';
    floatingContainer.style.height = '200px';
    floatingContainer.style.zIndex = '9999';
    document.body.appendChild(floatingContainer);
}

// 创建悬浮提示框
function createFloatingBox(message) {
    const floatingBox = document.createElement('div');
    floatingBox.style.position = 'relative';
    floatingBox.style.backgroundColor = '#f0f0f0';
    floatingBox.style.border = '1px solid #ddd';
    floatingBox.style.padding = '5px';
    floatingBox.style.borderRadius = '5px';
    floatingBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    floatingBox.style.whiteSpace = 'nowrap';
    floatingBox.style.marginBottom = '40px'; // 初始下边距为 40px
    floatingBox.innerText = message;
    floatingContainer.appendChild(floatingBox);
    return floatingBox;
}

// 更新悬浮提示框的位置
function updateFloatingBoxesPosition() {
    let offsetY = 0;
    for (let i = 0; i < floatingBoxes.length; i++) {
        floatingBoxes[i].style.bottom = offsetY + 'px';
        offsetY += floatingBoxes[i].offsetHeight + 5;
    }
}

// 显示悬浮提示
function showFloatingMessage(message) {
    if (!floatingContainer) {
        createFloatingContainer();
    }

    const floatingBox = createFloatingBox(message);
    floatingBoxes.push(floatingBox);

    // 如果有多个悬浮提示框，则调整它们的位置
    if (floatingBoxes.length > 1) {
        updateFloatingBoxesPosition();
    }

    // 在指定的时间间隔后，隐藏浮窗并从页面中移除
    setTimeout(function () {
        floatingBox.style.display = 'none';
        floatingContainer.removeChild(floatingBox);
        const indexToRemove = floatingBoxes.indexOf(floatingBox);
        if (indexToRemove !== -1) {
            floatingBoxes.splice(indexToRemove, 1);
            if (floatingBoxes.length > 0) {
                updateFloatingBoxesPosition();
            }
        }
    }, 5000); // 悬浮提示显示时间，单位毫秒
}

//调用显示浮窗
function showMessage(message){
    if(_flag==1){
        _flag++
        showFloatingMessage(message)
    }else{
        _flag++
        setTimeout(function(){
            showFloatingMessage(message)
        },(_flag-2)*2000)
    }
}