chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.url && request.fileName) {
        const downloadOptions = {
            url: request.url,
            filename: request.fileName,
            saveAs: request.showSaveAs
        };
        
        chrome.downloads.download(downloadOptions, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError);
            }
        });
    }
});