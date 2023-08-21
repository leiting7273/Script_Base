// ==UserScript==
// @name         浮窗看小说
// @namespace    myBook
// @version      0.1.1
// @description  1、在任意网页按下组合键“Ctrl+Shift+Z”，提示书架选择小说或输入小说网址 2、看小说时按下组合键“Ctrl+Shift+Z”可隐藏和显示悬浮窗 3、按"->"看下一章
// @author       Lei
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    console.log('按下组合键“Ctrl+Shift+Z”开始看小说')
    var docu    //当前小说document
    var bookObj
    // 创建悬浮窗的 HTML 结构
    var floatingWindow = document.createElement('div');
    floatingWindow.id = 'floatingWindow';
    floatingWindow.style.position = 'fixed';
    floatingWindow.style.top = '50px';
    floatingWindow.style.left = '50px';
    floatingWindow.style.width = '350px';
    floatingWindow.style.height = '450px';
    floatingWindow.style.backgroundColor = '#f0f0f0';
    floatingWindow.style.border = '1px solid #ccc';
    floatingWindow.style.overflow = 'auto'; // 添加滚动条
    floatingWindow.style.zIndex = '9999';
    floatingWindow.style.textAlign = 'left'; // 设置内容靠左对齐

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    floatingWindow.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            e.preventDefault(); // 阻止默认右键菜单弹出
            isDragging = true;
            offsetX = e.clientX - floatingWindow.getBoundingClientRect().left;
            offsetY = e.clientY - floatingWindow.getBoundingClientRect().top;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            floatingWindow.style.left = (e.clientX - offsetX) + 'px';
            floatingWindow.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging && e.button === 2) {
            isDragging = false;
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (isDragging) {
            e.preventDefault(); // 阻止右键菜单在拖动期间的弹出
        }
    });

    // 监听键盘按下事件
    var tabCount = 0 //按下次数
    var fwHide = false   //表示悬浮窗隐藏
    document.addEventListener('keydown', function (event) {
        if (event.code === 'KeyZ' && event.ctrlKey && event.shiftKey) {
            console.log("监听到按下组合键“Ctrl+Shift+Z”");
            if (tabCount === 0) {
                selectBook();
                tabCount++;
            } else {
                hideFW();
                tabCount++;
            }
        }
    });

    // 监听键盘方向键按下事件
    document.addEventListener('keydown', function (event) {
        switch (event.key) {
            case 'ArrowUp':
                // handleArrowUp();
                break;
            case 'ArrowDown':
                // handleArrowDown();
                break;
            case 'ArrowLeft':
                // handleArrowLeft();
                break;
            case 'ArrowRight':  //下一章
                let link = getNextChapterLink()
                if (link != null) {
                    console.log('跳转到下一页/章：' + link)
                    deleteBook(bookObj.bookURL)  //删除上一章的书签
                    getUrl(link)    //跳转
                } else {
                    alert('未找到下一章/页')
                }
                break;
            default:
                break;
        }
    });

    /************以上为悬浮窗结构 ************/

    // 定义函数：隐藏或显示悬浮窗
    function hideFW() {
        if (fwHide) {
            floatingWindow.style.display = 'block'; // 显示悬浮窗
            console.log('显示悬浮窗')
            fwHide = false;
        } else {
            floatingWindow.style.display = 'none'; // 隐藏悬浮窗
            console.log('隐藏悬浮窗')
            fwHide = true;
        }
    }

    // 将章节名和正文内容放入悬浮窗
    function showBook(chapterTitle, chapterContent) {
        floatingWindow.innerHTML = `
            <div style="padding: 10px;">
                <h2>${chapterTitle}</h2><br>
                <p>${chapterContent}</p>
            </div>
        `;

        document.body.appendChild(floatingWindow);
    }

    // 存储小说信息
    function storeBook(bookName, chapterName, bookURL) {
        const bookshelf = GM_getValue('bookshelf', []);
        const bookInfo = { bookName, chapterName, bookURL };
        bookshelf.push(bookInfo);
        GM_setValue('bookshelf', bookshelf);
        console.log(`小说${bookName}已存储。`);
        return bookInfo
    }

    // 删除小说信息
    function deleteBook(index) {
        const bookshelf = GM_getValue('bookshelf', []);
        let deletedBook = null; // 用于存储已删除的书籍信息

        if (index >= 0 && index < bookshelf.length) {
            deletedBook = bookshelf.splice(index, 1)[0];
            GM_setValue('bookshelf', bookshelf);
            console.log(`小说${deletedBook.bookName}已删除。`);
        } else {
            for (let i = bookshelf.length - 1; i >= 0; i--) {
                const book = bookshelf[i];
                if (book.bookName === index || book.chapterName === index || book.bookURL === index) {
                    deletedBook = bookshelf.splice(i, 1)[0];
                    console.log(`小说${deletedBook.bookName}已删除。`);
                    break; // 找到匹配的书籍后即停止遍历
                }
            }
        }

        if (deletedBook) {
            const deletedBooksNamespace = GM_getValue('deletedBooks', []);
            deletedBooksNamespace.push(deletedBook);
            GM_setValue('deletedBooks', deletedBooksNamespace);
        }
    }

    // 弹窗选择小说
    function selectBook() {
        const bookshelf = GM_getValue('bookshelf', []);
        if (bookshelf.length === 0) {
            alert('书架中没有存储的小说。');
            getUrl(null)
            return;
        }

        const bookOptions = bookshelf.map((bookInfo, index) => {
            return `${index + 1}. ${bookInfo.bookName} - ${bookInfo.chapterName}`;
        });

        bookOptions.push('0. 删除小说');

        const selectedOption = prompt(`请选择小说：\n${bookOptions.join('\n')}\n\n请输入小说编号：`);
        if (selectedOption !== null) {
            const selectedIndex = parseInt(selectedOption) - 1;
            if (selectedIndex === -1) {
                const deletedIndex = prompt('请输入要删除的小说编号：');
                if (deletedIndex !== null) {
                    const deletedIndexInt = parseInt(deletedIndex);
                    if (!isNaN(deletedIndexInt)) {
                        deleteBook(deletedIndexInt);
                    } else {
                        alert('无效的小说编号。');
                    }
                }
            } else if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < bookshelf.length) {
                const selectedBook = bookshelf[selectedIndex];
                console.log(`已选择小说：${selectedBook.bookName}`);
                //看书
                fetchAndConvertToDocument(selectedBook.bookURL)
                    .then(doc => {
                        docu = doc
                        //识别小说正文
                        const chapterContent = extractChapterContent();
                        console.log(selectedBook.chapterName)
                        bookObj = selectedBook
                        showBook(selectedBook.chapterName, chapterContent)
                    })
                return selectedBook.bookURL;
            } else {
                alert('无效的小说编号。');
            }
        }
    }

    //向网址url发起请求
    function fetchAndConvertToDocument(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function (response) {
                    if (response.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, "text/html");
                        resolve(doc);  // 将解析后的Document对象作为Promise的结果
                    } else {
                        reject(new Error("Request failed with status: " + response.status));
                    }
                },
                onerror: function (error) {
                    reject(new Error("Request error: " + error));
                }
            });
        });
    }

    // 获取小说网址
    function getUrl(url) {
        let novelURL
        if (url != null) { novelURL = url } else { novelURL = prompt("请输入小说网址："); }
        if (novelURL) {
            fetchAndConvertToDocument(novelURL)
                .then(doc => {
                    // console.log("获取并转换为Document对象成功:", doc);
                    docu = doc
                    //判断网址是否是小说网址
                    // 获取当前网页的标题和URL
                    const pageTitle = docu.title.toLowerCase();
                    const pageURL = novelURL;
                    // 检查页面标题和URL中是否包含小说关键词
                    const novelKeywords = ['小说', '小說', '小说网', '小說網', '小说站', '小說站', '小说阅读', '小說閱讀', '笔趣阁', '筆趣閣', '起点', '纵横', '17k', '搜狐阅读', '阅文集团', '轻小说', '言情小说', '修真', '玄幻', '都市', '言情', '穿越', '奇幻', '历史'];
                    const isNovelSite = novelKeywords.some(keyword => pageTitle.includes(keyword) || pageURL.includes(keyword));
                    if (!isNovelSite) {
                        alert('无效的小说网址');
                        return
                    }
                    //识别小说名称
                    //...
                    //识别小说章节
                    // 尝试提取类似“第?章*”的章节标题
                    const chapterTitleRegex = /第.+章.+/;
                    const bodyText = docu.body.textContent;
                    const matchedChapterTitle = bodyText.match(chapterTitleRegex);
                    if (!matchedChapterTitle) { alert('未识别到小说章节'); return }
                    const chapterTitle = matchedChapterTitle[0].trim();

                    //存储进书架
                    let bookName
                    if(url != null){
                        bookName = bookObj.bookName
                    }else{
                        bookName = '《' + prompt("请输入小说名称：") + '》'
                    }
                    let bookInfo = storeBook(bookName, chapterTitle, novelURL)
                    console.log(bookName + ' ' + chapterTitle + ' 存入书架成功')

                    //识别小说正文
                    const chapterContent = extractChapterContent();

                    //看书
                    bookObj = bookInfo
                    showBook(chapterTitle, chapterContent)
                })
                .catch(error => {
                    console.error("发生错误:", error);
                });
        } else {
            console.log("未输入网址，操作已取消。");
        }
    }

    // 提取本章正文内容
    function extractChapterContent() {
        const divElements = docu.querySelectorAll('div'); // 获取所有 <div> 元素

        let maxLineBreaks = 0;
        let content = '';

        // 遍历所有 <div> 元素，找到换行最多的一个
        divElements.forEach(div => {
            // 排除含有嵌套 <div> 的情况
            if (!div.querySelector('div')) {
                const lineBreaks = (div.innerHTML.match(/<br>/g) || []).length;
                if (lineBreaks > maxLineBreaks) {
                    maxLineBreaks = lineBreaks;
                    content = div.innerHTML.trim();
                }
            }
        });

        return content;
    }

    //下一章
    function getNextChapterLink() {
        const links = docu.querySelectorAll('a'); // 获取所有超链接元素
        let nextChapterLink = null;

        // 遍历超链接元素，查找下一章的超链接
        for (const link of links) {
            const linkText = link.textContent.toLowerCase();
            if (linkText.includes('下一章') || linkText.includes('下一页')) {
                const linkHref = link.getAttribute('href'); // 获取超链接的 href 属性
                if (linkHref) {
                    const baseHost = new URL(bookObj.bookURL).origin; // 获取基本地址（域名）
                    nextChapterLink = new URL(linkHref, baseHost).href; // 构建完整地址
                    break;
                }
            }
        }

        return nextChapterLink;
    }

})();