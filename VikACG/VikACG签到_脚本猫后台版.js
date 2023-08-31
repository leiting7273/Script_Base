// ==UserScript==
// @name         VikACG 自动签到（定时）
// @description  每天自动签到，需手动填写pushplus_token
// @namespace    vikacg.com
// @version      0.2.12
// @author       lei
// @background
// @crontab      * * once * *
// @icon         http://vikacg.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        GM_cookie
// @connect      www.vikacg.com
// ==/UserScript==


//执行签到
return new Promise((resolve, reject) => {
    'use strict';
    var b2_token
    let msg = ''
    //操作cookie
    // 定义 Cookie 信息
    const cookieDetails = {
        domain: "www.vikacg.com",
        name: 'b2_token'
    };

    // 使用 GM_cookie 函数获取 Cookie 值
    GM_cookie("list", cookieDetails, (cookies, error) => {
        if (!error) {
            const foundCookie = cookies.find(cookie => cookie.name == "b2_token");
            if (foundCookie) {
                b2_token = foundCookie.value;
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
                                            sendNotification(msg)   //发送浏览器通知
                                            resolve("ok");
                                        } else {
                                            log("签到失败")
                                            sendNotification('签到失败')   //发送浏览器通知
                                            reject("签到失败");
                                        }
                                    }
                                });
                                reject("请求2异常？");
                            } else {
                                msg = "今天已经签到，如有问题请尝试手动签到"
                                log("签到时间：" + checkinDate + "，签到获得积分：" + checkGetMission + "，目前积分：" + my_credit)
                                log(msg);
                                resolve("ok");
                            }
                        } else {
                            msg = '请求失败，是否未登录？'
                            log(msg)
                            GM_setValue('b2_token', null)
                            if (!compareDomains('www.vikacg.com')) {
                                promptRedirect('https://www.vikacg.com')
                            }
                            reject(msg);
                        }
                    }
                });
                reject("请求1异常？");
            } else {
                reject("未找到名为 b2_token 的 Cookie");
            }
        } else {
            reject("获取 Cookie 时出错:", error);
        }
    });
    resolve("执行完成");
});



// 在脚本猫后台脚本中使用浏览器通知 API 发送通知
function sendNotification(message) {
    // 检查浏览器是否支持通知
    GM_notification({
        title: 'VikACG',
        text: message,
        icon: 'http://vikacg.com/favicon.ico',
        timeout: 5000,
        onclick: () => {
            // 点击通知时打开链接
            GM_openInTab('https://www.vikacg.com', { active: true });
        }
    });
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
function log(msg) {
    console.log(msg)
    GM_log(msg, 'info')
    
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
