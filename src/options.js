// 语言配置
const translations = {
  en: {
    title: "Twitter Image Downloader Options",
    showSaveAs: "Show \"Save As\" dialogue",
    showSaveAsDesc: "If checked, you'll be prompted to choose the save location for each download.",
    fileNameFormat: "File name format",
    fileNameFormatDesc: "Customize the file name format using the variables below. <br><strong>Note:</strong> The file will be saved in the browser's default download location. To save to another directory, enable the \"Save As\" dialogue.",
    availableVariables: "Available variables:",
    save: "Save",
    saveSuccess: "Options saved",
    restoreDefaults: "Restore Defaults",
    restoreDefaultsSuccess: "Default options restored",
    downloadPath: "Download Path",
    downloadPathDesc: "Set a custom download path. Leave empty to use Chrome's default download location."
  },
  zh: {
    title: "Twitter 图片下载器选项",
    showSaveAs: "显示\"另存为\"对话框",
    showSaveAsDesc: "如果选中，每次下载时都会提示您选择保存位置。",
    fileNameFormat: "文件名格式",
    fileNameFormatDesc: "使用以下变量自定义文件名格式。<br><strong>注意：</strong> 文件将保存在浏览器的默认下载目录中。要保存到其他目录，请启用“另存为”对话框。",
    availableVariables: "可用变量：",
    save: "保存",
    saveSuccess: "选项已保存",
    restoreDefaults: "恢复默认设置",
    restoreDefaultsSuccess: "已恢复默认设置",
    downloadPath: "下载路径",
    downloadPathDesc: "设置自定义下载路径。留空则使用Chrome默认下载位置。"
  }
};

const variableDescriptions = {
  en: {
    "<userid>": "User ID of the tweet author",
    "<tweetid>": "Unique ID of the tweet",
    "<imageindex>": "Index of the image in the tweet (for multiple images)",
    "<ext>": "File extension of the image",
    "<year>": "Current year",
    "<month>": "Current month",
    "<day>": "Current day",
    "<dlh>": "Hour of download",
    "<dlm>": "Minute of download",
    "<dls>": "Second of download"
  },
  zh: {
    "<userid>": "推文作者的用户ID",
    "<tweetid>": "推文的唯一ID",
    "<imageindex>": "推文中图片的索引（用于多图推文）",
    "<ext>": "图片的文件扩展名",
    "<year>": "当前年份",
    "<month>": "当前月份",
    "<day>": "当前日期",
    "<dlh>": "下载时的小时",
    "<dlm>": "下载时的分钟",
    "<dls>": "下载时的秒数"
  }
};
// 设置默认选项
const defaultOptions = {
    showSaveAs: false,
    fileNameFormat: 'Twitter/<year>-<month>_<userid>_<tweetid>_<imageindex>.<ext>',
    language: navigator.language.startsWith('zh') ? 'zh' : 'en'
};
let currentLanguage = defaultOptions.language;
// 初始化选项
function initOptions() {
  chrome.storage.sync.get(defaultOptions, (items) => {
    document.getElementById('showSaveAs').checked = items.showSaveAs;
    document.getElementById('fileNameFormat').value = items.fileNameFormat;
    updateLanguage(items.language);
  });
}

// 在文档加载完成后调用初始化函数
document.addEventListener('DOMContentLoaded', initOptions);

// 更新页面语言
function updateLanguage(lang) {
  currentLanguage = lang;
  document.getElementById('title').textContent = translations[lang].title;
  document.getElementById('showSaveAsLabel').textContent = translations[lang].showSaveAs;
  document.getElementById('showSaveAsDesc').textContent = translations[lang].showSaveAsDesc;
  document.getElementById('fileNameFormatLabel').textContent = translations[lang].fileNameFormat;
  document.getElementById('fileNameFormatDesc').innerHTML = translations[lang].fileNameFormatDesc; // 使用 innerHTML
  document.getElementById('availableVariables').textContent = translations[lang].availableVariables;
  document.getElementById('save').textContent = translations[lang].save;
  document.getElementById('restore-defaults').textContent = translations[lang].restoreDefaults;

  // 更新变量说明
  const variablesList = document.getElementById('variablesList');
  variablesList.innerHTML = '';
  for (const [variable, description] of Object.entries(variableDescriptions[lang])) {
    const escapedVariable = variable.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    variablesList.innerHTML += `<div><code>${escapedVariable}</code>: ${description}</div>`;
  }

}

// 保存选项
function saveOptions() {
  const showSaveAs = document.getElementById('showSaveAs').checked;
  const fileNameFormat = document.getElementById('fileNameFormat').value;

  chrome.storage.sync.set(
    { showSaveAs, fileNameFormat, language: currentLanguage },
    () => {
      const status = document.createElement('div');
      status.textContent = translations[currentLanguage].saveSuccess;
      status.style.color = 'green';
      document.body.appendChild(status);
      setTimeout(() => status.remove(), 3000);
    }
  );
}

// 恢复选项
function restoreOptions() {
  chrome.storage.sync.get(defaultOptions, (items) => {
    initOptions(); // 重新加载选项
    // 可以添加恢复成功的提示
    console.log('已恢复默认设置');
  });
}

function restoreDefaults() {
  // 设置默认值
  document.getElementById('showSaveAs').checked = defaultOptions.showSaveAs;
  document.getElementById('fileNameFormat').value = defaultOptions.fileNameFormat;

  
  // 保存默认设置到存储
  chrome.storage.sync.set(defaultOptions, () => {
    const status = document.createElement('div');
    status.textContent = translations[currentLanguage].restoreDefaultsSuccess;
    status.style.color = 'green';
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 3000);
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore-defaults').addEventListener('click', restoreDefaults);
document.getElementById('en').addEventListener('click', () => updateLanguage('en'));
document.getElementById('zh').addEventListener('click', () => updateLanguage('zh'));
