const DEFAULT_SETTINGS = {
  agencyName: process.env.AGENCY_NAME || 'Shiv Shakti Hp Gas Agency ,Pandaul',
  rates: {
    '14.2 KG NON-SUBSIDIZED CYLINDER-LD(DBTL CTC)': 950,
    '14.2 KG NON-SUBSIDIZED CYLINDER': 950,
    '16-Scheme Ujjwala': 650,
    '19.0 KG NON-SUBSIDIZED CYLINDER': 1850,
    '5.0 KG NON-SUBSIDIZED CYLINDER': 380
  },
  defaultRate: 950,
  rowsPerPrintPage: 15,
  whatsAppMethod: 'web',
  columnFonts: {
    sn: 8, consumer_no: 8, name: 8.5, order_date: 8, area_name: 8,
    online: 8, ivrs_no: 8, mobile_no: 8, address: 6.8, ekyc: 8,
    rate: 8, total: 8, signature: 8
  },
  vendors: [],
  visibleColumns: {
    sn: true, consumerNo: true, consumerName: true, orderDate: true,
    areaName: true, deliveryMan: true, online: true, ivrsNo: true,
    mobileNo: true, address: true, ekyc: true, rate: true, total: true, signature: true
  }
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  }

  return res.status(200).json(DEFAULT_SETTINGS);
}
