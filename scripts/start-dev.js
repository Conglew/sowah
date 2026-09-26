const { execFile, spawn } = require("node:child_process");

const previewUrl = "sowah://event-call/dev-preview?mock=true";
const expo = spawn("npx", ["expo", "start", "--dev-client"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["pipe", "inherit", "inherit"],
});

let isOpeningPreview = false;

function openEventPreview() {
  if (isOpeningPreview) return;
  isOpeningPreview = true;
  process.stdout.write("\n[DEV] Opening Event voice-call preview…\n");

  execFile("xcrun", ["simctl", "openurl", "booted", previewUrl], (iosError) => {
    if (!iosError) {
      isOpeningPreview = false;
      return;
    }

    execFile(
      "adb",
      [
        "shell",
        "am",
        "start",
        "-a",
        "android.intent.action.VIEW",
        "-d",
        previewUrl,
      ],
      (androidError) => {
        isOpeningPreview = false;
        if (androidError) {
          process.stderr.write(
            "[DEV] No booted iOS Simulator or connected Android emulator was found.\n",
          );
        }
      },
    );
  });
}

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", (chunk) => {
    const input = chunk.toString();
    if (input.toLowerCase() === "g") {
      openEventPreview();
      return;
    }
    expo.stdin.write(chunk);
  });

  process.stdout.write(
    "\n› Press g │ open Event voice-call preview (development only)\n",
  );
} else {
  process.stdin.pipe(expo.stdin);
}

expo.on("exit", (code, signal) => {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    expo.kill(signal);
  });
}
