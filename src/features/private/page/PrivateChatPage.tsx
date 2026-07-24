import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";

import { colors } from "@/src/theme/colors";
import ChatHeader from "../components/ChatHeader";
import ChatInputBar from "../components/ChatInputBar";
import InvitationCard from "../components/InvitationCard";
import MessageBubble from "../components/MessageBubble";
import { usePrivateConversation } from "../hooks/usePrivateConversation";
import type { InvitationResponse, PrivateMessage } from "../types/private.types";
import { formatDateSeparatorLabel, formatMessageTime } from "../utils/private.utils";

// 捲到距離頂端這麼近（px）就觸發載入更早的訊息
const LOAD_MORE_MESSAGES_SCROLL_THRESHOLD = 60;

export default function PrivateChatPage() {
  const router = useRouter();
  // expo-router 的 useNavigation() 預設回傳的型別沒有帶到 native-stack 專屬的事件（例如 transitionEnd），
  // 這裡的 Stack 底層就是 @react-navigation/native-stack（見 app/_layout.tsx），所以直接標注成
  // NativeStackNavigationProp 來拿到正確的事件型別，不是隨便斷言繞過型別檢查。
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const {
    conversation,
    isLoading,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    respondToInvitation,
    markRead,
  } = usePrivateConversation(conversationId);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // 進入聊天室即視為已讀，清空該對話的未讀數字
  useEffect(() => {
    markRead();
  }, [markRead]);

  // 是否該在「內容大小一變」就貼到底：初次顯示、或最後一則訊息真的變了（自己送出/收到自動回覆）才會是 true；
  // 往上滑載入更早訊息只會讓陣列前面變長、最後一則不會變，不會把這個設回 true，
  // 視覺位置交給下面 ScrollView 的 maintainVisibleContentPosition 維持，不會被拉去底部。
  //
  // 這裡刻意不用「拿到訊息後 requestAnimationFrame 呼叫 scrollToEnd」這種寫法：
  // isLoading 為 true 時 ScrollView 根本還沒掛載（scrollRef 是 null），
  // 等資料載完、isLoading 變 false 才真的掛載出來時，watch messages 的 effect 不一定會再跑一次
  // （messages 的 reference 在那之前就沒變了），導致「有時候」進聊天室會停在頂端。
  // 改用 ScrollView 自己的 onContentSizeChange（見下方）：只要內容量測出來就一定會觸發，
  // 跟 React 那次 render 有沒有重跑無關。
  //
  // 而且不是「量到一次就收工」：內容還沒完全定型前（訊息還在陸續排版、字型／高度還在微調）
  // onContentSizeChange 可能觸發好幾次，只要還在持續變化，就一直貼著底部再捲一次；
  // 停止變化一小段時間後才視為「定型了」，這樣不管訊息清單多長、要花幾輪才量完，
  // 最後停下來的位置保證是真正的最底部。
  const shouldStickToBottomRef = useRef(true);
  const hasScrolledOnceRef = useRef(false);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // maintainVisibleContentPosition 只在「不是正在貼底」的時候才要開：
  // 這個 prop 本身也會主動調整捲動位置去補償上方內容的變化，貼底階段（訊息還在陸續排版量測）
  // 如果同時開著，會跟我們自己的 scrollToEnd 互搶捲動位置，變成「先貼到底、又被拉回去一點」的回彈感。
  // 所以貼底定型之前先關掉，定型之後（要往上滑補更早訊息了）才需要它幫忙維持位置。
  const [isStickingToBottom, setIsStickingToBottom] = useState(true);

  useEffect(() => {
    const messages = conversation?.messages ?? [];
    const currentLastMessageId = messages[messages.length - 1]?.id;
    if (!currentLastMessageId) return;

    if (currentLastMessageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = currentLastMessageId;
      shouldStickToBottomRef.current = true;
      setIsStickingToBottom(true);
    }
  }, [conversation?.messages]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // 判斷「已經定型、可以關掉貼底模式」的唯一入口，handleContentSizeChange 跟 transitionEnd
  // 保底捲動都要走同一個函式重新排程，不要各自維護一份「250ms 沒動靜就收工」的邏輯，
  // 不然兩邊各自認定的「定型時機」不同步，就會出現「已經關掉貼底、開了 maintainVisibleContentPosition，
  // 結果另一邊又強制捲一次」的兩段式跳動（回彈感的真正來源）。
  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      shouldStickToBottomRef.current = false;
      scrollRef.current?.scrollToEnd({ animated: false });
      setIsStickingToBottom(false);
    }, 250);
  }, []);

  // 補一個「進場轉場動畫結束」後的保底捲動：
  // 如果對話早就在快取裡（例如離開後又點回同一個聊天室），isLoading 幾乎瞬間變 false，
  // ScrollView 幾乎在畫面一 push 出來就掛載完成——這時反而會搶在 push 的滑入動畫還沒跑完前就捲到底，
  // 動畫真正結束、容器尺寸定案後，捲動位置可能因此跟預期的不一樣。
  //
  // 訊息比較多的對話（例如 samijma_184 那 10 則）排版本來就要花比較久，
  // 常常在 transitionEnd 觸發的當下，前面的 250ms settle timer 已經先「誤判定型」，
  // 把 maintainVisibleContentPosition 打開了——這時如果只是單純再呼叫一次 scrollToEnd，
  // 會跟已經啟動的 maintainVisibleContentPosition 互搶捲動位置，變成「先跳一次、又被拉回一點」的回彈。
  // 所以這裡不是單純補一次 scrollToEnd，而是先把狀態「重新收回貼底模式」
  // （shouldStickToBottomRef / isStickingToBottom 都設回 true，等於先關掉 maintainVisibleContentPosition），
  // 再捲到底，然後照同一套 scheduleSettle 重新定型，確保兩邊不會同時搶位置。
  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", (event) => {
      if (event.data?.closing) return; // 離場動畫結束才觸發的，不用管

      shouldStickToBottomRef.current = true;
      setIsStickingToBottom(true);
      scrollRef.current?.scrollToEnd({ animated: false });
      scheduleSettle();
    });

    return unsubscribe;
  }, [navigation, scheduleSettle]);

  const handleContentSizeChange = () => {
    if (!shouldStickToBottomRef.current) return;

    const animated = hasScrolledOnceRef.current;
    hasScrolledOnceRef.current = true;

    // 在 onContentSizeChange 這個 callback 裡「當下」就呼叫 scrollToEnd，
    // RN 的原生 layout 有時候還沒真的 commit 完，量到的高度會比最終高度矮一點，
    // 捲的距離也就跟著不夠——用 requestAnimationFrame 延一個 frame，等這次 layout 真的定案再捲。
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });

    // 內容量測還沒定型的話，短時間內還會再觸發 onContentSizeChange，
    // 這裡先不清旗標，讓下一次觸發還能繼續貼底；真的停止變化一段時間後才收掉，
    // 並且在收掉的當下再補一次「保底」的 scrollToEnd（這時 layout 一定已經完全穩定），
    // 確保不管前面幾次捲得夠不夠深，最後停下來的位置一定是真正的最底部。
    scheduleSettle();
  };

  const handleBack = () => router.back();

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    setDraft("");
    void sendMessage(text);
  };

  const handleRespond = (messageId: string, response: InvitationResponse) => {
    void respondToInvitation(messageId, response);
  };

  const handleScroll = (offsetY: number) => {
    if (
      offsetY <= LOAD_MORE_MESSAGES_SCROLL_THRESHOLD &&
      hasMoreMessages &&
      !isLoadingMoreMessages
    ) {
      void loadMoreMessages();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ChatHeader username="" avatarUri="" countryCode="" onBack={handleBack} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>找不到這個對話</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 這裡刻意只吃 top 這個 edge：bottom 的安全區間距改交給 ChatInputBar 自己用
  // useSafeAreaInsets 處理，讓它的深色底色可以一路延伸到螢幕最底（含 Home Indicator 那一截），
  // 不會被 SafeAreaView 在 bottom 多墊出一段白色空隙。
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ChatHeader
        username={conversation.username}
        avatarUri={conversation.avatarUri}
        countryCode={conversation.countryCode}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={100}
          onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.y)}
          onContentSizeChange={handleContentSizeChange}
          // 往上滑載入更早訊息時，內容會從最前面變長；這個 prop 讓 RN 自動補償捲動位置，
          // 畫面不會因為前面多了東西而整個往下跳。
          // 貼底定型前刻意不開（見上面 isStickingToBottom 的註解），不然會跟 scrollToEnd 互搶位置。
          maintainVisibleContentPosition={
            isStickingToBottom ? undefined : { minIndexForVisible: 0 }
          }
        >
          {isLoadingMoreMessages && (
            <View style={styles.loadingMoreWrap}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          )}

          {conversation.messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>尚無訊息，打個招呼吧！</Text>
            </View>
          ) : (
            renderMessages(conversation.messages, handleRespond)
          )}
        </ScrollView>

        <ChatInputBar value={draft} onChangeText={setDraft} onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** 依日期插入分隔線，並依訊息種類渲染邀請卡片或一般文字泡泡 */
