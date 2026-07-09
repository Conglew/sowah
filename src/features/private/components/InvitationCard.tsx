import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/src/theme/colors";
import type { InvitationResponse, PrivateInvitation } from "../types/private.types";
import { formatInvitationTime } from "../utils/private.utils";

type Props = {
  invitation: PrivateInvitation;
  onRespond: (response: InvitationResponse) => void;
  onChangeTime?: () => void;
};

export default function InvitationCard({
  invitation,
  onRespond,
  onChangeTime,
}: Props) {
  const isAccepted = invitation.response === "accepted";
  const isDeclined = invitation.response === "declined";

  return (
    <View style={styles.card}>
      <View style={styles.photosRow}>
        <Image
          source={{ uri: invitation.beforePhotoUri }}
          style={styles.photo}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <Image
          source={{ uri: invitation.afterPhotoUri }}
          style={styles.photo}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <View style={styles.swapIconWrap}>
          <Text style={styles.swapIcon}>⇄</Text>
        </View>
      </View>

      <Text style={styles.title}>Invitation!!</Text>
      <Text style={styles.time}>{formatInvitationTime(invitation.scheduledAt)}</Text>

      <View style={styles.choiceRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.choiceButton,
            styles.yesButton,
            isDeclined && styles.choiceButtonDimmed,
          ]}
          onPress={() => onRespond("accepted")}
        >
          <Text style={[styles.choiceButtonText, styles.choiceButtonTextLight]}>
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.choiceButton,
            styles.noButton,
            isAccepted && styles.choiceButtonDimmed,
          ]}
          onPress={() => onRespond("declined")}
        >
          <Text style={styles.choiceButtonText}>No</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.changeTimeButton}
        onPress={onChangeTime}
      >
        <Text style={styles.choiceButtonText}>Change Time</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
  },
  photosRow: {
    flexDirection: "row",
    gap: 8,
  },
  photo: {
    flex: 1,
    height: 130,
    borderRadius: 12,
    backgroundColor: "#DDDDDD",
  },
  swapIconWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  swapIcon: {
    fontSize: 14,
    color: "#666666",
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
  },
  time: {
    marginTop: 2,
    fontSize: 13,
    color: "#444444",
  },
  choiceRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  yesButton: {
    backgroundColor: colors.brandStrong,
  },
  noButton: {
    backgroundColor: "#E2E2E2",
  },
  choiceButtonDimmed: {
    opacity: 0.5,
  },
  choiceButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
  },
  choiceButtonTextLight: {
    color: "#FFFFFF",
  },
  changeTimeButton: {
    marginTop: 8,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
});
