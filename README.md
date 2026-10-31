# HP Gas Delivery Memo Pro

> Pending vendor cashmemo management for HP Gas distributorships —
> process cashmemos, build delivery run-sheets, print, and export,
> all behind a LicenseWala license.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Express-green)
![License](https://img.shields.io/badge/license-LicenseWala%20Subscription-purple)

🌐 **Live application**: [https://hp-gas-cashmemo-tool.vercel.app/](https://hp-gas-cashmemo-tool.vercel.app/)

---

## What it does

Every day, an HP Gas agency handles piles of pending vendor cashmemos:
which delivery boy took which cylinders, to which areas, at what rate.
**HP Gas Delivery Memo Pro** turns that pile into clean, printable
delivery sheets:

- **CSV processing** — reads HP Gas CSV reports and normalizes varied
  column names into one standard schema automatically.
- **Area & delivery-boy grouping** — filter and group pending cashmemos
  by area name or by specific delivery boys/vendors.
- **Rates & packages** — calculates cylinder rates and totals by
  package type (14.2 KG Non-Subsidized, Ujjwala, 19 KG Commercial,
  5 KG, and more), configurable from the UI.
- **Print-ready run-sheets** — generate delivery lists customized by
  font size, visible columns, and rows per page. Continuous page flow
  means no blank half-pages wasted across areas.
- **1-click translation** — translate Consumer Address and Name +
  Address fields in one click.
- **Excel export** — export filtered reports into cleanly styled Excel
  sheets.
- **WhatsApp access** — reach delivery vendors fast via WhatsApp Web
  or the app.
- **License protected** — print, export, and cashmemo processing stay
  locked until a valid LicenseWala license key is activated.

## License activation

A valid **LicenseWala subscription license** is required. Keys are
issued from the LicenseWala portal
([licensescript.netlify.app](https://licensescript.netlify.app/)).

- Open the app — if no active license is found, an activation screen
  appears. Enter your LicenseWala key and activate.
- The key is verified online against the LicenseWala server, together
  with a per-browser device identifier (one device per license).
- The license is re-verified silently every 30 minutes while the app
  is open. If the license expires, is revoked, or is blocked by the
  administrator, the app locks immediately and shows a renewal prompt.
- Network problems do not lock you out instantly: a short grace period
  (max 24 hours from the last successful verification) covers temporary
  outages.

## Incognito mode

The web app works in an Incognito window too, with one difference:
Incognito forgets stored data when the window closes, so each fresh
Incognito session shows the activation screen once. Enter your
LicenseWala key and everything works for that session.

## Tech stack

- **Frontend**: React 18, Vite, Lucide React Icons, Vanilla CSS design
  system
- **Backend / API**: Node.js, Express.js
- **Data processing**: PapaParse (CSV parsing), ExcelJS (Excel export)
- **Tooling**: Concurrently, PowerShell packaging scripts

## Project structure

```text
├── src/                      # React frontend
│   ├── App.jsx               # Main application (cashmemo processing, print, license gate)
│   ├── main.jsx              # Application entry point
│   └── index.css             # Design system & styling
├── api/                      # Serverless API routes
├── server.js                 # Express backend API server & CSV processor
├── package.json              # Dependencies & NPM scripts
├── Launch_Tool.bat           # One-click launcher (Windows)
└── Create_Offline_Package.ps1 # Standalone offline deployment builder
```

## Getting started

### Prerequisites

[Node.js](https://nodejs.org/) (v16 or higher).

### Installation

```bash
git clone https://github.com/rahulmaithili/Hp-Gas-Cashmemo-Tool.git
cd Hp-Gas-Cashmemo-Tool
npm install
```

### Run

```bash
npm run dev
```

This runs the backend API server and the Vite frontend together; the
app typically opens at `http://localhost:5173`.

### One-click launch (Windows)

Double-click `Launch_Tool.bat` to start the server and frontend
automatically.

## Configuration

Rates, agency details, and display settings (columns, fonts, rows per
print page) are configurable directly from the application UI.

## Privacy

- Your cashmemo data is processed in your browser / your own deployment.
- No data is sold, no advertisers, no third-party tracking.
- Only the license key and an anonymous device identifier are sent to
  the LicenseWala server, solely for license verification.

## Recent updates

- License hardening: offline fallback bounded to 24 hours from the last
  successful verification, with silent re-verification every 30 minutes
  while the app is open.
- Continuous page flow printing, eliminating blank half-page waste
  across areas.
- 1-click translation for Consumer Address and Name + Address.
- Filter panel redesign with a clean modern pattern.

## Support

- License keys and subscriptions: [LicenseWala portal](https://licensescript.netlify.app/)
- WhatsApp: [+91 75649 48617](https://wa.me/917564948617)
- Email: [life.rahulg@gmail.com](mailto:life.rahulg@gmail.com)
- Issues: [GitHub Issues](https://github.com/rahulmaithili/Hp-Gas-Cashmemo-Tool/issues)

---

Built for LPG distributors running HP Gas agencies.
