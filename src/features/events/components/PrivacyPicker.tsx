import LockClosedIcon from "@/src/assets/icons/lock_closed_icon.svg";
import LockOpenIcon from "@/src/assets/icons/lock_open_icon.svg";
import SelectField, { type SelectOption } from "./SelectField";
import { TOPIC_PRIVACY_LABELS, type TopicPrivacy } from "../types/events.types";

type PrivacyPickerProps = {
  value: TopicPrivacy;
  onChange: (value: TopicPrivacy) => void;
};

const PRIVACY_OPTIONS: SelectOption<TopicPrivacy>[] = [
  {
    label: TOPIC_PRIVACY_LABELS.public,
    value: "public",
    Icon: LockOpenIcon,
  },
  {
    // "(Premium Only)" 是 UI 文案不是 domain label，所以接在這裡而不是寫進 TOPIC_PRIVACY_LABELS
    label: `${TOPIC_PRIVACY_LABELS.private} (Premium Only)`,
    value: "private",
    Icon: LockClosedIcon,
    // 目前一律鎖住。等付費方案接上來後，把這裡改成 !isPremium 並讓呼叫端傳入方案狀態即可，
    // SelectField 已經支援逐項 disabled，不用再動元件本身。
    disabled: true,
  },
];

/** Topic 可見度：Public / Private（Private 需 Premium） */
export default function PrivacyPicker({ value, onChange }: PrivacyPickerProps) {
  return (
    <SelectField
      value={value}
      placeholder={TOPIC_PRIVACY_LABELS.public}
      placeholderIcon={LockOpenIcon}
      options={PRIVACY_OPTIONS}
      onChange={onChange}
    />
  );
}
