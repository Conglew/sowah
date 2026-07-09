import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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

import ChatHeader from "../components/ChatHeader";
import ChatInputBar from "../components/ChatInputBar";
import InvitationCard from "../components/InvitationCard";
import MessageBubble from "../components/MessageBubble";
import { usePrivateConversation } from "../hooks/usePrivateConversation";
import { usePrivateStore } from "../stores/private.store";
import type { InvitationResponse, PrivateMessage } from "../types/private.types";
import { formatDateSeparatorLabel, formatMessageTime } from "../utils/private.utils";

export default function PrivateChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const { conversation, isLoading } = usePrivateConversation(conversationId);
  const sendMessage = usePrivateStore((state) => state.sendMessage);
  const respondToInvitation = usePrivateStore((state) => state.respondToInvitation);
  const markConversationRead = usePrivateStore((state) => state.markConversationRead);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // 進入聊天室即視為已讀，清空該對話的未讀數字
  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId);
    }
  }, [conversationId, markConversationRead]);

  const handleBack = () => router.back();

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !conversationId) return;

    sendMessage(conversationId, text);
    setDraft("");
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleRespond = (messageId: string, response: InvitationResponse) => {
    if (!conversationId) return;
    respondToInvitation(conversationId, messageId, response);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
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
