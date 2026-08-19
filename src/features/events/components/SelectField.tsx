import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";

import SelectChevronIcon from "@/src/assets/icons/select_chevron_icon.svg";

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
  /** 該選項左側的 icon；用 svg 元件而非 emoji，才吃得到下面的 selected / disabled 色階 */
  Icon?: React.FC<SvgProps>;
  /** 不可選（例如需要付費方案才能用的選項）：灰掉且不接受點擊 */
  disabled?: boolean;
};

type SelectFieldProps<T extends string | number> = {
  /** 目前選到的值；null 代表尚未選擇，收合列會顯示 placeholder */
  value: T | null;
  placeholder: string;
  /** 尚未選擇時，收合列左側要顯示的 icon */
  placeholderIcon?: React.FC<SvgProps>;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

const ROW_HEIGHT = 28;
const ICON_WIDTH = 14;
const ICON_HEIGHT = 16;

// 三個色階同時負責兩件事：哪個是目前選的（深）、哪個不能選（最淺）。
// 展開清單刻意不放勾勾 / 底色，只靠色階區分，跟設計稿一致。
const SELECTED_COLOR = "#111111";
const UNSELECTED_COLOR = "#8A8A8A";
const DISABLED_COLOR = "#BDBDBD";
const PLACEHOLDER_COLOR = "#B8B8B8";
const CHEVRON_COLOR = "#AAAAAA";

/**
 * Participants / Privacy 這種「單選下拉」欄位。
 *
 * 收合時只顯示目前選的那一列；點下去整個框往下長高，把所有選項列在同一個框裡
 * （不是彈出原生 Picker，也不是 Modal），右側 chevron 對齊最後一列並翻轉成向上。
 * 這是設計稿指定的互動，所以不使用 @react-native-picker/picker。
 */
export default function SelectField<T extends string | number>({
  value,
  placeholder,
  placeholderIcon: PlaceholderIcon,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedOption = options.find((option) => option.value === value) ?? null;
  const CollapsedIcon = selectedOption?.Icon ?? PlaceholderIcon;

  const handleSelect = (option: SelectOption<T>) => {
    // disabled 的列本身已經不吃點擊，這裡再擋一次，避免之後有人改成用別的方式呼叫。
    if (option.disabled) return;

    onChange(option.value);
    setIsExpanded(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsColumn}>
        {isExpanded ? (
          options.map((option) => {
            const isSelected = option.value === value;
            const OptionIcon = option.Icon;
            const contentColor = option.disabled
              ? DISABLED_COLOR
              : isSelected
                ? SELECTED_COLOR
                : UNSELECTED_COLOR;

            return (
              <TouchableOpacity
                key={String(option.value)}
                activeOpacity={0.6}
                disabled={option.disabled}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: Boolean(option.disabled),
                  selected: isSelected,
                }}
                style={styles.row}
                onPress={() => handleSelect(option)}
              >
                {OptionIcon && (
                  <OptionIcon
                    width={ICON_WIDTH}
                    height={ICON_HEIGHT}
                    color={contentColor}
                    style={styles.icon}
                  />
                )}

                <Text style={[styles.rowText, { color: contentColor }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            style={styles.row}
            onPress={() => setIsExpanded(true)}
          >
            {CollapsedIcon && (
              <CollapsedIcon
                width={ICON_WIDTH}
                height={ICON_HEIGHT}
                color={selectedOption ? SELECTED_COLOR : PLACEHOLDER_COLOR}
                style={styles.icon}
              />
            )}

            <Text
              style={[
                styles.rowText,
                { color: selectedOption ? SELECTED_COLOR : PLACEHOLDER_COLOR },
              ]}
            >
              {selectedOption?.label ?? placeholder}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* chevron 獨立成右側一欄並靠下對齊：收合時只有一列，等同垂直置中；
          展開時會落在最後一列的高度上，跟設計稿一致。 */}
      <TouchableOpacity
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? "收合選項" : "展開選項"}
        hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
        style={styles.chevronColumn}
        onPress={() => setIsExpanded((current) => !current)}
      >
        <View style={styles.chevronBox}>
          <SelectChevronIcon
            width={12}
            height={7}
            color={CHEVRON_COLOR}
            style={isExpanded ? styles.chevronUp : undefined}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#C7C7C7",
    // 跟表單其他欄位（input / textArea）維持同一個圓角；要更圓的話改這一個數字即可
    borderRadius: 4,
    paddingHorizontal: 9,
    backgroundColor: "#FFFFFF",
  },
  optionsColumn: {
    flex: 1,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 12,
  },
  chevronColumn: {
    justifyContent: "flex-end",
    paddingLeft: 8,
  },
  chevronBox: {
    height: ROW_HEIGHT,
    justifyContent: "center",
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
});
