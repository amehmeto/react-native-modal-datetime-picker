"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PICKER_CONFIGS = exports.setAndroidPickerStyles = exports.buildRoundedDrawableXml = exports.needsRoundedDrawable = exports.getBorderRadiusDp = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const XML_1 = require("@expo/config-plugins/build/utils/XML");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const { assignStylesValue, getAppThemeGroup } = config_plugins_1.AndroidConfig.Styles;
const { assignColorValue } = config_plugins_1.AndroidConfig.Colors;
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
    amPmSelectedBackgroundColor: {
        attrName: "android:amPmSelectedBackgroundColor",
    },
};
const DATE_PICKER_WIDGET_ALLOWED_ATTRIBUTES = {
    headerBackground: { attrName: "android:headerBackground" },
    headerSelectedTextColor: { attrName: "android:headerSelectedTextColor" },
    calendarTextColor: { attrName: "android:calendarTextColor" },
    calendarSelectedTextColor: {
        attrName: "android:calendarSelectedTextColor",
    },
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
exports.PICKER_CONFIGS = PICKER_CONFIGS;
const insertColorEntries = (android, config, themedColorExtractor) => {
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
    if (theme.borderRadius == null) {
        return null;
    }
    if (typeof theme.borderRadius !== "number" || theme.borderRadius < 0) {
        throw new Error(`${moduleName}borderRadius must be a non-negative number, got: ${theme.borderRadius}`);
    }
    return `${theme.borderRadius}dp`;
};
exports.getBorderRadiusDp = getBorderRadiusDp;
const needsRoundedDrawable = (theme) => {
    if (!theme || !theme.windowBackground)
        return false;
    const radiusDp = (0, exports.getBorderRadiusDp)(theme);
    if (radiusDp === null || radiusDp === "0dp")
        return false;
    return true;
};
exports.needsRoundedDrawable = needsRoundedDrawable;
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
exports.buildRoundedDrawableXml = buildRoundedDrawableXml;
const writeRoundedDrawables = async (projectRoot, android) => {
    const resourceFolder = path_1.default.join(projectRoot, "android", "app", "src", "main", "res");
    for (const pickerConfig of PICKER_CONFIGS) {
        const theme = android[pickerConfig.optionKey];
        if (!(0, exports.needsRoundedDrawable)(theme)) {
            continue;
        }
        // needsRoundedDrawable guarantees theme, windowBackground, and radiusDp are defined
        const validTheme = theme;
        const radiusDp = (0, exports.getBorderRadiusDp)(validTheme);
        const drawableName = `${pickerConfig.attrPrefix.toLowerCase()}_rounded_bg`;
        const bgColor = validTheme.windowBackground;
        if (bgColor.light) {
            const drawableDir = path_1.default.join(resourceFolder, "drawable");
            fs_1.default.mkdirSync(drawableDir, { recursive: true });
            await (0, XML_1.writeXMLAsync)({
                path: path_1.default.join(drawableDir, `${drawableName}.xml`),
                xml: (0, exports.buildRoundedDrawableXml)(bgColor.light, radiusDp),
            });
        }
        if (bgColor.dark) {
            const drawableNightDir = path_1.default.join(resourceFolder, "drawable-night");
            fs_1.default.mkdirSync(drawableNightDir, { recursive: true });
            await (0, XML_1.writeXMLAsync)({
                path: path_1.default.join(drawableNightDir, `${drawableName}.xml`),
                xml: (0, exports.buildRoundedDrawableXml)(bgColor.dark, radiusDp),
            });
        }
    }
};
const setAndroidPickerStyles = (styles, theme, pickerConfig) => {
    if (!theme) {
        return styles;
    }
    const { styleName, themeAttribute, defaultParentTheme, attrPrefix, allowedAttributes, } = pickerConfig;
    const parentTheme = theme.parentTheme || defaultParentTheme;
    const useRoundedDrawable = (0, exports.needsRoundedDrawable)(theme);
    let result = Object.keys(theme).reduce((acc, userFacingAttrName) => {
        if (userFacingAttrName === "parentTheme") {
            return acc;
        }
        const entry = allowedAttributes[userFacingAttrName];
        if (!entry) {
            throw new Error(`${moduleName}Invalid attribute name: ${userFacingAttrName}. Supported for ${pickerConfig.optionKey} are ${Object.keys(allowedAttributes).join(", ")}`);
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
            ? numericDp
                ? `${rawValue}dp`
                : rawValue
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
    result = assignStylesValue(result, {
        add: true,
        parent: getAppThemeGroup(),
        name: themeAttribute,
        value: `@style/${styleName}`,
    });
    return result;
};
exports.setAndroidPickerStyles = setAndroidPickerStyles;
const withTimePickerDialogTheme = (baseConfig, options = {}) => {
    const { android = {} } = options;
    let newConfig = (0, config_plugins_1.withAndroidColors)(baseConfig, (config) => {
        insertColorEntries(android, config, (color, attrName) => {
            const value = color.light;
            if (!value) {
                throw new Error(`${moduleName}A light color value was not provided for "${attrName}". Providing at least a light color is required.`);
            }
            return value;
        });
        return config;
    });
    newConfig = (0, config_plugins_1.withAndroidColorsNight)(newConfig, (config) => {
        insertColorEntries(android, config, (color) => color.dark ?? null);
        return config;
    });
    newConfig = (0, config_plugins_1.withAndroidStyles)(newConfig, (config) => {
        for (const pickerConfig of PICKER_CONFIGS) {
            config.modResults = (0, exports.setAndroidPickerStyles)(config.modResults, android[pickerConfig.optionKey] ?? null, pickerConfig);
        }
        return config;
    });
    // Generate rounded background drawables when borderRadius + windowBackground are both set.
    const anyNeedsDrawable = PICKER_CONFIGS.some((c) => (0, exports.needsRoundedDrawable)(android[c.optionKey]));
    if (anyNeedsDrawable) {
        newConfig = (0, config_plugins_1.withDangerousMod)(newConfig, [
            "android",
            async (config) => {
                await writeRoundedDrawables(config.modRequest.projectRoot, android);
                return config;
            },
        ]);
    }
    return newConfig;
};
exports.default = withTimePickerDialogTheme;
