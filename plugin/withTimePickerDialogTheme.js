"use strict";

const { withAndroidColors, withAndroidColorsNight, withAndroidStyles, AndroidConfig } = require("@expo/config-plugins");

const { assignStylesValue, getAppThemeLightNoActionBarGroup } = AndroidConfig.Styles;
const { assignColorValue } = AndroidConfig.Colors;

const moduleName = "ModalDateTimePicker: ";

const TIME_PICKER_DIALOG_ALLOWED_ATTRIBUTES = {
  textColorPrimary: { attrName: "android:textColorPrimary" },
  colorAccent: { attrName: "colorAccent" },
  colorControlActivated: { attrName: "colorControlActivated" },
  colorControlHighlight: { attrName: "colorControlHighlight" },
  windowBackground: { attrName: "android:windowBackground" },
  textColor: { attrName: "android:textColor" },
  textColorSecondary: { attrName: "android:textColorSecondary" },
};

const TIME_PICKER_DIALOG_STYLE_NAME = "TimePickerDialogTheme";
const TIME_PICKER_DIALOG_THEME_ATTRIBUTE = "android:timePickerDialogTheme";
const ATTR_PREFIX = "timePickerDialog";

const insertColorEntries = (android = {}, config, themedColorExtractor) => {
  const theme = android.timePickerDialog;
  if (theme) {
    config.modResults = setAndroidColors(config.modResults, themedColorExtractor, theme);
  }
};

const setAndroidColors = (colors, themedColorExtractor, theme) => {
  return Object.entries(theme).reduce((acc, [attrName, colorValues]) => {
    const color = {
      name: `${ATTR_PREFIX}_${attrName}`,
      value: themedColorExtractor(colorValues, attrName) ?? null,
    };
    return assignColorValue(acc, color);
  }, colors);
};

const setAndroidPickerStyles = (styles, theme) => {
  if (!theme) {
    return styles;
  }

  styles = Object.keys(theme).reduce((acc, userFacingAttrName) => {
    const entry = TIME_PICKER_DIALOG_ALLOWED_ATTRIBUTES[userFacingAttrName];
    if (!entry) {
      throw new Error(
        `${moduleName}Invalid attribute name: ${userFacingAttrName}. Supported are ${Object.keys(TIME_PICKER_DIALOG_ALLOWED_ATTRIBUTES).join(", ")}`
      );
    }
    const { attrName } = entry;
    return assignStylesValue(acc, {
      add: true,
      parent: {
        name: TIME_PICKER_DIALOG_STYLE_NAME,
        parent: "Theme.AppCompat.Light.Dialog",
      },
      name: attrName,
      value: `@color/${ATTR_PREFIX}_${userFacingAttrName}`,
    });
  }, styles);

  styles = assignStylesValue(styles, {
    add: true,
    parent: getAppThemeLightNoActionBarGroup(),
    name: TIME_PICKER_DIALOG_THEME_ATTRIBUTE,
    value: `@style/${TIME_PICKER_DIALOG_STYLE_NAME}`,
  });

  return styles;
};

const withTimePickerDialogTheme = (baseConfig, options = {}) => {
  const { android = {} } = options;

  let newConfig = withAndroidColors(baseConfig, (config) => {
    insertColorEntries(android, config, (color, attrName) => {
      const value = color.light;
      if (!value) {
        throw new Error(
          `${moduleName}A light color value was not provided for "${attrName}". Providing at least a light color is required.`
        );
      }
      return value;
    });
    return config;
  });

  newConfig = withAndroidColorsNight(newConfig, (config) => {
    insertColorEntries(android, config, (color) => color.dark);
    return config;
  });

  newConfig = withAndroidStyles(newConfig, (config) => {
    config.modResults = setAndroidPickerStyles(config.modResults, android.timePickerDialog);
    return config;
  });

  return newConfig;
};

module.exports = withTimePickerDialogTheme;
