import React, { useEffect, useRef, useState, memo } from "react";
import DateTimePicker, {
  AndroidNativeProps,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type PickerMode = "date" | "time" | "datetime";

interface DateTimePickerModalProps extends Omit<
  AndroidNativeProps,
  "value" | "mode" | "onChange"
> {
  date?: Date;
  mode?: PickerMode;
  isVisible?: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  onHide?: (confirmed: boolean, date?: Date) => void;
}

const areEqual = (
  prevProps: DateTimePickerModalProps,
  nextProps: DateTimePickerModalProps,
) => {
  if (prevProps.isVisible && nextProps.isVisible) return true;
  return false;
};

const DateTimePickerModal = memo(
  ({
    date = new Date(),
    mode = "date",
    isVisible = false,
    onCancel,
    onConfirm,
    onHide = () => {},
    ...otherProps
  }: DateTimePickerModalProps) => {
    const currentDateRef = useRef(date);
    const [currentMode, setCurrentMode] = useState<"date" | "time" | null>(
      null,
    );

    useEffect(() => {
      if (isVisible && currentMode === null) {
        setCurrentMode(mode === "time" ? "time" : "date");
      } else if (!isVisible) {
        setCurrentMode(null);
      }
    }, [isVisible, currentMode, mode]);

    if (!isVisible || !currentMode) return null;

    const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed") {
        onCancel();
        onHide(false);
        return;
      }
      let nextDate = selectedDate!;
      if (mode === "datetime") {
        if (currentMode === "date") {
          setCurrentMode("time");
          currentDateRef.current = new Date(nextDate);
          return;
        } else if (currentMode === "time") {
          const year = currentDateRef.current.getFullYear();
          const month = currentDateRef.current.getMonth();
          const day = currentDateRef.current.getDate();
          const hours = nextDate.getHours();
          const minutes = nextDate.getMinutes();
          nextDate = new Date(year, month, day, hours, minutes);
        }
      }
      onConfirm(nextDate);
      onHide(true, nextDate);
    };

    return (
      <DateTimePicker
        {...otherProps}
        mode={currentMode}
        value={date}
        onChange={handleChange}
      />
    );
  },
  areEqual,
);

export default DateTimePickerModal;

export { DateTimePickerModal };
