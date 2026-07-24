import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
};

// iOS 用 will 系列事件才能跟系統鍵盤的滑入/滑出動畫同步；Android 沒有 will 事件，只能用 did。
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

export default function ChatInputBar({ value, onChangeText, onSend }: Props) {
  const canSend = value.trim().length > 0;
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // 軟鍵盤彈出時，畫面下緣的安全區（Home Indicator 那一截）已經被鍵盤本身蓋住、不需要再留，
  // 這裡才會多出「明明鍵盤已經頂上來，輸入列底下卻還空一截」的縫隙；
  // 鍵盤收起後才需要把 insets.bottom 補回來，避免壓到 Home Indicator 的手勢區。
  useEffect(() => {
    const showSub = Keyboard.addListener(KEYBOARD_SHOW_EVENT, () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(KEYBOARD_HIDE_EVENT, () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomPadding = isKeyboardVisible ? 10 : insets.bottom + 10;

  return (
    // PrivateChatPage 的 SafeAreaView 只吃 top，bottom 的安全區間距在這裡自己補：
    // 深色背景才能一路貼到螢幕最底（含 Home Indicator 那一截），不會卡在安全區邊界露出白色縫隙；
    // 鍵盤彈出時則改用固定的 10，讓輸入列剛好貼合鍵盤上緣，不會多出安全區那段空隙。
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Aa"
        placeholderTextColor="#AAAAAA"
        multiline
      />

      <TouchableOpacity
        activeOpacity={0.6}
        style={styles.sendButton}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
      >
        {/*
          示範圖裡的送出鍵是深色背景上的白色紙飛機線條圖示，沒有另外包一個圓形色塊。
          專案裡目前沒有現成的紙飛機 svg 素材，這裡直接用 react-native-svg（專案本來就有安裝，
          AppFooter.tsx 的播放鈕弧線也是同樣用法）畫一個 Material「send」圖示的 path，
          不需要新增套件或新增圖檔。
        */}
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            fill={canSend ? "#FFFFFF" : "#8A8A8A"}
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#4B4B4B",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  sendButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
