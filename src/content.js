console.log('Twitter Image Downloader content script loaded');

function addDownloadButton(retryCount = 0) {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-download-button])');
    let addedButtons = false;

    tweets.forEach((tweet) => {
        const images = tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]');
        if (images.length === 0) return;

        const actionBar = tweet.querySelector('div[role="group"]');
        if (!actionBar || actionBar.querySelector('.twitter-image-download-btn')) return;

        const button = document.createElement('div');
        button.textContent = getButtonText(); // 使用新函数获取按钮文本
        button.className = 'twitter-image-download-btn';
        button.style.cssText = `
            cursor: pointer;
            color: rgb(83, 100, 113);
            font-size: 13px;
            font-weight: 400;
            font-family: "Segoe UI", Arial, sans-serif;
            line-height: 16px;
            margin-right: 12px;
        `;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            images.forEach((img, index) => {
                const originalUrl = img.src.replace(/&name=\w+/, '&name=orig');
                
                chrome.storage.sync.get(
                    { showSaveAs: false, fileNameFormat: 'Twitter/<year>-<month>-<userid>-<tweetid>-<imageindex>.<ext>' },
                    (options) => {
                        const fileName = formatFileName(options.fileNameFormat, img, originalUrl, index);
                        chrome.runtime.sendMessage({
                            url: originalUrl,
                            fileName: fileName,
                            showSaveAs: options.showSaveAs
                        });
                    }
                );
            });
        });

        actionBar.appendChild(button);
        tweet.setAttribute('data-download-button', 'true');
        addedButtons = true;
    });

    // 如果没有添加任何按钮且重试次数未达到上限，则继续重试
    if (!addedButtons && retryCount < 5) {
        setTimeout(() => addDownloadButton(retryCount + 1), 1000);
    }
}

function observeChanges() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    
    const callback = function(mutationsList, observer) {
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = mutation.addedNodes;
                for (let node of addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('article[data-testid="tweet"]') || node.querySelector('article[data-testid="tweet"]')) {
                            addDownloadButton();
                            return;
                        }
                    }
                }
            }
        }
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
}

// 初始执行
addDownloadButton();

// 监听页面变化
observeChanges();

// 滚动时检查
window.addEventListener('scroll', debounce(() => {
    addDownloadButton();
    checkVisibleTweets();
}, 300));

// 检查可见的推文
function checkVisibleTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-download-button])');
    tweets.forEach(tweet => {
        if (isElementInViewport(tweet)) {
            addDownloadButtonToTweet(tweet);
        }
    });
}

// 为单个推文添加下载按钮
function addDownloadButtonToTweet(tweet) {
    const img = tweet.querySelector('img[src*="pbs.twimg.com/media"]');
    if (!img) return;

    const actionBar = tweet.querySelector('div[role="group"]');
    if (!actionBar || actionBar.querySelector('.twitter-image-download-btn')) return;

    const button = document.createElement('div');
    button.textContent = '下载原图';
    button.className = 'twitter-image-download-btn';
    button.style.cssText = `
        cursor: pointer;
        color: rgb(83, 100, 113);
        font-size: 13px;
        font-weight: 400;
        font-family: "Segoe UI", Arial, sans-serif;
        line-height: 16px;
        margin-right: 12px;
    `;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const originalUrl = img.src.replace(/&name=\w+/, '&name=orig');
        
        chrome.storage.sync.get(
            { showSaveAs: false, fileNameFormat: 'Twitter/<year>-<month>-<userid>-<tweetid>-<imageindex>.<ext>' },
            (options) => {
                const fileName = formatFileName(options.fileNameFormat, img, originalUrl, index);
                chrome.runtime.sendMessage({
                    url: originalUrl,
                    fileName: fileName,
                    showSaveAs: options.showSaveAs
                });
            }
        );
    });

    actionBar.appendChild(button);
    tweet.setAttribute('data-download-button', 'true');
}

// 辅助函数：检查元素是否在视口内
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// 辅助函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatFileName(format, img, url, imageIndex) {
    const now = new Date();
    const tweetContainer = img.closest('article');
    let userId = 'unknown';
    let tweetId = 'unknown';

    if (tweetContainer) {
        // 尝试获取用户ID
        const userLink = tweetContainer.querySelector('a[role="link"][href^="/"]');
        if (userLink) {
            userId = userLink.href.split('/').pop();
        }

        // 尝试获取推文ID
        const timeElement = tweetContainer.querySelector('time');
        if (timeElement) {
            const tweetLink = timeElement.closest('a');
            if (tweetLink) {
                tweetId = tweetLink.href.split('/').pop();
            }
        }
    }

    const ext = url.split('.').find(part => part.startsWith('format='))?.split('=')[1] || 'jpg'; // 提取纯粹的文件扩展名

    const replacements = {
        '<userid>': userId,
        '<tweetid>': tweetId,
        '<imageindex>': imageIndex,
        '<ext>': ext,
        '<year>': now.getFullYear(),
        '<month>': (now.getMonth() + 1).toString().padStart(2, '0'),
        '<day>': now.getDate().toString().padStart(2, '0'),
        '<dlh>': now.getHours().toString().padStart(2, '0'),
        '<dlm>': now.getMinutes().toString().padStart(2, '0'),
        '<dls>': now.getSeconds().toString().padStart(2, '0'),
    };

    let fileName = format;
    for (const [key, value] of Object.entries(replacements)) {
        fileName = fileName.replace(new RegExp(key, 'g'), value);
    }

    if (!fileName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
        fileName += `.${ext}`;
    }

    fileName = fileName.replace(/\.com\/media\/.*$/, '');

    return fileName;
}

function getButtonText() {
    const lang = navigator.language || navigator.userLanguage;
    return lang.startsWith('zh') ? '下载原图' : 'Download Original';
}