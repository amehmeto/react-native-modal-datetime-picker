import React from "react"
import { Platform } from "react-native"

export function DateTimePickerModal() {
  React.useEffect(() => {
    throw new Error(`DateTimePicker is not supported on: ${Platform.OS}`)
  }, [])
  return null
}
