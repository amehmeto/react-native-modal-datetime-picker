import {
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
  withDangerousMod,
  AndroidConfig,
  ConfigPlugin,
} from "@expo/config-plugins";
import { writeXMLAsync } from "@expo/config-plugins/build/utils/XML";
import fs from "fs";
import path from "path";

const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;
const { assignColorValue } = AndroidConfig.Colors;

const moduleName = "ModalDateTimePicker: ";

interface ThemedColor {
  light?: string;
  dark?: string;
}

interface AttributeEntry {
  attrName: string;
  literal?: boolean;
  numericDp?: boolean;
}

type AllowedAttributes = Record<string, AttributeEntry>;

interface ThemeConfig {
  parentTheme?: string;
  borderRadius?: number;
  windowBackground?: ThemedColor;
  [key: string]: unknown;
}

interface PickerConfig {
  optionKey: string;
  styleName: string;
  themeAttribute: string;
  defaultParentTheme: string;
  attrPrefix: string;
  allowedAttributes: AllowedAttributes;
}

interface AndroidOptions {
  [key: string]: ThemeConfig | undefined;
}

interface PluginOptions {
  android?: AndroidOptions;
}

const DIALOG_ALLOWED_ATTRIBUTES: AllowedAttributes = {
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
  borderRadius: {
    attrName: "android:dialogCornerRadius",
    literal: true,
    numericDp: true,
  },
  buttonBarPositiveButtonStyle: {
    attrName: "buttonBarPositiveButtonStyle",
    literal: true,
  },
  buttonBarNegativeButtonStyle: {
    attrName: "buttonBarNegativeButtonStyle",
    literal: true,
  },
};

const TIME_PICKER_WIDGET_ALLOWED_ATTRIBUTES: AllowedAttributes = {
  background: { attrName: "android:background" },
  headerBackground: { attrName: "android:headerBackground" },
  headerSelectedTextColor: { attrName: "android:headerSelectedTextColor" },
  numbersTextColor: { attrName: "android:numbersTextColor" },
  numbersInnerTextColor: { attrName: "android:numbersInnerTextColor" },
  numbersBackgroundColor: { attrName: "android:numbersBackgroundColor" },
  numbersSelectorColor: { attrName: "android:numbersSelectorColor" },
  amPmTextColor: { attrName: "android:amPmTextColor" },
  amPmBackgroundColor: { attrName: "android:amPmBackgroundColor" },
  amPmSelectedBackgroundColor: {
    attrName: "android:amPmSelectedBackgroundColor",
  },
};

const DATE_PICKER_WIDGET_ALLOWED_ATTRIBUTES: AllowedAttributes = {
  headerBackground: { attrName: "android:headerBackground" },
  headerSelectedTextColor: { attrName: "android:headerSelectedTextColor" },
  calendarTextColor: { attrName: "android:calendarTextColor" },
  calendarSelectedTextColor: {
    attrName: "android:calendarSelectedTextColor",
  },
  yearListSelectorColor: { attrName: "android:yearListSelectorColor" },
  dayOfWeekBackground: { attrName: "android:dayOfWeekBackground" },
};

const PICKER_CONFIGS: PickerConfig[] = [
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

type ThemedColorExtractor = (
  color: ThemedColor,
  attrName: string,
) => string | null;

const insertColorEntries = (
  android: AndroidOptions,
  config: { modResults: unknown },
  themedColorExtractor: ThemedColorExtractor,
): void => {
  for (const pickerConfig of PICKER_CONFIGS) {
    const theme = android[pickerConfig.optionKey];
    if (theme) {
      config.modResults = setAndroidColors(
        config.modResults,
        themedColorExtractor,
        theme,
        pickerConfig.attrPrefix,
        pickerConfig.allowedAttributes,
      );
    }
  }
};

const setAndroidColors = (
  colors: unknown,
  themedColorExtractor: ThemedColorExtractor,
  theme: ThemeConfig,
  attrPrefix: string,
  allowedAttributes: AllowedAttributes,
): unknown => {
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
      value: themedColorExtractor(colorValues as ThemedColor, attrName) ?? null,
    };
    return assignColorValue(
      acc as Parameters<typeof assignColorValue>[0],
      color,
    );
  }, colors);
};

export const getBorderRadiusDp = (theme: ThemeConfig): string | null => {
  if (theme.borderRadius == null) {
    return null;
  }
  if (typeof theme.borderRadius !== "number" || theme.borderRadius < 0) {
    throw new Error(
      `${moduleName}borderRadius must be a non-negative number, got: ${theme.borderRadius}`,
    );
  }
  return `${theme.borderRadius}dp`;
};

export const needsRoundedDrawable = (
  theme: ThemeConfig | null | undefined,
): boolean => {
  if (!theme || !theme.windowBackground) return false;
  const radiusDp = getBorderRadiusDp(theme);
  if (radiusDp === null || radiusDp === "0dp") return false;
  return true;
};

export const buildRoundedDrawableXml = (
  colorValue: string,
  radiusDp: string,
) => ({
  shape: {
    $: {
      "xmlns:android": "http://schemas.android.com/apk/res/android",
      "android:shape": "rectangle",
    },
    solid: [{ $: { "android:color": colorValue } }],
    corners: [{ $: { "android:radius": radiusDp } }],
  },
});

