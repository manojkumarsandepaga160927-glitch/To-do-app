/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#20372C',
    tint: '#2D674A',
    background: '#F7F6F0',
    foreground: '#20372C',
    card: '#FFFEFA',
    cardForeground: '#20372C',
    primary: '#2D674A',
    primaryForeground: '#ffffff',
    secondary: '#E9EEE6',
    secondaryForeground: '#385744',
    muted: '#E9EEE6',
    mutedForeground: '#7B887D',
    accent: '#F3C84B',
    accentForeground: '#263A2D',
    destructive: '#BD594A',
    destructiveForeground: '#ffffff',
    border: '#E5E8DE',
    input: '#E5E8DE',
  },
  dark: {
    text: '#F1F2E9',
    tint: '#9AC6A5',
    background: '#17231B',
    foreground: '#F1F2E9',
    card: '#202E24',
    cardForeground: '#F1F2E9',
    primary: '#9AC6A5',
    primaryForeground: '#17231B',
    secondary: '#2B3B30',
    secondaryForeground: '#D9E6D8',
    muted: '#2B3B30',
    mutedForeground: '#A2B1A4',
    accent: '#E9BE4D',
    accentForeground: '#263A2D',
    destructive: '#E17D6A',
    destructiveForeground: '#17231B',
    border: '#34463A',
    input: '#34463A',
  },
  radius: 18,
};

export default colors;
