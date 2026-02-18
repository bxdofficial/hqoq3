const typeSelect = document.getElementById('user_type');
const barField = document.getElementById('bar-field');
if (typeSelect && barField) {
  const toggle = () => barField.classList.toggle('hidden', typeSelect.value !== 'lawyer');
  typeSelect.addEventListener('change', toggle);
  toggle();
}
