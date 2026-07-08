import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const DEFAULT_SETTINGS = {
  agencyName: process.env.AGENCY_NAME || 'M/S RAHUL HP GAS SERVICE',
  rates: {
    '14.2 KG NON-SUBSIDIZED CYLINDER-LD(DBTL CTC)': parseInt(process.env.RATE_14_2_LD) || 950,
    '14.2 KG NON-SUBSIDIZED CYLINDER': parseInt(process.env.RATE_14_2) || 950,
    '16-Scheme Ujjwala': parseInt(process.env.RATE_UJJWALA) || 650,
    '19.0 KG NON-SUBSIDIZED CYLINDER': parseInt(process.env.RATE_19) || 1850,
    '5.0 KG NON-SUBSIDIZED CYLINDER': parseInt(process.env.RATE_5) || 380
  },
  defaultRate: parseInt(process.env.DEFAULT_RATE) || 950,
  rowsPerPrintPage: 15,
  whatsAppMethod: 'web',
  columnFonts: {
    sn: 8,
    consumer_no: 8,
    name: 8.5,
    order_date: 8,
    area_name: 8,
    online: 8,
    ivrs_no: 8,
    mobile_no: 8,
    address: 6.8,
    ekyc: 8,
    rate: 8,
    total: 8,
    signature: 8
  },
  vendors: [],
  visibleColumns: {
    sn: true,
    consumerNo: true,
    consumerName: true,
    orderDate: true,
    areaName: true,
    deliveryMan: true,
    online: true,
    ivrsNo: true,
    mobileNo: true,
    address: true,
    ekyc: true,
    rate: true,
    total: true,
    signature: true
  }
};



// Ensure settings file exists
function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Get available CSV files in current folder
app.get('/api/csv-files', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const csvFiles = files
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(__dirname, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first
    res.json(csvFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get data from specific CSV
// Helper to normalize varying CSV row structures into the standard table schema
function normalizeCsvRow(row) {
  const normalized = {};
  
  const getVal = (possibleKeys) => {
    for (const key in row) {
      const k = key.trim().toLowerCase().replace(/^\ufeff/, '');
      if (possibleKeys.includes(k)) {
        let val = row[key];
        if (typeof val === 'string') {
          val = val.trim();
          if (val.startsWith("'")) {
            val = val.substring(1);
          }
        }
        return val;
      }
    }
    return '';
  };

  normalized.ConsumerNo = getVal(['consumerno', 'consumer_no', 'consumerno.']);
  normalized.ConsumerName = getVal(['consumername', 'consumer_name', 'name']);
  normalized.OrderDate = getVal(['orderdate', 'order_date', 'date']);
  normalized.AreaName = getVal(['areaname', 'area_name', 'area', 'village']);
  normalized.DeliveryMan = getVal(['deliveryman', 'delivery_man', 'vendor']);
  
  const paymentVal = getVal(['refillpaymentstatus', 'refill_payment_status', 'online', 'paymentstatus', 'payment_status', 'payment']);
  if (paymentVal && (paymentVal.toUpperCase() === 'PAID' || paymentVal.toUpperCase() === 'ONLINE' || paymentVal.toUpperCase() === 'YES' || paymentVal.toUpperCase() === 'Y')) {
    normalized.RefillPaymentStatus = 'PAID';
  } else {
    normalized.RefillPaymentStatus = '';
  }

  normalized.IVRSBookingNumber = getVal(['ivrsbookingnumber', 'ivrsbookingn', 'ivrsbooking', 'ivrs_no', 'ivrs_number']);
  normalized.MobileNo = getVal(['mobileno', 'mobile_no', 'mobile', 'phone']);
  normalized.ConsumerAddress = getVal(['consumeraddress', 'consumer_address', 'address']);
  
  const ekycVal = getVal(['ekycstatus', 'ekyc_status', 'ekyc', 'ekycstatus.']);
  normalized.EkycStatus = ekycVal || 'EKYC NOT DONE';

  normalized.Packagecode_Desc = getVal(['packagecode_desc', 'packagecode', 'cylinder_type', 'package']);
  normalized.OrderQuantity = getVal(['orderquantity', 'order_quantity', 'qty', 'quantity']) || '1';
  
  normalized.CashMemoNo = getVal(['cashmemono', 'cash_memo_no', 'memono', 'memo_no']);
  normalized.CashMemoDate = getVal(['cashmemodate', 'cash_memo_date', 'memodate', 'memo_date']);

  return normalized;
}

// Helper to parse DD-MM-YYYY or DD/MM/YYYY into a sortable Date object
function parseOrderDate(dateStr) {
  if (!dateStr) return new Date(0);
  const cleanStr = dateStr.replace(/\//g, '-').trim();
  const [datePart, timePart] = cleanStr.split(' ');
  const parts = datePart.split('-');
  if (parts.length !== 3) return new Date(0);
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  let hours = 0, minutes = 0, seconds = 0;
  if (timePart) {
    const timeClean = timePart.replace(/\./g, ':');
    const timeParts = timeClean.split(':');
    if (timeParts.length >= 1) hours = parseInt(timeParts[0], 10) || 0;
    if (timeParts.length >= 2) minutes = parseInt(timeParts[1], 10) || 0;
    if (timeParts.length >= 3) seconds = parseInt(timeParts[2], 10) || 0;
  }
  return new Date(year, month, day, hours, minutes, seconds);
}

// Get data from specific CSV
app.get('/api/data', (req, res) => {
  const { filename } = req.query;
  if (!filename) {
    return res.status(400).json({ error: 'Filename parameter is required' });
  }

  const filePath = path.join(__dirname, filename);
  
  // Security check to keep path within the workspace
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(__dirname))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const buffer = fs.readFileSync(filePath);
    let fileContent = '';
    
    // Detect BOM
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      fileContent = buffer.toString('utf16le');
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.substring(1);
      }
    } else if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE - swap bytes to LE
      const swapped = Buffer.alloc(buffer.length);
      for (let i = 0; i < buffer.length; i += 2) {
        if (i + 1 < buffer.length) {
          swapped[i] = buffer[i + 1];
          swapped[i + 1] = buffer[i];
        }
      }
      fileContent = swapped.toString('utf16le');
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.substring(1);
      }
    } else if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      fileContent = buffer.toString('utf8');
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.substring(1);
      }
    } else {
      fileContent = buffer.toString('utf8');
    }
    
    // Parse CSV
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const cleanedData = results.data
          .map(row => normalizeCsvRow(row))
          .filter(row => row.ConsumerNo || row.ConsumerName);

        // Sort by date: Oldest to Newest
        cleanedData.sort((a, b) => parseOrderDate(a.OrderDate) - parseOrderDate(b.OrderDate));

        const standardFields = [
          'ConsumerNo', 'ConsumerName', 'OrderDate', 'AreaName', 
          'RefillPaymentStatus', 'IVRSBookingNumber', 'MobileNo', 
          'ConsumerAddress', 'EkycStatus'
        ];

        res.json({
          fields: standardFields,
          data: cleanedData
        });
      },
      error: (err) => {
        res.status(500).json({ error: 'Failed to parse CSV: ' + err.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific CSV file from disk
app.delete('/api/delete-file', (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const filePath = path.join(__dirname, filename);
  
  // Security check to keep path within the workspace
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(__dirname))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: `File ${filename} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json(loadSettings());
});

app.post('/api/settings', (req, res) => {
  const success = saveSettings(req.body);
  if (success) {
    res.json({ success: true, message: 'Settings saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Serve static files from the React app build directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Catch-all route for SPA routing
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Server setup
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});

