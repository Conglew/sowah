/**
 * 品牌色集中管理。
 * 目前保留專案既有的幾個橘色階（避免改動視覺），之後要收斂色階時只改這裡。
 */
export const colors = {
  brand: "#FF8A22", // 主品牌橘：icon active、logo year、feed refresh、footer
  brandStrong: "#FF7A00", // 實心按鈕
  brandLight: "#FF9F5A", // header 年份
  brandSoft: "#FFA15C", // 日期選取圈
  brandWarm: "#FF9F43", // event 標題
} as const;
