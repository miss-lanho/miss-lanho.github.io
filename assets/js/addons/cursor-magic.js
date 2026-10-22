!function () {
  const style = document.createElement('style');
  style.textContent = `
    :root{--glow-rgb:239 42 201}
    .glow-point{position:absolute;width:5px;height:5px;border-radius:999px;background:rgb(var(--glow-rgb));box-shadow:0 0 1.35rem .65rem rgb(var(--glow-rgb)/.82);pointer-events:none;z-index:999999;mix-blend-mode:screen;animation:glow-point-out 420ms ease-out forwards}
    .star{position:absolute;z-index:999999;color:white;font-size:1rem;line-height:1;animation-duration:1500ms;animation-fill-mode:forwards;pointer-events:none;text-shadow:0 0 1rem currentColor;mix-blend-mode:screen}
    @keyframes glow-point-out{0%{opacity:.95;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.18)}}
    @keyframes fall-1{0%{transform:translate(0,0) rotateX(45deg) rotateY(30deg) rotateZ(0) scale(.25);opacity:0}5%{transform:translate(10px,-10px) rotateX(45deg) rotateY(30deg) rotateZ(0) scale(1);opacity:1}100%{transform:translate(25px,200px) rotateX(180deg) rotateY(270deg) rotateZ(90deg) scale(1);opacity:0}}
    @keyframes fall-2{0%{transform:translate(0,0) rotateX(-20deg) rotateY(10deg) scale(.25);opacity:0}10%{transform:translate(-10px,-5px) rotateX(-20deg) rotateY(10deg) scale(1);opacity:1}100%{transform:translate(-10px,160px) rotateX(-90deg) rotateY(45deg) scale(.25);opacity:0}}
    @keyframes fall-3{0%{transform:translate(0,0) rotateX(0) rotateY(45deg) scale(.5);opacity:0}15%{transform:translate(7px,5px) rotateX(0) rotateY(45deg) scale(1);opacity:1}100%{transform:translate(20px,120px) rotateX(-180deg) rotateY(-90deg) scale(.5);opacity:0}}
  `;
  document.head.appendChild(style);

  const start = Date.now();
  const originPosition = { x: 0, y: 0 };
  const last = {
    starTimestamp: start,
    starPosition: originPosition,
    mousePosition: originPosition
  };
  const config = {
    starAnimationDuration: 1500,
    minimumTimeBetweenStars: 180,
    minimumDistanceBetweenStars: 54,
    glowDuration: 420,
    maximumGlowPointSpacing: 9,
    colors: ['249 146 253', '137 247 255', '255 157 199', '255 228 156', '252 254 255'],
    sizes: ['1.35rem', '1rem', '.75rem'],
    animations: ['fall-1', 'fall-2', 'fall-3'],
    symbols: ['✦', '✧', '✩', '✶']
  };
  let count = 0;

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const selectRandom = list => list[rand(0, list.length - 1)];
  const px = value => `${value}px`;
  const ms = value => `${value}ms`;
  const calcDistance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const appendElement = element => document.body.appendChild(element);
  const removeElement = (element, delay) => setTimeout(() => element.remove(), delay);

  function createStar(position) {
    const star = document.createElement('span');
    const color = selectRandom(config.colors);
    star.className = 'star';
    star.textContent = selectRandom(config.symbols);
    star.style.left = px(position.x);
    star.style.top = px(position.y);
    star.style.fontSize = selectRandom(config.sizes);
    star.style.color = `rgb(${color})`;
    star.style.animationName = config.animations[count++ % config.animations.length];
    star.style.animationDuration = ms(config.starAnimationDuration);
    appendElement(star);
    removeElement(star, config.starAnimationDuration);
  }

  function createGlowPoint(position) {
    const glow = document.createElement('div');
    const color = selectRandom(config.colors);
    glow.className = 'glow-point';
    glow.style.left = px(position.x);
    glow.style.top = px(position.y);
    glow.style.setProperty('--glow-rgb', color);
    appendElement(glow);
    removeElement(glow, config.glowDuration);
  }

  function createGlow(from, to) {
    const distance = calcDistance(from, to);
    const quantity = Math.max(Math.floor(distance / config.maximumGlowPointSpacing), 1);
    const stepX = (to.x - from.x) / quantity;
    const stepY = (to.y - from.y) / quantity;

    Array.from({ length: quantity }).forEach((_, index) => {
      createGlowPoint({ x: from.x + stepX * index, y: from.y + stepY * index });
    });
  }

  function updateLastStar(position) {
    last.starTimestamp = Date.now();
    last.starPosition = position;
  }

  function updateLastMousePosition(position) {
    last.mousePosition = position;
  }

  function handleMove(event) {
    const point = event.touches ? event.touches[0] : event;
    const position = { x: point.pageX, y: point.pageY };

    if (last.mousePosition.x === 0 && last.mousePosition.y === 0) {
      updateLastMousePosition(position);
    }

    const now = Date.now();
    const farEnough = calcDistance(last.starPosition, position) >= config.minimumDistanceBetweenStars;
    const waitedEnough = now - last.starTimestamp > config.minimumTimeBetweenStars;

    if (farEnough || waitedEnough) {
      createStar(position);
      updateLastStar(position);
    }

    createGlow(last.mousePosition, position);
    updateLastMousePosition(position);
  }

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('touchmove', handleMove, { passive: true });
  document.body.addEventListener('mouseleave', () => updateLastMousePosition(originPosition));
}();
