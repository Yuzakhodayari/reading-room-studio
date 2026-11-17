import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

// 1. Inter - Primary Editorial & Modern UI Sans
export const interFont = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// 2. IBM Plex Mono - Primary Technical & Ledger Data Readouts
export const ibmPlexMonoFont = loadIBMPlexMono("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// 3. Newsreader - Journalistic Headings & Document Titles
export const newsreaderFont = loadNewsreader("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// 4. Space Grotesk - Futuristic / Cyber / Modern Display
export const spaceGroteskFont = loadSpaceGrotesk("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// 5. Oswald - Bold Condensed Editorial & Cold Open Impact
export const oswaldFont = loadOswald("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const FONTS = {
  sans: `${interFont.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  mono: `${ibmPlexMonoFont.fontFamily}, 'SF Mono', 'Cascadia Code', Consolas, monospace`,
  serif: `${newsreaderFont.fontFamily}, 'Newsreader', 'Times New Roman', Georgia, serif`,
  display: `${spaceGroteskFont.fontFamily}, -apple-system, sans-serif`,
  condensed: `${oswaldFont.fontFamily}, 'Impact', 'Arial Black', sans-serif`,
};
