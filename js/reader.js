/* ============================================
   ICONMIC - Reader Logic + Anti-Piracy
   ============================================ */

let currentBook = null;
let currentChapter = 0;
let totalChapters = 1;
let fontSizeLevel = 2;
const fontSizes = ['font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl'];

document.addEventListener('DOMContentLoaded', () => {
  initReader();
  initAntiPiracy();
});

/* ---------- Reader Init ---------- */

async function initReader() {
  const bookId = getQueryParam('id');
  if (!bookId) {
    window.location.href = 'library.html';
    return;
  }

  const user = await getCurrentUser();
  const demoUser = JSON.parse(localStorage.getItem('iconmic_demo_user') || 'null');

  if (!user && !demoUser) {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('readerContainer').style.display = 'none';
    document.getElementById('chapterNav').style.display = 'none';

    sessionStorage.setItem('iconmic_redirect', `reader.html?id=${bookId}`);
    return;
  }

  const book = SAMPLE_BOOKS.find(b => b.id === bookId);
  if (!book) {
    showToast('Book not found', 'error');
    setTimeout(() => { window.location.href = 'library.html'; }, 1500);
    return;
  }

  currentBook = book;
  document.getElementById('toolbarTitle').textContent = book.title;
  document.title = `${book.title} - ICONMIC Reader`;

  setupWatermark(user || demoUser);
  loadBookContent(book);
}

/* ---------- Content Loading ---------- */

function loadBookContent(book) {
  const content = document.getElementById('readerContent');
  if (!content) return;

  const chapters = generateSampleContent(book);
  totalChapters = chapters.length;

  content.innerHTML = `
    <h1>${book.title}</h1>
    <p class="book-author-line">by ${book.author}</p>
    ${chapters[currentChapter]}
  `;

  content.className = `reader-content ${fontSizes[fontSizeLevel]}`;
  updateChapterNav();
  window.scrollTo(0, 0);
}

