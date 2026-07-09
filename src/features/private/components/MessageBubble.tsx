import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";
import type { PrivateMessage } from "../types/private.types";
import { formatMessageTime } from "../utils/private.utils";

type Props = {
  message: PrivateMessage;
  isOwn: boolean;
};

export default function MessageBubble({ message, isOwn }: Props) {
  const time = formatMessageTime(message.createdAt);

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {isOwn && (
        <View style={styles.metaOwn}>
          {message.isAuto && <Text style={styles.metaAutoLabel}>Auto</Text>}
          <Text style={styles.metaTime}>{time}</Text>
        </View>
      )}

      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.text}
        </Text>
      </View>

      {!isOwn && (
        <View style={styles.metaOther}>
          <Text style={styles.metaTime}>{time}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "72%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: colors.brandStrong,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 19,
  },
  textOwn: {
    color: "#FFFFFF",
  },
  textOther: {
    color: "#111111",
  },
  metaOwn: {
    marginRight: 6,
    alignItems: "flex-end",
  },
  metaOther: {
    marginLeft: 6,
    alignItems: "flex-start",
  },
  metaAutoLabel: {
    fontSize: 10,
    color: "#999999",
  },
  metaTime: {
    fontSize: 10,
    color: "#999999",
  },
});
