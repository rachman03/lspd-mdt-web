import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename: string;
  onProgress?: (status: string) => void;
}

/**
 * Generates and downloads a high-resolution A4 PDF directly in the browser
 * without depending on window.print() or iframe modal permissions.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<boolean> {
  const { filename, onProgress } = options;
  try {
    onProgress?.('Mempersiapkan dokumen...');

    // Render element to high-res canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (retina / 300dpi equivalent)
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // Standard A4 pixel width at 96dpi
    });

    onProgress?.('Menghasilkan berkas PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height in mm corresponding to pdfWidth
    const imgHeightMm = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeightMm;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightMm, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Subsequent pages if document exceeds one A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightMm, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanName);

    onProgress?.('Unduhan PDF selesai!');
    return true;
  } catch (error) {
    console.error('Gagal membuat PDF:', error);
    onProgress?.('Terjadi kesalahan saat membuat PDF.');
    return false;
  }
}

/**
 * Fallback print handler that attempts browser print,
 * with fallback to isolated hidden print iframe.
 */
export function triggerBrowserPrint(): boolean {
  try {
    if (typeof window !== 'undefined') {
      window.print();
      return true;
    }
  } catch (e) {
    console.warn('window.print() gagal atau diblokir sandbox iframe:', e);
  }
  return false;
}
