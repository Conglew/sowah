import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import PrivacyPicker from "@/src/features/events/components/PrivacyPicker";
import type { TopicPrivacy } from "@/src/features/events/types/events.types";
import { eventsApi } from "@/src/features/events/api/events.api";

export default function CreateTopicPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  // Private 目前需要 Premium 才能選，實際上只有 Public 可選，
  // 硬要使用者「先選一次」沒有意義，所以直接預設 public。
  const [privacy, setPrivacy] = useState<TopicPrivacy>("public");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate || !selectedTime || !participantCount) {
      Alert.alert("資料未完成", "請填寫標題、日期、時間與參加人數。");
      return;
    }

    const start = new Date(selectedDate);
    start.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    setIsSubmitting(true);
    try {
      await eventsApi.create({
        title: title.trim(),
        description: description.trim(),
        start: start.toISOString(),
        duration_minutes: 30,
        kind: participantCount === 2 ? "one-on-one" : "multiple",
        visibility: privacy,
      });
      Alert.alert("建立成功", "活動已建立。", [
        { text: "完成", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.warn("[CreateTopicPage] create failed", error);
      Alert.alert("建立失敗", "請確認時間與欄位後再試一次。");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Ex: Travel"
            placeholderTextColor="#C8C8C8"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Discussion Guide</Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Privacy</Text>

          <PrivacyPicker value={privacy} onChange={setPrivacy} />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
          onPress={() => void handleCreate()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Create</Text>
          )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
