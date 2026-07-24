/* eslint-disable */
/**
 * 本機產生 Chat 測試用 UserSig。
 *
 * ⚠️ 只給「本機測試」用。SECRETKEY 有最高權限，絕對不要進 App、不要進 git、不要放前端。
 * 正式環境的 UserSig 一定要由你自己的後端簽發。
 *
 * 用法：
 *   1. npm i -D tls-sig-api-v2
 *   2. 在 .env 設好 CHAT_SDK_APP_ID 與 CHAT_SECRETKEY（不要加 EXPO_PUBLIC_ 前綴，避免被打包進 App）
 *   3. node scripts/gen-usersig.js <userID>
 *   4. 把印出的 UserSig 貼到 .env 的 EXPO_PUBLIC_CHAT_TEST_USERSIG，重啟 Metro
 *
 * 產一組給對方帳號測收發：node scripts/gen-usersig.js bob
 */
const fs = require("fs");
const path = require("path");

// 極簡 .env 讀取（不引額外套件）
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnv();

const userID = process.argv[2];
if (!userID) {
  console.error("用法：node scripts/gen-usersig.js <userID>");
  process.exit(1);
}

const sdkAppId = Number(process.env.CHAT_SDK_APP_ID);
const secretKey = process.env.CHAT_SECRETKEY;

if (!sdkAppId || !secretKey) {
  console.error("請先在 .env 設定 CHAT_SDK_APP_ID 與 CHAT_SECRETKEY");
  process.exit(1);
}

let TLSSigAPIv2;
try {
  TLSSigAPIv2 = require("tls-sig-api-v2");
} catch {
  console.error("缺少套件，請先執行：npm i -D tls-sig-api-v2");
  process.exit(1);
}

const EXPIRE_SECONDS = 7 * 24 * 60 * 60; // 7 天，測試夠用
const api = new TLSSigAPIv2.Api(sdkAppId, secretKey);
const userSig = api.genSig(userID, EXPIRE_SECONDS);

console.log(`\nuserID:  ${userID}`);
console.log(`userSig: ${userSig}\n`);
console.log("貼到 .env： EXPO_PUBLIC_CHAT_TEST_USERSIG=" + userSig + "\n");
