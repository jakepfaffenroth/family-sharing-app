// Detect if given element is visible within the viewport
// If not, move it into the viewport
const isInViewport = el => {
  const bounding = el.getBoundingClientRect();
  return (
    // bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
};

const outsideEdges = el => {
  const bounding = el.getBoundingClientRect();
  return {
    // top: bounding.top < 0,
    left: bounding.left < 0,
    bottom:
      bounding.bottom >
      (window.innerHeight || document.documentElement.clientHeight),
    right:
      bounding.right >
      (window.innerWidth || document.documentElement.clientWidth)
  };
};

const adjustPosition = el => {
  const edges = outsideEdges(el);
  // console.log('edges:', edges);
  const needsMoreAdjustment = el.classList.value.includes('posAdjust');

  el.classList.remove('left-0', 'right-0', 'bottom-0');
  const posAdjust = [];
  for (const key in edges) {
    if (edges[key]) {
      posAdjust.push(key + '-' + (needsMoreAdjustment ? '4' : '0'));
    }
  }
  // console.log('adding', posAdjust);
  el.classList.add('posAdjust');
  for (const value of posAdjust) {
    el.classList.add(value);
  }
  // console.log('el.classList.value:', el.classList.value);
};

export default el => {
  // console.log('isInViewport(el):', isInViewport(el));
  if (isInViewport(el)) {
    return;
  } else {
    adjustPosition(el);
  }
};
