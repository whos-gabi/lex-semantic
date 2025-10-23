/**
 * PDF Module - PDF text extraction and processing
 */

const pdfParse = require('pdf-parse');

export interface PDFResult {
  text: string;
  pages: number;
  info: any;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFResult> {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    
    return {
      text: pdfData.text,
      pages: pdfData.numpages,
      info: pdfData.info
    };
  } catch (error) {
    console.error('❌ PDF processing error:', error);
    throw new Error('Failed to process PDF: ' + (error as Error).message);
  }
}

/**
 * Format extracted text
 */
export function formatText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
}

/**
 * Parse multipart form data to extract PDF buffer
 */
export function parseMultipartData(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const contentTypeHeader = req.headers['content-type'];
    const boundaryMatch = contentTypeHeader?.match(/boundary=(.+)/);
    const boundary = boundaryMatch ? boundaryMatch[1] : null;

    if (!boundary) {
      reject(new Error('Invalid content type'));
      return;
    }

    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const fullBuffer = Buffer.concat(chunks);
        
        // Find the PDF content between boundaries
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        
        // Find start of PDF content
        let startIndex = fullBuffer.indexOf(boundaryBuffer);
        if (startIndex === -1) {
          reject(new Error('Invalid form data'));
          return;
        }

        // Find the actual PDF content (after headers)
        const contentDispositionHeader = Buffer.from('Content-Disposition: form-data; name="pdf"; filename=');
        startIndex = fullBuffer.indexOf(contentDispositionHeader, startIndex);
        if (startIndex === -1) {
          reject(new Error('Invalid form data: Content-Disposition missing'));
          return;
        }

        const pdfStart = fullBuffer.indexOf(Buffer.from('\r\n\r\n'), startIndex);
        if (pdfStart === -1) {
          reject(new Error('Invalid form data'));
          return;
        }

        // Find end of PDF content
        const pdfEnd = fullBuffer.indexOf(boundaryBuffer, pdfStart);
        if (pdfEnd === -1) {
          reject(new Error('Invalid form data'));
          return;
        }

        // Extract PDF content
        const pdfBuffer = fullBuffer.slice(pdfStart + 4, pdfEnd);
        
        // Validate PDF header
        const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
        if (pdfBuffer.length < 4 || pdfHeader !== '%PDF') {
          reject(new Error('Invalid PDF file'));
          return;
        }

        resolve(pdfBuffer);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', (error: Error) => {
      reject(error);
    });
  });
}
