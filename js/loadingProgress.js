updateProgressBar();

/**
 * 进度条进度
 *	total 总进度条 max:100%
	pageWebLoading 页面初始加载 10%
	rgbLoading rgb加载  10%
	music 音乐加载 20%
	gltfLoading 模型加载 配额 60%

 * */
globalThis.progressCount = { total: 0, pageWebLoading: 0, rgbLoading: 0, gltfLoading: 0, musicLoading: 0 };

// 进度条1% 需要花费的时间 (单位ms)
globalThis.webPageLoadingStandard = 100;
const startTime = Date.now();
console.log('开始时间:', startTime);

/**
 * 更新进度条
 */
function updateProgressBar() {
    webPageLoading();
    // 进度条进度
    const progressBar = document.querySelector('.progress-bar');
    const loadingContainer = document.querySelector('.loading-container');
    const envelopeContainer = document.querySelector('.envelope-container');
    let count = 0;

    const timer = setInterval(() => {
        console.log('总体进度情况', globalThis.progressCount);

        globalThis.progressCount.total =
            globalThis.progressCount.pageWebLoading +
            globalThis.progressCount.rgbLoading +
            globalThis.progressCount.gltfLoading +
            globalThis.progressCount.musicLoading;

        const total = globalThis.progressCount.total;

        progressBar.style.width = `${total}%`;
        if (total >= 100) {
            clearInterval(timer);
            envelopeContainer.classList.add('envelope-show');
            loadingContainer.style.opacity = 0;
        }
    }, 500);
}

/**
 * 网页加载进度条模拟
 */
function webPageLoading() {
    // 基础页面加载 占据整个进度条的 10%
    let pageLoadingProgressQuota = 10;

    const timer = setInterval(() => {
        if (pageLoadingProgressQuota === 0) {
            clearInterval(timer);
        }

        globalThis.progressCount.pageWebLoading++;
        pageLoadingProgressQuota--;
    }, 500);

    Pace.on('done', () => {
        /**
         * 基础页面加载完毕 进度条前进完整 10%
         */
        globalThis.progressCount.pageWebLoading = 10;
        clearInterval(timer);

        // 获取页面基准加载时间
        const pagWebDoneTime = Date.now();
        globalThis.webPageLoadingStandard = (pagWebDoneTime - startTime) / 10;
        console.log('获取到基准时间:', globalThis.webPageLoadingStandard);
    });
}
