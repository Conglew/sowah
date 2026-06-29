import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ParticipantsPickerProps = {
  value: number | null;
  onChange: (value: number) => void;
};

const PARTICIPANT_OPTIONS = [2, 3, 4, 5, 6];

export default function ParticipantsPicker({
  value,
  onChange,
}: ParticipantsPickerProps) {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handleValueChange = (nextValue: number) => {
    onChange(nextValue);

    if (Platform.OS === "android") {
      setIsPickerVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.selectInput}
        onPress={() => setIsPickerVisible((current) => !current)}
      >
        <View style={styles.selectContent}>
          <Text style={styles.leftIcon}>👤</Text>

          <Text style={[styles.selectText, !value && styles.placeholderText]}>
            {value ? `${value} Participants` : "2–6 Participants"}
          </Text>
        </View>

        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      {isPickerVisible && (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={value ?? 2}
            onValueChange={handleValueChange}
            mode="dropdown"
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {PARTICIPANT_OPTIONS.map((participantCount) => {
              return (
                <Picker.Item
                  key={participantCount}
                  label={`${participantCount}`}
                  value={participantCount}
                />
              );
            })}
          </Picker>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.doneButton}
              onPress={() => setIsPickerVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
  leftIcon: {
    width: 18,
    fontSize: 13,
    color: "#B8B8B8",
  },
  selectText: {
    flex: 1,
    fontSize: 12,
    color: "#111111",
  },
  placeholderText: {
    color: "#B8B8B8",
  },
  chevron: {
    marginLeft: 8,
    fontSize: 14,
    color: "#AAAAAA",
  },
  pickerWrapper: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "#F2F2F2" : "#FFFFFF",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 150 : 48,
  },
  pickerItem: {
    fontSize: 18,
    color: "#111111",
  },
  doneButton: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF7A00",
  },
});
