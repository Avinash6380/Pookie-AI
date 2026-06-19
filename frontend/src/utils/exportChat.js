import { jsPDF } from 'jspdf';

// 1. EXPORT CHAT HISTORY AS TXT BLOB
export const exportToTxt = (characterName, messages) => {
  let content = `Pookie AI Companion Chat Log\n`;
  content += `Companion Character: ${characterName}\n`;
  content += `Export Date: ${new Date().toLocaleString()}\n`;
  content += `=========================================================\n\n`;

  messages.forEach((msg) => {
    const time = new Date(msg.timestamp).toLocaleString();
    const speaker = msg.role === 'user' ? 'You' : characterName;
    content += `[${time}] ${speaker}: ${msg.content}\n`;
    if (msg.reaction) {
      content += `Reaction: ${msg.reaction}\n`;
    }
    content += `\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PookieAI_Chat_${characterName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

// 2. EXPORT CHAT HISTORY AS PDF USING JSPDF
export const exportToPdf = (characterName, messages) => {
  const doc = new jsPDF();
  let yOffset = 20;
  const pageWidth = 170; // Text margin boundaries

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Pookie AI Chat Transcript`, 20, yOffset);
  yOffset += 10;

  // Metadata
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Companion Partner: ${characterName} | Exported: ${new Date().toLocaleString()}`, 20, yOffset);
  yOffset += 15;

  messages.forEach((msg) => {
    // Check page overflow
    if (yOffset > 270) {
      doc.addPage();
      yOffset = 20;
    }

    const time = new Date(msg.timestamp).toLocaleString();
    const speaker = msg.role === 'user' ? 'You' : characterName;

    // Header info (Sender + Timestamp)
    doc.setFont('Helvetica', 'bold');
    doc.text(`[${time}] ${speaker}:`, 20, yOffset);
    yOffset += 6;

    // Message body text wrap
    doc.setFont('Helvetica', 'normal');
    const textLines = doc.splitTextToSize(msg.content, pageWidth);
    textLines.forEach((line) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      doc.text(line, 20, yOffset);
      yOffset += 6;
    });

    // Reaction if present
    if (msg.reaction) {
      doc.setFont('Helvetica', 'italic');
      doc.text(`Reaction: ${msg.reaction}`, 20, yOffset);
      yOffset += 6;
    }

    yOffset += 4; // Buffer between message elements
  });

  // Save the PDF
  doc.save(`PookieAI_Chat_${characterName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
};
