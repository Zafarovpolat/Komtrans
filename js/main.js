/* Lightweight interactivity:
   - Modals
   - FAQ accordion
   - Feature accordion (single-open)
   - Phone mask
   - Form validation
*/

(function () {
  'use strict';

  // ---------- Phone mask ----------
  function applyPhoneMask(input) {
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });

    input.addEventListener('input', function (e) {
      var raw = input.value.replace(/\D/g, '');
      // Always start with 7
      if (raw.length === 0) { input.value = ''; return; }
      if (raw[0] === '8') raw = '7' + raw.slice(1);
      if (raw[0] !== '7') raw = '7' + raw;
      raw = raw.slice(0, 11);

      var formatted = '+7';
      if (raw.length > 1) formatted += ' (' + raw.slice(1, 4);
      if (raw.length >= 4) formatted += ') ' + raw.slice(4, 7);
      if (raw.length >= 7) formatted += '-' + raw.slice(7, 9);
      if (raw.length >= 9) formatted += '-' + raw.slice(9, 11);
      input.value = formatted;
    });

    input.addEventListener('keydown', function (e) {
      // Allow: backspace, delete, tab, escape, arrows
      if ([8, 46, 9, 27, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) return;
      // Allow Ctrl/Cmd shortcuts
      if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) return;
      // Block non-digits
      if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });

    input.addEventListener('blur', function () {
      if (input.value === '+7 (') input.value = '';
    });
  }

  document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);

  // ---------- Form validation ----------
  function isPhoneComplete(val) {
    // Full mask: +7 (XXX) XXX-XX-XX = 18 chars, 11 digits
    return val.replace(/\D/g, '').length === 11;
  }

  function showError(field, msg) {
    field.classList.add('has-error');
    var existing = field.querySelector('.field-error');
    if (!existing) {
      var err = document.createElement('span');
      err.className = 'field-error';
      err.textContent = msg;
      field.appendChild(err);
    } else {
      existing.textContent = msg;
    }
  }

  function clearError(field) {
    field.classList.remove('has-error');
    var err = field.querySelector('.field-error');
    if (err) err.remove();
  }

  function validateModalForm(form) {
    var valid = true;

    // Name (required, min 2 chars) — only if field exists and is required
    var nameInput = form.querySelector('input[name="name"]');
    if (nameInput) {
      var nameField = nameInput.closest('.field');
      if (nameInput.value.trim().length < 2) {
        showError(nameField, 'Введите ваше имя');
        valid = false;
      } else {
        clearError(nameField);
      }
    }

    // Phone (required if marked required or always in call modal)
    var phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput) {
      var phoneField = phoneInput.closest('.field');
      if (!isPhoneComplete(phoneInput.value)) {
        showError(phoneField, 'Введите корректный номер телефона');
        valid = false;
      } else {
        clearError(phoneField);
      }
    }

    // Email (optional field — validate format only if filled in)
    var emailInput = form.querySelector('input[type="email"]');
    if (emailInput) {
      var emailField = emailInput.closest('.field');
      var emailVal = emailInput.value.trim();
      var emailRequired = emailInput.hasAttribute('required');
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRequired && !emailVal) {
        showError(emailField, 'Введите e-mail');
        valid = false;
      } else if (emailVal && !emailRegex.test(emailVal)) {
        showError(emailField, 'Введите корректный e-mail');
        valid = false;
      } else {
        clearError(emailField);
      }
    }

    // Question textarea (required if exists)
    var questionInput = form.querySelector('textarea[name="question"]');
    if (questionInput) {
      var questionField = questionInput.closest('.field');
      if (questionInput.value.trim().length < 3) {
        showError(questionField, 'Введите ваш вопрос');
        valid = false;
      } else {
        clearError(questionField);
      }
    }


    // Agreement checkbox
    var agreeInput = form.querySelector('.agreement input[type="checkbox"]');
    if (agreeInput) {
      var agreeLabel = agreeInput.closest('.agreement');
      if (!agreeInput.checked) {
        agreeLabel.classList.add('has-error');
        if (!agreeLabel.querySelector('.field-error')) {
          var agreeErr = document.createElement('span');
          agreeErr.className = 'field-error';
          agreeErr.textContent = 'Необходимо согласие';
          agreeLabel.appendChild(agreeErr);
        }
        valid = false;
      } else {
        agreeLabel.classList.remove('has-error');
        var agreeErrEl = agreeLabel.querySelector('.field-error');
        if (agreeErrEl) agreeErrEl.remove();
      }
    }

    return valid;
  }

  // Clear errors on input
  document.addEventListener('input', function (e) {
    var field = e.target.closest('.field');
    if (field && field.classList.contains('has-error')) {
      clearError(field);
    }
  });
  document.addEventListener('change', function (e) {
    var agreement = e.target.closest('.agreement');
    if (agreement && agreement.classList.contains('has-error')) {
      agreement.classList.remove('has-error');
      var err = agreement.querySelector('.field-error');
      if (err) err.remove();
    }
  });

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

  // Agreement checkbox: let link open without toggling the checkbox
  document.addEventListener('click', function (e) {
    const link = e.target.closest('.agreement a');
    if (link) { e.stopPropagation(); }
  }, true); // capture phase

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

  // ---------- Section calculator → opens modal-calculator ----------
  var calcWidget = document.getElementById('calc-widget');
  if (calcWidget) {
    calcWidget.addEventListener('submit', function (e) {
      e.preventDefault();
      calcModalGoTo(1);
      openModal('calculator');
    });
  }

  // ---------- Multi-step calculator modal ----------
  (function () {
    var modal = document.getElementById('modal-calculator');
    if (!modal) return;

    var steps = modal.querySelectorAll('.calc-step');
    var progressSpans = modal.querySelectorAll('#calc-modal-progress span');
    var header = modal.querySelector('#calc-modal-header');
    var TOTAL = 5;

    function updateProgress(step) {
      progressSpans.forEach(function (s, i) {
        s.classList.toggle('is-active', i < step);
      });
    }

    function goTo(step) {
      steps.forEach(function (el) {
        el.hidden = parseInt(el.getAttribute('data-step'), 10) !== step;
      });
      // Hide header on final step
      if (header) header.hidden = step > TOTAL;
      updateProgress(Math.min(step, TOTAL));

      // Auto-select first radio on each question step if none selected
      var current = modal.querySelector('.calc-step[data-step="' + step + '"]');
      if (current) {
        var radios = current.querySelectorAll('input[type="radio"]');
        var anyChecked = Array.from(radios).some(function (r) { return r.checked; });
        if (!anyChecked && radios.length) {
          radios[0].checked = true;
          radios[0].closest('.calc-opt').classList.add('is-selected');
        }

        // Hide prev button only on step 1 (can't go back from first question)
        var prevBtn = current.querySelector('.calc-prev-btn');
        if (prevBtn) {
          var hide = step === 1;
          prevBtn.style.display = hide ? 'none' : '';
          var nav = prevBtn.closest('.calc-nav');
          if (nav) nav.classList.toggle('calc-nav--single', hide);
        }
      }
    }

    // Make goTo accessible outside for the page widget trigger
    window.calcModalGoTo = goTo;

    // Next buttons (steps 1-5 only; step 6 submit is handled by the form handler)
    modal.addEventListener('click', function (e) {
      if (e.target.closest('.calc-next-btn')) {
        var stepEl = e.target.closest('.calc-step');
        if (!stepEl) return;
        var cur = parseInt(stepEl.getAttribute('data-step'), 10);
        if (cur <= TOTAL) goTo(cur + 1); // only navigate question steps, not the final form
      }
      if (e.target.closest('.calc-prev-btn') && !e.target.closest('.calc-prev-btn').disabled) {
        var stepEl = e.target.closest('.calc-step');
        var cur = parseInt(stepEl.getAttribute('data-step'), 10);
        goTo(cur - 1);
      }
      if (e.target.closest('.calc-restart')) {
        // Reset all radios
        modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
          r.checked = false;
          r.closest('.calc-opt').classList.remove('is-selected');
        });
        goTo(1);
      }
    });

    // Radio visual selection inside modal
    modal.addEventListener('change', function (e) {
      var radio = e.target.closest('.calc-opt input[type="radio"]');
      if (!radio) return;
      var group = radio.name;
      modal.querySelectorAll('input[name="' + group + '"]').forEach(function (r) {
        r.closest('.calc-opt').classList.toggle('is-selected', r.checked);
      });
    });

    // Reset to step 1 when modal closes
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) {
        setTimeout(function () { goTo(1); }, 300);
      }
    });

    // Init
    goTo(1);
  })();

  // ---------- Form thank-you ----------
  // Generic handler for all modal forms EXCEPT the calc final form
  document.querySelectorAll('form[data-form]:not(#calc-final-form)').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateModalForm(form)) return;
      const modal = form.closest('.modal');
      if (modal) closeModal(modal);
      setTimeout(function () { openModal('thx'); }, 100);
      form.reset();
    });
  });

  // Calc final form: validate, close modal, reset quiz to step 1, open thx
  var calcFinalForm = document.getElementById('calc-final-form');
  if (calcFinalForm) {
    calcFinalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateModalForm(calcFinalForm)) return;
      var calcModal = document.getElementById('modal-calculator');
      if (calcModal) closeModal(calcModal);
      // Reset quiz steps back to 1 so next open starts fresh
      if (typeof window.calcModalGoTo === 'function') window.calcModalGoTo(1);
      calcFinalForm.reset();
      setTimeout(function () { openModal('thx'); }, 100);
    });
  }
  // ---------- Carousel (Portfolio & Reviews) ----------
  function makeCarousel(navAttr, wrapId, getVisible, infinite, onMove) {
    var nav = document.querySelector('[data-carousel="' + navAttr + '"]');
    var wrap = document.getElementById(wrapId);
    if (!nav || !wrap) return;
    var track = wrap.querySelector('.carousel-track');
    if (!track) return;

    var realItems = Array.from(track.children);
    var N = realItems.length;
    var current = 0;

    if (infinite) {
      realItems.slice().reverse().forEach(function (item) {
        track.insertBefore(item.cloneNode(true), track.firstChild);
      });
      realItems.forEach(function (item) {
        track.appendChild(item.cloneNode(true));
      });
      current = N;
    }

    function vis() { return getVisible(); }
    function totalItems() { return track.children.length; }

    function setLayout() {
      track.style.gridTemplateColumns = 'repeat(' + totalItems() + ', calc(100% / ' + vis() + '))';
    }

    function moveTo(idx, animate) {
      current = idx;
      setLayout();
      if (!animate) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(calc(-' + current + ' / ' + vis() + ' * 100%))';
        track.offsetHeight; // force reflow
        track.style.transition = '';
      } else {
        track.style.transform = 'translateX(calc(-' + current + ' / ' + vis() + ' * 100%))';
      }
      if (onMove) onMove(track, current);
    }

    // After slide — snap back to real items if in clone zone
    track.addEventListener('transitionend', function (e) {
      if (e.propertyName !== 'transform' || !infinite) return;
      if (current >= N * 2) { moveTo(current - N, false); }
      else if (current < N) { moveTo(current + N, false); }
    });

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-dir]');
      if (!btn) return;
      var dir = parseInt(btn.getAttribute('data-dir'), 10);
      if (infinite) {
        moveTo(current + dir, true);
      } else {
        var max = Math.max(0, N - vis());
        moveTo(Math.max(0, Math.min(max, current + dir)), true);
        var btns = nav.querySelectorAll('button');
        btns[0].style.opacity = current <= 0 ? '0.4' : '';
        btns[1].style.opacity = current >= max ? '0.4' : '';
        btns[0].disabled = current <= 0;
        btns[1].disabled = current >= max;
      }
    });

    // Touch swipe
    var startX = 0;
    wrap.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', function (e) {
      var dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) {
        if (infinite) { moveTo(current + (dx > 0 ? 1 : -1), true); }
        else {
          var max = Math.max(0, N - vis());
          moveTo(Math.max(0, Math.min(max, current + (dx > 0 ? 1 : -1))), true);
        }
      }
    }, { passive: true });

    // Resize — re-render without animation
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { moveTo(current, false); }, 150);
    });

    moveTo(current, false);
  }

  // Portfolio: 4 slides, infinite loop
  makeCarousel('portfolio', 'carousel-portfolio', function () {
    return window.innerWidth <= 768 ? 1 : 2;
  }, true);

  // Reviews: infinite loop — restore border-left on the first visible card after each slide
  makeCarousel('reviews', 'carousel-reviews', function () {
    return window.innerWidth <= 768 ? 1 : window.innerWidth <= 1280 ? 2 : 3;
  }, true, function (track, current) {
    Array.from(track.children).forEach(function (card) {
      card.style.borderLeft = '';
    });
    if (track.children[current]) {
      track.children[current].style.borderLeft = '1px solid #E0DFDE';
    }
  });

})();
