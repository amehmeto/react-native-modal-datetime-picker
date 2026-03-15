"use strict";

const { withAndroidColors, withAndroidColorsNight, withAndroidStyles, withDangerousMod, AndroidConfig } = require("@expo/config-plugins");
const { writeXMLAsync } = require("@expo/config-plugins/build/utils/XML");
const path = require("path");

const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;
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
  borderRadius: { attrName: "android:dialogCornerRadius", literal: true, numericDp: true },
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

const getBorderRadiusDp = (theme) => {
  if (theme.borderRadius != null) {
    return `${theme.borderRadius}dp`;
  }
  if (theme.dialogCornerRadius != null) {
    return theme.dialogCornerRadius;
  }
  return null;
};

const needsRoundedDrawable = (theme) => {
  return theme && theme.windowBackground && getBorderRadiusDp(theme) !== null;
};

const buildRoundedDrawableXml = (colorValue, radiusDp) => ({
  shape: {
    $: {
      "xmlns:android": "http://schemas.android.com/apk/res/android",
      "android:shape": "rectangle",
    },
    solid: [{ $: { "android:color": colorValue } }],
    corners: [{ $: { "android:radius": radiusDp } }],
  },
});

const writeRoundedDrawables = async (projectRoot, android) => {
  const resourceFolder = path.join(projectRoot, "android", "app", "src", "main", "res");

  for (const pickerConfig of PICKER_CONFIGS) {
    const theme = android[pickerConfig.optionKey];
    if (!needsRoundedDrawable(theme)) {
      continue;
    }
    const radiusDp = getBorderRadiusDp(theme);
    const drawableName = `${pickerConfig.attrPrefix.toLowerCase()}_rounded_bg`;
    const bgColor = theme.windowBackground;

    if (bgColor.light) {
      await writeXMLAsync({
        path: path.join(resourceFolder, "drawable", `${drawableName}.xml`),
        xml: buildRoundedDrawableXml(bgColor.light, radiusDp),
      });
    }

    if (bgColor.dark) {
      await writeXMLAsync({
        path: path.join(resourceFolder, "drawable-night", `${drawableName}.xml`),
        xml: buildRoundedDrawableXml(bgColor.dark, radiusDp),
      });
    }
  }
};

const setAndroidPickerStyles = (styles, theme, pickerConfig) => {
  if (!theme) {
    return styles;
  }

  const { styleName, themeAttribute, defaultParentTheme, attrPrefix, allowedAttributes } = pickerConfig;
  const parentTheme = theme.parentTheme || defaultParentTheme;
  const useRoundedDrawable = needsRoundedDrawable(theme);

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
    const { attrName, literal, numericDp } = entry;
    const rawValue = theme[userFacingAttrName];

    // When borderRadius + windowBackground are both set, point windowBackground
    // to the generated rounded drawable instead of the flat color resource.
    if (useRoundedDrawable && userFacingAttrName === "windowBackground") {
      return assignStylesValue(acc, {
        add: true,
        parent: { name: styleName, parent: parentTheme },
        name: attrName,
        value: `@drawable/${attrPrefix.toLowerCase()}_rounded_bg`,
      });
    }

    const value = literal
      ? (numericDp ? `${rawValue}dp` : rawValue)
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
    parent: getAppThemeGroup(),
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

  // Generate rounded background drawables when borderRadius + windowBackground are both set.
  newConfig = withDangerousMod(newConfig, [
    "android",
    async (config) => {
      await writeRoundedDrawables(config.modRequest.projectRoot, android);
      return config;
    },
  ]);

  return newConfig;
};

module.exports = withTimePickerDialogTheme;
