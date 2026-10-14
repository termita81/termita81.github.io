/** The P / A / S / M buttons. */
export function bindModeSelector(store) {
  for (const input of document.querySelectorAll('input[name="exposure-mode"]')) {
    input.addEventListener('change', () => store.update({ mode: input.value }));
  }
}