function generateSampleContent(book) {
  return [
    `<h2 class="chapter-title">Chapter 1: The Beginning</h2>
    <p><span class="first-letter">T</span>he morning sun cast long shadows across the quiet streets as the story of "${book.title}" began to unfold. It was a day like any other, yet something in the air whispered of change — a shift so subtle that only the most perceptive souls could sense it.</p>
    <p>In the heart of a bustling city, where dreams were as plentiful as the stars above, our protagonist found themselves at a crossroads. The path ahead was shrouded in mystery, each direction promising adventure and uncertainty in equal measure.</p>
    <p>The world of ${book.author}'s imagination stretched before them like an infinite canvas, waiting to be painted with the vivid colors of experience. Every corner held a secret, every shadow concealed a truth waiting to be discovered.</p>
    <p>"There are moments in life," a wise voice once said, "when the ordinary becomes extraordinary, when the mundane transforms into the magical. This was one such moment."</p>
    <p>The air was thick with anticipation, heavy with the weight of stories yet untold. In the distance, the sound of possibilities echoed through the corridors of time, beckoning the curious and the brave alike.</p>
    <p>As the first chapter of this remarkable journey unfolded, it became clear that nothing would ever be quite the same again. The adventure had begun, and there was no turning back.</p>`,

    `<h2 class="chapter-title">Chapter 2: The Discovery</h2>
    <p><span class="first-letter">D</span>ays turned into weeks as the journey continued. Each new dawn brought fresh revelations and deeper understanding. The protagonist had discovered something that would change everything they thought they knew.</p>
    <p>It started with a simple observation — a pattern hidden in plain sight, waiting for the right eyes to see it. Like a puzzle piece clicking into place, the discovery illuminated connections that had always been there, lurking beneath the surface of everyday life.</p>
    <p>"Knowledge is not simply about knowing things," the mentor explained, adjusting the ancient text before them. "It is about seeing the invisible threads that connect all things. Once you learn to see them, the world reveals itself in ways you never imagined possible."</p>
    <p>The protagonist spent countless hours studying, researching, and questioning everything they had previously accepted as truth. Old assumptions crumbled like sandcastles before the tide, replaced by new understanding that was both humbling and exhilarating.</p>
    <p>Friends and allies emerged from unexpected places, drawn together by a shared purpose that transcended individual ambitions. Together, they formed a fellowship bound not by obligation, but by genuine conviction and mutual respect.</p>
    <p>As the second chapter drew to a close, the stakes had risen considerably. What had begun as a personal quest had evolved into something far larger — a mission that would test the limits of courage, loyalty, and love.</p>`,

    `<h2 class="chapter-title">Chapter 3: The Challenge</h2>
    <p><span class="first-letter">T</span>he greatest challenges often arrive uninvited, and this one was no exception. It came swiftly and without warning, threatening to undo everything that had been built with such painstaking care.</p>
    <p>Standing at the edge of adversity, our protagonist faced a choice that would define not only their own future but the future of everyone they held dear. The weight of responsibility pressed down like a physical force, demanding action in the face of overwhelming uncertainty.</p>
    <p>Yet it was precisely in this moment of crisis that true character revealed itself. Not in grand gestures or dramatic speeches, but in the quiet determination to keep going when every fiber of being screamed for surrender.</p>
    <p>"Courage is not the absence of fear," the protagonist realized, standing firm against the gathering storm. "It is the decision that something else is more important than fear."</p>
    <p>The battle was fierce, the odds seemingly insurmountable. But with each setback came a lesson, and with each lesson came strength. What had once seemed impossible began to look merely difficult, and what had seemed difficult began to look achievable.</p>
    <p>As this chapter concluded, the story had reached its climax. The resolution, when it came, would require everything they had learned, every connection they had forged, and every ounce of courage they possessed. The final chapter awaited.</p>
    <p style="text-align: center; margin-top: 3rem; color: var(--text-muted); font-style: italic;">— End of Preview —</p>
    <p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">This is a sample preview. Connect your Supabase database to load full book content.</p>`
  ];
}

/* ---------- Chapter Navigation ---------- */

function updateChapterNav() {
  const indicator = document.getElementById('chapterIndicator');
  const prevBtn = document.getElementById('prevChapter');
  const nextBtn = document.getElementById('nextChapter');

  if (indicator) indicator.textContent = `Chapter ${currentChapter + 1} of ${totalChapters}`;
  if (prevBtn) prevBtn.disabled = currentChapter === 0;
  if (nextBtn) nextBtn.disabled = currentChapter >= totalChapters - 1;
}

function nextChapter() {
  if (currentChapter < totalChapters - 1) {
    currentChapter++;
    loadBookContent(currentBook);
  }
}

function previousChapter() {
  if (currentChapter > 0) {
    currentChapter--;
    loadBookContent(currentBook);
  }
}

/* ---------- Font Size ---------- */

function increaseFontSize() {
  if (fontSizeLevel < fontSizes.length - 1) {
    fontSizeLevel++;
    const content = document.getElementById('readerContent');
    if (content) content.className = `reader-content ${fontSizes[fontSizeLevel]}`;
  }
}

function decreaseFontSize() {
  if (fontSizeLevel > 0) {
    fontSizeLevel--;
    const content = document.getElementById('readerContent');
    if (content) content.className = `reader-content ${fontSizes[fontSizeLevel]}`;
  }
}

/* ---------- Theme Toggle ---------- */

let themeIndex = 0;
const themes = ['', 'reader-light', 'reader-sepia'];
const themeIcons = ['\uD83C\uDF19', '\u2600\uFE0F', '\uD83D\uDCDC'];

function toggleTheme() {
  document.body.classList.remove(...themes.filter(Boolean));
  themeIndex = (themeIndex + 1) % themes.length;
  if (themes[themeIndex]) document.body.classList.add(themes[themeIndex]);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = themeIcons[themeIndex];
}

