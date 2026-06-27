# 🔥 HP Gas Delivery & Pending Vendor Cashmemo Tool

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Live App](https://img.shields.io/badge/🚀_Live_Demo-Open_Application-success?style=for-the-badge&logo=render)](https://hp-gas-cashmemo-tool.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

🌐 **Live Web Application**: [https://hp-gas-cashmemo-tool.onrender.com/](https://hp-gas-cashmemo-tool.onrender.com/)

A powerful, high-efficiency desktop and web application specifically crafted for **HP Gas Distributorships & Agencies**. This tool automates the management of pending vendor cashmemos, delivery boy tracking, eKYC status monitoring, rate calculation, dynamic print page generation, and Excel exports.


---

## ✨ Key Features

- 📑 **Automated CSV Parsing & Normalization**: Automatically scans local folder for HP Gas CSV reports and intelligently normalizes varied column names into a unified standard schema.
- 🚚 **Delivery Boy & Vendor Management**: Filter and group pending cashmemos by area name or specific delivery boys/vendors.
- 💰 **Dynamic Rate & Package Calculation**: Automatically calculates cylinder rates and total billings based on cylinder package types (e.g., 14.2 KG Non-Subsidized, Ujjwala, 19 KG Commercial, 5 KG).
- 🖨️ **Customizable Print Sheets**: Generate print-ready delivery lists customized by font size, visible columns, and exact rows per page to match physical distribution sheets.
- 📱 **WhatsApp Integration**: Fast, direct messaging access to delivery vendors via WhatsApp Web or App.
- 📊 **Excel & Data Export**: Export filtered reports into cleanly styled Excel sheets utilizing `exceljs`.
- 📦 **Offline Package Deployment**: Bundled with PowerShell scripts (`Create_Offline_Package.ps1`) for seamless standalone offline deployment without technical overhead.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide React Icons, Vanilla CSS Design System
- **Backend / API**: Node.js, Express.js
- **Data Processing**: PapaParse (CSV Parsing), ExcelJS (Excel Generation)
- **Tooling & Bundling**: Concurrently, PowerShell Packaging Scripts

---

## 📁 Project Structure

```text
├── src/                      # React Frontend Source Files
│   ├── App.jsx               # Main UI Application Component
│   ├── main.jsx              # Application Entry Point
│   └── index.css             # Design System & Styling
├── server.js                 # Express Backend API Server & CSV Processor
├── package.json              # Project Dependencies & NPM Scripts
├── settings.json             # App Configuration (Rates, Fonts, Vendors)
├── Launch_Tool.bat           # One-click Launcher Batch Script
└── Create_Offline_Package.ps1 # Standalone Offline Deployment Builder
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your system.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rahulmaithili/Hp-Gas-Cashmemo-Tool.git
   cd Hp-Gas-Cashmemo-Tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 💻 Running the Application

### Development / Full Mode
To run both the backend API server and the Vite frontend simultaneously:

```bash
npm run dev
```

The application will start and open locally (typically at `http://localhost:5173`).

### Launch via One-Click Script (Windows)
Double-click on `Launch_Tool.bat` to launch the server and frontend automatically.

---

## ⚙️ Configuration (`settings.json`)

You can customize rates, agency names, and column display settings directly from the application UI or by modifying `settings.json`:

```json
{
  "agencyName": "M/S RAHUL HP GAS SERVICE",
  "rates": {
    "14.2 KG NON-SUBSIDIZED CYLINDER-LD(DBTL CTC)": 950,
    "16-Scheme Ujjwala": 650,
    "19.0 KG NON-SUBSIDIZED CYLINDER": 1850,
    "5.0 KG NON-SUBSIDIZED CYLINDER": 380
  },
  "defaultRate": 950,
  "rowsPerPrintPage": 15
}
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [Issues](https://github.com/rahulmaithili/Hp-Gas-Cashmemo-Tool/issues) page.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
