// Central branding config. Fill these in when the real token launches.
// Empty strings hide the related UI (no fake buy buttons).
export const brand = {
  gameName: "PEAK OR JEET?",
  subtitle: "How well do you know the trenches?",
  tagline: "Guess the peak market cap. Don't get rekt.",
  token: {
    name: "",
    ticker: "",
    contractAddress: "",
  },
  links: {
    xCommunity: "",
    tokenInfo: "",
  },
  logoUrl: "", // optional image logo; text logo used when empty
  siteUrl: typeof window !== "undefined" ? window.location.origin : "",
};