/* ---------- Fullscreen ---------- */

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

/* ---------- Watermark ---------- */

function setupWatermark(user) {
  const watermark = document.getElementById('watermark');
  if (!watermark || !user) return;

  const identifier = user.email || user.user_metadata?.display_name || 'User';
  const text = `ICONMIC - ${identifier}`;

  let watermarkHTML = '';
  for (let i = 0; i < 40; i++) {
    watermarkHTML += `<span>${text}</span>`;
  }
  watermark.innerHTML = watermarkHTML;
}

/* ---------- Anti-Piracy Measures ---------- */

function initAntiPiracy() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showPiracyWarning();
  });

  // Disable text selection on reader content
  document.addEventListener('selectstart', (e) => {
    if (e.target.closest('.reader-content')) {
      e.preventDefault();
    }
  });

  // Disable copy
  document.addEventListener('copy', (e) => {
    if (e.target.closest('.reader-content') || e.target.closest('.reader-container')) {
      e.preventDefault();
      showPiracyWarning();
    }
  });

  // Disable drag
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  // Disable common keyboard shortcuts for copying/saving/printing
  document.addEventListener('keydown', (e) => {
    const blockedCombos = [
      { ctrl: true, key: 'c' },   // Copy
      { ctrl: true, key: 'u' },   // View source
      { ctrl: true, key: 's' },   // Save
      { ctrl: true, key: 'p' },   // Print
      { ctrl: true, shift: true, key: 'i' },  // Dev tools
      { ctrl: true, shift: true, key: 'j' },  // Dev tools console
      { key: 'F12' },             // Dev tools
      { key: 'PrintScreen' }      // Screenshot
    ];

    for (const combo of blockedCombos) {
      const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = combo.shift ? e.shiftKey : !combo.shift;
      const keyMatch = e.key.toLowerCase() === combo.key?.toLowerCase() || e.key === combo.key;

      if (ctrlMatch && shiftMatch && keyMatch) {
        e.preventDefault();
        e.stopPropagation();

        if (['c', 'PrintScreen'].includes(combo.key)) {
          showPiracyWarning();
        }
        return false;
      }
    }
  });

  // Detect visibility change (potential screen recording)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const content = document.getElementById('readerContent');
      if (content) content.style.filter = 'blur(20px)';
    } else {
      const content = document.getElementById('readerContent');
      if (content) content.style.filter = 'none';
    }
  });

  // Disable print
  const style = document.createElement('style');
  style.textContent = '@media print { body { display: none !important; } }';
  document.head.appendChild(style);

  // Detect screenshots via PrintScreen
  window.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText('').catch(() => {});
      showPiracyWarning();
    }
  });
}

function showPiracyWarning() {
  const modal = document.getElementById('piracyWarning');
  if (modal) modal.classList.add('active');
}

function dismissPiracyWarning() {
  const modal = document.getElementById('piracyWarning');
  if (modal) modal.classList.remove('active');
}

/* ---------- Toolbar Auto-hide ---------- */

let lastScroll = 0;
let toolbarTimeout;

window.addEventListener('scroll', () => {
  const toolbar = document.getElementById('readerToolbar');
  if (!toolbar) return;

  const currentScroll = window.scrollY;

  if (currentScroll > lastScroll && currentScroll > 100) {
    toolbar.classList.add('hidden');
  } else {
    toolbar.classList.remove('hidden');
  }

  lastScroll = currentScroll;

  clearTimeout(toolbarTimeout);
  toolbarTimeout = setTimeout(() => {
    if (currentScroll > 100) {
      toolbar.classList.add('hidden');
    }
  }, 3000);
});

document.addEventListener('click', () => {
  const toolbar = document.getElementById('readerToolbar');
  if (toolbar) toolbar.classList.remove('hidden');
});
