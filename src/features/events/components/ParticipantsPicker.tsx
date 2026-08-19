import ParticipantIcon from "@/src/assets/icons/participant_icon.svg";
import SelectField, { type SelectOption } from "./SelectField";

type ParticipantsPickerProps = {
  value: number | null;
  onChange: (value: number) => void;
};

const PARTICIPANT_OPTIONS: SelectOption<number>[] = [2, 3, 4, 5, 6].map(
  (count) => ({
    label: `${count} Participants`,
    value: count,
    Icon: ParticipantIcon,
  }),
);

/** 參加人數：2–6 人 */
export default function ParticipantsPicker({
  value,
  onChange,
}: ParticipantsPickerProps) {
  return (
    <SelectField
      value={value}
      placeholder="2–6 Participants"
      placeholderIcon={ParticipantIcon}
      options={PARTICIPANT_OPTIONS}
      onChange={onChange}
    />
  );
}
