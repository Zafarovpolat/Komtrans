/* Lightweight interactivity:
   - Modals
   - FAQ accordion
   - Feature accordion (single-open)
*/

(function () {
  'use strict';

  // ---------- Modal helpers ----------
  function openModal(name) {
    const m = document.getElementById('modal-' + name);
    if (!m) return;
    m.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    if (!document.querySelector('.modal.is-open')) {
      document.body.style.overflow = '';
    }
  }

  document.addEventListener('click', function (e) {
    const opener = e.target.closest('[data-modal]');
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute('data-modal'));
      return;
    }
    const closer = e.target.closest('[data-close]');
    if (closer) {
      e.preventDefault();
      closeModal(closer.closest('.modal'));
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach(closeModal);
    }
  });

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('is-open');
      // Toggle current
      document.querySelectorAll('.faq-item.is-open').forEach(function (el) {
        if (el !== item) el.classList.remove('is-open');
      });
      item.classList.toggle('is-open', !wasOpen);
    });
  });

  // ---------- Features list (single open) ----------
  document.querySelectorAll('.feature-row').forEach(function (row) {
    row.addEventListener('click', function () {
      const wasOpen = row.classList.contains('is-open');
      document.querySelectorAll('.feature-row.is-open').forEach(function (el) {
        if (el !== row) el.classList.remove('is-open');
      });
      row.classList.toggle('is-open', !wasOpen);
    });
  });

  // ---------- Calculator radio visual ----------
  document.querySelectorAll('.calc-opt input[type="radio"]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      const groupName = inp.name;
      document
        .querySelectorAll('.calc-opt input[name="' + groupName + '"]')
        .forEach(function (i) {
          i.closest('.calc-opt').classList.toggle('is-selected', i.checked);
        });
    });
  });
  // initialise default selected state
  document.querySelectorAll('.calc-opt input[type="radio"]:checked').forEach(function (i) {
    i.closest('.calc-opt').classList.add('is-selected');
  });

  // ---------- Form thank-you ----------
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Close current modal first
      const modal = form.closest('.modal');
      if (modal) closeModal(modal);
      setTimeout(function () { openModal('thx'); }, 100);
      form.reset();
    });
  });
})();