function renderMessages(
  messages: PrivateMessage[],
  onRespond: (messageId: string, response: InvitationResponse) => void,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastDateKey: string | null = null;

  messages.forEach((message) => {
    const dateKey = dayjs(message.createdAt).format("YYYY-MM-DD");

    if (dateKey !== lastDateKey) {
      nodes.push(
        <Text key={`sep-${dateKey}`} style={styles.dateSeparator}>
          {formatDateSeparatorLabel(message.createdAt)}
        </Text>,
      );
      lastDateKey = dateKey;
    }

    if (message.kind === "invitation" && message.invitation) {
      nodes.push(
        <View key={message.id} style={styles.invitationWrap}>
          <InvitationCard
            invitation={message.invitation}
            onRespond={(response) => onRespond(message.id, response)}
          />
          <Text style={styles.invitationTime}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>,
      );
      return;
    }

    nodes.push(
      <MessageBubble
        key={message.id}
        message={message}
        isOwn={message.senderId === "me"}
      />,
    );
  });

  return nodes;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  loadingMoreWrap: {
    paddingVertical: 10,
    alignItems: "center",
  },
  dateSeparator: {
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
    color: "#AAAAAA",
  },
  invitationWrap: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  invitationTime: {
    marginTop: 4,
    fontSize: 11,
    color: "#AAAAAA",
  },
});
