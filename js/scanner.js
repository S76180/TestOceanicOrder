/* ============================================
   ICONMIC - QR Scanner Logic
   ============================================ */

let html5QrCode = null;
let isScanning = false;

/* ---------- Scanner Controls ---------- */

async function startScanner() {
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');
  const overlay = document.getElementById('scannerOverlay');

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('qrReader');
    }

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1
      },
      onScanSuccess,
      onScanFailure
    );

    isScanning = true;
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    if (overlay) overlay.style.display = 'flex';

    showToast('Camera started. Point at a QR code.', 'info');
  } catch (err) {
    console.error('Scanner error:', err);

    if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
      showToast('Camera permission denied. Please allow camera access.', 'error');
    } else if (err.toString().includes('NotFoundError')) {
      showToast('No camera found on this device.', 'error');
    } else {
      showToast('Could not start camera. Try the manual code entry.', 'error');
    }
  }
}

async function stopScanner() {
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');

  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
    } catch (e) {
      console.error('Error stopping scanner:', e);
    }
    isScanning = false;
  }

  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
}

/* ---------- Scan Handlers ---------- */

function onScanSuccess(decodedText) {
  stopScanner();
  processQRCode(decodedText);
}

function onScanFailure() {
  // Scanning in progress - no action needed on each failed frame
}

/* ---------- QR Code Processing ---------- */

function processQRCode(code) {
  const bookId = parseQRCode(code);

  if (!bookId) {
    showToast('Invalid QR code. Please scan an ICONMIC card.', 'error');
    return;
  }

  checkAuthAndRedirect(bookId);
}

function parseQRCode(code) {
  // QR code format examples:
  // 1. Direct URL: https://iconmic.com/read/book-1
  // 2. Code format: ICONMIC-BOOK-001
  // 3. Short format: book-1

  if (code.includes('iconmic.com/read/')) {
    const parts = code.split('/read/');
    return parts[1] || null;
  }

  if (code.startsWith('ICONMIC-')) {
    const parts = code.split('-');
    if (parts.length >= 3) {
      const bookNum = parseInt(parts[2]);
      return `book-${bookNum}`;
    }
  }

  if (code.startsWith('book-')) {
    return code;
  }

  // Try to find a matching book
  const matchedBook = SAMPLE_BOOKS.find(b =>
    b.id === code ||
    b.title.toLowerCase() === code.toLowerCase()
  );

  return matchedBook ? matchedBook.id : null;
}

async function checkAuthAndRedirect(bookId) {
  const user = await getCurrentUser();
  const demoUser = JSON.parse(localStorage.getItem('iconmic_demo_user') || 'null');

  if (!user && !demoUser) {
    sessionStorage.setItem('iconmic_redirect', `reader.html?id=${bookId}`);
    showToast('Please sign in to read this book', 'info');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  showScanResult(bookId);
}

function showScanResult(bookId) {
  const result = document.getElementById('scanResult');
  const bookInfo = document.getElementById('scanBookInfo');
  const readBtn = document.getElementById('scanReadBtn');

  const book = SAMPLE_BOOKS.find(b => b.id === bookId);

  if (!book) {
    showToast('Book not found in library', 'error');
    return;
  }

  if (bookInfo) {
    bookInfo.innerHTML = `
      <h4>${book.title}</h4>
      <p>by ${book.author}</p>
      <p style="margin-top: 0.5rem; font-size: 0.85rem;">${book.description}</p>
    `;
  }

  if (readBtn) {
    readBtn.href = `reader.html?id=${bookId}`;
  }

  if (result) {
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth' });
  }

  showToast('Book found!', 'success');
}

/* ---------- Manual Code Entry ---------- */

function processManualCode() {
  const input = document.getElementById('manualCode');
  if (!input) return;

  const code = input.value.trim();
  if (!code) {
    showToast('Please enter a book code', 'error');
    return;
  }

  processQRCode(code);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('manualCode');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        processManualCode();
      }
    });
  }

  // Check for QR code in URL params
  const qrParam = getQueryParam('code');
  if (qrParam) {
    processQRCode(qrParam);
  }
});
