import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";

export function CalendarPicker({
  value,
  onChange,
  maximumDate = new Date(),
}: {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
}) {
  const defaultStyles = useDefaultStyles("light");

  return (
    <DateTimePicker
      mode="single"
      date={value}
      maxDate={maximumDate}
      firstDayOfWeek={1}
      onChange={({ date }) => {
        if (!date) return;

        const selectedDate =
          date instanceof Date
            ? date
            : typeof date === "string" || typeof date === "number"
              ? new Date(date)
              : date.toDate();

        if (!Number.isNaN(selectedDate.getTime())) onChange(selectedDate);
      }}
      styles={{
        ...defaultStyles,
        header: { backgroundColor: "transparent" },
        month_selector_label: { color: "#1A1D26", fontWeight: "600" },
        year_selector_label: { color: "#1A1D26", fontWeight: "600" },
        weekday_label: { color: "#5C5F68" },
        day_label: { color: "#1A1D26" },
        selected: { backgroundColor: "#1A85FF" },
        selected_label: { color: "#FFFFFF", fontWeight: "600" },
        today: { borderWidth: 1, borderColor: "#1A85FF" },
        disabled_label: { color: "#A7A9AE" },
        button_prev_image: { tintColor: "#5C5F68" },
        button_next_image: { tintColor: "#5C5F68" },
      }}
    />
  );
}
