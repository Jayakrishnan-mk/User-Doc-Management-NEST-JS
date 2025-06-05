import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class IngestionService {
  async processDocument(
    doc: any,
    updateStatus: (status: string) => Promise<void>,
  ) {
    const filePath = doc.fileUrl.startsWith('/')
      ? doc.fileUrl.slice(1)
      : doc.fileUrl;
    if (!fs.existsSync(filePath)) {
      await updateStatus('failed');
      return { error: 'File not found for document' };
    }
    // If PDF, use pdf-parse for full text extraction
    if (filePath.toLowerCase().endsWith('.pdf')) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        // VirusTotal scan for PDF
        const vtResult = await this.scanWithVirusTotal(filePath);
        await updateStatus('complete');
        return {
          message: 'PDF parsed',
          text: pdfData.text,
          virusTotal: {
            ...vtResult,
            note: 'VirusTotal scan may take several minutes. Please check the scanUrl later for results.',
          },
        };
      } catch (err) {
        await updateStatus('failed');
        return { error: 'PDF parsing failed', details: err.message };
      }
    }
    // Otherwise, use OCR.Space for images (Optical Character Recognition)
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('apikey', process.env.OCR_SPACE_API_KEY);
    try {
      const response = await axios.post(
        'https://api.ocr.space/parse/image',
        form,
        {
          headers: form.getHeaders(),
        },
      );
      // VirusTotal scan for image
      const vtResult = await this.scanWithVirusTotal(filePath);
      await updateStatus('complete');
      return {
        message: 'Ingestion complete',
        ocrResult: response.data,
        virusTotal: {
          ...vtResult,
          note: 'VirusTotal scan may take several minutes. Please check the scanUrl later for results.',
        },
      };
    } catch (err) {
      await updateStatus('failed');
      return { error: 'OCR failed', details: err.message };
    }
  }

  async scanWithVirusTotal(filePath: string) {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) return { error: 'VirusTotal API key not set' };
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      const response = await axios.post(
        'https://www.virustotal.com/api/v3/files',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-apikey': apiKey,
          },
        },
      );
      // The scan is asynchronous; return scan id/link for user to check
      const scanId = response.data.data.id;
      const scanUrl = `https://www.virustotal.com/gui/file/${scanId}/detection`;
      return { scanId, scanUrl };
    } catch (err) {
      return { error: 'VirusTotal scan failed', details: err.message };
    }
  }
}
