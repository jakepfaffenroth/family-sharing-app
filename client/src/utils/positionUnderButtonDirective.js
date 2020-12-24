
export default (el, binding) => {
  const menuBtn = binding.instance.$refs.menuBtn || null;
  const bounding = menuBtn.getBoundingClientRect();
  console.log('bounding:', bounding);
  console.log('el:', el);
  console.log(
    'binding.instance.$refs.menuBtn:',
    binding.instance.$refs.menuBtn
  );

  el.style.width = bounding.width + 'px';
  el.style.height = bounding.height + 'px';
  console.log('el:', el);
};
