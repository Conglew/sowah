import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/theme/colors";
import EventDateTimePicker from "@/src/features/events/components/EventDateTimePicker";
import ParticipantsPicker from "@/src/features/events/components/ParticipantsPicker";

export default function CreateTopicPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create New Topic</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Topic Title</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex: Travel"
            placeholderTextColor="#C8C8C8"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Discussion Guide</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: What is your favorite travel experience? Where did you go? What made the trip memorable? Would you like to visit again?"
            placeholderTextColor="#C8C8C8"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date & Time</Text>

          <EventDateTimePicker
            date={selectedDate}
            time={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Participants</Text>

          <ParticipantsPicker
            value={participantCount}
            onChange={setParticipantCount}
          />
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Create</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 42,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: "#555555",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 23,
    paddingTop: 26,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 12,
    color: "#666666",
  },
  input: {
    minHeight: 28,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 74,
    lineHeight: 17,
  },
  selectInput: {
    height: 28,
    borderWidth: 1,
    borderColor: "#C7C7C7",
    borderRadius: 4,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  selectContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  selectIcon: {
    width: 18,
    fontSize: 13,
    color: "#B8B8B8",
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 12,
    color: "#B8B8B8",
  },
  chevron: {
    marginLeft: 8,
    fontSize: 14,
    color: "#AAAAAA",
  },
  submitButton: {
    height: 35,
    marginTop: 7,
    borderRadius: 9,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
