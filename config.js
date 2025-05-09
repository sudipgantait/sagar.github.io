/*
HOW TO SET UP GOOGLE SHEETS:

1. Create a new Google Sheet:
   - Go to sheets.google.com
   - Create a new sheet
   - Add these column headers: Name, Category, Description
   - Enter your medicine data

2. Share and publish the sheet:
   - Click "File" > "Share" > "Publish to web"
   - In the first dropdown, select your sheet name
   - In the second dropdown, select "Comma-separated values (.csv)"
   - Click "Publish"
   - Copy the provided URL

3. Update this URL:
   - Replace the URL below with your published Google Sheet URL
   - The URL should look like: https://docs.google.com/spreadsheets/d/e/[YOUR_SHEET_ID]/pub?output=csv
*/

export const CONFIG = {
    // Replace this URL with your Google Sheets published URL
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLIFgPpgcaz3BTZ71JfHcoaYap8lwe1pvaOJ8kymT8SZDPPIJyvjWTi5sjW9uPU-3pYEu7Ejgv_E6l/pub?gid=0&single=true&output=csv',
    
    // How often to check for updates (in milliseconds)
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
      // Cache settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache,
    
    // Fallback data to use when connection fails
    FALLBACK_DATA: [
        { name: 'Paracetamol', category: 'Pain Relief', description: 'For fever and mild pain' },
        { name: 'Amoxicillin', category: 'Antibiotics', description: 'Antibiotic medication' },
        { name: 'Omeprazole', category: 'Digestive', description: 'For acid reflux and ulcers' },
        { name: 'Cetirizine', category: 'Allergy', description: 'For allergies and hay fever' }
    ]
};
