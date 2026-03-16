import React from "react";
import { Platform } from "react-native";

export function DateTimePickerModal() {
  React.useEffect(() => {
    // eslint-disable-next-line no-console -- intentional warning for unsupported platforms
    console.warn(`DateTimePicker is not supported on: ${Platform.OS}`);
  }, []);
  return null;
}
