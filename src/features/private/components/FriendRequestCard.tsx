import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/src/theme/colors";

type FriendRequestCardProps = {
  username: string;
  isResponding: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export default function FriendRequestCard({
  username,
  isResponding,
  onAccept,
  onDecline,
}: FriendRequestCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>好友邀請</Text>
      <Text style={styles.message}>{username} 想加你為好友</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          disabled={isResponding}
          onPress={onDecline}
        >
          <Text style={styles.declineText}>拒絕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          disabled={isResponding}
          onPress={onAccept}
        >
          {isResponding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptText}>接受</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F2F2F2",
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.brandStrong },
  message: { marginTop: 5, fontSize: 14, color: "#555555" },
  actions: { marginTop: 14, flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: { backgroundColor: "#E0E0E0" },
  acceptButton: { backgroundColor: colors.brandStrong },
  declineText: { fontSize: 14, fontWeight: "700", color: "#444444" },
  acceptText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
