(function () {
  var form = document.getElementById('rsvp-form');
  if (!form) return;

  var T = window.RSVP_TEXT || {};
  var list = document.getElementById('guest-list');
  var tpl = document.getElementById('guest-template');
  var addBtn = document.getElementById('add-guest');
  var status = document.getElementById('rsvp-status');
  var thanks = document.getElementById('rsvp-thanks');
  var submitBtn = form.querySelector('button[type=submit]');
  var maxGuests = parseInt(form.dataset.maxGuests, 10) || 6;

  function attending() {
    var checked = form.querySelector('input[name=attending]:checked');
    return checked ? checked.value : null;
  }

  // Declining guests only need to give names, so hide and un-require meal fields.
  function applyAttending() {
    var declining = attending() === 'no';
    form.classList.toggle('declining', declining);
    list.querySelectorAll('select[data-field=meal]').forEach(function (s) {
      s.required = !declining;
    });
  }

  function renumber() {
    var guests = list.querySelectorAll('.guest');
    guests.forEach(function (g, i) {
      g.querySelector('.n').textContent = i + 1;
      g.querySelector('.remove').hidden = guests.length === 1;
    });
    addBtn.hidden = guests.length >= maxGuests;
  }

  function addGuest() {
    var node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.remove').addEventListener('click', function () {
      node.remove();
      renumber();
    });
    list.appendChild(node);
    renumber();
    applyAttending();
    return node;
  }

  function setStatus(msg, kind) {
    status.textContent = msg || '';
    status.className = kind || '';
  }

  form.querySelectorAll('input[name=attending]').forEach(function (radio) {
    radio.addEventListener('change', applyAttending);
  });
  addBtn.addEventListener('click', function () {
    addGuest().querySelector('input').focus();
  });
  addGuest();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.website.value) return; // bot filled the honeypot

    if (!form.checkValidity()) {
      form.classList.add('validated');
      setStatus(T.required, 'error');
      var firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var endpoint = form.dataset.endpoint;
    if (!endpoint) {
      setStatus(T.not_configured, 'error');
      return;
    }

    var going = attending() === 'yes';
    var payload = {
      lang: form.dataset.lang,
      attending: attending(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      guests: Array.prototype.map.call(list.querySelectorAll('.guest'), function (g) {
        return {
          name: g.querySelector('[data-field=name]').value.trim(),
          meal: going ? g.querySelector('[data-field=meal]').value : '',
          dietary: going ? g.querySelector('[data-field=dietary]').value.trim() : ''
        };
      })
    };

    submitBtn.disabled = true;
    submitBtn.textContent = T.sending;
    setStatus('');

    // text/plain + no-cors keeps this a "simple" request, which Apps Script accepts
    // without a CORS preflight. The response is opaque, so a network error is the
    // only failure we can detect here.
    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      form.hidden = true;
      thanks.textContent = going ? T.thanks_yes : T.thanks_no;
      thanks.hidden = false;
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () {
      setStatus(T.error, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = T.submit;
    });
  });
})();
