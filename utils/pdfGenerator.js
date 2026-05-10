import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generatePDF(htmlContent, options = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      },
      ...options
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export function generateCertificateHTML(template, data) {
  // This will be implemented per certificate type
  return template(data);
}