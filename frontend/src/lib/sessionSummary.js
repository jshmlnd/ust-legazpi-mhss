export const stripSummaryMarkdown = (value = '') => String(value)
  .replace(/\*\*(.*?)\*\*/gs, '$1')
  .replace(/__(.*?)__/gs, '$1')
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/^\s*[-*+]\s+/gm, '- ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const toFilename = (appointment) => {
  const date = String(appointment?.date || 'session').replace(/[^a-z0-9-]+/gi, '-');
  return `session-documentation-${date}`;
};

const isHeading = (line) => /^(Presenting concern|Key themes|Interventions and response|Plan and follow-up|Risk\/safety):$/i.test(line.trim());

const toPdfText = (value) => value
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[–—]/g, '-')
  .replace(/…/g, '...')
  .replace(/\u00a0/g, ' ')
  .replace(/[^\x20-\x7e]/g, '');

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadSummaryDocx = async ({ appointment, summary }) => {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const text = stripSummaryMarkdown(summary);
  const paragraphs = text.split('\n').map((line) => {
    const value = line.trim();
    if (!value) return new Paragraph({ spacing: { after: 100 } });
    if (isHeading(value)) {
      return new Paragraph({
        children: [new TextRun({ text: value, bold: true })],
        spacing: { before: 180, after: 80 },
      });
    }
    if (value.startsWith('- ')) {
      return new Paragraph({
        children: [new TextRun({ text: value.slice(2) })],
        bullet: { level: 0 },
        spacing: { after: 80 },
      });
    }
    return new Paragraph({ children: [new TextRun({ text: value })], spacing: { after: 80 } });
  });
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Session Documentation', bold: true, size: 32 })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Student: ${appointment?.studentName || 'Anonymous Student'}`, bold: true })],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `${appointment?.type || 'Session'} session - ${appointment?.date || ''}`, italics: true })],
          spacing: { after: 240 },
        }),
        ...paragraphs,
      ],
    }],
  });
  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${toFilename(appointment)}.docx`);
};

export const downloadSummaryPdf = async ({ appointment, summary }) => {
  const { jsPDF } = await import('jspdf');
  const text = stripSummaryMarkdown(summary).split('\n').map(toPdfText);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const lineHeight = 14;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Session Documentation', margin, y);
  y += 24;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Student: ${toPdfText(appointment?.studentName || 'Anonymous Student')}`, margin, y);
  y += 16;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${appointment?.type || 'Session'} session - ${appointment?.date || ''}`, margin, y);
  y += 24;

  const drawParagraph = (paragraph, bold = false) => {
    if (!paragraph) {
      y += 8;
      return;
    }
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 11 : 10);
    const lines = pdf.splitTextToSize(paragraph, pageWidth - margin * 2);
    for (const line of lines) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += bold ? 5 : 2;
  };

  for (const paragraph of text) drawParagraph(paragraph, isHeading(paragraph));

  pdf.save(`${toFilename(appointment)}.pdf`);
};