const writeRoundedDrawables = async (
  projectRoot: string,
  android: AndroidOptions,
): Promise<void> => {
  const resourceFolder = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "res",
  );

  for (const pickerConfig of PICKER_CONFIGS) {
    const theme = android[pickerConfig.optionKey];
    if (!needsRoundedDrawable(theme)) {
      continue;
    }
    const radiusDp = getBorderRadiusDp(theme!)!;
    const drawableName = `${pickerConfig.attrPrefix.toLowerCase()}_rounded_bg`;
    const bgColor = theme!.windowBackground!;

    if (bgColor.light) {
      const drawableDir = path.join(resourceFolder, "drawable");
      fs.mkdirSync(drawableDir, { recursive: true });
      await writeXMLAsync({
        path: path.join(drawableDir, `${drawableName}.xml`),
        xml: buildRoundedDrawableXml(bgColor.light, radiusDp),
      });
    }

    if (bgColor.dark) {
      const drawableNightDir = path.join(resourceFolder, "drawable-night");
      fs.mkdirSync(drawableNightDir, { recursive: true });
      await writeXMLAsync({
        path: path.join(drawableNightDir, `${drawableName}.xml`),
        xml: buildRoundedDrawableXml(bgColor.dark, radiusDp),
      });
    }
  }
};

export const setAndroidPickerStyles = (
  styles: unknown,
  theme: ThemeConfig | null,
  pickerConfig: PickerConfig,
): unknown => {
  if (!theme) {
    return styles;
  }

  const {
    styleName,
    themeAttribute,
    defaultParentTheme,
    attrPrefix,
    allowedAttributes,
  } = pickerConfig;
  const parentTheme = theme.parentTheme || defaultParentTheme;
  const useRoundedDrawable = needsRoundedDrawable(theme);

  let result = Object.keys(theme).reduce((acc, userFacingAttrName) => {
    if (userFacingAttrName === "parentTheme") {
      return acc;
    }
    const entry = allowedAttributes[userFacingAttrName];
    if (!entry) {
      throw new Error(
        `${moduleName}Invalid attribute name: ${userFacingAttrName}. Supported for ${pickerConfig.optionKey} are ${Object.keys(allowedAttributes).join(", ")}`,
      );
    }
    const { attrName, literal, numericDp } = entry;
    const rawValue = theme[userFacingAttrName];

    // When borderRadius + windowBackground are both set, point windowBackground
    // to the generated rounded drawable instead of the flat color resource.
    if (useRoundedDrawable && userFacingAttrName === "windowBackground") {
      return assignStylesValue(acc as Parameters<typeof assignStylesValue>[0], {
        add: true,
        parent: { name: styleName, parent: parentTheme },
        name: attrName,
        value: `@drawable/${attrPrefix.toLowerCase()}_rounded_bg`,
      });
    }

    const value = literal
      ? numericDp
        ? `${rawValue}dp`
        : (rawValue as string)
      : `@color/${attrPrefix}_${userFacingAttrName}`;
    return assignStylesValue(acc as Parameters<typeof assignStylesValue>[0], {
      add: true,
      parent: {
        name: styleName,
        parent: parentTheme,
      },
      name: attrName,
      value,
    });
  }, styles);

  result = assignStylesValue(
    result as Parameters<typeof assignStylesValue>[0],
    {
      add: true,
      parent: getAppThemeGroup(),
      name: themeAttribute,
      value: `@style/${styleName}`,
    },
  );

  return result;
};

const withTimePickerDialogTheme: ConfigPlugin<PluginOptions> = (
  baseConfig,
  options = {},
) => {
  const { android = {} } = options;

  let newConfig = withAndroidColors(baseConfig, (config) => {
    insertColorEntries(android, config, (color, attrName) => {
      const value = color.light;
      if (!value) {
        throw new Error(
          `${moduleName}A light color value was not provided for "${attrName}". Providing at least a light color is required.`,
        );
      }
      return value;
    });
    return config;
  });

  newConfig = withAndroidColorsNight(newConfig, (config) => {
    insertColorEntries(android, config, (color) => color.dark ?? null);
    return config;
  });

  newConfig = withAndroidStyles(newConfig, (config) => {
    for (const pickerConfig of PICKER_CONFIGS) {
      config.modResults = setAndroidPickerStyles(
        config.modResults,
        android[pickerConfig.optionKey] ?? null,
        pickerConfig,
      ) as typeof config.modResults;
    }
    return config;
  });

  // Generate rounded background drawables when borderRadius + windowBackground are both set.
  const anyNeedsDrawable = PICKER_CONFIGS.some((c) =>
    needsRoundedDrawable(android[c.optionKey]),
  );
  if (anyNeedsDrawable) {
    newConfig = withDangerousMod(newConfig, [
      "android",
      async (config) => {
        await writeRoundedDrawables(config.modRequest.projectRoot, android);
        return config;
      },
    ]);
  }

  return newConfig;
};

export default withTimePickerDialogTheme;
export { PICKER_CONFIGS };
export type { ThemeConfig, PickerConfig };
