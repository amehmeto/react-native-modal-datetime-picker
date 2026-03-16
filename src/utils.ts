import { Dimensions, Platform } from "react-native"

const IPHONE_X_DIMENSIONS = new Set([780, 812, 844, 852, 896, 926, 932])

export const isIphoneX = () => {
  const { height, width } = Dimensions.get("window")

  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTV &&
    (IPHONE_X_DIMENSIONS.has(height) || IPHONE_X_DIMENSIONS.has(width))
  )
}
