import React from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  View,
  Appearance,
  ViewStyle,
} from "react-native";
import DateTimePicker, {
  IOSNativeProps,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Modal from "./Modal";
import { isIphoneX } from "./utils";

export const BACKGROUND_COLOR_LIGHT = "white";
export const BACKGROUND_COLOR_DARK = "#16213E";
export const BORDER_COLOR = "#d5d5d5";
export const BORDER_COLOR_DARK = "#222E47";
export const BORDER_RADIUS = 20;
export const BUTTON_FONT_WEIGHT = "normal" as const;
export const BUTTON_FONT_COLOR = "#38BDF8";
export const BUTTON_FONT_SIZE = 20;
export const HIGHLIGHT_COLOR_DARK = "#1C2D52";
export const HIGHLIGHT_COLOR_LIGHT = "#ebebeb";

interface DateTimePickerModalProps extends Omit<
  IOSNativeProps,
  "value" | "onChange"
> {
  buttonTextColorIOS?: string;
  cancelButtonTestID?: string;
  confirmButtonTestID?: string;
  cancelTextIOS?: string;
  confirmTextIOS?: string;
  customCancelButtonIOS?: React.ComponentType<CancelButtonProps>;
  customConfirmButtonIOS?: React.ComponentType<ConfirmButtonProps>;
  customHeaderIOS?: React.ComponentType;
  customPickerIOS?: React.ComponentType<IOSNativeProps>;
  date?: Date;
  modalPropsIOS?: Record<string, unknown>;
  modalStyleIOS?: ViewStyle;
  isDarkModeEnabled?: boolean;
  isVisible?: boolean;
  pickerContainerStyleIOS?: ViewStyle;
  pickerStyleIOS?: ViewStyle;
  backdropStyleIOS?: ViewStyle;
  pickerComponentStyleIOS?: ViewStyle;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  onChange?: (date: Date) => void;
  onHide?: (confirmed: boolean, date: Date) => void;
  backgroundColorIOS?: string;
  borderColorIOS?: string;
  borderColorDarkIOS?: string;
  borderRadiusIOS?: number;
  buttonFontSizeIOS?: number;
  buttonHeightIOS?: number;
  confirmButtonFontFamilyIOS?: string;
  cancelButtonFontFamilyIOS?: string;
  confirmButtonFontWeightIOS?: TextStyle["fontWeight"];
  cancelButtonFontWeightIOS?: TextStyle["fontWeight"];
  highlightColorIOS?: string;
  backdropOpacityIOS?: number;
  backdropColorIOS?: string;
  animationDurationIOS?: number;
}

interface DateTimePickerModalState {
  currentDate: Date;
  isPickerVisible: boolean;
}

export class DateTimePickerModal extends React.PureComponent<
  DateTimePickerModalProps,
  DateTimePickerModalState
> {
  static defaultProps = {
    cancelTextIOS: "Cancel",
    confirmTextIOS: "Confirm",
    modalPropsIOS: {},
    date: new Date(),
    isDarkModeEnabled: undefined,
    isVisible: false,
    pickerContainerStyleIOS: {},
    pickerStyleIOS: {},
    backdropStyleIOS: {},
    pickerComponentStyleIOS: {},
  };

  state: DateTimePickerModalState = {
    currentDate: this.props.date ?? new Date(),
    isPickerVisible: this.props.isVisible ?? false,
  };

  didPressConfirm = false;

  static getDerivedStateFromProps(
    props: DateTimePickerModalProps,
    state: DateTimePickerModalState,
  ) {
    if (props.isVisible && !state.isPickerVisible) {
      return { currentDate: props.date, isPickerVisible: true };
    }
    return null;
  }

  handleCancel = () => {
    this.didPressConfirm = false;
    this.props.onCancel();
  };

  handleConfirm = () => {
    this.didPressConfirm = true;
    this.props.onConfirm(this.state.currentDate);
  };

  handleHide = () => {
    const { onHide } = this.props;
    if (onHide) {
      onHide(this.didPressConfirm, this.state.currentDate);
    }
    this.setState({ isPickerVisible: false });
  };

  handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (this.props.onChange && date) {
      this.props.onChange(date);
    }
    if (date) {
      this.setState({ currentDate: date });
    }
  };

  render() {
    const {
      cancelButtonTestID,
      confirmButtonTestID,
      cancelTextIOS,
      confirmTextIOS,
      customCancelButtonIOS,
      customConfirmButtonIOS,
      customHeaderIOS,
      customPickerIOS,
      date: _date,
      display,
      isDarkModeEnabled,
      isVisible,
      modalStyleIOS,
      modalPropsIOS,
      pickerContainerStyleIOS,
      pickerStyleIOS,
      pickerComponentStyleIOS,
      onCancel: _onCancel,
      onConfirm: _onConfirm,
      onChange: _onChange,
      onHide: _onHide,
      backdropStyleIOS,
      buttonTextColorIOS,
      backgroundColorIOS,
      borderColorIOS,
      borderColorDarkIOS,
      borderRadiusIOS,
      buttonFontSizeIOS,
      buttonHeightIOS,
      confirmButtonFontFamilyIOS,
      cancelButtonFontFamilyIOS,
      confirmButtonFontWeightIOS,
      cancelButtonFontWeightIOS,
      highlightColorIOS,
      backdropOpacityIOS,
      backdropColorIOS,
      animationDurationIOS,
      ...otherProps
    } = this.props;
    const isAppearanceModuleAvailable = !!(
      Appearance && Appearance.getColorScheme
    );
    const _isDarkModeEnabled =
      isDarkModeEnabled === undefined && isAppearanceModuleAvailable
        ? Appearance.getColorScheme() === "dark"
        : isDarkModeEnabled || false;

    const ConfirmButtonComponent = customConfirmButtonIOS || ConfirmButton;
    const CancelButtonComponent = customCancelButtonIOS || CancelButton;
    const PickerComponent = customPickerIOS || DateTimePicker;
    const HeaderComponent = customHeaderIOS;

    const themedContainerStyle = _isDarkModeEnabled
      ? pickerStyles.containerDark
      : pickerStyles.containerLight;
    const containerOverrides = {
      ...(backgroundColorIOS && { backgroundColor: backgroundColorIOS }),
      ...(borderRadiusIOS != null && { borderRadius: borderRadiusIOS }),
    };

    return (
      <Modal
        isVisible={isVisible}
        contentStyle={[pickerStyles.modal, modalStyleIOS]}
        onBackdropPress={this.handleCancel}
        onHide={this.handleHide}
        backdropStyle={backdropStyleIOS}
        backdropOpacity={backdropOpacityIOS}
        backdropColor={backdropColorIOS}
        animationDuration={animationDurationIOS}
        {...modalPropsIOS}
      >
        <View
          style={[
            pickerStyles.container,
            themedContainerStyle,
            containerOverrides,
            pickerContainerStyleIOS,
          ]}
        >
          {HeaderComponent && <HeaderComponent />}
          {!HeaderComponent && display === "inline" && (
            <View style={pickerStyles.headerFiller} />
          )}
          <View
            style={[
              display === "inline"
                ? pickerStyles.pickerInline
                : pickerStyles.pickerSpinner,
              pickerStyleIOS,
            ]}
          >
            <PickerComponent
              display={display || "spinner"}
              {...otherProps}
              value={this.state.currentDate}
              onChange={this.handleChange}
              // Workaround: inline datetime picker in a Modal sometimes renders
              // incorrectly without an explicit height (seen since datetimepicker 6.7.0).
              style={[
                {
                  height:
                    !customPickerIOS &&
                    otherProps.mode === "datetime" &&
                    display === "inline"
                      ? 370
                      : undefined,
                },
                pickerComponentStyleIOS,
              ]}
            />
          </View>
          <ConfirmButtonComponent
            confirmButtonTestID={confirmButtonTestID}
            isDarkModeEnabled={_isDarkModeEnabled}
            onPress={this.handleConfirm}
            label={confirmTextIOS!}
            buttonTextColorIOS={buttonTextColorIOS}
            borderColor={
              _isDarkModeEnabled
                ? borderColorDarkIOS || borderColorIOS
                : borderColorIOS
            }
            highlightColor={highlightColorIOS}
            buttonHeight={buttonHeightIOS}
            fontSize={buttonFontSizeIOS}
            fontFamily={confirmButtonFontFamilyIOS}
            fontWeight={confirmButtonFontWeightIOS}
          />
        </View>
        <CancelButtonComponent
          cancelButtonTestID={cancelButtonTestID}
          isDarkModeEnabled={_isDarkModeEnabled}
          onPress={this.handleCancel}
          label={cancelTextIOS!}
          buttonTextColorIOS={buttonTextColorIOS}
          backgroundColor={backgroundColorIOS}
          borderRadius={borderRadiusIOS}
          highlightColor={highlightColorIOS}
          buttonHeight={buttonHeightIOS}
          fontSize={buttonFontSizeIOS}
          fontFamily={cancelButtonFontFamilyIOS}
          fontWeight={cancelButtonFontWeightIOS}
        />
      </Modal>
    );
  }
}

