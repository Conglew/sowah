import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { usersApi } from "@/src/features/profile/api/users.api";
import PickerImgIcon from "@/src/assets/icons/picker_img_icon.svg";
import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import {
  COUNTRIES,
  type CountryCode,
} from "@/src/shared/utils/country-flag";
import { haptics } from "@/src/shared/utils/haptics";
import { useAuthStore } from "@/src/stores/auth.store";
import { useProfileStore } from "@/src/stores/profile.store";
import { colors } from "@/src/theme/colors";

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }

  return undefined;
}

export default function OnboardingProfilePage() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const setProfile = useProfileStore((state) => state.setProfile);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [country, setCountry] = useState<CountryCode | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 && country !== null && !submitting;

  const selectedCountry = COUNTRIES.find((c) => c.code === country) ?? null;

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("需要相簿權限才能設定頭像");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleDobChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed") {
      return;
    }
    if (selected) {
      setDob(selected);
    }
  };

  const handleSelectCountry = (code: CountryCode) => {
    haptics.selection();
    setCountry(code);
    setShowCountryModal(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 畫面已無獨立 User ID 欄位 → 以 Name 當作後端必填的 user_id 送出。
      // dob / avatar 目前後端不支援，先留在畫面（UI-only）。
      const profile = await usersApi.initMe({
        user_id: name.trim(),
        country: country as CountryCode,
      });

      setProfile(profile);
      completeOnboarding();
    } catch (submitError) {
      const statusCode = getStatusCode(submitError);

      if (statusCode === 409) {
        setError("This user ID is already taken.");
      } else if (statusCode === 400) {
        setError("Invalid user ID. Please try another one.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome to SoWah!</Text>
        <Text style={styles.subtitle}>Set up your profile.</Text>

        {/* 頭像 */}
        <View style={styles.avatarWrap}>
          <Pressable style={styles.avatarCircle} onPress={pickAvatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <SowahAvatar width={138} height={134} />
            )}
          </Pressable>

          <Pressable style={styles.avatarBadge} onPress={pickAvatar} hitSlop={8}>
            {/* svg 本身已含深灰圓底 + icon，直接 30×30 呈現，不要再外包圓圈 */}
            <PickerImgIcon width={21} height={21} />
          </Pressable>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: SoWah"
            placeholderTextColor="#C8C8C8"
          />
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.selectInput}
            onPress={() => setShowDatePicker((prev) => !prev)}
          >
            <Text style={[styles.selectText, !dob && styles.placeholder]}>
              {dob ? dayjs(dob).format("DD / MM / YYYY") : "DD / MM / YYYY"}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={dob ?? new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleDobChange}
              />
            </View>
          )}
        </View>

        {/* Country / Region */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Country / Region</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.selectInput}
            onPress={() => setShowCountryModal(true)}
          >
            <Text
              style={[styles.selectText, !selectedCountry && styles.placeholder]}
            >
              {selectedCountry
                ? `${selectedCountry.flag}  ${selectedCountry.name}`
                : "Select your country"}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>START</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 國家選單 */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCountryModal(false)}
        >
          {/* 遮罩瞬間出現；只有 sheet 用 reanimated 從下滑上來 */}
          <Animated.View
            entering={SlideInDown.duration(260)}
            style={styles.modalSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Country / Region</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                hitSlop={8}
              >
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = item.code === country;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.countryRow}
                    onPress={() => handleSelectCountry(item.code)}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    {active && <Text style={styles.countryCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 48,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 15,
    color: "#555555",
  },

  // 頭像
  avatarWrap: {
    alignSelf: "center",
    marginBottom: 28,
  },
  avatarCircle: {
    width: 138,
    height: 134,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "#595959",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarBadge: {
    position: "absolute",
    right: 5,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#595959",
    alignItems: "center",
    justifyContent: "center",
  },

  // 欄位
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: "#444444",
  },
  input: {
    height: 38,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  selectInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: "#111111",
  },
  placeholder: {
    color: "#C8C8C8",
  },
  chevron: {
    marginLeft: 8,
    fontSize: 16,
    color: "#AAAAAA",
  },
  pickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  errorText: {
    marginBottom: 12,
    fontSize: 12,
    color: "#E04A4A",
  },

  submitButton: {
    height: 52,
    marginTop: 20,
    borderRadius: 26,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#D9D9D9",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    fontStyle: "italic",
    color: "#FFFFFF",
  },

  // 國家 modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 10,
  },
  modalSheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  modalClose: {
    fontSize: 18,
    color: "#888888",
  },
  countryRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
  },
  countryCheck: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brandStrong,
  },
});
