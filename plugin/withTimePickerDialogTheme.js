"use strict";

const { withAndroidColors, withAndroidColorsNight, withAndroidStyles, AndroidConfig } = require("@expo/config-plugins");

const { assignStylesValue, getAppThemeLightNoActionBarGroup } = AndroidConfig.Styles;
const { assignColorValue } = AndroidConfig.Colors;

const moduleName = "ModalDateTimePicker: ";

const DIALOG_ALLOWED_ATTRIBUTES = {
  textColorPrimary: { attrName: "android:textColorPrimary" },
  textColorSecondary: { attrName: "android:textColorSecondary" },
  textColorPrimaryInverse: { attrName: "android:textColorPrimaryInverse" },
  textColorSecondaryInverse: { attrName: "android:textColorSecondaryInverse" },
  colorAccent: { attrName: "colorAccent" },
  colorPrimary: { attrName: "colorPrimary" },
  colorControlActivated: { attrName: "colorControlActivated" },
  colorControlHighlight: { attrName: "colorControlHighlight" },
  colorControlNormal: { attrName: "android:colorControlNormal" },
  windowBackground: { attrName: "android:windowBackground" },
  textColor: { attrName: "android:textColor" },
  dialogCornerRadius: { attrName: "android:dialogCornerRadius", literal: true },
  buttonBarPositiveButtonStyle: { attrName: "buttonBarPositiveButtonStyle", literal: true },
  buttonBarNegativeButtonStyle: { attrName: "buttonBarNegativeButtonStyle", literal: true },
};

const TIME_PICKER_WIDGET_ALLOWED_ATTRIBUTES = {
  background: { attrName: "android:background" },
  headerBackground: { attrName: "android:headerBackground" },
  headerSelectedTextColor: { attrName: "android:headerSelectedTextColor" },
  numbersTextColor: { attrName: "android:numbersTextColor" },
  numbersInnerTextColor: { attrName: "android:numbersInnerTextColor" },
  numbersBackgroundColor: { attrName: "android:numbersBackgroundColor" },
  numbersSelectorColor: { attrName: "android:numbersSelectorColor" },
  amPmTextColor: { attrName: "android:amPmTextColor" },
  amPmBackgroundColor: { attrName: "android:amPmBackgroundColor" },
  amPmSelectedBackgroundColor: { attrName: "android:amPmSelectedBackgroundColor" },
};

const DATE_PICKER_WIDGET_ALLOWED_ATTRIBUTES = {
  headerBackground: { attrName: "android:headerBackground" },
  headerSelectedTextColor: { attrName: "android:headerSelectedTextColor" },
  calendarTextColor: { attrName: "android:calendarTextColor" },
  calendarSelectedTextColor: { attrName: "android:calendarSelectedTextColor" },
  yearListSelectorColor: { attrName: "android:yearListSelectorColor" },
  dayOfWeekBackground: { attrName: "android:dayOfWeekBackground" },
};

const PICKER_CONFIGS = [
  {
    optionKey: "timePickerDialog",
    styleName: "TimePickerDialogTheme",
    themeAttribute: "android:timePickerDialogTheme",
    defaultParentTheme: "Theme.AppCompat.Light.Dialog",
    attrPrefix: "timePickerDialog",
    allowedAttributes: DIALOG_ALLOWED_ATTRIBUTES,
  },
  {
    optionKey: "datePickerDialog",
    styleName: "DatePickerDialogTheme",
    themeAttribute: "android:datePickerDialogTheme",
    defaultParentTheme: "Theme.AppCompat.Light.Dialog",
    attrPrefix: "datePickerDialog",
    allowedAttributes: DIALOG_ALLOWED_ATTRIBUTES,
  },
  {
    optionKey: "timePickerWidget",
    styleName: "TimePickerWidgetStyle",
    themeAttribute: "android:timePickerStyle",
    defaultParentTheme: "android:Widget.Material.Light.TimePicker",
    attrPrefix: "timePickerWidget",
    allowedAttributes: TIME_PICKER_WIDGET_ALLOWED_ATTRIBUTES,
  },
  {
    optionKey: "datePickerWidget",
    styleName: "DatePickerWidgetStyle",
    themeAttribute: "android:datePickerStyle",
    defaultParentTheme: "android:Widget.Material.Light.DatePicker",
    attrPrefix: "datePickerWidget",
    allowedAttributes: DATE_PICKER_WIDGET_ALLOWED_ATTRIBUTES,
  },
];

const insertColorEntries = (android = {}, config, themedColorExtractor) => {
  for (const pickerConfig of PICKER_CONFIGS) {
    const theme = android[pickerConfig.optionKey];
    if (theme) {
      config.modResults = setAndroidColors(config.modResults, themedColorExtractor, theme, pickerConfig.attrPrefix, pickerConfig.allowedAttributes);
    }
  }
};

const setAndroidColors = (colors, themedColorExtractor, theme, attrPrefix, allowedAttributes) => {
  return Object.entries(theme).reduce((acc, [attrName, colorValues]) => {
    if (attrName === "parentTheme") {
      return acc;
    }
    const entry = allowedAttributes[attrName];
    if (entry && entry.literal) {
      return acc;
    }
    const color = {
      name: `${attrPrefix}_${attrName}`,
      value: themedColorExtractor(colorValues, attrName) ?? null,
    };
    return assignColorValue(acc, color);
  }, colors);
};

const setAndroidPickerStyles = (styles, theme, pickerConfig) => {
  if (!theme) {
    return styles;
  }

  const { styleName, themeAttribute, defaultParentTheme, attrPrefix, allowedAttributes } = pickerConfig;
  const parentTheme = theme.parentTheme || defaultParentTheme;

  styles = Object.keys(theme).reduce((acc, userFacingAttrName) => {
    if (userFacingAttrName === "parentTheme") {
      return acc;
    }
    const entry = allowedAttributes[userFacingAttrName];
    if (!entry) {
      throw new Error(
        `${moduleName}Invalid attribute name: ${userFacingAttrName}. Supported for ${pickerConfig.optionKey} are ${Object.keys(allowedAttributes).join(", ")}`
      );
    }
    const { attrName, literal } = entry;
    const value = literal
      ? theme[userFacingAttrName]
      : `@color/${attrPrefix}_${userFacingAttrName}`;
    return assignStylesValue(acc, {
      add: true,
      parent: {
        name: styleName,
        parent: parentTheme,
      },
      name: attrName,
      value,
    });
  }, styles);

  styles = assignStylesValue(styles, {
    add: true,
    parent: getAppThemeLightNoActionBarGroup(),
    name: themeAttribute,
    value: `@style/${styleName}`,
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
    for (const pickerConfig of PICKER_CONFIGS) {
      config.modResults = setAndroidPickerStyles(config.modResults, android[pickerConfig.optionKey], pickerConfig);
    }
    return config;
  });

  return newConfig;
};

module.exports = withTimePickerDialogTheme;
