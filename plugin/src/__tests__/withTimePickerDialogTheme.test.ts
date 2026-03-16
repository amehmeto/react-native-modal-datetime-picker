import {
  getBorderRadiusDp,
  needsRoundedDrawable,
  buildRoundedDrawableXml,
  setAndroidPickerStyles,
  PICKER_CONFIGS,
} from "../withTimePickerDialogTheme";
import type { ThemeConfig, PickerConfig } from "../withTimePickerDialogTheme";

// Minimal styles stub matching Expo's XML resource format
const emptyStyles = () => ({
  resources: {
    style: [] as unknown[],
  },
});

const DIALOG_PICKER_CONFIG: PickerConfig = PICKER_CONFIGS[0]; // timePickerDialog

describe("getBorderRadiusDp", () => {
  it("returns dp string for a valid numeric borderRadius", () => {
    expect(getBorderRadiusDp({ borderRadius: 12 })).toBe("12dp");
  });

  it("returns '0dp' for borderRadius of 0", () => {
    expect(getBorderRadiusDp({ borderRadius: 0 })).toBe("0dp");
  });

  it("throws for negative borderRadius", () => {
    expect(() => getBorderRadiusDp({ borderRadius: -1 })).toThrow(
      "non-negative number",
    );
  });

  it("throws for non-number borderRadius", () => {
    expect(() =>
      getBorderRadiusDp({ borderRadius: "8dp" } as unknown as ThemeConfig),
    ).toThrow("non-negative number");
  });

  it("returns null when borderRadius is not set", () => {
    expect(getBorderRadiusDp({})).toBeNull();
  });
});

describe("needsRoundedDrawable", () => {
  it("returns true when windowBackground and borderRadius > 0 are set", () => {
    expect(
      needsRoundedDrawable({
        windowBackground: { light: "#FFF" },
        borderRadius: 12,
      }),
    ).toBe(true);
  });

  it("returns false when borderRadius is 0", () => {
    expect(
      needsRoundedDrawable({
        windowBackground: { light: "#FFF" },
        borderRadius: 0,
      }),
    ).toBe(false);
  });

  it("returns false when windowBackground is absent", () => {
    expect(needsRoundedDrawable({ borderRadius: 12 })).toBe(false);
  });

  it("returns false when theme is null/undefined", () => {
    expect(needsRoundedDrawable(null)).toBe(false);
    expect(needsRoundedDrawable(undefined)).toBe(false);
  });

  it("returns false when borderRadius is not set", () => {
    expect(needsRoundedDrawable({ windowBackground: { light: "#FFF" } })).toBe(
      false,
    );
  });
});

describe("buildRoundedDrawableXml", () => {
  it("builds correct XML structure", () => {
    const result = buildRoundedDrawableXml("#1E293B", "12dp");
    expect(result).toEqual({
      shape: {
        $: {
          "xmlns:android": "http://schemas.android.com/apk/res/android",
          "android:shape": "rectangle",
        },
        solid: [{ $: { "android:color": "#1E293B" } }],
        corners: [{ $: { "android:radius": "12dp" } }],
      },
    });
  });
});

interface StyleItem {
  $: { name: string };
  _: string;
}

interface StyleEntry {
  $: { name: string; parent?: string };
  item: StyleItem[];
}

interface StylesResult {
  resources: {
    style: StyleEntry[];
  };
}

describe("setAndroidPickerStyles", () => {
  it("returns styles unchanged when theme is null", () => {
    const styles = emptyStyles();
    const result = setAndroidPickerStyles(styles, null, DIALOG_PICKER_CONFIG);
    expect(result).toBe(styles);
  });

  it("throws for an invalid attribute name", () => {
    expect(() =>
      setAndroidPickerStyles(
        emptyStyles(),
        { invalidAttr: { light: "#FFF" } },
        DIALOG_PICKER_CONFIG,
      ),
    ).toThrow("Invalid attribute name: invalidAttr");
  });

  it("sets borderRadius as dp literal in styles", () => {
    const styles = setAndroidPickerStyles(
      emptyStyles(),
      { borderRadius: 16 },
      DIALOG_PICKER_CONFIG,
    ) as StylesResult;
    const dialogStyle = styles.resources.style.find(
      (s) => s.$.name === "TimePickerDialogTheme",
    );
    expect(dialogStyle).toBeDefined();
    const cornerItem = dialogStyle!.item.find(
      (i) => i.$.name === "android:dialogCornerRadius",
    );
    expect(cornerItem!._).toBe("16dp");
  });

  it("redirects windowBackground to drawable when rounded drawable is needed", () => {
    const styles = setAndroidPickerStyles(
      emptyStyles(),
      {
        windowBackground: { light: "#1E293B" },
        borderRadius: 12,
      },
      DIALOG_PICKER_CONFIG,
    ) as StylesResult;
    const dialogStyle = styles.resources.style.find(
      (s) => s.$.name === "TimePickerDialogTheme",
    );
    const bgItem = dialogStyle!.item.find(
      (i) => i.$.name === "android:windowBackground",
    );
    expect(bgItem!._).toBe("@drawable/timepickerdialog_rounded_bg");
  });

  it("uses color resource for windowBackground when no borderRadius", () => {
    const styles = setAndroidPickerStyles(
      emptyStyles(),
      {
        windowBackground: { light: "#1E293B" },
      },
      DIALOG_PICKER_CONFIG,
    ) as StylesResult;
    const dialogStyle = styles.resources.style.find(
      (s) => s.$.name === "TimePickerDialogTheme",
    );
    const bgItem = dialogStyle!.item.find(
      (i) => i.$.name === "android:windowBackground",
    );
    expect(bgItem!._).toBe("@color/timePickerDialog_windowBackground");
  });
});
