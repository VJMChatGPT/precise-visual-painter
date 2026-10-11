// Configure these at build time. An explicit empty buy URL disables the button.
export function pumpFunUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "pump.fun" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (/^\/$/.test(url.pathname) ||
        /^\/(?:coin\/)?[1-9A-HJ-NP-Za-km-z]{32,44}\/?$/.test(url.pathname))
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function siteUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}

export const brand = {
  gameName: "PEAK OR JEET",
  subtitle: "How well do you know the trenches?",
  tagline: "Guess the peak market cap. Don't get rekt.",
  token: {
    name: "PEAK",
    ticker: "$PEAK",
    contractAddress: "",
  },
  links: {
    xCommunity: "",
    // Temporary Pump.fun homepage requested for prelaunch. Replace with the exact token URL.
    buy: pumpFunUrl(import.meta.env["VITE_PUMP_FUN_URL"] ?? "https://pump.fun"),
  },
  logoUrl: "", // optional image logo; text logo used when empty
  siteUrl: siteUrl(
    import.meta.env["VITE_SITE_URL"] || "https://precise-visual-painter.lovable.app",
  ),
  description:
    "Guess the peak market cap. Don't get rekt. How well do you know the trenches? Play PEAK OR JEET, home of $PEAK.",
  shareImage: "/social-preview.png",
};
