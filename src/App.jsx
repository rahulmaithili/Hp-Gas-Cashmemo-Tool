import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Download, Settings, Sun, Moon, 
  RefreshCw, FileSpreadsheet, CheckCircle2, X, ChevronLeft, 
  ChevronRight, Info, Coins, Users, MapPin, CheckSquare, Square,
  Printer, Upload, Filter, ListCheck, UserCheck, Languages, AlertCircle,
  Trash2, Type, Send, UserPlus, Copy, Calendar
} from 'lucide-react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Data states
  const [csvFiles, setCsvFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fields, setFields] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // App settings
  const [settings, setSettings] = useState({
    agencyName: 'M/S RAHUL HP GAS SERVICE',
    rates: {},
    defaultRate: 950,
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
    },
    rowsPerPrintPage: 15
  });
  
  // Temp settings for modal
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Village selector state
  const [villageSelectorText, setVillageSelectorText] = useState('');
  
  // Filter states
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [areaSearch, setAreaSearch] = useState('');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  
  const [selectedDeliveryMen, setSelectedDeliveryMen] = useState([]);
  const [deliveryManSearch, setDeliveryManSearch] = useState('');
  const [isDeliveryManDropdownOpen, setIsDeliveryManDropdownOpen] = useState(false);

  const [selectedEkycStatuses, setSelectedEkycStatuses] = useState([]);
  const [ekycSearch, setEkycSearch] = useState('');
  const [isEkycDropdownOpen, setIsEkycDropdownOpen] = useState(false);
  
  const [textSearch, setTextSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Hindi translation state
  const [translationColumn, setTranslationColumn] = useState('ConsumerName');
  const [hasTranslatedColumn, setHasTranslatedColumn] = useState({});

  // Formatting options
  const [includeRatesAndSignature, setIncludeRatesAndSignature] = useState(false);
  const [useExcelClassicStyle, setUseExcelClassicStyle] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Refs for dropdown toggle clicks
  const areaRef = useRef(null);
  const deliveryManRef = useRef(null);
  const ekycRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (areaRef.current && !areaRef.current.contains(event.target)) {
        setIsAreaDropdownOpen(false);
      }
      if (deliveryManRef.current && !deliveryManRef.current.contains(event.target)) {
        setIsDeliveryManDropdownOpen(false);
      }
      if (ekycRef.current && !ekycRef.current.contains(event.target)) {
        setIsEkycDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch initial files and settings
  useEffect(() => {
    fetchSettings();
    fetchFiles();
  }, []);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      
      // Fallbacks if missing
      if (!data.columnFonts) {
        data.columnFonts = { ...settings.columnFonts };
      }
      if (!data.vendors) {
        data.vendors = [];
      }
      if (!data.rowsPerPrintPage) {
        data.rowsPerPrintPage = 15;
      }
      if (!data.visibleColumns) {
        data.visibleColumns = { ...settings.visibleColumns };
      } else {
        data.visibleColumns = { ...settings.visibleColumns, ...data.visibleColumns };
      }
      
      setSettings(data);
      setTempSettings(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading settings', 'error');
    }
  };

  // Fetch files in directory
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/csv-files');
      if (!response.ok) throw new Error('Failed to load CSV files');
      const files = await response.json();
      setCsvFiles(files);
      if (files.length > 0) {
        setSelectedFile(files[0].name);
        fetchData(files[0].name);
      } else {
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Load CSV data from file
  const fetchData = async (filename) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data?filename=${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setFields(result.fields);
      setData(result.data);
      
      // Auto-select all rows
      const rowIds = new Set(result.data.map((_, i) => i));
      setSelectedRows(rowIds);
      
      // Reset states
      setHasTranslatedColumn({});
      setSelectedAreas([]);
      setSelectedDeliveryMen([]);
      setSelectedEkycStatuses([]);
      setTextSearch('');
      setPaymentStatusFilter('ALL');
      setCurrentPage(1);
      
      showToast(`Loaded ${result.data.length} bookings successfully`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize varying CSV row structures into the standard table schema
  const normalizeCsvRow = (row) => {
    const normalized = {};
    
    // Find case-insensitive keys
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
    
    // Refill Payment Status
    const paymentVal = getVal(['refillpaymentstatus', 'refill_payment_status', 'online', 'paymentstatus', 'payment_status', 'payment']);
    if (paymentVal && (paymentVal.toUpperCase() === 'PAID' || paymentVal.toUpperCase() === 'ONLINE' || paymentVal.toUpperCase() === 'YES' || paymentVal.toUpperCase() === 'Y')) {
      normalized.RefillPaymentStatus = 'PAID';
    } else {
      normalized.RefillPaymentStatus = '';
    }

    normalized.IVRSBookingNumber = getVal(['ivrsbookingnumber', 'ivrsbookingn', 'ivrsbooking', 'ivrs_no', 'ivrs_number']);
    normalized.MobileNo = getVal(['mobileno', 'mobile_no', 'mobile', 'phone']);
    normalized.ConsumerAddress = getVal(['consumeraddress', 'consumer_address', 'address']);
    
    // Ekyc Status
    const ekycVal = getVal(['ekycstatus', 'ekyc_status', 'ekyc', 'ekycstatus.']);
    normalized.EkycStatus = ekycVal || 'EKYC NOT DONE'; // default

    normalized.Packagecode_Desc = getVal(['packagecode_desc', 'packagecode', 'cylinder_type', 'package']);
    normalized.OrderQuantity = getVal(['orderquantity', 'order_quantity', 'qty', 'quantity']) || '1';
    
    normalized.CashMemoNo = getVal(['cashmemono', 'cash_memo_no', 'memono', 'memo_no']);
    normalized.CashMemoDate = getVal(['cashmemodate', 'cash_memo_date', 'memodate', 'memo_date']);

    return normalized;
  };

  // Helper to parse DD-MM-YYYY or DD/MM/YYYY into a sortable Date object
  const parseOrderDate = (dateStr) => {
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
  };

  // Local File Upload Handler for "everyday new booking download karke upload kare"
  const handleLocalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target.result;
        const uint8 = new Uint8Array(buffer);
        
        let encoding = 'utf-8';
        let offset = 0;
        
        // Detect BOM
        if (uint8.length >= 2 && uint8[0] === 0xff && uint8[1] === 0xfe) {
          encoding = 'utf-16le';
          offset = 2;
        } else if (uint8.length >= 2 && uint8[0] === 0xfe && uint8[1] === 0xff) {
          encoding = 'utf-16be';
          offset = 2;
        } else if (uint8.length >= 3 && uint8[0] === 0xef && uint8[1] === 0xbb && uint8[2] === 0xbf) {
          encoding = 'utf-8';
          offset = 3;
        }
        
        const decoder = new TextDecoder(encoding);
        const text = decoder.decode(uint8.subarray(offset));

        Papa.parse(text, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            try {
              if (!results.data || results.data.length === 0) {
                throw new Error("No data rows found in the parsed CSV file.");
              }

              // Normalize each row
              const normalizedData = results.data
                .map(row => normalizeCsvRow(row))
                .filter(row => row.ConsumerNo || row.ConsumerName);

              if (normalizedData.length === 0) {
                throw new Error("No valid booking records (with ConsumerNo/ConsumerName) found in the CSV.");
              }

              // Sort by date: Oldest to Newest
              normalizedData.sort((a, b) => parseOrderDate(a.OrderDate) - parseOrderDate(b.OrderDate));

              setData(normalizedData);
              
              // Standard field keys for rendering
              const standardFields = [
                'ConsumerNo', 'ConsumerName', 'OrderDate', 'AreaName', 
                'RefillPaymentStatus', 'IVRSBookingNumber', 'MobileNo', 
                'ConsumerAddress', 'EkycStatus'
              ];
              setFields(standardFields);

              // Auto-select all rows
              const rowIds = new Set(normalizedData.map((_, i) => i));
              setSelectedRows(rowIds);

              // Reset filters
              setHasTranslatedColumn({});
              setSelectedAreas([]);
              setSelectedDeliveryMen([]);
              setSelectedEkycStatuses([]);
              setTextSearch('');
              setPaymentStatusFilter('ALL');
              setCurrentPage(1);

              setSelectedFile(`Uploaded: ${file.name}`);
              setLoading(false);
              showToast(`Uploaded and loaded ${normalizedData.length} bookings successfully!`);
            } catch (err) {
              console.error('Error post-processing CSV:', err);
              setError(err.message || 'Error parsing CSV structure');
              setLoading(false);
            }
          },
          error: (err) => {
            console.error('PapaParse error:', err);
            setError('Failed to parse uploaded CSV: ' + err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('FileReader error:', err);
        setError('Failed to read file: ' + err.message);
        setLoading(false);
      } finally {
        // Clear input value so same file can be re-uploaded
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle removing uploaded file
  const handleRemoveUploadedFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (csvFiles.length > 0) {
      setSelectedFile(csvFiles[0].name);
      fetchData(csvFiles[0].name);
      showToast('Uploaded file removed. Original CSV restored.');
    } else {
      setData([]);
      setFields([]);
      setSelectedFile('');
      setSelectedRows(new Set());
      showToast('Uploaded file cleared.');
    }
  };

  // Delete specific CSV file from disk
  const handleDeleteFile = async () => {
    if (selectedFile.startsWith('Uploaded:')) {
      handleRemoveUploadedFile();
      return;
    }

    if (!selectedFile) return;

    const confirmDelete = window.confirm(`क्या आप वाकई इस फ़ाइल (${selectedFile}) को कंप्यूटर से हमेशा के लिए डिलीट करना चाहते हैं?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await fetch('/api/delete-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete file');
      }

      showToast(`File deleted successfully`);
      
      // Refresh list and select the next file
      const updatedFiles = csvFiles.filter(file => file.name !== selectedFile);
      setCsvFiles(updatedFiles);
      
      if (updatedFiles.length > 0) {
        setSelectedFile(updatedFiles[0].name);
        fetchData(updatedFiles[0].name);
      } else {
        setData([]);
        setFields([]);
        setSelectedFile('');
        setSelectedRows(new Set());
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle file switch
  const handleFileChange = (e) => {
    const filename = e.target.value;
    setSelectedFile(filename);
    if (filename.startsWith('Uploaded:')) {
      showToast('Cannot reload manually uploaded browser files', 'warning');
    } else {
      fetchData(filename);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSettings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setSettings(tempSettings);
      setIsSettingsOpen(false);
      showToast('Settings saved successfully');
    } catch (err) {
      showToast('Error saving settings', 'error');
    }
  };

  // Save Settings Quietly (without showing toaster)
  const saveSettingsQuietly = async (updatedSettings) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
    } catch (err) {
      console.error('Error saving settings quietly:', err);
    }
  };

  // Toggle Column Visibility Handler
  const toggleColumnVisibility = (colKey) => {
    const updatedSettings = {
      ...settings,
      visibleColumns: {
        ...settings.visibleColumns,
        [colKey]: settings.visibleColumns?.[colKey] === false ? true : false
      }
    };
    setSettings(updatedSettings);
    setTempSettings(updatedSettings);
    saveSettingsQuietly(updatedSettings);
  };

  // Toggle master rates and signatures checkbox
  const toggleIncludeRatesAndSignature = (checked) => {
    setIncludeRatesAndSignature(checked);
    const updatedSettings = {
      ...settings,
      visibleColumns: {
        ...settings.visibleColumns,
        rate: checked,
        total: checked,
        signature: checked
      }
    };
    setSettings(updatedSettings);
    setTempSettings(updatedSettings);
    saveSettingsQuietly(updatedSettings);
  };



  // Reset local config rates to match newly seen package names
  const syncRateSettings = () => {
    const packages = [...new Set(data.map(item => item.Packagecode_Desc).filter(Boolean))];
    const newRates = { ...tempSettings.rates };
    packages.forEach(pkg => {
      if (newRates[pkg] === undefined) {
        newRates[pkg] = tempSettings.defaultRate;
      }
    });
    setTempSettings(prev => ({
      ...prev,
      rates: newRates
    }));
    showToast('Synced rate items with current data');
  };

  // Hindi translation logic
  const handleTranslateColumn = async () => {
    if (data.length === 0) return;

    // Determine target indices to translate based on selection or filters
    const indicesToTranslate = new Set();
    if (selectedRows.size > 0) {
      selectedRows.forEach(idx => {
        if (idx >= 0 && idx < data.length) {
          indicesToTranslate.add(idx);
        }
      });
    } else {
      filteredData.forEach(row => {
        const idx = data.indexOf(row);
        if (idx !== -1) {
          indicesToTranslate.add(idx);
        }
      });
    }

    if (indicesToTranslate.size === 0) {
      showToast('No matching records found to translate.', 'warning');
      return;
    }

    setTranslationLoading(true);
    setTranslationProgress(0);
    showToast(`Translating ${translationColumn} column to Hindi for ${indicesToTranslate.size} records...`, 'info');

    const backupKey = `original_${translationColumn}`;
    
    // Create copies of rows being modified to respect React state immutability
    const updatedData = data.map((row, idx) => {
      if (indicesToTranslate.has(idx)) {
        const updatedRow = { ...row };
        if (updatedRow[backupKey] === undefined) {
          updatedRow[backupKey] = row[translationColumn] || '';
        }
        return updatedRow;
      }
      return row;
    });

    const rowsToTranslate = Array.from(indicesToTranslate).map(idx => updatedData[idx]);
    const batchSize = 30; 
    const totalRows = rowsToTranslate.length;

    try {
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = rowsToTranslate.slice(i, i + batchSize);

        // Prepend sequential number to prevent Google Translate from merging rows
        const texts = batch.map((row, idx) => `${idx + 1}. ${row[backupKey] || row[translationColumn] || ' '}`);
        const queryText = texts.join('\n');
        
        if (queryText.trim() === '') continue;

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(queryText)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Translation API request failed');
        const result = await res.json();

        let translatedText = '';
        if (result && result[0]) {
          translatedText = result[0].map(item => item[0]).join('');
        }

        const translatedLines = translatedText.split('\n');

        batch.forEach((row, idx) => {
          const engPrefix = `${idx + 1}.`;
          const hindiPrefix = `${idx + 1}`.split('').map(char => {
            const hDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
            return hDigits[parseInt(char, 10)] || char;
          }).join('') + '.';

          // Find if there is a line starting with this prefix
          const matchingLine = translatedLines.find(line => {
            const trimmed = line.trim();
            return trimmed.startsWith(engPrefix) || trimmed.startsWith(hindiPrefix);
          });

          if (matchingLine) {
            // Strip the number prefix
            row[translationColumn] = matchingLine.replace(/^[0-9०-९]+[\s\.\:\)\]]+/, '').trim();
          } else {
            // Fallback to index-based line if numbering layout is corrupted
            const fallbackLine = translatedLines[idx];
            if (fallbackLine) {
              row[translationColumn] = fallbackLine.replace(/^[0-9०-९]+[\s\.\:\)\]]+/, '').trim();
            }
          }
        });

        setTranslationProgress(Math.min(100, Math.round(((i + batchSize) / totalRows) * 100)));
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      setData(updatedData);
      setHasTranslatedColumn({
        ...hasTranslatedColumn,
        [translationColumn]: true
      });
      showToast(`${translationColumn} column translated to Hindi successfully for ${totalRows} records!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Translation failed. Please try smaller filters or check connection.', 'error');
    } finally {
      setTranslationLoading(false);
      setTranslationProgress(0);
    }
  };

  const handleRevertTranslation = () => {
    const backupKey = `original_${translationColumn}`;
    const updatedData = data.map(row => {
      if (row[backupKey] !== undefined) {
        return {
          ...row,
          [translationColumn]: row[backupKey]
        };
      }
      return row;
    });

    setData(updatedData);
    setHasTranslatedColumn({
      ...hasTranslatedColumn,
      [translationColumn]: false
    });
    showToast(`Restored original English text for ${translationColumn}`);
  };

  // Reset all dashboard search and filter criteria
  const clearFilters = () => {
    setSelectedAreas([]);
    setSelectedDeliveryMen([]);
    setSelectedEkycStatuses([]);
    setTextSearch('');
    setPaymentStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setAreaSearch('');
    setDeliveryManSearch('');
    setEkycSearch('');
    showToast('Filters reset successfully');
  };

  // Compute unique values dynamically from CSV file
  const uniqueAreas = [...new Set(data.map(item => item.AreaName).filter(Boolean))].sort();
  const uniqueDeliveryMen = [...new Set(data.map(item => item.DeliveryMan).filter(Boolean))].sort();
  const uniqueEkycStatuses = [...new Set(data.map(item => item.EkycStatus).filter(Boolean))].sort();

  // Rate Helper
  const getRate = (pkg) => {
    if (!pkg) return settings.defaultRate;
    return settings.rates[pkg] !== undefined ? settings.rates[pkg] : settings.defaultRate;
  };

  // Helper to parse DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD for comparison at local midnight
  const parseDateToCompare = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(/\//g, '-').trim();
    const [datePart] = cleanStr.split(' ');
    const parts = datePart.split('-');
    if (parts.length !== 3) return null;
    
    let day, month, year;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
    
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Filter logic (Smart multi-village comma-separated search)
  const filteredData = data.filter((row) => {
    // Area Filter
    if (selectedAreas.length > 0 && !selectedAreas.includes(row.AreaName)) {
      return false;
    }
    
    // Delivery Man (Vendor) Filter
    if (selectedDeliveryMen.length > 0 && !selectedDeliveryMen.includes(row.DeliveryMan)) {
      return false;
    }

    // eKYC Status Filter (Multi-select)
    if (selectedEkycStatuses.length > 0 && !selectedEkycStatuses.includes(row.EkycStatus)) {
      return false;
    }
    
    // Date Range Filter
    if (startDate) {
      const sDate = parseDateToCompare(startDate);
      const rDate = parseDateToCompare(row.OrderDate);
      if (rDate && sDate && rDate < sDate) return false;
    }
    if (endDate) {
      const eDate = parseDateToCompare(endDate);
      const rDate = parseDateToCompare(row.OrderDate);
      if (rDate && eDate && rDate > eDate) return false;
    }
    
    // Payment Status Filter
    if (paymentStatusFilter !== 'ALL') {
      const isPaid = row.RefillPaymentStatus === 'PAID';
      if (paymentStatusFilter === 'PAID' && !isPaid) return false;
      if (paymentStatusFilter === 'UNPAID' && isPaid) return false;
    }
    
    // Comma-Separated search inside ConsumerAddress, name, consumer #, area, phone
    if (textSearch.trim() !== '') {
      const terms = textSearch.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (terms.length > 0) {
        const matchesAnyTerm = terms.some(term => {
          return (
            row.ConsumerAddress?.toLowerCase().includes(term) ||
            (row.original_ConsumerAddress && row.original_ConsumerAddress.toLowerCase().includes(term)) ||
            row.ConsumerName?.toLowerCase().includes(term) ||
            (row.original_ConsumerName && row.original_ConsumerName.toLowerCase().includes(term)) ||
            row.ConsumerNo?.toLowerCase().includes(term) ||
            row.CashMemoNo?.toLowerCase().includes(term) ||
            row.MobileNo?.toLowerCase().includes(term) ||
            row.AreaName?.toLowerCase().includes(term) ||
            (row.original_AreaName && row.original_AreaName.toLowerCase().includes(term)) ||
            row.EkycStatus?.toLowerCase().includes(term) ||
            (row.original_EkycStatus && row.original_EkycStatus.toLowerCase().includes(term))
          );
        });
        if (!matchesAnyTerm) return false;
      }
    }
    
    return true;
  });

  // Checkbox row toggles
  const handleToggleRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAllFiltered = () => {
    const allFilteredIndices = filteredData.map(row => data.indexOf(row));
    const allAreChecked = allFilteredIndices.every(idx => selectedRows.has(idx));
    
    const newSelected = new Set(selectedRows);
    if (allAreChecked) {
      allFilteredIndices.forEach(idx => newSelected.delete(idx));
    } else {
      allFilteredIndices.forEach(idx => newSelected.add(idx));
    }
    setSelectedRows(newSelected);
  };

  // eKYC Status-based batch selections (Check/Uncheck)
  const selectByEkycStatus = (status, check) => {
    const newSelected = new Set(selectedRows);
    data.forEach((row, idx) => {
      if (row.EkycStatus === status) {
        if (check) {
          newSelected.add(idx);
        } else {
          newSelected.delete(idx);
        }
      }
    });
    setSelectedRows(newSelected);
    showToast(`${check ? 'Checked' : 'Unchecked'} all rows with Ekyc: "${status}"`);
  };

  // Quick checkbox toggle by village name/address
  const handleToggleByVillage = (actionType) => {
    if (!villageSelectorText.trim()) {
      showToast('Please enter a village or address keyword first. (कृपया पहले गाँव या पता लिखें।)', 'error');
      return;
    }
    
    // Split input by comma for multiple keywords support, e.g. "yamsham, yamsam"
    const terms = villageSelectorText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (terms.length === 0) return;
    
    const newSelected = new Set(selectedRows);
    let affectedCount = 0;
    
    if (actionType === 'check') {
      filteredData.forEach((row) => {
        const dataIndex = data.indexOf(row);
        const matches = terms.some(term => {
          return (
            row.ConsumerAddress?.toLowerCase().includes(term) ||
            (row.original_ConsumerAddress && row.original_ConsumerAddress.toLowerCase().includes(term)) ||
            row.AreaName?.toLowerCase().includes(term) ||
            (row.original_AreaName && row.original_AreaName.toLowerCase().includes(term))
          );
        });
        
        if (matches) {
          newSelected.add(dataIndex);
          affectedCount++;
        }
      });
      showToast(`Checked ${affectedCount} rows matching "${villageSelectorText}". (मैचिंग वाले ${affectedCount} टिक किए गए)`, 'success');
    } else if (actionType === 'uncheck') {
      filteredData.forEach((row) => {
        const dataIndex = data.indexOf(row);
        const matches = terms.some(term => {
          return (
            row.ConsumerAddress?.toLowerCase().includes(term) ||
            (row.original_ConsumerAddress && row.original_ConsumerAddress.toLowerCase().includes(term)) ||
            row.AreaName?.toLowerCase().includes(term) ||
            (row.original_AreaName && row.original_AreaName.toLowerCase().includes(term))
          );
        });
        
        if (matches) {
          newSelected.delete(dataIndex);
          affectedCount++;
        }
      });
      showToast(`Unchecked ${affectedCount} rows matching "${villageSelectorText}". (मैचिंग वाले ${affectedCount} अन-टिक किए गए)`, 'success');
    } else if (actionType === 'keep-only') {
      filteredData.forEach((row) => {
        const dataIndex = data.indexOf(row);
        const matches = terms.some(term => {
          return (
            row.ConsumerAddress?.toLowerCase().includes(term) ||
            (row.original_ConsumerAddress && row.original_ConsumerAddress.toLowerCase().includes(term)) ||
            row.AreaName?.toLowerCase().includes(term) ||
            (row.original_AreaName && row.original_AreaName.toLowerCase().includes(term))
          );
        });
        
        if (matches) {
          newSelected.add(dataIndex);
          affectedCount++;
        } else {
          newSelected.delete(dataIndex);
        }
      });
      showToast(`Kept only ${affectedCount} matching rows checked. (केवल मैचिंग वाले ${affectedCount} टिक रखे गए)`, 'success');
    }
    
    setSelectedRows(newSelected);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper to fetch custom column font size or default
  const getColFontSize = (colKey, def) => {
    return settings.columnFonts?.[colKey] !== undefined ? settings.columnFonts[colKey] : def;
  };

  // Selection statistics
  const activeSelectedRows = filteredData.filter(row => selectedRows.has(data.indexOf(row)));
  const totalCylinders = activeSelectedRows.reduce((acc, row) => acc + parseInt(row.OrderQuantity || 1, 10), 0);
  const totalAmount = activeSelectedRows.reduce((acc, row) => {
    const rate = getRate(row.Packagecode_Desc);
    const qty = parseInt(row.OrderQuantity || 1, 10);
    return acc + (rate * qty);
  }, 0);

  // Clipboard copy helper
  const handleCopyToClipboard = () => {
    if (activeSelectedRows.length === 0) {
      showToast('No checked bookings found to copy. (कॉपी करने के लिए कोई टिक की हुई बुकिंग नहीं मिली।)', 'error');
      return;
    }

    const visibleCols = Object.entries(settings.visibleColumns || {})
      .filter(([_, val]) => val !== false)
      .map(([key, _]) => key);
      
    const keyToLabel = {
      sn: 'Sn',
      consumerNo: 'ConsumerNo',
      consumerName: 'ConsumerName',
      orderDate: 'OrderDate',
      areaName: 'AreaName',
      deliveryMan: 'DeliveryMan',
      online: 'Online',
      ivrsNo: 'IVRSBookingNo',
      mobileNo: 'MobileNo',
      address: 'ConsumerAddress',
      ekyc: 'EkycStatus',
      rate: 'Rate',
      total: 'Total',
      signature: 'Signature'
    };

    const headers = visibleCols.map(k => keyToLabel[k] || k);
    let text = headers.join('\t') + '\n';

    activeSelectedRows.forEach((row, idx) => {
      const rowValues = [];
      visibleCols.forEach(col => {
        if (col === 'sn') {
          rowValues.push(idx + 1);
        } else if (col === 'consumerNo') {
          rowValues.push(row.ConsumerNo || '');
        } else if (col === 'consumerName') {
          rowValues.push(row.ConsumerName || '');
        } else if (col === 'orderDate') {
          rowValues.push(row.OrderDate ? row.OrderDate.split(' ')[0] : '');
        } else if (col === 'areaName') {
          rowValues.push(row.AreaName || '');
        } else if (col === 'deliveryMan') {
          rowValues.push(row.DeliveryMan || '');
        } else if (col === 'online') {
          rowValues.push(row.RefillPaymentStatus === 'PAID' ? 'PAID' : '');
        } else if (col === 'ivrsNo') {
          rowValues.push(row.IVRSBookingNumber || '');
        } else if (col === 'mobileNo') {
          rowValues.push(row.MobileNo || '');
        } else if (col === 'address') {
          rowValues.push(row.ConsumerAddress || '');
        } else if (col === 'ekyc') {
          rowValues.push(row.EkycStatus || '');
        } else if (col === 'rate') {
          rowValues.push(getRate(row.Packagecode_Desc));
        } else if (col === 'total') {
          rowValues.push(getRate(row.Packagecode_Desc) * parseInt(row.OrderQuantity || 1, 10));
        } else if (col === 'signature') {
          rowValues.push('');
        }
      });
      text += rowValues.join('\t') + '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard! You can paste in Excel/WhatsApp.', 'success');
    }).catch((err) => {
      console.error(err);
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  // PDF print trigger
  const handlePrintPdf = () => {
    window.print();
  };

  // Direct PDF generation and download
  const handleDownloadPdfDirect = () => {
    if (activeSelectedRows.length === 0) {
      showToast('Please select at least one booking (check the checkbox) to download. (कृपया डाउनलोड करने के लिए कम से कम एक बुकिंग टिक करें)', 'error');
      return;
    }
    
    showToast('Generating PDF file...', 'success');
    
    const element = document.querySelector('.printable-area');
    if (!element) {
      showToast('Printable area not found', 'error');
      return;
    }
    
    // Create a hidden container wrapper that matches A4 Landscape dimensions
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '11.69in';
    container.style.height = '0';
    container.style.overflow = 'visible';
    container.style.zIndex = '-9999';
    container.style.pointerEvents = 'none';
    
    const clone = element.cloneNode(true);
    // Remove printable-area class so that CSS display:none does not apply inside the html2pdf iframe
    clone.classList.remove('printable-area');
    clone.style.display = 'block';
    clone.style.background = '#ffffff';
    clone.style.width = '11.69in';
    clone.style.padding = '0.35in'; // Match native print margins in HTML
    clone.style.boxSizing = 'border-box';
    
    container.appendChild(clone);
    document.body.appendChild(container);
    
    const dateStr = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
    const areaLabel = selectedAreas.length > 0 ? selectedAreas[0] : 'All';
    const opt = {
      margin:       0, // Zero margin in jsPDF since we apply the padding inside HTML
      filename:     `Delivery_List_${areaLabel}_${dateStr}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, // 2x scale keeps image quality crisp while drastically reducing PDF file size (MBs)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(container);
        showToast('PDF downloaded successfully!', 'success');
        setShowWaInstructions(true);
      }).catch(err => {
        console.error('PDF generation error:', err);
        document.body.removeChild(container);
        showToast('Failed to generate PDF, trying browser print dialog...', 'error');
        window.print();
        setShowWaInstructions(true);
      });
    } else {
      document.body.removeChild(container);
      window.print();
      setShowWaInstructions(true);
    }
  };

  // ExcelJS styling and file export
  const exportToExcel = async (groupByArea = true) => {
    if (activeSelectedRows.length === 0) {
      showToast('Please select at least one booking (check the checkbox) to export. (कृपया निर्यात करने के लिए कम से कम एक बुकिंग टिक करें)', 'error');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      
      // Group filtered data by AreaName or keep it all in one sheet
      const groupedData = {};
      if (groupByArea) {
        activeSelectedRows.forEach(row => {
          const area = row.AreaName || 'Unknown Area';
          if (!groupedData[area]) {
            groupedData[area] = [];
          }
          groupedData[area].push(row);
        });
      } else {
        groupedData['All Bookings'] = activeSelectedRows;
      }

      Object.entries(groupedData).forEach(([areaName, areaRows], sheetIdx) => {
        const excelTotalCylinders = areaRows.reduce((acc, row) => acc + parseInt(row.OrderQuantity || 1, 10), 0);
        const excelTotalAmount = areaRows.reduce((acc, row) => {
          const rate = getRate(row.Packagecode_Desc);
          const qty = parseInt(row.OrderQuantity || 1, 10);
          return acc + (rate * qty);
        }, 0);

        // Sanitize sheet name: limit to 30 chars, remove invalid chars: \ / ? * : [ ]
        let cleanSheetName = areaName.replace(/[*?:/\\\[\]]/g, '').trim();
        if (cleanSheetName.length > 30) {
          cleanSheetName = cleanSheetName.substring(0, 27) + '...';
        }
        if (!cleanSheetName) {
          cleanSheetName = `Sheet ${sheetIdx + 1}`;
        }

        const worksheet = workbook.addWorksheet(cleanSheetName);

        // Page Setup Configuration for printing (Landscape, repeating title, margins)
        worksheet.pageSetup = {
          orientation: 'landscape',
          paperSize: 9, // A4
          fitToPage: true,
          fitToWidth: 1, // Fit all columns to 1 page width
          fitToHeight: 0, // Auto flow rows vertically
          printTitlesRow: '1:4', // Repeat rows 1 to 4 on every printed page!
          margins: {
            left: 0.5,
            right: 0.5,
            top: 0.5,
            bottom: 0.5,
            header: 0.3,
            footer: 0.3
          }
        };

        // Ensure grid lines print
        worksheet.views = [{ showGridLines: true }];

        // Define Columns based on visibleColumns
        const headers = [];
        if (settings.visibleColumns?.sn !== false) headers.push({ header: 'Sn', key: 'sno', width: 6 });
        if (settings.visibleColumns?.consumerNo !== false) headers.push({ header: 'ConsumerNo', key: 'consumer_no', width: 15 });
        if (settings.visibleColumns?.consumerName !== false) headers.push({ header: 'ConsumerName', key: 'name', width: 22 });
        if (settings.visibleColumns?.orderDate !== false) headers.push({ header: 'OrderDate', key: 'order_date', width: 13 });
        if (settings.visibleColumns?.areaName !== false) headers.push({ header: 'AreaName', key: 'area_name', width: 15 });
        if (settings.visibleColumns?.deliveryMan !== false) headers.push({ header: 'DeliveryMan', key: 'delivery_man', width: 20 });
        if (settings.visibleColumns?.online !== false) headers.push({ header: 'Online', key: 'online', width: 10 });
        if (settings.visibleColumns?.ivrsNo !== false) headers.push({ header: 'IVRSBookingNo', key: 'ivrs_no', width: 16 });
        if (settings.visibleColumns?.mobileNo !== false) headers.push({ header: 'MobileNo', key: 'mobile', width: 13 });
        if (settings.visibleColumns?.address !== false) headers.push({ header: 'ConsumerAddress', key: 'address', width: 38 });
        if (settings.visibleColumns?.ekyc !== false) headers.push({ header: 'EkycStatus', key: 'ekyc', width: 16 });
        if (settings.visibleColumns?.rate !== false) headers.push({ header: 'Rate', key: 'rate', width: 10 });
        if (settings.visibleColumns?.total !== false) headers.push({ header: 'Total', key: 'total', width: 12 });
        if (settings.visibleColumns?.signature !== false) headers.push({ header: 'Remarks / Signature', key: 'signature', width: 25 });

        worksheet.columns = headers;

        const numCols = headers.length;
        // Calculate the last column letter dynamically
        const lastColLetter = String.fromCharCode(64 + numCols);

        // Add Headers manually for nice styling spans
        worksheet.insertRow(1, []);
        worksheet.insertRow(2, []);
        worksheet.insertRow(3, []);

        // Merge and Style Title
        worksheet.mergeCells(`A1:${lastColLetter}1`);
        const titleCell = worksheet.getCell('A1');
        titleCell.value = settings.agencyName;
        titleCell.font = { name: 'Nirmala UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F4C81' } // Corporate HP Blue
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 32;

        // Merge and Style Subtitle
        worksheet.mergeCells(`A2:${lastColLetter}2`);
        const subtitleCell = worksheet.getCell('A2');
        const dmanLabel = selectedDeliveryMen.length > 0 ? selectedDeliveryMen.join(', ') : 'ALL AGENTS';
        if (groupByArea) {
          subtitleCell.value = `DELIVERY SHEET: ${areaName.toUpperCase()} (Delivery Agent: ${dmanLabel})`;
        } else {
          subtitleCell.value = `DELIVERY SHEET: ALL AREAS MIXED (Delivery Agent: ${dmanLabel})`;
        }
        subtitleCell.font = { name: 'Nirmala UI', size: 11, bold: true, color: { argb: 'FF333333' } };
        subtitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Merge and Style Stats row
        worksheet.mergeCells(`A3:${lastColLetter}3`);
        const statsCell = worksheet.getCell('A3');
        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const hasRateCol = settings.visibleColumns?.rate !== false;
        const hasTotalCol = settings.visibleColumns?.total !== false;
        if (hasRateCol && hasTotalCol) {
          statsCell.value = `Total Cylinders: ${excelTotalCylinders}  |  Total Amount: ₹${excelTotalAmount.toLocaleString('en-IN')}  |  Generated on: ${dateStr}`;
        } else {
          statsCell.value = `Total Cylinders: ${excelTotalCylinders}  |  Generated on: ${dateStr}`;
        }
        statsCell.font = { name: 'Nirmala UI', size: 9, italic: true, color: { argb: 'FF475569' } };
        statsCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
        statsCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(3).height = 18;

        // Style Table Headers (Row 4)
        const headerRow = worksheet.getRow(4);
        headerRow.height = 28;
        
        headers.forEach((_, colIndex) => {
          const cell = headerRow.getCell(colIndex + 1);
          cell.font = { name: 'Nirmala UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A8A' } // Deep Navy Table Header
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            left: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
            right: { style: 'thin', color: { argb: 'FF94A3B8' } }
          };
        });

        // Add Data Rows
        areaRows.forEach((row, idx) => {
          const dateOnly = row.OrderDate ? row.OrderDate.split(' ')[0] : '';
          const isPaid = row.RefillPaymentStatus === 'PAID';
          const displayPayment = isPaid ? 'PAID' : '';
          const rate = getRate(row.Packagecode_Desc);
          const qty = parseInt(row.OrderQuantity || 1, 10);
          const total = rate * qty;

          const rowValues = [];
          if (settings.visibleColumns?.sn !== false) rowValues.push(idx + 1);
          if (settings.visibleColumns?.consumerNo !== false) rowValues.push(row.ConsumerNo || '');
          if (settings.visibleColumns?.consumerName !== false) rowValues.push(row.ConsumerName || '');
          if (settings.visibleColumns?.orderDate !== false) rowValues.push(dateOnly);
          if (settings.visibleColumns?.areaName !== false) rowValues.push(row.AreaName || '');
          if (settings.visibleColumns?.deliveryMan !== false) rowValues.push(row.DeliveryMan || '');
          if (settings.visibleColumns?.online !== false) rowValues.push(displayPayment);
          if (settings.visibleColumns?.ivrsNo !== false) rowValues.push(row.IVRSBookingNumber || '');
          if (settings.visibleColumns?.mobileNo !== false) rowValues.push(row.MobileNo || '');
          if (settings.visibleColumns?.address !== false) rowValues.push(row.ConsumerAddress || '');
          if (settings.visibleColumns?.ekyc !== false) rowValues.push(row.EkycStatus || '');
          if (settings.visibleColumns?.rate !== false) rowValues.push(rate);
          if (settings.visibleColumns?.total !== false) rowValues.push(total);
          if (settings.visibleColumns?.signature !== false) rowValues.push('');

          const addedRow = worksheet.addRow(rowValues);
          addedRow.height = 24;

          const isEven = idx % 2 === 0;
          const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

          for (let colIdx = 1; colIdx <= numCols; colIdx++) {
            const cell = addedRow.getCell(colIdx);
            cell.font = { name: 'Nirmala UI', size: 9 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowBgColor }
            };

            // Column specific alignments and formatting
            const headerKey = headers[colIdx - 1].key;
            if (headerKey === 'sno' || headerKey === 'order_date' || headerKey === 'online' || headerKey === 'ekyc' || headerKey === 'area_name' || headerKey === 'delivery_man') {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if (headerKey === 'rate' || headerKey === 'total') {
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
              cell.numFmt = '₹#,##0';
            } else if (headerKey === 'address') {
              cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
            }

            // Bold styling for consumer name
            if (headerKey === 'name') {
              cell.font = { name: 'Nirmala UI', size: 9, bold: true };
            }

            // Color badge for Online (PAID)
            if (headerKey === 'online' && cell.value === 'PAID') {
              cell.font = {
                name: 'Nirmala UI',
                size: 9,
                bold: true,
                color: { argb: 'FF10B981' } // Green
              };
            }

            // Color badge for EkycStatus
            if (headerKey === 'ekyc') {
              const isEkycDone = cell.value === 'EKYC DONE';
              cell.font = {
                name: 'Nirmala UI',
                size: 9,
                bold: true,
                color: { argb: isEkycDone ? 'FF10B981' : 'FFF59E0B' }
              };
            }
          }
        });

        // Total Summary Row at bottom
        const totalColIndex = headers.findIndex(h => h.key === 'total') + 1;
        let summaryRow;
        
        if (totalColIndex > 0) {
          const summaryValues = Array(numCols).fill('');
          summaryValues[totalColIndex - 1] = excelTotalAmount;
          summaryRow = worksheet.addRow(summaryValues);
          worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, totalColIndex - 1);
          
          const mergedLabelCell = summaryRow.getCell(1);
          mergedLabelCell.value = `GRAND TOTAL (${areaRows.length} BOOKINGS, ${excelTotalCylinders} CYLINDERS)`;
          mergedLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
          mergedLabelCell.font = { name: 'Nirmala UI', size: 10, bold: true };
          
          const totalAmountCell = summaryRow.getCell(totalColIndex);
          totalAmountCell.alignment = { vertical: 'middle', horizontal: 'right' };
          totalAmountCell.font = { name: 'Nirmala UI', size: 10, bold: true };
          totalAmountCell.numFmt = '₹#,##0';
        } else {
          const summaryValues = Array(numCols).fill('');
          summaryRow = worksheet.addRow(summaryValues);
          worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, numCols);
          
          const mergedLabelCell = summaryRow.getCell(1);
          mergedLabelCell.value = `GRAND TOTAL (${areaRows.length} BOOKINGS, ${excelTotalCylinders} CYLINDERS)`;
          mergedLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
          mergedLabelCell.font = { name: 'Nirmala UI', size: 10, bold: true };
        }
        summaryRow.height = 26;

        for (let colIdx = 1; colIdx <= numCols; colIdx++) {
          const cell = summaryRow.getCell(colIdx);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF1E3A8A' } }
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2E8F0' }
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const cleanAreasStr = groupByArea ? (selectedAreas.length > 0 ? selectedAreas.join('_') : 'ALL') : 'MIXED';
      link.download = `CashMemoList_${cleanAreasStr}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      showToast('Excel Cashmemo generated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export to Excel', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <FileSpreadsheet size={32} />
          <div>
            <h1>HP Gas Delivery Memo Pro</h1>
            <span>Daily Cashmemo & eKYC Manager</span>
          </div>
        </div>
        
        {/* Dynamic File Selector & Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {(csvFiles.length > 0 || selectedFile.startsWith('Uploaded:')) && (
            <div className="csv-selector-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select className="csv-select-control" value={selectedFile} onChange={handleFileChange}>
                {csvFiles.map(file => (
                  <option key={file.name} value={file.name}>
                    {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                  </option>
                ))}
                {selectedFile.startsWith('Uploaded:') && (
                  <option value={selectedFile}>{selectedFile.substring(9, 39)}...</option>
                )}
              </select>
              
              {selectedFile.startsWith('Uploaded:') ? (
                <button 
                  className="theme-btn" 
                  onClick={handleRemoveUploadedFile} 
                  title="Remove uploaded file from browser memory" 
                  style={{ border: 'none', background: 'none', color: 'var(--danger)', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              ) : (
                selectedFile && (
                  <button 
                    className="theme-btn" 
                    onClick={handleDeleteFile} 
                    title="Delete this CSV file from computer disk" 
                    style={{ border: 'none', background: 'none', color: 'var(--danger)', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )
              )}
            </div>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()} 
            style={{ gap: '0.375rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            title="Upload any downloaded HP booking CSV directly in browser"
          >
            <Upload size={16} />
            <span>Upload Daily CSV</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLocalFileUpload} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => { setTempSettings({ ...settings }); setIsSettingsOpen(true); }}>
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button className="theme-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="main-content">
        {translationLoading && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderColor: 'var(--border-focus)', animation: 'pulse 2s infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
              <Languages className="animate-spin" size={20} />
              <span>Translating column values to Hindi ({translationProgress}%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${translationProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.1s ease' }}></div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={48} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            <h3>Processing Booking Records...</h3>
            <p>Scanning addresses, parsing fields, and loading layout details.</p>
          </div>
        ) : error ? (
          <div className="card" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Error Loading Workspace Data</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={fetchFiles}>
              Retry Scanning Directory
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state" style={{ gap: '1rem' }}>
            <FileSpreadsheet size={48} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            <h3>No Booking Records Loaded</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              The workspace folder does not contain any CSV files. Please upload your daily HP Gas refilling list below to get started.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: '0.5rem', gap: '0.5rem' }}
            >
              <Upload size={18} />
              <span>Select CSV File from Computer</span>
            </button>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Filter size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Matching Filters</span>
                  <span className="stat-value">{filteredData.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon accent">
                  <CheckSquare size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Checked for Export</span>
                  <span className="stat-value">{activeSelectedRows.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                  <Users size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Active Cylinders</span>
                  <span className="stat-value">{totalCylinders}</span>
                </div>
              </div>

              {includeRatesAndSignature && (
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                    <Coins size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total to Collect</span>
                    <span className="stat-value">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Panel */}
            <div className="card">
              <div className="card-title">
                <SlidersHorizontal size={20} />
                <span>Advanced Search & Filters</span>
              </div>
              
              {/* Row of Dropdowns */}
              <div className="grid-filters">
                {/* 1. Multi-Area Autocomplete Dropdown */}
                <div className="form-group" ref={areaRef}>
                  <label>Select Area(s)</label>
                  <div 
                    className={`multi-select-trigger ${isAreaDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                  >
                    {selectedAreas.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>All Areas ({uniqueAreas.length})</span>
                    ) : (
                      selectedAreas.map(area => (
                        <span key={area} className="multi-select-tag">
                          {area}
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAreas(selectedAreas.filter(a => a !== area));
                          }}>×</button>
                        </span>
                      ))
                    )}
                  </div>
                  {isAreaDropdownOpen && (
                    <div className="multi-select-dropdown">
                      <div className="multi-select-search" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Search area..."
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                        />
                      </div>
                      <div className="multi-select-option" onClick={() => {
                        setSelectedAreas(uniqueAreas);
                        setAreaSearch('');
                      }}>
                        <span className="font-bold">Select All Areas</span>
                      </div>
                      <div className="multi-select-option" onClick={() => setSelectedAreas([])}>
                        <span className="font-bold text-danger">Clear All</span>
                      </div>
                      {uniqueAreas
                        .filter(area => area.toLowerCase().includes(areaSearch.toLowerCase()))
                        .map(area => {
                          const isSelected = selectedAreas.includes(area);
                          return (
                            <div 
                              key={area}
                              className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedAreas(selectedAreas.filter(a => a !== area));
                                } else {
                                  setSelectedAreas([...selectedAreas, area]);
                                }
                              }}
                            >
                              <input type="checkbox" checked={isSelected} readOnly />
                              <span>{area}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 2. Multi-Delivery Man (Vendor) Autocomplete Dropdown */}
                <div className="form-group" ref={deliveryManRef}>
                  <label>Select Vendor / Delivery Agent</label>
                  <div 
                    className={`multi-select-trigger ${isDeliveryManDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsDeliveryManDropdownOpen(!isDeliveryManDropdownOpen)}
                  >
                    {selectedDeliveryMen.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>All Vendors ({uniqueDeliveryMen.length})</span>
                    ) : (
                      selectedDeliveryMen.map(man => (
                        <span key={man} className="multi-select-tag">
                          {man.split(' ')[0]}
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeliveryMen(selectedDeliveryMen.filter(m => m !== man));
                          }}>×</button>
                        </span>
                      ))
                    )}
                  </div>
                  {isDeliveryManDropdownOpen && (
                    <div className="multi-select-dropdown">
                      <div className="multi-select-search" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Search vendor..."
                          value={deliveryManSearch}
                          onChange={(e) => setDeliveryManSearch(e.target.value)}
                        />
                      </div>
                      <div className="multi-select-option" onClick={() => {
                        setSelectedDeliveryMen(uniqueDeliveryMen);
                        setDeliveryManSearch('');
                      }}>
                        <span className="font-bold">Select All Vendors</span>
                      </div>
                      <div className="multi-select-option" onClick={() => setSelectedDeliveryMen([])}>
                        <span className="font-bold text-danger">Clear All</span>
                      </div>
                      {uniqueDeliveryMen
                        .filter(man => man.toLowerCase().includes(deliveryManSearch.toLowerCase()))
                        .map(man => {
                          const isSelected = selectedDeliveryMen.includes(man);
                          return (
                            <div 
                              key={man}
                              className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDeliveryMen(selectedDeliveryMen.filter(m => m !== man));
                                } else {
                                  setSelectedDeliveryMen([...selectedDeliveryMen, man]);
                                }
                              }}
                            >
                              <input type="checkbox" checked={isSelected} readOnly />
                              <span>{man}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 3. eKYC Status Multi-select Dropdown */}
                <div className="form-group" ref={ekycRef}>
                  <label>Select eKYC Status(es)</label>
                  <div 
                    className={`multi-select-trigger ${isEkycDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsEkycDropdownOpen(!isEkycDropdownOpen)}
                  >
                    {selectedEkycStatuses.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>All Statuses ({uniqueEkycStatuses.length})</span>
                    ) : (
                      selectedEkycStatuses.map(status => (
                        <span key={status} className="multi-select-tag">
                          {status.split(' ')[0]}
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEkycStatuses(selectedEkycStatuses.filter(s => s !== status));
                          }}>×</button>
                        </span>
                      ))
                    )}
                  </div>
                  {isEkycDropdownOpen && (
                    <div className="multi-select-dropdown">
                      <div className="multi-select-search" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Search status..."
                          value={ekycSearch}
                          onChange={(e) => setEkycSearch(e.target.value)}
                        />
                      </div>
                      <div className="multi-select-option" onClick={() => {
                        setSelectedEkycStatuses(uniqueEkycStatuses);
                        setEkycSearch('');
                      }}>
                        <span className="font-bold">Select All</span>
                      </div>
                      <div className="multi-select-option" onClick={() => setSelectedEkycStatuses([])}>
                        <span className="font-bold text-danger">Clear All</span>
                      </div>
                      {uniqueEkycStatuses
                        .filter(status => status.toLowerCase().includes(ekycSearch.toLowerCase()))
                        .map(status => {
                          const isSelected = selectedEkycStatuses.includes(status);
                          return (
                            <div 
                              key={status}
                              className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedEkycStatuses(selectedEkycStatuses.filter(s => s !== status));
                                } else {
                                  setSelectedEkycStatuses([...selectedEkycStatuses, status]);
                                }
                              }}
                            >
                              <input type="checkbox" checked={isSelected} readOnly />
                              <span>{status}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 4. Refill Payment Dropdown */}
                <div className="form-group">
                  <label>Refill Payment (Online / Cash)</label>
                  <select 
                    className="input-control" 
                    value={paymentStatusFilter} 
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PAID">PAID (Online)</option>
                    <option value="UNPAID">CASH TO COLLECT (Unpaid)</option>
                  </select>
                </div>

                {/* 5. Date Range Selector - From Date */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    <span>From Date (इस तारीख से)</span>
                  </label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={startDate} 
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} 
                  />
                </div>

                {/* 6. Date Range Selector - To Date */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    <span>To Date (इस तारीख तक)</span>
                  </label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={endDate} 
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} 
                  />
                </div>
              </div>

              {/* Full Width Address and Village search */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Search in Address / Village Name (Supports multiple values separated by commas ",")</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Search e.g. mominpur, yamsam, 615814..."
                    value={textSearch}
                    onChange={(e) => { setTextSearch(e.target.value); setCurrentPage(1); }}
                    style={{ paddingLeft: '2rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  💡 Enter multiple village names or consumer IDs separated by commas to filter them all together.
                </span>
              </div>

              {/* Hindi Translation Widget */}
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Languages size={18} style={{ color: 'var(--primary)' }} />
                  <span>Translate Column to Hindi (हिंदी में बदलें):</span>
                </span>
                
                <select 
                  className="input-control" 
                  style={{ width: '180px', padding: '0.375rem 0.5rem', fontSize: '0.85rem' }} 
                  value={translationColumn}
                  onChange={(e) => setTranslationColumn(e.target.value)}
                >
                  <option value="ConsumerName">ConsumerName (नाम)</option>
                  <option value="AreaName">AreaName (गाँव/क्षेत्र)</option>
                  <option value="ConsumerAddress">ConsumerAddress (पता)</option>
                  <option value="EkycStatus">EkycStatus (eKYC स्थिति)</option>
                </select>

                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem' }} 
                  onClick={handleTranslateColumn}
                  disabled={translationLoading}
                >
                  Translate to Hindi (बदलें)
                </button>

                {hasTranslatedColumn[translationColumn] && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }} 
                    onClick={handleRevertTranslation}
                  >
                    Undo Translation (वापस बदलें)
                  </button>
                )}
                
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  <span>Translates only searched or checked rows. (केवल सर्च या टिक किए गए नाम ही बदलेंगे)</span>
                </span>
              </div>

              {/* Selection Batch Helpers (eKYC check/uncheck buttons) */}
              <div style={{ padding: '0.75rem 0', marginTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ListCheck size={16} />
                  <span>eKYC Quick Selectors:</span>
                </span>
                {uniqueEkycStatuses.map(status => (
                  <div key={status} style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => selectByEkycStatus(status, true)}
                    >
                      Check "{status}"
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }} 
                      onClick={() => selectByEkycStatus(status, false)}
                    >
                      Uncheck
                    </button>
                  </div>
                ))}
              </div>

              {/* Village/Address Quick Selector (गाँव/पता टिक-अनटिक टूल) */}
              <div style={{ padding: '0.75rem 0', marginTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                  <span>Quick Village Selector (गाँव के अनुसार टिक/अन-टिक करें):</span>
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Enter Village Name e.g. birsair, samou..."
                    value={villageSelectorText}
                    onChange={(e) => setVillageSelectorText(e.target.value)}
                    style={{ width: '250px', padding: '0.375rem 0.5rem', fontSize: '0.85rem' }}
                  />
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem' }} 
                    onClick={() => handleToggleByVillage('check')}
                  >
                    Check Matching (टिक करें)
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }} 
                    onClick={() => handleToggleByVillage('uncheck')}
                  >
                    Uncheck Matching (अन-टिक करें)
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem' }} 
                    onClick={() => handleToggleByVillage('keep-only')}
                  >
                    Keep Only This (केवल इसे टिक रखें)
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  💡 Type a village/address keyword (like "birsair") to quickly check or uncheck rows in the current filtered list.
                </span>
              </div>

              {/* Formatting and layout controls */}
              <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={includeRatesAndSignature} 
                    onChange={(e) => toggleIncludeRatesAndSignature(e.target.checked)} 
                  />
                  <span>Include Cylinder Rates & Signature Columns</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={useExcelClassicStyle} 
                    onChange={(e) => setUseExcelClassicStyle(e.target.checked)} 
                  />
                  <span>Classic Plain Grid Excel style (Matches PDF screenshot)</span>
                </label>
              </div>

              {/* Column Selection Checkboxes */}
              <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Select Columns to Include in Cashmemo (दिखाए जाने वाले कॉलम चुनें):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem 1rem' }}>
                  {Object.entries({
                    sn: 'Sn',
                    consumerNo: 'ConsumerNo',
                    consumerName: 'ConsumerName',
                    orderDate: 'OrderDate',
                    areaName: 'AreaName',
                    deliveryMan: 'DeliveryMan',
                    online: 'Online Paid Status',
                    ivrsNo: 'IVRSBookingNo',
                    mobileNo: 'MobileNo',
                    address: 'ConsumerAddress',
                    ekyc: 'EkycStatus',
                    rate: 'Cylinder Rate',
                    total: 'Total Amount',
                    signature: 'Signature/Remarks'
                  }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={settings.visibleColumns?.[key] !== false} 
                        onChange={() => toggleColumnVisibility(key)} 
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rows per page print settings */}
              <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Rows per page in PDF (पीडीएफ में प्रति पेज लाइन संख्या):
                </span>
                <select
                  className="input-control"
                  style={{ width: '120px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                  value={settings.rowsPerPrintPage || 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 15;
                    const updatedSettings = {
                      ...settings,
                      rowsPerPrintPage: val
                    };
                    setSettings(updatedSettings);
                    setTempSettings(updatedSettings);
                    saveSettingsQuietly(updatedSettings);
                  }}
                >
                  <option value={10}>10 lines</option>
                  <option value={15}>15 lines</option>
                  <option value={20}>20 lines</option>
                  <option value={25}>25 lines</option>
                  <option value={30}>30 lines</option>
                  <option value={40}>40 lines</option>
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                </select>
              </div>

              {/* PDF & Hindi translation tips/instructions banner */}
              <div style={{ 
                marginTop: '1rem', 
                borderTop: '1px solid var(--border)', 
                paddingTop: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem', 
                backgroundColor: 'var(--primary-light)', 
                border: '1px solid #bfdbfe', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.25rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>💡 PDF & Hindi Print Tips (महत्वपूर्ण सुझाव)</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: '1.4' }}>
                  <li>
                    <strong>For clean, selectable & small-size PDF:</strong> Click <strong>"Print PDF / Save"</strong> and select <strong>"Save as PDF"</strong> in your browser print options. This results in a very small file size (in KBs), enables copy/paste, and renders perfect Hindi characters.
                  </li>
                  <li>
                    <strong>साफ लिखावट और कॉपी करने योग्य PDF के लिए:</strong> <strong>"Print PDF / Save"</strong> बटन पर क्लिक करें और प्रिंट विकल्प में <strong>"Save as PDF"</strong> चुनें। इससे फाइल का साइज बहुत छोटा बनेगा और हिंदी के अक्षर बिल्कुल सही (Devanagari script) दिखेंगे।
                  </li>
                  <li>
                    <strong>Hindi in Excel:</strong> To get Excel sheets in Hindi, use the <strong>"Translate Column to Hindi"</strong> widget above first, then click download.
                  </li>
                </ul>
              </div>

              {/* Actions panel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={clearFilters}>
                    Reset Filters
                  </button>
                  <button className="btn btn-secondary" onClick={handleToggleAllFiltered}>
                    {filteredData.every(row => selectedRows.has(data.indexOf(row))) ? 'Uncheck All Filtered' : 'Check All Filtered'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleDownloadPdfDirect}
                    disabled={activeSelectedRows.length === 0}
                    style={{ gap: '0.5rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                  >
                    <Download size={18} />
                    <span>Download PDF ({activeSelectedRows.length})</span>
                  </button>

                  <button 
                    className="btn" 
                    onClick={handlePrintPdf}
                    disabled={activeSelectedRows.length === 0}
                    style={{ gap: '0.5rem', border: '1px solid #dc2626', color: '#dc2626', backgroundColor: 'transparent', fontWeight: 600 }}
                  >
                    <Printer size={18} />
                    <span>Print PDF / Save ({activeSelectedRows.length})</span>
                  </button>

                  <button 
                    className="btn" 
                    onClick={handleCopyToClipboard}
                    disabled={activeSelectedRows.length === 0}
                    style={{ gap: '0.5rem', border: '1px solid #10b981', color: '#10b981', backgroundColor: 'transparent', fontWeight: 600 }}
                  >
                    <Copy size={18} />
                    <span>Copy Clipboard ({activeSelectedRows.length})</span>
                  </button>

                  <button 
                    className="btn btn-primary" 
                    onClick={() => exportToExcel(true)} 
                    disabled={activeSelectedRows.length === 0}
                    style={{ gap: '0.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--border-focus) 100%)' }}
                  >
                    <Download size={18} />
                    <span>Download Excel (Area-wise) ({activeSelectedRows.length})</span>
                  </button>

                  <button 
                    className="btn btn-primary" 
                    onClick={() => exportToExcel(false)} 
                    disabled={activeSelectedRows.length === 0}
                    style={{ gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    <Download size={18} />
                    <span>Download Excel (Single Sheet) ({activeSelectedRows.length})</span>
                  </button>
                </div>
              </div>
            </div>



            {/* Data Table Card */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div className="font-bold">Showing {filteredData.length} records matching filters</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <strong>Selected Areas: </strong>
                    {selectedAreas.length > 0 ? selectedAreas.join(', ') : 'All Areas'}
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages || 1}</span>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredData.length > 0 && filteredData.every(row => selectedRows.has(data.indexOf(row)))}
                          onChange={handleToggleAllFiltered}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      {settings.visibleColumns?.sn !== false && <th>Sn</th>}
                      {settings.visibleColumns?.consumerNo !== false && <th>ConsumerNo</th>}
                      {settings.visibleColumns?.consumerName !== false && <th>ConsumerName</th>}
                      {settings.visibleColumns?.orderDate !== false && <th>OrderDate</th>}
                      {settings.visibleColumns?.areaName !== false && <th>AreaName</th>}
                      {settings.visibleColumns?.deliveryMan !== false && <th>DeliveryMan</th>}
                      {settings.visibleColumns?.online !== false && <th>Online</th>}
                      {settings.visibleColumns?.ivrsNo !== false && <th>IVRSBookingNo</th>}
                      {settings.visibleColumns?.mobileNo !== false && <th>MobileNo</th>}
                      {settings.visibleColumns?.address !== false && <th>ConsumerAddress</th>}
                      {settings.visibleColumns?.ekyc !== false && <th>EkycStatus</th>}
                      {settings.visibleColumns?.rate !== false && <th className="text-right">Rate</th>}
                      {settings.visibleColumns?.total !== false && <th className="text-right">Total</th>}
                      {settings.visibleColumns?.signature !== false && <th>Signature</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => {
                      const dataIndex = data.indexOf(row);
                      const isChecked = selectedRows.has(dataIndex);
                      const rate = getRate(row.Packagecode_Desc);
                      const qty = parseInt(row.OrderQuantity || 1, 10);
                      const isPaid = row.RefillPaymentStatus === 'PAID';
                      const dateOnly = row.OrderDate ? row.OrderDate.split(' ')[0] : '';

                      // Retrieve custom font sizes
                      const snSize = getColFontSize('sn', 9);
                      const noSize = getColFontSize('consumer_no', 9);
                      const nameSize = getColFontSize('name', 9.5);
                      const dateSize = getColFontSize('order_date', 9);
                      const areaSize = getColFontSize('area_name', 9);
                      const onlineSize = getColFontSize('online', 9);
                      const ivrsSize = getColFontSize('ivrs_no', 9);
                      const mobSize = getColFontSize('mobile_no', 9);
                      const addrSize = getColFontSize('address', 7.5);
                      const ekycSize = getColFontSize('ekyc', 9);

                      return (
                        <tr 
                          key={dataIndex} 
                          className={isChecked ? 'selected' : ''} 
                          onClick={() => handleToggleRow(dataIndex)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleToggleRow(dataIndex)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          {settings.visibleColumns?.sn !== false && <td style={{ fontSize: `${snSize}pt`, textAlign: 'center' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>}
                          {settings.visibleColumns?.consumerNo !== false && <td style={{ fontSize: `${noSize}pt` }}>{row.ConsumerNo}</td>}
                          {settings.visibleColumns?.consumerName !== false && <td style={{ fontSize: `${nameSize}pt`, fontWeight: 'bold' }}>{row.ConsumerName}</td>}
                          {settings.visibleColumns?.orderDate !== false && <td style={{ fontSize: `${dateSize}pt` }}>{dateOnly}</td>}
                          {settings.visibleColumns?.areaName !== false && <td style={{ fontSize: `${areaSize}pt` }}>{row.AreaName}</td>}
                          {settings.visibleColumns?.deliveryMan !== false && <td style={{ fontSize: '9pt' }}>{row.DeliveryMan}</td>}
                          {settings.visibleColumns?.online !== false && (
                            <td style={{ fontSize: `${onlineSize}pt`, textAlign: 'center', fontWeight: 'bold' }}>
                              {isPaid && (
                                <span className="badge badge-success">PAID</span>
                              )}
                            </td>
                          )}
                          {settings.visibleColumns?.ivrsNo !== false && <td style={{ fontSize: `${ivrsSize}pt` }}>{row.IVRSBookingNumber}</td>}
                          {settings.visibleColumns?.mobileNo !== false && <td style={{ fontSize: `${mobSize}pt` }}>{row.MobileNo}</td>}
                          {settings.visibleColumns?.address !== false && (
                            <td style={{ fontSize: `${addrSize}pt`, maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }} title={row.ConsumerAddress}>
                              {row.ConsumerAddress}
                            </td>
                          )}
                          {settings.visibleColumns?.ekyc !== false && (
                            <td style={{ fontSize: `${ekycSize}pt`, fontWeight: 'bold' }}>
                              <span className={`badge ${row.EkycStatus === 'EKYC DONE' ? 'badge-success' : 'badge-warning'}`}>
                                {row.EkycStatus}
                              </span>
                            </td>
                          )}
                          {settings.visibleColumns?.rate !== false && <td className="text-right" style={{ fontSize: `${getColFontSize('rate', 9)}pt` }}>₹{rate}</td>}
                          {settings.visibleColumns?.total !== false && <td className="text-right font-bold" style={{ fontSize: `${getColFontSize('total', 9)}pt` }}>₹{rate * qty}</td>}
                          {settings.visibleColumns?.signature !== false && <td></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="table-footer">
                  <span>Displaying {paginatedData.length} records ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length})</span>
                  <div className="pagination">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 2
                      ) {
                        return (
                          <button 
                            key={pageNum}
                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} style={{ padding: '0 0.25rem', display: 'flex', alignSelf: 'flex-end', color: 'var(--text-muted)' }}>...</span>;
                      }
                      return null;
                    })}
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Hidden Printable Area for window.print() */}
      {/* Hidden Printable Area for window.print() */}
      <div className="printable-area">
        {(() => {
          // Pre-calculate chunks for all areas based on settings.rowsPerPrintPage
          const areaGroups = Object.entries(
            activeSelectedRows.reduce((acc, row) => {
              const area = row.AreaName || 'Unknown Area';
              if (!acc[area]) acc[area] = [];
              acc[area].push(row);
              return acc;
            }, {})
          );

          const printChunks = areaGroups.flatMap(([areaName, areaRows]) => {
            const pageSize = settings.rowsPerPrintPage || 15;
            const chunks = [];
            for (let i = 0; i < areaRows.length; i += pageSize) {
              chunks.push(areaRows.slice(i, i + pageSize));
            }
            return chunks.map((chunkRows, chunkIdx) => ({
              areaName,
              chunkRows,
              chunkIdx,
              totalChunks: chunks.length,
              areaTotalRows: areaRows.length,
              areaTotalCylinders: areaRows.reduce((acc, r) => acc + parseInt(r.OrderQuantity || 1, 10), 0)
            }));
          });

          return printChunks.map(({ areaName, chunkRows, chunkIdx, totalChunks, areaTotalRows, areaTotalCylinders }, globalIdx) => {
            const visibleColsCount = Object.entries(settings.visibleColumns || {}).filter(([key, val]) => val !== false).length;
            const pageLabel = totalChunks > 1 ? ` (Page ${chunkIdx + 1}/${totalChunks})` : '';
            const isLastGlobal = globalIdx === printChunks.length - 1;
            const serialStart = chunkIdx * (settings.rowsPerPrintPage || 15) + 1;

            return (
              <div 
                key={`${areaName}-${chunkIdx}`} 
                className="print-area-section" 
                style={{ 
                  pageBreakAfter: isLastGlobal ? 'auto' : 'always', 
                  marginBottom: isLastGlobal ? '20px' : '0' 
                }}
              >
                <table className="print-table" style={{ width: '100%', marginBottom: '20px' }}>
                  <thead>
                    {/* Repeating title/metadata row that prints at the top of every page */}
                    <tr>
                      <th colSpan={visibleColsCount} style={{ padding: '6px 8px', backgroundColor: '#f2f2f2', borderBottom: '2px solid #000000', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: '"Nirmala UI", "Segoe UI", Arial, sans-serif' }}>
                          <div>
                            <span style={{ fontSize: '11pt', fontWeight: 'bold', color: '#000000' }}>{settings.agencyName}</span>
                            <span style={{ fontSize: '9pt', marginLeft: '1.5rem', color: '#000000', fontWeight: 'bold' }}>
                              Area: {areaName.toUpperCase()}{pageLabel}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#333333', fontWeight: 'normal' }}>
                            <strong>Total Booking:</strong> {areaTotalRows} | <strong>Cylinders:</strong> {areaTotalCylinders}
                          </div>
                        </div>
                      </th>
                    </tr>
                    {/* Column labels row */}
                    <tr>
                      {settings.visibleColumns?.sn !== false && <th style={{ width: '4%' }}>Sn</th>}
                      {settings.visibleColumns?.consumerNo !== false && <th style={{ width: '10%' }}>ConsumerNo</th>}
                      {settings.visibleColumns?.consumerName !== false && <th style={{ width: '18%' }}>ConsumerName</th>}
                      {settings.visibleColumns?.orderDate !== false && <th style={{ width: '10%' }}>OrderDate</th>}
                      {settings.visibleColumns?.areaName !== false && <th style={{ width: '12%' }}>AreaName</th>}
                      {settings.visibleColumns?.deliveryMan !== false && <th style={{ width: '15%' }}>DeliveryMan</th>}
                      {settings.visibleColumns?.online !== false && <th style={{ width: '8%' }}>Online</th>}
                      {settings.visibleColumns?.ivrsNo !== false && <th style={{ width: '11%' }}>IVRSBookingNo</th>}
                      {settings.visibleColumns?.mobileNo !== false && <th style={{ width: '11%' }}>MobileNo</th>}
                      {settings.visibleColumns?.address !== false && <th style={{ width: '38%' }}>ConsumerAddress</th>}
                      {settings.visibleColumns?.ekyc !== false && <th style={{ width: '10%' }}>EkycStatus</th>}
                      {settings.visibleColumns?.rate !== false && <th style={{ width: '8%' }}>Rate</th>}
                      {settings.visibleColumns?.total !== false && <th style={{ width: '8%' }}>Total</th>}
                      {settings.visibleColumns?.signature !== false && <th style={{ width: '20%' }}>Remarks / Signature</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {chunkRows.map((row, idx) => {
                      const dateOnly = row.OrderDate ? row.OrderDate.split(' ')[0] : '';
                      const rate = getRate(row.Packagecode_Desc);
                      const qty = parseInt(row.OrderQuantity || 1, 10);
                      const total = rate * qty;

                      return (
                        <tr key={idx}>
                          {settings.visibleColumns?.sn !== false && <td className="text-center" style={{ fontSize: `${getColFontSize('sn', 9)}pt` }}>{serialStart + idx}</td>}
                          {settings.visibleColumns?.consumerNo !== false && <td style={{ fontSize: `${getColFontSize('consumer_no', 9)}pt` }}>{row.ConsumerNo}</td>}
                          {settings.visibleColumns?.consumerName !== false && <td className="font-bold" style={{ fontSize: `${getColFontSize('name', 9.5)}pt` }}>{row.ConsumerName}</td>}
                          {settings.visibleColumns?.orderDate !== false && <td style={{ fontSize: `${getColFontSize('order_date', 9)}pt` }}>{dateOnly}</td>}
                          {settings.visibleColumns?.areaName !== false && <td style={{ fontSize: `${getColFontSize('area_name', 8)}pt` }}>{row.AreaName}</td>}
                          {settings.visibleColumns?.deliveryMan !== false && <td style={{ fontSize: '8.5pt' }}>{row.DeliveryMan}</td>}
                          {settings.visibleColumns?.online !== false && (
                            <td className="text-center font-bold" style={{ fontSize: `${getColFontSize('online', 9)}pt` }}>
                              {row.RefillPaymentStatus === 'PAID' ? 'PAID' : ''}
                            </td>
                          )}
                          {settings.visibleColumns?.ivrsNo !== false && <td style={{ fontSize: `${getColFontSize('ivrs_no', 9)}pt` }}>{row.IVRSBookingNumber}</td>}
                          {settings.visibleColumns?.mobileNo !== false && <td style={{ fontSize: `${getColFontSize('mobile_no', 9)}pt` }}>{row.MobileNo}</td>}
                          {settings.visibleColumns?.address !== false && <td className="address-cell" style={{ fontSize: `${getColFontSize('address', 7.5)}pt` }}>{row.ConsumerAddress}</td>}
                          {settings.visibleColumns?.ekyc !== false && <td className="font-bold" style={{ fontSize: `${getColFontSize('ekyc', 9)}pt` }}>{row.EkycStatus}</td>}
                          {settings.visibleColumns?.rate !== false && <td className="text-right" style={{ fontSize: `${getColFontSize('rate', 9)}pt` }}>₹{rate}</td>}
                          {settings.visibleColumns?.total !== false && <td className="text-right font-bold" style={{ fontSize: `${getColFontSize('total', 9)}pt` }}>₹{total}</td>}
                          {settings.visibleColumns?.signature !== false && <td></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          });
        })()}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '95%' }}>
            <div className="modal-header">
              <h2>Agency Settings & Formatting</h2>
              <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Distributor settings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label>Distributor/Agency Name</label>
                  <input
                    type="text"
                    className="input-control"
                    value={tempSettings.agencyName}
                    onChange={(e) => setTempSettings({ ...tempSettings, agencyName: e.target.value })}
                    placeholder="Enter Agency Name"
                  />
                </div>

                <div className="form-group">
                  <label>Default Rate (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={tempSettings.defaultRate}
                    onChange={(e) => setTempSettings({ ...tempSettings, defaultRate: parseInt(e.target.value, 10) || 0 })}
                    placeholder="Default Rate"
                  />
                </div>

              </div>

              {/* Dynamic Font Sizes Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <label className="font-bold" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Type size={16} />
                  <span>Column Font Sizes (कॉलम का फ़ॉन्ट साइज - pt)</span>
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  {Object.entries(tempSettings.columnFonts || {}).map(([colKey, size]) => {
                    const readableName = colKey.toUpperCase().replace('_', ' ');
                    return (
                      <div key={colKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span>{readableName}:</span>
                        <input
                          type="number"
                          className="input-control"
                          style={{ width: '60px', padding: '0.25rem', height: '28px', textAlign: 'right' }}
                          step="0.5"
                          min="5"
                          max="20"
                          value={size}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 9;
                            setTempSettings({
                              ...tempSettings,
                              columnFonts: {
                                ...tempSettings.columnFonts,
                                [colKey]: val
                              }
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cylinder Specific Rates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="font-bold" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cylinder Specific Rates (₹)</label>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={syncRateSettings}>
                    Detect cylinder types from CSV
                  </button>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table className="rate-settings-table">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <th>Cylinder Description</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Rate (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(tempSettings.rates).length === 0 ? (
                        <tr>
                          <td colSpan="2" className="text-center" style={{ color: 'var(--text-muted)', padding: '1rem' }}>
                            No custom rates detected. Click 'Detect cylinder types' to list and assign rates.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(tempSettings.rates).map(([pkg, rate]) => (
                          <tr key={pkg}>
                            <td style={{ fontSize: '0.75rem', fontWeight: 500 }}>{pkg}</td>
                            <td>
                              <input
                                type="number"
                                value={rate}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setTempSettings({
                                    ...tempSettings,
                                    rates: {
                                      ...tempSettings.rates,
                                      [pkg]: val
                                    }
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast.show && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          <CheckCircle2 size={18} style={{ color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
