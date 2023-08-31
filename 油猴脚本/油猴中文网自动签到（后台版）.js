/// ==UserScript==
// @name         油猴中文网自动签到（后台版）
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.1
// @description  自动签到脚本，每天执行一次
// @author       lei
// @background
// @crontab      * * once * *
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_cookie
// @connect      bbs.tampermonkey.net.cn
// ==/UserScript==

// 设置目标网站的相关信息
const targetUrl = 'https://bbs.tampermonkey.net.cn/';
const signInUrl = 'https://bbs.tampermonkey.net.cn/plugin.php?id=dsu_paulsign:sign';
const signInParams = 'operation=qiandao&infloat=1&inajax=1&formhash=763efa25&qdxq=kx&qdmode=3&todaysay=&fastreply=0';
return new Promise((resolve, reject) => {
    // 获取当前日期
    const today = new Date();
    const currentDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    GM_cookie("list", { domain: 'bbs.tampermonkey.net.cn' }, function(cookies) {
        // 构建 Cookie 字符串
        const allCookies = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            if (allCookies) {
                // 发送签到请求
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: signInUrl,
                    data: signInParams,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': allCookies
                    },
                    onload: function(response) {
                        if (response.status === 200) {
                            // 发送成功，继续查询签到结果
                            checkSignInResult(currentDate);
                        } else {
                            GM_log('签到失败');
                        }
                        resolve('执行完成')
                    },
                    onerror: function(error) {
                        reject('请求错误:', error)
                    }
                });
            } else {
                console.log("未找到指定的 Cookie");
                reject('未找到指定的 Cookie');
            }
        resolve('执行完成');
    });
    
});

// 查询签到结果
function checkSignInResult(currentDate) {
    // 发送查询请求
    GM_xmlhttpRequest({
        method: 'GET',
        url: signInUrl,
        onload: function(response) {
            if (response.status === 200) {
                // 解析响应HTML，查找签到时间
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const signInTime = doc.querySelector('font[color="#ff00cc"]').textContent;

                if (signInTime.includes(currentDate)) {
                    // 已签到
                    GM_notification({
                        title: '油猴中文网',
                        text: '今天已经签到过了。',
                        timeout: 5000
                    });
                } else {
                    // 未签到
                    GM_notification({
                        title: '油猴中文网',
                        text: '签到成功！',
                        timeout: 5000
                    });
                }
            } else {
                GM_log('查询签到结果失败');
            }
        },
        onerror: function(error) {
            GM_log('请求错误:', error);
        }
    });
}

