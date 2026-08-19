/**
 * 版面尺寸集中管理。
 *
 * SCREEN_HORIZONTAL_PADDING 是各分頁主清單的左右內距。之所以要抽成常數，
 * 是因為有元件需要「反向抵銷」它來做滿版（例如 Group 的 Suggested for you 水平列表
 * 用 marginHorizontal: -SCREEN_HORIZONTAL_PADDING 讓卡片可以捲到螢幕邊緣）。
 * 兩邊各自寫死數字的話，之後只要有人改了其中一個，滿版就會歪掉且很難察覺。
 */
export const SCREEN_HORIZONTAL_PADDING = 23;
