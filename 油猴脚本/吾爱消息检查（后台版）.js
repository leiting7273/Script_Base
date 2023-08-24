// ==UserScript==
// @name         吾爱消息检查（后台版）
// @namespace    https://www.52pojie.cn/
// @version      0.1.0
// @description  吾爱消息检查，每5分钟检查一次
// @author       lei
// @background
// @crontab      */5 * * * *
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_cookie
// @grant        GM_notification
// @connect      www.52pojie.cn
// ==/UserScript==

return new Promise((resolve, reject) => {
    const myDate = new Date()

    //获取Cookie
    GM_cookie("list", { domain: "www.52pojie.cn" }, (cookies, error) => {
        if (!error) {
            // 步骤 3: 使用GM_xmlhttpRequest发送请求到plugin.php
            const requestUrl = 'https://www.52pojie.cn/plugin.php?id=noti&inajax=yes&action=checknew&type=3_3_1&h=eb04b630&time=' + myDate.getTime() + '&handlekey=getMsg&m=0&f=' + Math.random();

            // 构造请求头
            const headers = {
                "Cookie": cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ")
            };
            // 发送请求
            GM_xmlhttpRequest({
                method: "GET",
                url: requestUrl,
                headers: headers,
                onload: function (response) {
                    const responseBody = response.response;
                    // 处理响应
                    const json = parseJSONFromCDATANode(responseBody)
                    GM_log('吾爱新响应：' + response.responseText);
                    if (json.msg != '') {
                        let jsonArray = json.msg
                        if (jsonArray && jsonArray.length > 0) {
                            jsonArray.forEach(item => {
                                const decodedContent = decodeHTML(item.data.content);
                                const strippedContent = removeXMLTags(decodedContent);
                                const myUrl = extractHrefsFromXML(decodedContent)
                                sendNotification(strippedContent, myUrl);
                                resolve("ok");
                            });
                        } else { reject('？？？') }
                    }
                },
                onerror: function (error) {
                    reject("请求错误:", error);
                }
            });
        }
    });

});

// 在脚本猫后台脚本中使用浏览器通知 API 发送通知
function sendNotification(message, url) {
    // 请求用户允许显示通知
    GM_notification({
        title: '新消息',
        text: message,
        timeout: 5000,  // 通知显示时间（毫秒）
        onclick: () => {
            //点击弹窗执行
            window.open(url) 
        }
    });
}

//提取XML中的JSON
function parseJSONFromCDATANode(xmlText) {
    // 提取CDATA节点内容
    const cdataStart = '<![CDATA[';
    const cdataEnd = ']]>';
    const cdataStartIndex = xmlText.indexOf(cdataStart);
    const cdataEndIndex = xmlText.indexOf(cdataEnd, cdataStartIndex + cdataStart.length);

    if (cdataStartIndex !== -1 && cdataEndIndex !== -1) {
        const cdataContent = xmlText.substring(cdataStartIndex + cdataStart.length, cdataEndIndex);

        try {
            // 解析JSON
            const json = JSON.parse(cdataContent);
            return json;
        } catch (error) {
            console.error("解析JSON出错:", error);
            return null;
        }
    } else {
        console.error("未找到CDATA节点");
        return null;
    }
}

// 解码 HTML 实体编码
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// 移除XML标签
function removeXMLTags(text) {
    const xmlTagRegex = /<[^>]*>/g;
    return text.replace(xmlTagRegex, '');
}

function extractHrefsFromXML(xmlText) {
    GM_log('XML：' + xmlText)
    const linkTagRegex = /<a [^>]*href=["']([^"'><]*)["'][^>]*>[^<>]*?(\u67e5\u770b)[^<>]*?<\/a>/g;
    const hrefs = [];

    let match;
    while ((match = linkTagRegex.exec(xmlText)) !== null) {
        const href = match[1];
        const decodedHref = decodeHTML(href);
        const fullURL = buildFullURL(decodedHref);
        GM_log('链接：' + fullURL)
        hrefs.push(fullURL);
    }

    return hrefs[0];
}

// 构建完整的链接地址
function buildFullURL(url) {
    const baseURL = 'http://www.52pojie.cn/';
    return baseURL + url;
}
