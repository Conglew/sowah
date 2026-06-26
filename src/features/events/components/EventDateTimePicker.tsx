import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EventDateTimePickerProps = {
  date: Date | null;
  time: Date | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
};

type VisiblePicker = "date" | "time" | null;

function roundToNearestHalfHour(date: Date) {
  const nextDate = new Date(date);
  const minutes = nextDate.getMinutes();

  if (minutes < 15) {
    nextDate.setMinutes(0);
  } else if (minutes < 45) {
    nextDate.setMinutes(30);
  } else {
    nextDate.setHours(nextDate.getHours() + 1);
    nextDate.setMinutes(0);
  }

  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);

  return nextDate;
}

export default function EventDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: EventDateTimePickerProps) {
  const [visiblePicker, setVisiblePicker] = useState<VisiblePicker>(null);

  const togglePicker = (picker: Exclude<VisiblePicker, null>) => {
    setVisiblePicker((current) => (current === picker ? null : picker));
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setVisiblePicker(null);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    if (Platform.OS === "android") {
      setVisiblePicker(null);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selectedTime) {
      onTimeChange(roundToNearestHalfHour(selectedTime));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerBlock}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.selectInput}
          onPress={() => togglePicker("date")}
        >
          <View style={styles.selectContent}>
            <Text style={styles.leftIcon}>▣</Text>

            <Text style={[styles.selectText, !date && styles.placeholderText]}>
              {date ? dayjs(date).format("YYYY/MM/DD") : "Date"}
            </Text>
          </View>

          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>

        {visiblePicker === "date" && (
          <View style={styles.nativePickerWrapper}>
            <DateTimePicker
              value={date ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              style={styles.nativePicker}
            />
          </View>
        )}
      </View>

      <View style={styles.pickerBlock}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.selectInput}
          onPress={() => togglePicker("time")}
        >
          <View style={styles.selectContent}>
            <Text style={styles.leftIcon}>◷</Text>

            <Text style={[styles.selectText, !time && styles.placeholderText]}>
              {time ? dayjs(time).format("HH:mm") : "Time (30min)"}
            </Text>
          </View>

          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>

        {visiblePicker === "time" && (
          <View style={styles.nativePickerWrapper}>
            <DateTimePicker
              value={time ?? new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minuteInterval={30}
              onChange={handleTimeChange}
              style={styles.nativePicker}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  pickerBlock: {
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
  nativePickerWrapper: {
    marginTop: 6,
    marginBottom: 8,
    borderWidth: Platform.OS === "ios" ? 0 : 0,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  nativePicker: {
    width: "100%",
  },
});