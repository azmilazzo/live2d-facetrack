function simulateMouseMove(x, y) {
  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });
  document.dispatchEvent(event);
}
