!function () {
  const style = document.createElement('style');
  style.textContent = `
    #waifu-toggle{position:fixed;left:18px;bottom:18px;z-index:92;width:42px;height:42px;border:1px solid hsl(var(--border));border-radius:999px;background:hsl(var(--primary-foreground)/.86);backdrop-filter:blur(12px);color:hsl(var(--foreground));display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 12px 30px rgb(0 0 0/.28);transition:.2s ease}
    #waifu-toggle:hover{transform:translateY(-3px);color:hsl(var(--primary))}
    body #waifu{left:18px!important;right:auto!important;bottom:6px!important;z-index:90!important;filter:drop-shadow(0 18px 22px rgb(0 0 0/.34));transform-origin:left bottom;transition:.25s ease!important;pointer-events:auto!important}
    body #waifu:hover{transform:translateY(-6px)}
    #waifu-tips{border:1px solid hsl(var(--border))!important;border-radius:14px!important;background:hsl(var(--primary-foreground)/.88)!important;backdrop-filter:blur(12px);box-shadow:0 12px 30px rgb(0 0 0/.22)!important;color:hsl(var(--foreground))!important;font-size:12px!important}
    #waifu-tool{display:none!important}
    #live2d{cursor:grab!important}
    .waifu-floor-effect{position:fixed;left:20px;bottom:12px;z-index:91;width:170px;height:58px;pointer-events:none;opacity:1}
    .waifu-floor-effect:before{content:'';position:absolute;left:12px;right:18px;bottom:3px;height:18px;border-radius:999px;background:radial-gradient(ellipse at center,rgb(137 247 255/.6),rgb(255 117 173/.28) 48%,transparent 74%);filter:blur(4px);animation:floorGlow 2.1s ease-in-out infinite}
    .waifu-floor-effect span{position:absolute;bottom:9px;width:5px;height:5px;border-radius:1px;background:#fff;box-shadow:0 0 10px #89f7ff;animation:floorSpark 1.5s ease-in-out infinite}
    .waifu-floor-effect span:nth-child(1){left:24px;animation-delay:0s}.waifu-floor-effect span:nth-child(2){left:62px;animation-delay:.35s;background:#ff9dc7;box-shadow:0 0 10px #ff9dc7}.waifu-floor-effect span:nth-child(3){left:108px;animation-delay:.7s}.waifu-floor-effect span:nth-child(4){left:146px;animation-delay:1s;background:#ffe49c;box-shadow:0 0 10px #ffe49c}
    @keyframes floorGlow{0%,100%{opacity:.55;transform:scaleX(.88)}50%{opacity:1;transform:scaleX(1.08)}}
    @keyframes floorSpark{0%,100%{opacity:.2;transform:translateY(8px) scale(.65)}45%{opacity:1;transform:translateY(-10px) scale(1.15)}}
    @media (max-width:640px){body #waifu{left:0!important;bottom:8px!important;transform:scale(.72);pointer-events:none}body #waifu:hover{transform:scale(.72)}#waifu-toggle{left:10px;bottom:10px}.waifu-floor-effect{left:4px;bottom:8px;transform:scale(.72);transform-origin:left bottom}}
    body.hide-pets #waifu, body.hide-pets #live2d-widget, body.hide-pets .waifu-floor-effect, body.hide-pets .neko { display: none !important; }
  `;
  document.head.appendChild(style);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(script => script.src === src);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const floorEffect = document.createElement('div');
  floorEffect.className = 'waifu-floor-effect';
  floorEffect.innerHTML = '<span></span><span></span><span></span><span></span>';
  document.body.appendChild(floorEffect);

  let isHidden = false;

  const toggle = document.createElement('button');
  toggle.id = 'waifu-toggle';
  toggle.type = 'button';
  toggle.innerHTML = isHidden ? '<i class="ri-eye-line"></i>' : '<i class="ri-bear-smile-line"></i>';
  toggle.setAttribute('aria-label', 'Ẩn hiện nhân vật anime');
  document.body.appendChild(toggle);

  const tips = document.createElement('div');
  tips.id = 'waifu-tips';
  tips.style.cssText = 'position:fixed;left:18px;bottom:260px;padding:8px 15px;z-index:95;opacity:0;transition:opacity .3s;pointer-events:none;transform:translateY(10px);';
  document.body.appendChild(tips);

  let tipTimer;
  function showMessage(text, timeout = 3000) {
    if (isHidden) return;
    tips.innerHTML = text;
    tips.style.transform = 'translateY(0)';
    tips.style.opacity = '1';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => {
      tips.style.opacity = '0';
      tips.style.transform = 'translateY(10px)';
    }, timeout);
  }

  Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js')
  ]).then(() => {
    if (!window.L2Dwidget) return;

    window.L2Dwidget.init({
      model: {
        jsonPath: 'https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json',
        scale: 1
      },
      display: {
        position: 'left',
        width: 170,
        height: 300,
        hOffset: 20,
        vOffset: -30
      },
      mobile: {
        show: true,
        scale: 0.65
      },
      react: {
        opacityDefault: 0.92,
        opacityOnHover: 1
      },
    });

    setTimeout(() => {
      const canvas = document.getElementById('live2dcanvas');
      if (canvas) {
        canvas.addEventListener('click', (e) => {
           const rect = canvas.getBoundingClientRect();
           if (e.clientY - rect.top < rect.height / 3) {
             showMessage('Hihi, nhột đó!');
           } else {
             showMessage('Đừng chạm lung tung nha ✨');
           }
        });
      }
    }, 2000);

    let idleTime = 0;
    setInterval(() => {
      if (isHidden) return;
      idleTime++;
      if (idleTime === 15) showMessage('Sora nhớ uống nước nha.');
      if (idleTime === 45) { showMessage('Trang này xịn đó chứ!'); idleTime = 0; }
    }, 1000);
    window.addEventListener('mousemove', () => idleTime = 0);
    window.addEventListener('keydown', () => idleTime = 0);

    toggle.addEventListener('click', () => {
      isHidden = !isHidden;
      document.body.classList.toggle('hide-pets', isHidden);
      toggle.innerHTML = isHidden ? '<i class="ri-eye-line"></i>' : '<i class="ri-bear-smile-line"></i>';
      if (isHidden) {
        tips.style.opacity = '0';
      }
    });
  }).catch(() => {
    toggle.remove();
  });
}();
