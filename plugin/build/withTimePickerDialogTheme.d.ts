import { ConfigPlugin } from "@expo/config-plugins";
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
declare const PICKER_CONFIGS: PickerConfig[];
export declare const getBorderRadiusDp: (theme: ThemeConfig) => string | null;
export declare const needsRoundedDrawable: (theme: ThemeConfig | null | undefined) => boolean;
export declare const buildRoundedDrawableXml: (colorValue: string, radiusDp: string) => {
    shape: {
        $: {
            "xmlns:android": string;
            "android:shape": string;
        };
        solid: {
            $: {
                "android:color": string;
            };
        }[];
        corners: {
            $: {
                "android:radius": string;
            };
        }[];
    };
};
export declare const setAndroidPickerStyles: (styles: unknown, theme: ThemeConfig | null, pickerConfig: PickerConfig) => unknown;
declare const withTimePickerDialogTheme: ConfigPlugin<PluginOptions>;
export default withTimePickerDialogTheme;
export { PICKER_CONFIGS };
export type { ThemeConfig, PickerConfig };
