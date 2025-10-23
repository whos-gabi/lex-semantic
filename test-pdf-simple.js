const pdfParse = require('pdf-parse');

// Test with a simple PDF
const fs = require('fs');
const path = require('path');

async function testPDF() {
  try {
    const pdfPath = path.join(__dirname, 'uploads', 'Serverles WEB App cu EJS.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log('PDF buffer size:', pdfBuffer.length);
    console.log('PDF header:', pdfBuffer.toString('ascii', 0, 10));
    
    const data = await pdfParse(pdfBuffer);
    console.log('PDF parsed successfully!');
    console.log('Text length:', data.text.length);
    console.log('First 200 chars:', data.text.substring(0, 200));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDF();
