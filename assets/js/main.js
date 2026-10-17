/**
 * Madhavbaug Ayunetra™ Complete Eye Care Combo - High Conversion COD Landing Page Logic
 * Features:
 * 1. Hero Showcase with Badge Overlays & Dynamic Pricing
 * 2. Pricing & Bundle Sync (1 Combo - Starter, 2 Combos - Most Popular, 3 Combos - Best Value)
 * 3. Unified COD Lead Modal with Name, Contact, Address, City, State
 * 4. 24-Hour Duplicate Prevention by Contact Number
 * 5. Google Sheets Webhook Integration
 * 6. Sticky Mobile Bar, Review Filtering & Accordion FAQs
 */

// ==============================================================================
// GOOGLE SHEETS WEBHOOK CONFIGURATION
// ==============================================================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxPUkOupq8Y2yASFmtee7_jClPsb-ljf_pn3ByQ2sWBSV-BROXsLtBQKxxbuGlwKz6NOQ/exec';

// Local Storage Key & 24 Hours Cooldown (24 * 60 * 60 * 1000 ms)
const SUBMITTED_CONTACTS_KEY = 'madhavbaug_ayunetra_contacts_24h';
const DUPLICATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Pricing & Bundle Selector State
  // ==========================================================================
  const bundleCards = document.querySelectorAll('.bundle-card');
  const formPackCards = document.querySelectorAll('.form-pack-card');
  const currentPriceEl = document.getElementById('currentPrice');
  const originalPriceEl = document.getElementById('originalPrice');
  const discountTagEl = document.getElementById('discountTag');
  const stickyPriceEl = document.getElementById('stickyPrice');
  const stickyPackNameEl = document.getElementById('stickyPackName');

  const bundleData = [
    {
      index: 0,
      title: '1 Combo Pack (30 Days Care - 30 Capsules + Eye Drops)',
      units: '30 Days Course',
      price: 899,
      original: 1299,
      discount: '31% की छूट',
      desc: '1 Month Starter: 30 Capsules + Herbal Eye Drops for Digital Fatigue'
    },
    {
      index: 1,
      title: '2 Combo Packs (60 Days Course - 60 Capsules + 2x Eye Drops)',
      units: '60 Days Course (Recommended)',
      price: 1599,
      original: 2598,
      discount: '38% की भारी बचत (Most Popular)',
      desc: 'Most Popular: Complete Retinal Nourishment & Eye Strain Recovery'
    },
    {
      index: 2,
      title: '3 Combo Packs (90 Days Total Care - 90 Capsules + 3x Eye Drops)',
      units: '90 Days Total Vision Care',
      price: 2199,
      original: 3897,
      discount: '44% की सबसे बड़ी छूट',
      desc: 'Best Value: Long-Term Vision Protection & Dry Eye Elimination'
    }
  ];

  let selectedBundleIndex = 1; // Default: 2 Combos (60 Days)

  function updateBundleState(index) {
    selectedBundleIndex = index;
    const data = bundleData[index];

    // Update Hero UI
    if (currentPriceEl) currentPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (originalPriceEl) originalPriceEl.textContent = `₹${data.original.toLocaleString('en-IN')}`;
    if (discountTagEl) discountTagEl.textContent = data.discount;

    // Update Bundle Cards in Hero
    bundleCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    // Update Form Pack Cards in Section
    formPackCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    // Update Sticky Bar
    if (stickyPriceEl) stickyPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (stickyPackNameEl) stickyPackNameEl.textContent = data.title;

    // Update Modal Hidden Inputs
    const modalSelectedPackInput = document.getElementById('modalSelectedPack');
    const modalPriceInput = document.getElementById('modalPrice');
    if (modalSelectedPackInput) modalSelectedPackInput.value = data.title;
    if (modalPriceInput) modalPriceInput.value = `₹${data.price.toLocaleString('en-IN')}`;
  }

  // Click listeners for bundle cards
  bundleCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  formPackCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  // Initialize with index 1 (Most popular)
  updateBundleState(1);

  // ==========================================================================
  // 2. Duplicate Check Helper (24-Hour Cooldown)
  // ==========================================================================
  const phoneInput = document.getElementById('modalCodPhone');
  const duplicateAlert = document.getElementById('modalDuplicateAlert');

  function cleanPhoneNumber(phone) {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  function checkDuplicateContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return false;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      const timestamp = stored[clean];
      if (timestamp && (Date.now() - timestamp < DUPLICATE_COOLDOWN_MS)) {
        return true;
      }
    } catch (e) {
      console.warn('LocalStorage access error:', e);
    }
    return false;
  }

  function saveSubmittedContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      stored[clean] = Date.now();
      localStorage.setItem(SUBMITTED_CONTACTS_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function validateDuplicateUI() {
    if (!phoneInput) return false;
    const phone = phoneInput.value.trim();
    const isDup = checkDuplicateContact(phone);
    if (duplicateAlert) {
      duplicateAlert.style.display = isDup ? 'block' : 'none';
    }
    return isDup;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', validateDuplicateUI);
    phoneInput.addEventListener('blur', validateDuplicateUI);
  }

  // ==========================================================================
  // 3. Modals Management (Common COD Lead Modal, Thank You Modal)
  // ==========================================================================
  const codModal = document.getElementById('codModal');
  const codModalClose = document.getElementById('codModalClose');
  const thankYouModal = document.getElementById('thankYouModal');
  const thankYouModalClose = document.getElementById('thankYouModalClose');
  const thankYouModalDoneBtn = document.getElementById('thankYouModalDoneBtn');
  const buyNowButtons = document.querySelectorAll('.btn-buy-now');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    if (modal === codModal && duplicateAlert) {
      validateDuplicateUI();
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  buyNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(codModal);
    });
  });

  if (codModalClose) codModalClose.addEventListener('click', () => closeModal(codModal));
  if (thankYouModalClose) thankYouModalClose.addEventListener('click', () => closeModal(thankYouModal));
  if (thankYouModalDoneBtn) thankYouModalDoneBtn.addEventListener('click', () => closeModal(thankYouModal));

  // Close modal on overlay background click
  [codModal, thankYouModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // ESC key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [codModal, thankYouModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  // ==========================================================================
  // 4. Form Submission & Webhook Integration
  // ==========================================================================
  const modalCodForm = document.getElementById('modalCodForm');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');

  function generateOrderId() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `MDB-EYE-${randomNum}`;
  }

  function handleOrderSuccess(name, phone, address, city, state, packTitle, amount, orderId) {
    // Populate Thank You Modal
    const tyOrderId = document.getElementById('thankYouOrderId');
    const tyCustomerName = document.getElementById('thankYouCustomerName');
    const tyPhone = document.getElementById('thankYouPhone');
    const tyPack = document.getElementById('thankYouPack');
    const tyAmount = document.getElementById('thankYouAmount');
    const whatsappConfirmBtn = document.getElementById('whatsappConfirmBtn');

    if (tyOrderId) tyOrderId.textContent = orderId;
    if (tyCustomerName) tyCustomerName.textContent = name;
    if (tyPhone) tyPhone.textContent = `+91 ${phone}`;
    if (tyPack) tyPack.textContent = packTitle;
    if (tyAmount) tyAmount.textContent = amount;

    // Generate WhatsApp direct confirmation link
    if (whatsappConfirmBtn) {
      const fullAddress = [address, city, state].filter(Boolean).join(', ') || 'कॉल पर कन्फर्म किया जाएगा';
      const waMsg = encodeURIComponent(
        `नमस्ते Madhavbaug Team,\nमैंने अभी Ayunetra Complete Eye Care Combo का COD आर्डर बुक किया है।\n\n📌 Order ID: ${orderId}\n👤 नाम: ${name}\n📦 पैकेज: ${packTitle}\n💰 राशि: ${amount} (Cash on Delivery)\n📍 पता: ${fullAddress}\n\nकृपया मेरा ऑर्डर जल्द से जल्द डिस्पैच करें। धन्यवाद!`
      );
      whatsappConfirmBtn.href = `https://wa.me/919321457890?text=${waMsg}`;
    }

    // Close COD Lead Modal & Open Thank You Modal
    closeModal(codModal);
    openModal(thankYouModal);

    // Save phone to duplicate blocklist
    saveSubmittedContact(phone);
    if (modalCodForm) modalCodForm.reset();
  }

  if (modalCodForm) {
    modalCodForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('modalCodName')?.value.trim() || '';
      const phone = document.getElementById('modalCodPhone')?.value.trim() || '';
      const address = document.getElementById('modalCodAddress')?.value.trim() || '';
      const city = document.getElementById('modalCodCity')?.value.trim() || '';
      const state = document.getElementById('modalCodState')?.value.trim() || '';

      const bundle = bundleData[selectedBundleIndex] || bundleData[1];
      const orderId = generateOrderId();
      const amountStr = `₹${bundle.price.toLocaleString('en-IN')}`;

      // 1. Check if contact number was already submitted within 24 hours
      if (checkDuplicateContact(phone)) {
        if (duplicateAlert) duplicateAlert.style.display = 'block';
        showToast('⚠️ आप पहले ही ऑर्डर सबमिट कर चुके हैं। 24 घंटे में हमारे आई-केयर एक्सपर्ट आपको कॉल करेंगे।');
        return;
      }

      // Basic validation
      const cleanPhone = cleanPhoneNumber(phone);
      if (!cleanPhone || cleanPhone.length !== 10) {
        showToast('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें!');
        if (phoneInput) phoneInput.focus();
        return;
      }

      if (!name) {
        showToast('कृपया अपना नाम दर्ज करें!');
        return;
      }

      // Disable submit button & show loading indicator
      const originalBtnHtml = modalSubmitBtn ? modalSubmitBtn.innerHTML : '';
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = true;
        modalSubmitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
          </svg>
          ऑर्डर प्रोसेस हो रहा है...
        `;
      }

      const payload = {
        order_id: orderId,
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        product: 'Madhavbaug Ayunetra Complete Eye Care Combo',
        pack: bundle.title,
        price: amountStr,
        name: name,
        contact: cleanPhone,
        address: address || 'N/A',
        city: city || 'N/A',
        state: state || 'N/A',
        payment_mode: 'Cash On Delivery (COD)',
        source_url: window.location.href,
        status: 'Pending Confirmation'
      };

      try {
        if (GOOGLE_SHEETS_WEBHOOK_URL && !GOOGLE_SHEETS_WEBHOOK_URL.includes('PASTE_YOUR_')) {
          await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn('Webhook logging error (non-fatal):', err);
      } finally {
        if (modalSubmitBtn) {
          modalSubmitBtn.disabled = false;
          modalSubmitBtn.innerHTML = originalBtnHtml;
        }
        handleOrderSuccess(name, cleanPhone, address, city, state, bundle.title, amountStr, orderId);
        showToast('🎉 आपका ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है!');
      }
    });
  }

  // ==========================================================================
  // 5. Sticky Mobile Bottom Bar Visibility & Scroll Tracker
  // ==========================================================================
  const stickyBar = document.getElementById('stickyMobileBar');
  const heroSection = document.getElementById('product-hero');

  if (stickyBar && heroSection) {
    window.addEventListener('scroll', () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom < 100) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 6. Accordion FAQ Functionality
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question-btn, .faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close others
        faqItems.forEach(other => other.classList.remove('active'));
        // Toggle current
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // ==========================================================================
  // 7. Patient Review Filters
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  const reviewCards = document.querySelectorAll('.review-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      reviewCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // 8. Toast Notification Utility
  // ==========================================================================
  function showToast(msg) {
    let toast = document.getElementById('toastNotice');
    let toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
});
