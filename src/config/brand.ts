// Central branding config. Fill these in when the real token launches.
// Empty strings hide the related UI (no fake buy buttons).
export const brand = {
  gameName: "MemeCap",
  tagline: "Which memecoin reached the higher peak market cap?",
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
