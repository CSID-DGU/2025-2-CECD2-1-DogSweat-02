document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#camera-form');
  if (!form) {
    return;
  }

  const typeRadios = form.querySelectorAll('input[name="streamType"]');
  const urlInput = form.querySelector('[data-role="stream-url-input"]');
  const helperText = form.querySelector('[data-role="stream-url-helper"]');
  const urlLabel = form.querySelector('[data-role="stream-url-label"]');
  const optionPills = form.querySelectorAll('.option-pill');

  if (!typeRadios.length || !urlInput) {
    return;
  }

  const defaults = {
    placeholder: urlInput.getAttribute('placeholder') || '',
    helper: helperText ? helperText.textContent.trim() : '',
    label: urlLabel ? urlLabel.textContent.trim() : ''
  };

  const updateActiveState = () => {
    if (!optionPills.length) {
      return;
    }
    optionPills.forEach((pill) => {
      const input = pill.querySelector('input[type="radio"]');
      pill.classList.toggle('is-active', Boolean(input?.checked));
    });
  };

  const applyConfig = (radio) => {
    if (!radio || !radio.checked) {
      return;
    }

    const { urlPlaceholder, helper } = radio.dataset;
    if (urlPlaceholder) {
      urlInput.placeholder = urlPlaceholder;
    } else {
      urlInput.placeholder = defaults.placeholder;
    }

    if (helperText) {
      helperText.textContent = helper || defaults.helper;
    }

    if (urlLabel) {
      urlLabel.textContent = radio.value === 'YOUTUBE' ? 'YouTube 스트리밍 주소' : 'RTSP 스트리밍 주소';
    }

    updateActiveState();
  };

  typeRadios.forEach((radio) => {
    radio.addEventListener('change', () => applyConfig(radio));
    if (radio.checked) {
      applyConfig(radio);
    }
  });
});
