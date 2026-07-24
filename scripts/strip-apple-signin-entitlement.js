/**
 * 這支腳本只在「免費 Personal Team 想裝實機測試」的情境下需要。
 *
 * 背景：expo-apple-authentication 是 @expo/prebuild-config 內建的
 * versionedExpoSDKPackages 名單成員，只要這個套件有被 autolink，
 * prebuild 就會無條件把 com.apple.developer.applesignin 寫進
 * ios/sowah/sowah.entitlements —— 這件事跟 app.json 的 plugins 清單
 * 完全無關，也跟 package.json 的 expo.autolinking.exclude 設定無關
 * （後者只能讓原生模組不被連結進 App，沒辦法阻止這個 entitlement 被寫入）。
 * 免費的 Personal Team 完全不支援這個 capability，Xcode 簽章會直接失敗。
 *
 * 這支腳本在每次 `expo prebuild` 之後手動跑一次，
 * 把這個 entitlement 從產生出來的檔案裡拿掉，讓 Personal Team 能正常簽章、裝機測試。
 *
 * 之後辦了付費 Apple Developer Program、要正式支援 Apple 登入時，
 * 這支腳本就不需要再跑了（直接留著沒差，檔案裡本來就沒有這個 key 的話腳本什麼都不會做）。
 */
const fs = require("fs");
const path = require("path");

const entitlementsPath = path.join(
  __dirname,
  "..",
  "ios",
  "sowah",
  "sowah.entitlements",
);

if (!fs.existsSync(entitlementsPath)) {
  console.log(
    "[strip-apple-signin-entitlement] 找不到 entitlements 檔案，可能還沒 prebuild，略過。",
  );
  process.exit(0);
}

const contents = fs.readFileSync(entitlementsPath, "utf8");

const keyPattern =
  /\s*<key>com\.apple\.developer\.applesignin<\/key>\s*<array>[\s\S]*?<\/array>\n?/;

if (keyPattern.test(contents)) {
  const updated = contents.replace(keyPattern, "\n");
  fs.writeFileSync(entitlementsPath, updated, "utf8");
  console.log(
    "[strip-apple-signin-entitlement] 已移除 com.apple.developer.applesignin（Personal Team 用，僅供本機測試）。",
  );
} else {
  console.log(
    "[strip-apple-signin-entitlement] entitlements 裡沒有找到 applesignin，不需要處理。",
  );
}
