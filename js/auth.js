/* ============================================
   ICONMIC - Auth Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAuthForms();
  initPasswordStrength();
});

function initAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
}

/* ---------- Login ---------- */

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    await signIn(email, password);
    showToast('Welcome back!', 'success');

    const redirect = sessionStorage.getItem('iconmic_redirect') || 'index.html';
    sessionStorage.removeItem('iconmic_redirect');

    setTimeout(() => { window.location.href = redirect; }, 1000);
  } catch (err) {
    showToast(err.message || 'Invalid email or password', 'error');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

/* ---------- Register ---------- */

async function handleRegister(e) {
  e.preventDefault();

  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  const btn = document.getElementById('registerBtn');

  if (!displayName || !email || !password || !confirmPassword) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    document.getElementById('confirmPassword').classList.add('error');
    return;
  }

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  if (!agreeTerms) {
    showToast('Please agree to the Terms of Service', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    await signUp(email, password, displayName);
    showToast('Account created! Please check your email to verify.', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
  } catch (err) {
    showToast(err.message || 'Failed to create account', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

/* ---------- Demo Login ---------- */

function demoLogin() {
  localStorage.setItem('iconmic_demo_user', JSON.stringify({
    id: 'demo-user-001',
    email: 'demo@iconmic.com',
    user_metadata: { display_name: 'Demo Reader' }
  }));
  showToast('Logged in as Demo Reader!', 'success');
  setTimeout(() => { window.location.href = 'library.html'; }, 1000);
}

/* ---------- Password Toggle ---------- */

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ---------- Password Strength ---------- */

function initPasswordStrength() {
  const passwordInput = document.getElementById('password');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  if (!passwordInput || !strengthFill) return;

  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let score = 0;

    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;

    const levels = [
      { width: '0%', color: 'transparent', text: '' },
      { width: '20%', color: '#E17055', text: 'Weak' },
      { width: '40%', color: '#FDCB6E', text: 'Fair' },
      { width: '60%', color: '#FDCB6E', text: 'Good' },
      { width: '80%', color: '#00B894', text: 'Strong' },
      { width: '100%', color: '#00B894', text: 'Very Strong' }
    ];

    const level = levels[score] || levels[0];
    strengthFill.style.width = level.width;
    strengthFill.style.background = level.color;
    if (strengthText) {
      strengthText.textContent = level.text;
      strengthText.style.color = level.color;
    }
  });
}

/* ---------- Forgot Password ---------- */

function showForgotPassword() {
  const modal = document.getElementById('forgotModal');
  if (modal) modal.classList.add('active');
}

function closeForgotPassword() {
  const modal = document.getElementById('forgotModal');
  if (modal) modal.classList.remove('active');
}

const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();

    try {
      await resetPassword(email);
      showToast('Reset link sent! Check your email.', 'success');
      closeForgotPassword();
    } catch (err) {
      showToast(err.message || 'Failed to send reset link', 'error');
    }
  });
}
