# UI/UX Technical Guideline: "Jellywatch" (Bioluminescent Ocean Monitoring)

You are an expert Frontend Developer and UI/UX Designer. Generate clean, accessible, and responsive code (React/Tailwind CSS/HTML) for a Marine Monitoring Application based on the "Bioluminescent Deep-Tech" aesthetic.

---

## 🎨 Color Tokens & Theme Specifications

Support both DARK MODE (Default/Primary) and LIGHT MODE via CSS variables or Tailwind classes.

### Dark Mode (Primary - "Abyssal Marine"):
- **Background Main:** `#0B132B` (Abyssal Navy)
- **Surface / Cards:** `#1C2541` with `backdrop-filter: blur(12px)` and `background: rgba(28, 37, 65, 0.65)`
- **Border:** `1px solid rgba(0, 245, 212, 0.15)`
- **Text Primary:** `#F8F9FA` (High contrast)
- **Text Secondary:** `#8D99AE`
- **Accent Safe/Normal (Cyan Glow):** `#00F5D4` (Glow effect: `box-shadow: 0 0 15px rgba(0, 245, 212, 0.4)`)
- **Accent Warning/Alert (Violet Glow):** `#9B5DE5` (Glow effect: `box-shadow: 0 0 15px rgba(155, 93, 229, 0.4)`)

### Light Mode ("Ocean Foam"):
- **Background Main:** `#F4F9FC`
- **Surface / Cards:** `#FFFFFF` with `backdrop-filter: blur(8px)` and `background: rgba(255, 255, 255, 0.85)`
- **Border:** `1px solid rgba(0, 180, 216, 0.15)`
- **Text Primary:** `#0D1B2A`
- **Text Secondary:** `#5C6B73`
- **Accent Safe/Normal:** `#00B4D8`
- **Accent Warning/Alert:** `#9D4EDD`

---

## 📐 Typography Rules

- **Primary Font Family:** `Inter` or `Plus Jakarta Sans` (sans-serif)
- **Headings & Title:** `font-bold` / `font-semibold` with subtle tracking/letter-spacing (`tracking-wide`).
- **Data Values (Suhu, Salinitas, Arus, etc.):** 
  - Use large, bold font sizes (`text-2xl` to `text-3xl`).
  - Unit values (°C, PSU, M/S, %) must be slightly smaller and muted (`text-sm font-medium opacity-75`).

---

## 💡 Component & Layout Guidelines

1. **Overall Layout:**
   - Clean, grid-based dashboard with rounded card corners (`border-radius: 16px` or `rounded-2xl`).
   - Use subtle glassmorphic styling (semi-transparent backgrounds + subtle border glow).

2. **Main Status Card (Jellyfish Bloom Risk):**
   - Must prominently feature the risk level (e.g., "RENDAH (NORMAL)" or "TINGGI (ALERT)").
   - Include a bioluminescent glow indicator (Cyan for Low Risk, Purple/Magenta for High Risk).
   - Space allocated for a subtle jellyfish visual asset/icon.
   - *Witty/Charming Detail:* Include a subtle, elegant Easter egg or playful micro-interaction (e.g., a stylish line-art jellyfish icon with a dapper hat, or a smiling wave icon) to keep the app friendly yet highly professional.

3. **Data Metric Widgets (Suhu, Salinitas, Arus, Kecerahan):**
   - Render in a clean 2x2 grid on mobile screens.
   - Combine clear labels, numeric readouts, and minimal vector icons/line graphs.

4. **Map Section:**
   - Dark/Light mode styled map container with an active glowing pulse highlight representing jellyfish population hotspots.