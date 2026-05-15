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
  function openModal(name, opener) {
    const m = document.getElementById('modal-' + name);
    if (!m) return;

    // Optional title override from opener (data-modal-title)
    if (opener) {
      const titleEl = m.querySelector('.modal__title');
      if (titleEl) {
        const overrideTitle = opener.getAttribute('data-modal-title');
        if (overrideTitle) {
          titleEl.textContent = overrideTitle;
        } else if (titleEl.dataset.defaultTitle) {
          titleEl.textContent = titleEl.dataset.defaultTitle;
        }
      }
      // Optional context capture (sent with the form to identify which route/step the user clicked)
      const ctx = opener.getAttribute('data-context');
      const ctxField = m.querySelector('[data-context-field]');
      if (ctxField) ctxField.value = ctx || '';
    }

    m.classList.add('is-open');
    // Lock page scroll. We lock both <html> and <body> so the page
    // can't scroll behind the modal (especially the mobile burger menu).
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Auto-focus first form input when a modal containing a form opens
    var form = m.querySelector('form');
    if (form) {
      var first = form.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
      );
      if (first) {
        setTimeout(function () {
          try { first.focus({ preventScroll: true }); } catch (_) { first.focus(); }
        }, 180);
      }
    }
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    // Reset title back to default for the next open
    const titleEl = modal.querySelector('.modal__title');
    if (titleEl && titleEl.dataset.defaultTitle) {
      titleEl.textContent = titleEl.dataset.defaultTitle;
    }
    if (!document.querySelector('.modal.is-open')) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  // Expose for other modules
  window.openModal = openModal;
  window.closeModal = closeModal;

  // Smoothly scroll to a section by id, optionally focusing its first form input.
  function smoothScrollToSection(targetId) {
    var target = document.getElementById(targetId);
    if (!target) return null;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var form = target.querySelector('form');
    if (form) {
      var first = form.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
      );
      if (first) {
        // Wait for smooth scroll to settle before focusing so we don't fight it.
        setTimeout(function () {
          try { first.focus({ preventScroll: true }); } catch (_) { first.focus(); }
        }, 700);
      }
    }
    return target;
  }
  window.smoothScrollToSection = smoothScrollToSection;

  // Global in-page anchor handler: smooth-scroll and keep #hash out of the URL.
  document.addEventListener('click', function (e) {
    // Let modal openers / closers handle themselves.
    if (e.target.closest('[data-modal], [data-close]')) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    // Skip dropdown toggle "Ещё" — JS handles it separately.
    if (a.classList.contains('has-dd')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#' || href.length < 2) return;
    var id = href.slice(1);
    if (!document.getElementById(id)) return;
    e.preventDefault();
    smoothScrollToSection(id);
  });

  document.addEventListener('click', function (e) {
    const opener = e.target.closest('[data-modal]');
    if (opener) {
      e.preventDefault();
      var name = opener.getAttribute('data-modal');
      // Direct opens of the calculator modal always start at step 1
      if (name === 'calculator' && typeof window.calcModalGoTo === 'function') {
        window.calcModalGoTo(1);
      }
      openModal(name, opener);
      return;
    }
    const closer = e.target.closest('[data-close]');
    if (closer) {
      e.preventDefault();
      closeModal(closer.closest('.modal'));
      return;
    }
    if (e.target.classList.contains('modal')) {
      closeModal(e.target);
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

  // ---------- Section calculator → opens modal-calculator (skip duplicate step 1) ----------
  var calcWidget = document.getElementById('calc-widget');
  if (calcWidget) {
    calcWidget.addEventListener('submit', function (e) {
      e.preventDefault();
      // Carry the answered "from" question into the modal so the user doesn't repeat step 1.
      var picked = calcWidget.querySelector('input[name="from"]:checked');
      var modal = document.getElementById('modal-calculator');
      if (picked && modal) {
        var modalRadio = modal.querySelector('input[name="cq1"][value="' + picked.value + '"]');
        if (modalRadio) {
          // Clear other radios + their selected style first
          modal.querySelectorAll('input[name="cq1"]').forEach(function (r) {
            r.checked = false;
            var lbl = r.closest('.calc-opt');
            if (lbl) lbl.classList.remove('is-selected');
          });
          modalRadio.checked = true;
          var lbl = modalRadio.closest('.calc-opt');
          if (lbl) lbl.classList.add('is-selected');
        }
      }
      // Jump straight to step 2 (“Что везём?”)
      calcModalGoTo(2);
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
  // ---------- FAQ CTA repositioning (≤1280px → end of faq__items) ----------
  (function () {
    var cta   = document.querySelector('.faq__cta');
    var items = document.querySelector('.faq__items');
    var left  = document.querySelector('.faq__left');
    if (!cta || !items || !left) return;

    var inItems = false;

    function syncFaqCta() {
      if (window.innerWidth <= 1280 && !inItems) {
        items.appendChild(cta);
        inItems = true;
      } else if (window.innerWidth > 1280 && inItems) {
        left.appendChild(cta);
        inItems = false;
      }
    }

    syncFaqCta();
    window.addEventListener('resize', syncFaqCta);
  }());

  // ---------- Features accordion ----------
  (function () {
    var grid = document.querySelector('.features__grid');
    if (!grid) return;

    var rows   = Array.prototype.slice.call(grid.querySelectorAll('.feature-row'));
    var bgA    = grid.querySelector('.fv-bg--a');
    var bgB    = grid.querySelector('.fv-bg--b');
    var textEl = grid.querySelector('.features__visual-text');

    // Find initially open row index
    var currentIdx = 0;
    rows.forEach(function (row, i) {
      if (row.classList.contains('is-open')) currentIdx = i;
    });

    function activate(idx) {
      if (idx === currentIdx) return;

      // Switch active class
      rows[currentIdx].classList.remove('is-open');
      rows[idx].classList.add('is-open');
      currentIdx = idx;

      // Crossfade background image
      if (bgA && bgB) {
        var imgUrl = rows[idx].dataset.fimg;
        if (imgUrl) {
          bgB.style.backgroundImage = 'url(' + imgUrl + ')';
          bgB.style.opacity = '1';
          setTimeout(function () {
            bgA.style.backgroundImage = 'url(' + imgUrl + ')';
            bgB.style.opacity = '0';
          }, 550);
        }
      }

      // Fade visual text
      if (textEl) {
        var newText = rows[idx].dataset.ftext || '';
        textEl.style.transition = 'opacity 0.3s ease';
        textEl.style.opacity = '0';
        setTimeout(function () {
          textEl.innerHTML = newText;
          textEl.style.opacity = '1';
        }, 300);
      }
    }

    // Attach click listeners
    rows.forEach(function (row, i) {
      row.addEventListener('click', function () { activate(i); });
    });
  }());

  // ---------- Features mobile slider (≤1280px) ----------
  (function () {
    var section = document.querySelector('.features');
    if (!section) return;

    var rows = Array.prototype.slice.call(section.querySelectorAll('.feature-row'));
    if (!rows.length) return;

    // Build slider DOM
    var slider = document.createElement('div');
    slider.className = 'features-slider';

    var trackWrap = document.createElement('div');
    trackWrap.className = 'features-slider__wrap';

    var track = document.createElement('div');
    track.className = 'features-slider__track';

    rows.forEach(function (row) {
      var imgUrl = row.dataset.fimg || 'assets/img/feature-img.jpg';
      var ftext  = row.dataset.ftext || '';
      var titleEl = row.querySelector('.feature-row__content h3');
      var descEl  = row.querySelector('.feature-row__content p');
      var numEl   = row.querySelector('.feature-row__num');

      var slide = document.createElement('div');
      slide.className = 'feature-slide';
      slide.innerHTML =
        '<div class="feature-slide__visual" style="background-image:url(' + imgUrl + ')">' +
          '<div class="feature-slide__overlay"></div>' +
          '<h3 class="feature-slide__vtext">' + ftext + '</h3>' +
        '</div>' +
        '<div class="feature-slide__body">' +
          '<div class="feature-slide__content">' +
            '<h3>' + (titleEl ? titleEl.innerHTML : '') + '</h3>' +
            '<p>' + (descEl ? descEl.innerHTML : '') + '</p>' +
          '</div>' +
          '<span class="feature-slide__num">' + (numEl ? numEl.textContent.trim() : '') + '</span>' +
        '</div>';

      track.appendChild(slide);
    });

    trackWrap.appendChild(track);
    slider.appendChild(trackWrap);

    var grid = section.querySelector('.features__grid');
    grid.parentNode.insertBefore(slider, grid.nextSibling);

    // Slider state
    var currentIdx = 0;
    var total = rows.length;
    var baseOffset = 0; // px offset at drag start

    function getStep() {
      var s = track.querySelector('.feature-slide');
      return s ? s.offsetWidth : 0;
    }

    function snapTo(idx) {
      if (idx < 0) idx = 0;
      if (idx >= total) idx = total - 1;
      currentIdx = idx;
      track.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      track.style.transform = 'translateX(' + (-currentIdx * getStep()) + 'px)';
    }

    function dragMove(delta) {
      track.style.transition = 'none';
      track.style.transform = 'translateX(' + (baseOffset + delta) + 'px)';
    }

    // ---- Touch ----
    var tx = 0, ty = 0, isHoriz = false;
    track.addEventListener('touchstart', function (e) {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      isHoriz = false;
      baseOffset = -currentIdx * getStep();
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
      var dx = e.touches[0].clientX - tx;
      var dy = e.touches[0].clientY - ty;
      if (!isHoriz && Math.abs(dx) < Math.abs(dy)) return; // vertical scroll
      isHoriz = true;
      dragMove(dx);
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      if (!isHoriz) return;
      var d = tx - e.changedTouches[0].clientX;
      var threshold = getStep() * 0.25;
      snapTo(currentIdx + (d > threshold ? 1 : d < -threshold ? -1 : 0));
    });

    // ---- Mouse drag ----
    var mx = 0, dragging = false;
    track.addEventListener('mousedown', function (e) {
      mx = e.clientX;
      dragging = true;
      baseOffset = -currentIdx * getStep();
      track.style.transition = 'none';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      dragMove(e.clientX - mx);
    });

    document.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      var d = mx - e.clientX;
      var threshold = getStep() * 0.25;
      snapTo(currentIdx + (d > threshold ? 1 : d < -threshold ? -1 : 0));
    });
  }());

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
    if (window.innerWidth <= 640) {
      var wrap = document.getElementById('carousel-portfolio');
      return wrap ? wrap.offsetWidth / 320 : 1;
    }
    return window.innerWidth <= 1024 ? 1.15 : 2;
  }, true);

  // ---------- Portfolio modal slider ----------
  (function () {
    var modal = document.getElementById('modal-portfolio');
    if (!modal) return;
    var mainImg = modal.querySelector('.pf-main-img');
    var thumbsWrap = modal.querySelector('.pf-thumbs');
    var arrowsWrap = modal.querySelector('.pf-arrows');
    if (!mainImg || !thumbsWrap || !arrowsWrap) return;

    var images = [];
    var currentIdx = 0;

    function url(src) { return "url('" + src + "')"; }

    function show(idx, animate) {
      if (!images.length) return;
      idx = ((idx % images.length) + images.length) % images.length;
      var prevImg = mainImg.style.backgroundImage;
      var nextImg = url(images[idx]);
      var changed = prevImg !== nextImg;
      currentIdx = idx;

      if (animate && changed && prevImg) {
        // Crossfade: snapshot the previous image into a fade-out overlay
        // sitting on top of the main image, then swap the main image to the
        // new one. The overlay's opacity transitions to 0, revealing the new.
        var fade = document.createElement('div');
        fade.className = 'pf-main-img__fade';
        fade.style.backgroundImage = prevImg;
        mainImg.appendChild(fade);
        mainImg.style.backgroundImage = nextImg;
        // Force layout so the transition runs from opacity:1 -> 0.
        // eslint-disable-next-line no-unused-expressions
        fade.offsetWidth;
        fade.classList.add('is-fading-out');
        var done = false;
        var cleanup = function () {
          if (done) return;
          done = true;
          if (fade.parentNode) fade.parentNode.removeChild(fade);
        };
        fade.addEventListener('transitionend', cleanup);
        // Safety fallback in case transitionend doesn't fire.
        setTimeout(cleanup, 600);
      } else {
        mainImg.style.backgroundImage = nextImg;
      }

      Array.from(thumbsWrap.children).forEach(function (t, i) {
        if (i === idx) t.classList.add('is-active');
        else t.classList.remove('is-active');
      });
    }

    function rebuildThumbs() {
      thumbsWrap.innerHTML = '';
      images.forEach(function (src, i) {
        var div = document.createElement('div');
        div.style.backgroundImage = url(src);
        if (i === 0) div.classList.add('is-active');
        div.addEventListener('click', function () { show(i, true); });
        thumbsWrap.appendChild(div);
      });
    }

    // Wire up arrows (delegated by buttons inside .pf-arrows)
    var arrowBtns = arrowsWrap.querySelectorAll('button');
    if (arrowBtns.length >= 2) {
      arrowBtns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        show(currentIdx - 1, true);
      });
      arrowBtns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        show(currentIdx + 1, true);
      });
    }

    // Touch swipe on main image
    var startX = 0;
    mainImg.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    mainImg.addEventListener('touchend', function (e) {
      var dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) show(currentIdx + (dx > 0 ? 1 : -1), true);
    }, { passive: true });

    // Keyboard arrows when modal is open
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') show(currentIdx - 1, true);
      else if (e.key === 'ArrowRight') show(currentIdx + 1, true);
    });

    // Hook: every time a portfolio card opens the modal, repopulate images from data-images
    function loadFromOpener(opener) {
      if (!opener) return;
      var raw = opener.getAttribute('data-images') || '';
      var list = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!list.length) {
        // Fallback: try to read background-image from .case-card__img
        var img = opener.querySelector('.case-card__img');
        if (img) {
          var m = (img.getAttribute('style') || '').match(/url\(['"]?([^'")]+)['"]?\)/);
          if (m) list = [m[1]];
        }
      }
      images = list;
      rebuildThumbs();
      show(0, false);
    }

    // Listen for clicks that open the portfolio modal so we can populate it first
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-modal="portfolio"]');
      if (opener) loadFromOpener(opener);
    }, true); // capture phase so it runs before openModal's bubble handler
  }());

  // Reviews: infinite loop — restore border-left on the first visible card after each slide
  makeCarousel('reviews', 'carousel-reviews', function () {
    if (window.innerWidth <= 640) {
      var wrap = document.getElementById('carousel-reviews');
      return wrap ? wrap.offsetWidth / 320 : 1;
    }
    return window.innerWidth <= 1024 ? 1.15 : window.innerWidth <= 1280 ? 2 : 3;
  }, true, function (track, current) {
    Array.from(track.children).forEach(function (card) {
      card.style.borderLeft = '';
    });
    if (track.children[current]) {
      track.children[current].style.borderLeft = '1px solid #E0DFDE';
    }
  });

  // ---------- Mobile menu nav links — close menu then smooth scroll ----------
  (function () {
    var menuModal = document.getElementById('modal-menu');
    if (!menuModal) return;

    menuModal.addEventListener('click', function (e) {
      var link = e.target.closest('.menu-list a[href]');
      if (!link) return;

      var href = link.getAttribute('href');
      // Only intercept hash links (in-page anchors)
      if (!href || !href.startsWith('#')) return;

      e.preventDefault();

      var targetId = href.slice(1);

      // Close the menu first
      closeModal(menuModal);

      // Wait for the close animation to finish (matches modal transition: 0.28s)
      setTimeout(function () {
        if (typeof window.smoothScrollToSection === 'function') {
          window.smoothScrollToSection(targetId);
        } else {
          var target = document.getElementById(targetId);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  }());

  // ---------- Header "Ещё" dropdown — click toggle on touch / keyboard ----------
  (function () {
    var ddWraps = document.querySelectorAll('.has-dd-wrap');
    if (!ddWraps.length) return;

    ddWraps.forEach(function (wrap) {
      var trigger = wrap.querySelector('.has-dd');
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var open = wrap.classList.toggle('is-open');
        // Close other open dropdowns
        if (open) {
          ddWraps.forEach(function (w) {
            if (w !== wrap) w.classList.remove('is-open');
          });
        }
      });

      // Close on dropdown link click
      wrap.querySelectorAll('.dd-menu a').forEach(function (a) {
        a.addEventListener('click', function () {
          wrap.classList.remove('is-open');
        });
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-dd-wrap')) {
        ddWraps.forEach(function (w) { w.classList.remove('is-open'); });
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ddWraps.forEach(function (w) { w.classList.remove('is-open'); });
      }
    });
  }());

  // ---------- Sticky header ----------
  (function () {
    var header = document.querySelector('.site-header');
    var placeholder = document.getElementById('header-placeholder');
    if (!header) return;

    // Only sticky on index (has is-overlay class)
    if (!header.classList.contains('is-overlay')) return;

    var triggered = false;
    var headerHeight = header.offsetHeight || 84;
    var STICKY_TRANSITION_MS = 400;
    var leavingTimer = null;

    function showSticky() {
      if (leavingTimer) {
        clearTimeout(leavingTimer);
        leavingTimer = null;
      }
      // 1. Put header into fixed position, off-screen, with no transition.
      header.classList.remove('is-overlay', 'is-sticky-leaving');
      header.classList.add('is-sticky', 'is-sticky-entering');
      // 2. Force reflow so the browser registers the off-screen state.
      header.offsetHeight; // eslint-disable-line no-unused-expressions
      // 3. Remove the entering modifier → the .is-sticky transition runs the slide-in.
      header.classList.remove('is-sticky-entering');
      if (placeholder) {
        placeholder.classList.add('is-active');
        placeholder.style.height = headerHeight + 'px';
      }
    }

    function hideSticky() {
      // Animate out: keep .is-sticky for fixed positioning, add leaving modifier
      // to transition opacity/transform back off-screen.
      header.classList.add('is-sticky-leaving');
      if (placeholder) placeholder.classList.remove('is-active');

      if (leavingTimer) clearTimeout(leavingTimer);
      leavingTimer = setTimeout(function () {
        leavingTimer = null;
        // Only revert if we're still in the leaving state (not re-shown mid-animation).
        if (!header.classList.contains('is-sticky-leaving')) return;
        // Suppress the hero-anim--header transition during cleanup so the header
        // doesn't animate back in from translateY(-100%) when we swap classes.
        header.style.transition = 'none';
        header.classList.remove('is-sticky', 'is-sticky-leaving');
        header.classList.add('is-overlay');
        // Force reflow so the no-transition state is applied before we re-enable.
        header.offsetHeight; // eslint-disable-line no-unused-expressions
        header.style.transition = '';
      }, STICKY_TRANSITION_MS + 30);
    }

    function onScroll() {
      if (window.scrollY > window.innerHeight * 0.85) {
        if (!triggered) {
          triggered = true;
          showSticky();
        }
      } else {
        if (triggered) {
          triggered = false;
          hideSticky();
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }());

  // ---------- Hero entry animation ----------
  (function () {
    var header = document.querySelector('.site-header');
    var heroTitle = document.querySelector('.hero__title');
    var heroLead  = document.querySelector('.hero__lead');
    var heroMetrics = document.querySelectorAll('.hero__calc, .hero__metric');

    var targets = [];
    if (header)     targets.push({ el: header,    delay: 0,   cls: 'hero-anim--header' });
    if (heroTitle)  targets.push({ el: heroTitle,  delay: 200, cls: 'hero-anim' });
    if (heroLead)   targets.push({ el: heroLead,   delay: 400, cls: 'hero-anim' });
    heroMetrics.forEach(function (m, i) {
      targets.push({ el: m, delay: 580 + i * 130, cls: 'hero-anim' });
    });

    // Apply hidden state via inline style BEFORE first paint,
    // then replace with CSS class so the transition kicks in.
    targets.forEach(function (t) {
      t.el.style.opacity = '0';
      if (t.cls === 'hero-anim--header') {
        t.el.style.transform = 'translateY(-24px)';
      } else {
        t.el.style.transform = 'translateY(40px)';
      }
    });

    // After browser has painted opacity:0, switch to class-based transition
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (t) {
          // Remove inline style overrides, add CSS class (which sets opacity:0 via CSS)
          t.el.style.opacity = '';
          t.el.style.transform = '';
          t.el.classList.add(t.cls);
          // Trigger transition after a frame
          setTimeout(function () {
            t.el.classList.add('is-visible');
          }, t.delay);
        });
      });
    });
  }());

  // ---------- Parallax ----------
  (function () {
    // Respect reduced-motion preference
    var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduce && prefersReduce.matches) return;

    // Existing parallax targets (preserve original behavior)
    var heroBgImg = document.querySelector('.hero__bg img');
    var routesBgImg = document.querySelector('.routes__bg img');
    var garantBg = document.querySelector('.garant__bg');

    // New parallax targets — apply via CSS variables so they don't affect
    // image dimensions or other inline styles (e.g. crossfade backgroundImage).
    var calcInner = document.querySelector('.calc__inner');
    var fvBgA = document.querySelector('.fv-bg--a');
    var fvBgB = document.querySelector('.fv-bg--b');
    var featuresVisual = document.querySelector('.features__visual');
    var calcSection = calcInner && calcInner.closest('.calc');
    var routesSection = routesBgImg && routesBgImg.closest('.routes');
    var garantSection = garantBg && garantBg.closest('.garant');

    function progressFor(rect) {
      // 0 = section just entering from bottom, 0.5 = centered, 1 = leaving top
      return (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    }

    var ticking = false;

    function update() {
      ticking = false;
      var sy = window.scrollY;
      var vh = window.innerHeight;

      // Hero: original behavior — translate proportional to scrollY
      if (heroBgImg) {
        heroBgImg.style.transform = 'translateY(' + (sy * 0.35) + 'px)';
      }

      // Routes: original behavior — translate based on section progress
      if (routesBgImg && routesSection) {
        var rRect = routesSection.getBoundingClientRect();
        if (rRect.bottom > 0 && rRect.top < vh) {
          var rProgress = progressFor(rRect);
          routesBgImg.style.transform = 'translateY(' + (rProgress * -60) + 'px)';
        }
      }

      // Garant: original behavior — translate based on section progress
      if (garantBg && garantSection) {
        var gRect = garantSection.getBoundingClientRect();
        if (gRect.bottom > 0 && gRect.top < vh) {
          var gProgress = progressFor(gRect);
          garantBg.style.transform = 'translateY(' + (gProgress * -50) + 'px)';
        }
      }

      // Calc: shift pseudo-element bg via CSS var (symmetric around center).
      if (calcInner && calcSection) {
        var cRect = calcSection.getBoundingClientRect();
        if (cRect.bottom > 0 && cRect.top < vh) {
          var cProgress = progressFor(cRect);
          if (cProgress < 0) cProgress = 0;
          else if (cProgress > 1) cProgress = 1;
          var cOffset = (cProgress - 0.5) * 2 * 50;
          calcInner.style.setProperty('--calc-bg-y', cOffset.toFixed(1) + 'px');
        }
      }

      // Features visual: shift bg-position on both crossfade layers via CSS var
      if (featuresVisual && (fvBgA || fvBgB)) {
        var fRect = featuresVisual.getBoundingClientRect();
        if (fRect.bottom > 0 && fRect.top < vh) {
          var fProgress = progressFor(fRect);
          if (fProgress < 0) fProgress = 0;
          else if (fProgress > 1) fProgress = 1;
          var fOffset = (fProgress - 0.5) * 2 * 70;
          var fStr = fOffset.toFixed(1) + 'px';
          if (fvBgA) fvBgA.style.setProperty('--fv-bg-y', fStr);
          if (fvBgB) fvBgB.style.setProperty('--fv-bg-y', fStr);
        }
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }());

  // ---------- Sticky steps heading ----------
  (function () {
    var heading = document.querySelector('.steps__heading');
    var section = document.querySelector('.steps');
    if (!heading || !section) return;

    // Cache the original top offset of heading relative to section (set once on load/resize)
    var headingOffsetInSection = 0;

    function cacheOffsets() {
      // Distance from section top to heading top (in document flow, no scroll)
      headingOffsetInSection = heading.getBoundingClientRect().top - section.getBoundingClientRect().top;
    }

    function update() {
      // Only active on wide screens (2-column layout)
      if (window.innerWidth <= 1280) {
        heading.style.transform = '';
        return;
      }

      var sectionRect = section.getBoundingClientRect();
      var headingHeight = heading.offsetHeight;
      var offsetTop = 100; // desired gap from viewport top

      // How far the heading's natural position is from offsetTop
      // heading natural viewport top = sectionRect.top + headingOffsetInSection (adjusted for current translate)
      // We want heading to sit at offsetTop once sectionRect.top + headingOffsetInSection < offsetTop
      var naturalHeadingTop = sectionRect.top + headingOffsetInSection;

      if (naturalHeadingTop <= offsetTop) {
        var translate = offsetTop - naturalHeadingTop;

        // Max translate: heading bottom must not exceed section bottom minus bottom padding
        var sectionBottom = sectionRect.bottom;
        var bottomPadding = 60; // matches .steps .container padding-bottom
        var maxTranslate = sectionBottom - (sectionRect.top + headingOffsetInSection) - headingHeight - bottomPadding;

        translate = Math.min(translate, Math.max(maxTranslate, 0));
        translate = Math.max(translate, 0);
        heading.style.transform = 'translateY(' + translate + 'px)';
      } else {
        heading.style.transform = 'translateY(0)';
      }
    }

    // On resize recalculate the static offset (before any transform)
    window.addEventListener('resize', function () {
      heading.style.transform = '';
      cacheOffsets();
      update();
    }, { passive: true });

    window.addEventListener('scroll', update, { passive: true });

    // Init
    cacheOffsets();
    update();
  }());


  (function () {
    if (!('IntersectionObserver' in window)) return;

    // Selectors of elements to animate when they enter the viewport.
    // Picks section titles, paragraphs/cards/rows — broad coverage with sensible defaults.
    var selectors = [
      'h2', 'h3',
      '.section-tag',
      '.type-card',
      '.routes__row',
      '.routes__after',
      '.feature-row',
      '.features__visual',
      '.num-card',
      '.calc__inner',
      '.step-item',
      '.garant-card',
      '#carousel-portfolio',
      '#carousel-reviews',
      '.faq-item',
      '.faq__cta',
      '.site-footer__top'
    ];

    // Carousels get fade-only (no translateY) because overflow:hidden clips vertical movement
    var fadeOnlySelectors = ['#carousel-portfolio', '#carousel-reviews'];

    var nodes = document.querySelectorAll(selectors.join(','));

    // Filter out elements inside carousel tracks and mobile sliders —
    // the whole carousel wrap animates instead of individual slides.
    var filteredNodes = Array.prototype.filter.call(nodes, function (el) {
      return !el.closest('.carousel-track') && !el.closest('.features-slider__track');
    });

    filteredNodes.forEach(function (el) {
      var isFadeOnly = fadeOnlySelectors.some(function (s) { return el.matches(s); });
      el.classList.add(isFadeOnly ? 'reveal--fade' : 'reveal');
    });

    // Stagger groups within the same parent for a wave effect.
    var seen = new WeakMap();
    filteredNodes.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var idx = seen.get(parent) || 0;
      // Cap delay so very long lists don't take forever to reveal.
      var delay = Math.min(idx * 110, 500);
      el.style.transitionDelay = delay + 'ms';
      seen.set(parent, idx + 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

    filteredNodes.forEach(function (el) { io.observe(el); });
  }());

})();
