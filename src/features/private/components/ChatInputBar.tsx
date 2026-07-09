import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
};

export default function ChatInputBar({ value, onChangeText, onSend }: Props) {
  const canSend = value.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Aa"
        placeholderTextColor="#AAAAAA"
        multiline
      />

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F0F0F0",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  sendIcon: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