const pickerStyles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 10,
    marginBottom: isIphoneX() ? 34 : 10,
  },
  container: {
    borderRadius: BORDER_RADIUS,
    marginBottom: 8,
    overflow: "hidden",
  },
  pickerSpinner: {
    marginBottom: 8,
  },
  pickerInline: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  headerFiller: {},
  containerLight: {
    backgroundColor: BACKGROUND_COLOR_LIGHT,
  },
  containerDark: {
    backgroundColor: BACKGROUND_COLOR_DARK,
  },
});

export interface ConfirmButtonProps {
  isDarkModeEnabled?: boolean;
  confirmButtonTestID?: string;
  onPress: () => void;
  label: string;
  buttonTextColorIOS?: string;
  borderColor?: string;
  highlightColor?: string;
  buttonHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: TextStyle["fontWeight"];
  style?: typeof confirmButtonStyles;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  isDarkModeEnabled,
  confirmButtonTestID,
  onPress,
  label,
  buttonTextColorIOS,
  borderColor,
  highlightColor,
  buttonHeight,
  fontSize,
  fontFamily,
  fontWeight,
  style = confirmButtonStyles,
}) => {
  const themedButtonStyle = isDarkModeEnabled
    ? confirmButtonStyles.buttonDark
    : confirmButtonStyles.buttonLight;

  const underlayColor =
    highlightColor ??
    (isDarkModeEnabled ? HIGHLIGHT_COLOR_DARK : HIGHLIGHT_COLOR_LIGHT);
  const heightStyle =
    buttonHeight != null ? { height: buttonHeight } : undefined;
  const borderOverride = borderColor ? { borderColor } : undefined;
  const textOverrides = {
    ...(fontSize != null && { fontSize }),
    ...(fontFamily && { fontFamily }),
    ...(fontWeight && { fontWeight }),
    ...(buttonTextColorIOS && { color: buttonTextColorIOS }),
  };
  return (
    <TouchableHighlight
      testID={confirmButtonTestID}
      style={[themedButtonStyle, style.button, heightStyle, borderOverride]}
      underlayColor={underlayColor}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[style.text, textOverrides]}>{label}</Text>
    </TouchableHighlight>
  );
};

