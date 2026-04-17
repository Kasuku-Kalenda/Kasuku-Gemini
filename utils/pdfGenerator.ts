
// We can't import external libraries, so we will assume jsPDF is loaded via CDN.
// In index.html, one would add: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// For this environment, we will mock the functionality.
import type { Event } from '../types';

declare const jspdf: any;

export const generatePdf = (event: Event) => {
    // Check if jsPDF is available
    if (typeof jspdf === 'undefined') {
        alert("PDF generation is currently unavailable. Please try again later.");
        console.error("jsPDF library not found. Please load it from a CDN.");
        return;
    }
    
    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Set up document
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor('#0E6251'); // Secondary color
        doc.text(event.title, 15, 20);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor('#2C3E50'); // Dark color
        
        let dateStr = event.dateISO ? new Date(event.dateISO).toLocaleDateString() : event.period;
        doc.text(`Date: ${dateStr || 'N/A'}`, 15, 30);

        doc.setFontSize(11);
        doc.setTextColor('#555');
        const summaryLines = doc.splitTextToSize(event.summary, 180); // 180 is width
        doc.text(summaryLines, 15, 40);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor('#E67E22'); // Primary color
        doc.text('Sources:', 15, 100);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#007BFF');
        let yPos = 108;
        event.sources.forEach(source => {
            if (yPos < 280) {
                 doc.textWithLink(source.label, 15, yPos, { url: source.url });
                 yPos += 7;
            }
        });

        doc.save(`${event.slug}.pdf`);

    } catch (e) {
        alert("An error occurred while generating the PDF.");
        console.error("PDF generation failed", e);
    }
};
