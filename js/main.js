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
    document.body.style.overflow = 'hidden';
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
      document.body.style.overflow = '';
    }
  }

  // Expose for other modules
  window.openModal = openModal;
  window.closeModal = closeModal;

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

    var dotsContainer = document.getElementById('dots-' + navAttr);
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

    // Build pagination dots (one per real slide)
    var dotButtons = [];
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (var di = 0; di < N; di++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'К слайду ' + (idx + 1));
          if (idx === 0) b.classList.add('is-active');
          b.addEventListener('click', function () {
            var base = infinite ? N : 0;
            moveTo(base + idx, true);
          });
          dotsContainer.appendChild(b);
          dotButtons.push(b);
        })(di);
      }
    }

    function syncDots() {
      if (!dotButtons.length) return;
      var realIdx = ((current % N) + N) % N;
      for (var i = 0; i < dotButtons.length; i++) {
        if (i === realIdx) dotButtons[i].classList.add('is-active');
        else dotButtons[i].classList.remove('is-active');
      }
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
      syncDots();
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
    return window.innerWidth <= 1024 ? 1.15 : 2;
  }, true);

  // Per-card image switcher (after carousel clones cards, init for all of them)
  function initImageSwitcher(card) {
    var dots = card.querySelectorAll('.case-card__img-dot');
    var imgs = card.querySelectorAll('.case-card__media .case-card__img');
    if (dots.length === 0 || imgs.length === 0) return;
    dots.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(dot.getAttribute('data-img'), 10) || 0;
        imgs.forEach(function (img, i) {
          if (i === idx) img.classList.add('is-active');
          else img.classList.remove('is-active');
        });
        dots.forEach(function (d, i) {
          if (i === idx) d.classList.add('is-active');
          else d.classList.remove('is-active');
        });
      });
    });
  }
  document.querySelectorAll('#carousel-portfolio .case-card').forEach(initImageSwitcher);

  // Reviews: infinite loop — restore border-left on the first visible card after each slide
  makeCarousel('reviews', 'carousel-reviews', function () {
    return window.innerWidth <= 1024 ? 1.15 : window.innerWidth <= 1280 ? 2 : 3;
  }, true, function (track, current) {
    Array.from(track.children).forEach(function (card) {
      card.style.borderLeft = '';
    });
    if (track.children[current]) {
      track.children[current].style.borderLeft = '1px solid #E0DFDE';
    }
  });

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

  // ---------- Scroll-triggered reveal animations (sibur-style) ----------
  (function () {
    if (!('IntersectionObserver' in window)) return;
    // Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Selectors of elements to animate when they enter the viewport.
    // Picks section titles, paragraphs/cards/rows — broad coverage with sensible defaults.
    var selectors = [
      'h1', 'h2', 'h3',
      '.section-tag',
      '.hero__lead',
      '.hero__metric',
      '.hero__calc',
      '.type-card',
      '.routes__row',
      '.routes__after',
      '.feature-row',
      '.features__visual',
      '.num-card',
      '.calc__inner',
      '.step-item',
      '.garant-card',
      '.case-card',
      '.review-card',
      '.faq-item',
      '.faq__cta',
      '.site-footer__top'
    ];

    var nodes = document.querySelectorAll(selectors.join(','));
    nodes.forEach(function (el) {
      el.classList.add('reveal');
    });

    // Stagger groups within the same parent for a wave effect.
    var seen = new WeakMap();
    nodes.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var idx = seen.get(parent) || 0;
      // Cap delay so very long lists don't take forever to reveal.
      var delay = Math.min(idx * 70, 350);
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    nodes.forEach(function (el) { io.observe(el); });
  }());

})();
