import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usersApi } from "@/src/features/profile/api/users.api";
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

  const [userId, setUserId] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    userId.trim().length > 0 && country.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile = await usersApi.initMe({
        user_id: userId.trim(),
        country: country.trim(),
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
      <View style={styles.content}>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          Choose a user ID and country to finish setting up your account.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="Ex: sowah_user"
            placeholderTextColor="#C8C8C8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Ex: TW"
            placeholderTextColor="#C8C8C8"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 13,
    lineHeight: 19,
    color: "#7A7A7A",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    color: "#666666",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    marginBottom: 12,
    fontSize: 12,
    color: "#E04A4A",
  },
  submitButton: {
    height: 48,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E2E2E2",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