export const confirmButtonStyles = StyleSheet.create({
  button: {
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
    height: 57,
    justifyContent: "center",
  },
  buttonLight: {
    borderColor: BORDER_COLOR,
  },
  buttonDark: {
    borderColor: BORDER_COLOR_DARK,
  },
  text: {
    textAlign: "center",
    color: BUTTON_FONT_COLOR,
    fontSize: BUTTON_FONT_SIZE,
    fontWeight: BUTTON_FONT_WEIGHT,
    fontFamily: "Inter_400Regular",
    backgroundColor: "transparent",
  },
});

export interface CancelButtonProps {
  cancelButtonTestID?: string;
  isDarkModeEnabled?: boolean;
  onPress: () => void;
  label: string;
  buttonTextColorIOS?: string;
  backgroundColor?: string;
  borderRadius?: number;
  highlightColor?: string;
  buttonHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: TextStyle["fontWeight"];
  style?: typeof cancelButtonStyles;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  cancelButtonTestID,
  isDarkModeEnabled,
  onPress,
  label,
  buttonTextColorIOS,
  backgroundColor,
  borderRadius,
  highlightColor,
  buttonHeight,
  fontSize,
  fontFamily,
  fontWeight,
  style = cancelButtonStyles,
}) => {
  const themedButtonStyle = isDarkModeEnabled
    ? cancelButtonStyles.buttonDark
    : cancelButtonStyles.buttonLight;
  const underlayColor =
    highlightColor ??
    (isDarkModeEnabled ? HIGHLIGHT_COLOR_DARK : HIGHLIGHT_COLOR_LIGHT);
  const heightStyle =
    buttonHeight != null ? { height: buttonHeight } : undefined;
  const bgOverride = backgroundColor ? { backgroundColor } : undefined;
  const radiusOverride = borderRadius != null ? { borderRadius } : undefined;
  const textOverrides = {
    ...(fontSize != null && { fontSize }),
    ...(fontFamily && { fontFamily }),
    ...(fontWeight && { fontWeight }),
    ...(buttonTextColorIOS && { color: buttonTextColorIOS }),
  };
  return (
    <TouchableHighlight
      testID={cancelButtonTestID}
      style={[
        themedButtonStyle,
        style.button,
        heightStyle,
        bgOverride,
        radiusOverride,
      ]}
      underlayColor={underlayColor}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[style.text, textOverrides]}>{label}</Text>
    </TouchableHighlight>
  );
};

export const cancelButtonStyles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS,
    height: 57,
    justifyContent: "center",
  },
  buttonLight: {
    backgroundColor: BACKGROUND_COLOR_LIGHT,
  },
  buttonDark: {
    backgroundColor: BACKGROUND_COLOR_DARK,
  },
  text: {
    padding: 10,
    textAlign: "center",
    color: BUTTON_FONT_COLOR,
    fontSize: BUTTON_FONT_SIZE,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    backgroundColor: "transparent",
  },
});
