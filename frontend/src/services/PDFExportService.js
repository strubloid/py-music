import React, { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const PDFExportService = {
  // Method 1: High-Quality HTML-to-PDF (Recommended)
  exportAsHighQualityPDF: async (musicLines, options = {}) => {
    const {
      title = 'My Song',
      fontSize = 14,
      chordFontSize = 14,
      lineSpacing = 25,
      pageMargin = 40,
      showChords = true,
      showLyrics = true
    } = options

    // Create optimized print container
    const printContainer = document.createElement('div')
    printContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 794px;
      background: white;
      padding: ${pageMargin}px;
      font-family: 'Georgia', serif;
      box-sizing: border-box;
      min-height: 1000px;
    `

    // Generate clean HTML structure
    let html = `
      <div style="margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333; font-family: 'Arial', sans-serif;">${title}</h1>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="song-content">
    `

    musicLines.forEach((line, lineIndex) => {
      if ((line.chords?.length > 0 && showChords) || (line.text && showLyrics)) {
        html += `<div style="margin-bottom: ${lineSpacing}px; page-break-inside: avoid;">`

        // Chords with accurate positioning
        if (line.chords?.length > 0 && showChords) {
          html += `<div style="position: relative; height: 35px; margin-bottom: 5px;">`
          
          line.chords.forEach((chord, chordIndex) => {
            const position = line.chordPositions?.[chordIndex] || (chordIndex * 100 + 10)
            const printPosition = Math.max(0, Math.min(position * 0.6, 650)) // Scale and bound
            
            html += `
              <span style="
                position: absolute;
                left: ${printPosition}px;
                font-weight: bold;
                font-size: ${chordFontSize}px;
                color: #2c3e50;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                padding: 6px 12px;
                border-radius: 15px;
                border: 1px solid #dee2e6;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                font-family: 'Arial', sans-serif;
              ">${chord}</span>
            `
          })
          
          html += `</div>`
        }

        // Lyrics
        if (line.text && showLyrics) {
          html += `
            <div style="
              font-size: ${fontSize}px;
              line-height: 1.8;
              color: #2c3e50;
              padding: 12px 0;
              border-bottom: 1px dotted #bdc3c7;
              font-family: 'Georgia', serif;
            ">${line.text}</div>
          `
        }

        html += `</div>`
      }
    })

    html += `</div>`
    printContainer.innerHTML = html
    document.body.appendChild(printContainer)

    try {
      // Capture with high quality
      const canvas = await html2canvas(printContainer, {
        scale: 3, // Ultra-high resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: Math.max(1123, printContainer.scrollHeight + 80),
        logging: false,
        imageTimeout: 0
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgAspectRatio = canvas.height / canvas.width
      const imgHeight = pdfWidth * imgAspectRatio

      // Handle multi-page
      let yOffset = 0
      while (yOffset < imgHeight) {
        const pageHeight = Math.min(pdfHeight, imgHeight - yOffset)
        
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -yOffset,
          pdfWidth,
          imgHeight,
          undefined,
          'FAST'
        )

        yOffset += pdfHeight
        if (yOffset < imgHeight) {
          pdf.addPage()
        }
      }

      document.body.removeChild(printContainer)
      return pdf.save(`song-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`)

    } catch (error) {
      document.body.removeChild(printContainer)
      throw error
    }
  },

  // Method 2: Native Browser Print (Alternative)
  exportViaPrint: (musicLines, options = {}) => {
    const printWindow = window.open('', '_blank')
    const { title = 'My Song' } = options

    const printCSS = `
      <style>
        @page { 
          margin: 20mm; 
          size: A4;
        }
        body { 
          font-family: Georgia, serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .song-header {
          border-bottom: 2px solid #333;
          margin-bottom: 30px;
          padding-bottom: 15px;
        }
        .song-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          font-family: Arial, sans-serif;
        }
        .song-date {
          font-size: 12px;
          color: #666;
          margin: 8px 0 0 0;
        }
        .music-line {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .chords-container {
          position: relative;
          height: 35px;
          margin-bottom: 5px;
        }
        .chord {
          position: absolute;
          font-weight: bold;
          font-size: 14px;
          background: #f8f9fa;
          padding: 6px 12px;
          border-radius: 15px;
          border: 1px solid #dee2e6;
          font-family: Arial, sans-serif;
        }
        .lyrics {
          font-size: 14px;
          padding: 12px 0;
          border-bottom: 1px dotted #bdc3c7;
        }
      </style>
    `

    let printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        ${printCSS}
      </head>
      <body>
        <div class="song-header">
          <h1 class="song-title">${title}</h1>
          <p class="song-date">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
    `

    musicLines.forEach((line) => {
      if (line.chords?.length > 0 || line.text) {
        printHTML += `<div class="music-line">`

        if (line.chords?.length > 0) {
          printHTML += `<div class="chords-container">`
          line.chords.forEach((chord, index) => {
            const position = line.chordPositions?.[index] || (index * 100 + 10)
            const scaledPosition = Math.max(0, position * 0.5)
            printHTML += `<span class="chord" style="left: ${scaledPosition}px;">${chord}</span>`
          })
          printHTML += `</div>`
        }

        if (line.text) {
          printHTML += `<div class="lyrics">${line.text}</div>`
        }

        printHTML += `</div>`
      }
    })

    printHTML += `
        </body>
      </html>
    `

    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  },

  // Method 3: Text-Only Export (Fast, simple)
  exportAsText: (musicLines, title = 'My Song') => {
    let textContent = `${title}\n`
    textContent += `Generated: ${new Date().toLocaleDateString()}\n`
    textContent += `${'='.repeat(50)}\n\n`

    musicLines.forEach((line, index) => {
      if (line.chords?.length > 0 || line.text) {
        // Chords line
        if (line.chords?.length > 0) {
          let chordLine = ''
          let maxPos = 0
          
          // Build chord line with spacing
          line.chords.forEach((chord, chordIndex) => {
            const position = Math.floor((line.chordPositions?.[chordIndex] || (chordIndex * 100 + 10)) / 10)
            while (chordLine.length < position) {
              chordLine += ' '
            }
            chordLine += chord
            maxPos = Math.max(maxPos, position + chord.length)
          })
          
          textContent += chordLine + '\n'
        }

        // Lyrics line
        if (line.text) {
          textContent += line.text + '\n'
        }

        textContent += '\n'
      }
    })

    // Download as .txt file
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}

export default PDFExportService