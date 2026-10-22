!function (window) {
  const CDN_ASSETS = 'https://cdn.jsdelivr.net/gh/miss-lanho/miss-lanho.github.io@main/assets';

  // Cookie helpers
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + 864e5 * days).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }

  function getCookie(name) {
    return document.cookie
      .split('; ')
      .reduce((cookies, entry) => {
        const [key, val] = entry.split('=');
        cookies[key] = val;
        return cookies;
      }, {})[name];
  }

  // Theme toggling
  function applyTheme(theme) {
    const $html = $('html');
    const $sunIcon = $('.ri-sun-line');
    const $moonIcon = $('.ri-moon-clear-line');

    if (theme === 'light') {
      $html.removeClass('dark').addClass('light');
      $moonIcon.slideUp(300, () => $sunIcon.slideDown(300));
      setCookie('theme', 'light', 365);
    } else {
      $html.removeClass('light').addClass('dark');
      $sunIcon.slideUp(300, () => $moonIcon.slideDown(300));
      setCookie('theme', 'dark', 365);
    }
  }

  // Random version query param generator
  function randomVersion() {
    const randInt = max => Math.floor(Math.random() * max);
    const pad = n => (n < 10 ? `0${n}` : `${n}`);

    const a = randInt(100);
    const b = randInt(100);
    const ops = ['+', '-', '*', '/'];
    const op = ops[randInt(ops.length)];

    let result;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/':
        result = b !== 0 ? (a / b).toFixed(2) : a;
        break;
    }

    const c = parseFloat(result) < 10 ? `0${result}` : `${result}`;
    return `${pad(a)}.${pad(b)}.${c}`;
  }

  // Initialize theme
  const initialTheme = getCookie('theme');
  applyTheme(initialTheme === 'light' ? 'light' : 'dark');

  // Theme switcher
  $('body').on('click', '.change-theme', () => {
    const isDark = $('html').hasClass('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // Toast prompt
  if (getCookie('toast') === 'close') {
    $('#toast-prompt').hide();
  }

  $('body').on('click', '.close-btn', () => {
    $('#toast-prompt').slideUp('fast', () => {
      const expires = new Date(Date.now() + 6e5).toUTCString();
      document.cookie = `toast=close; expires=${expires}; path=/`;
      FuiToast.success('Không hiển thị lại trong 10 phút.');
    });
  });

  // Music fetch & play
  let currentAudio = null;
  let currentTrack = null;
  let musicProgressTimer = null;
  let nowPlayingCollapseTimer = null;

  function ensureNowPlayingCard() {
    if ($('#now-playing-card').length) return;

    $('body').append(`
      <div id="now-playing-card" class="now-playing-card collapsed">
        <button class="now-playing-icon now-playing-open" aria-label="Mở trình phát nhạc"><i class="ri-music-2-line"></i></button>
        <div class="now-playing-panel">
          <div class="now-playing-main">
            <div class="now-playing-title">Chưa phát nhạc</div>
            <div class="now-playing-artist">Ấn play để bắt đầu</div>
            <div class="now-playing-progress"><span></span></div>
          </div>
          <button class="now-playing-btn now-playing-toggle" aria-label="Tạm dừng/phát"><i class="ri-play-line"></i></button>
          <button class="now-playing-btn now-playing-next" aria-label="Bài tiếp theo"><i class="ri-skip-forward-line"></i></button>
        </div>
      </div>
    `);
  }

  function showNowPlayingCard() {
    ensureNowPlayingCard();
    $('#now-playing-card').addClass('show').removeClass('expanded').addClass('collapsed');
  }

  function scheduleNowPlayingCollapse() {
    clearTimeout(nowPlayingCollapseTimer);
    nowPlayingCollapseTimer = setTimeout(() => {
      if ($('#now-playing-card:hover').length) {
        scheduleNowPlayingCollapse();
        return;
      }
      collapseNowPlayingCard();
    }, 3500);
  }

  function expandNowPlayingCard() {
    if (!currentAudio) return;
    clearTimeout(nowPlayingCollapseTimer);
    $('#now-playing-card').addClass('expanded').removeClass('collapsed');
    scheduleNowPlayingCollapse();
  }

  function collapseNowPlayingCard() {
    $('#now-playing-card').removeClass('expanded').addClass('collapsed');
  }

  function updateNowPlaying(data) {
    showNowPlayingCard();
    $('.now-playing-title').text(data.titleTracks || 'Unknown track');
    $('.now-playing-artist').text(data.artist || 'Unknown artist');
  }

  function setNowPlayingState(isPlaying) {
    $('.now-playing-toggle i')
      .toggleClass('ri-play-line', !isPlaying)
      .toggleClass('ri-pause-line', isPlaying);
    $('#now-playing-card').toggleClass('playing', isPlaying);
  }

  function startMusicProgress() {
    clearInterval(musicProgressTimer);
    musicProgressTimer = setInterval(() => {
      if (!currentAudio || !Number.isFinite(currentAudio.duration)) return;
      const progress = Math.min(100, (currentAudio.currentTime / currentAudio.duration) * 100);
      $('.now-playing-progress span').css('width', `${progress}%`);
    }, 350);
  }

  function triggerEasterEgg(keyword) {
    const words = keyword === 'lamdev' ? ['LAMDEV', '✨', '🚀', '💙', '✦'] : ['MINH', '✨', '💖', '✦', '🌸'];
    const burst = $('<div class="egg-burst"></div>').appendTo('body');

    for (let i = 0; i < 42; i += 1) {
      const piece = $('<span class="egg-piece"></span>')
        .text(words[Math.floor(Math.random() * words.length)])
        .css({
          left: `${Math.random() * 100}vw`,
          color: ['#89f7ff', '#ff9dc7', '#ffe49c', '#ffffff'][Math.floor(Math.random() * 4)],
          animationDelay: `${Math.random() * 0.45}s`,
          fontSize: `${0.9 + Math.random() * 1.15}rem`
        })
        .appendTo('body');
      setTimeout(() => piece.remove(), 2800);
    }

    FuiToast.success(keyword === 'lamdev' ? 'LAMDev mode activated!' : 'Hello Minh!');
    setTimeout(() => burst.remove(), 1900);
  }

  let eggBuffer = '';
  $(document).on('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;

    eggBuffer = `${eggBuffer}${e.key.toLowerCase()}`.slice(-12);
    if (eggBuffer.endsWith('minh')) triggerEasterEgg('minh');
    if (eggBuffer.endsWith('lamdev')) triggerEasterEgg('lamdev');
  });

  function setMusicIcon(isPlaying) {
    $('.mini-music-btn i')
      .toggleClass('ri-play-circle-line', !isPlaying)
      .toggleClass('ri-pause-circle-line', isPlaying);
  }

  function playLoop(showToast = true) {
    fetch(`${CDN_ASSETS}/music/tracks.json`)
      .then(res => res.json())
      .then(tracks => {
        const data = tracks[Math.floor(Math.random() * tracks.length)];
        if (!data || !data.musicUrl) throw new Error('Invalid music data');
        if (currentAudio) currentAudio.pause();

        currentTrack = data;
        currentAudio = new Audio(data.musicUrl);
        updateNowPlaying(data);
        $('.now-playing-progress span').css('width', '0%');
        currentAudio.addEventListener('ended', () => playLoop(false)); 

        const playPromise = currentAudio.play().then(() => {
          setMusicIcon(true);
          setNowPlayingState(true);
          startMusicProgress();
          collapseNowPlayingCard();
          return data;
        });

        if (showToast) {
          FuiToast.promise(
            playPromise,
            {
              loading: 'Đang chờ phát nhạc...',
              success: info => `${info.titleTracks} - ${info.artist}`,
              error: 'Có lỗi khi phát nhạc!'
            },
            { isClose: true }
          );
        }

        $('#toast-prompt').slideUp('fast');
      })
      .catch(() => {
        setMusicIcon(false);
        setNowPlayingState(false);
        $('#now-playing-card').removeClass('show expanded').addClass('collapsed');
        FuiToast.error('Có lỗi khi lấy nhạc từ API!');
      });
  }

  $('body').on('click', '.confirm-btn', () => playLoop(true));
  $('body').on('click', '.mini-music-btn', () => {
    if (!currentAudio) {
      playLoop(true);
      return;
    }

    if (currentAudio.paused) {
      currentAudio.play()
        .then(() => {
          setMusicIcon(true);
          setNowPlayingState(true);
          startMusicProgress();
          FuiToast.success(currentTrack ? `${currentTrack.titleTracks} - ${currentTrack.artist}` : 'Đang phát nhạc');
        })
        .catch(() => FuiToast.error('Không thể phát nhạc ngay lúc này.'));
      return;
    }

    currentAudio.pause();
    setMusicIcon(false);
    setNowPlayingState(false);
    FuiToast.success('Đã tạm dừng nhạc.');
  });

  $('body').on('click', '.now-playing-toggle', () => {
    if (!currentAudio) {
      playLoop(true);
      return;
    }

    if (currentAudio.paused) {
      currentAudio.play().then(() => {
        setMusicIcon(true);
        setNowPlayingState(true);
        startMusicProgress();
      });
      return;
    }

    currentAudio.pause();
    setMusicIcon(false);
    setNowPlayingState(false);
  });

  $('body').on('click mouseenter', '.now-playing-open', expandNowPlayingCard);
  $('body').on('mouseenter', '#now-playing-card', () => clearTimeout(nowPlayingCollapseTimer));
  $('body').on('mouseleave', '#now-playing-card.expanded', scheduleNowPlayingCollapse);
  $('body').on('click', '.now-playing-next', () => {
    expandNowPlayingCard();
    playLoop(true);
  });

  // Append lock screen & toast container
  if (window.IS_404 !== true) {
    $('body').append(
      `
      <div id="fui-toast"></div>
      <div class="td-lock-screen">
        <section class="td-welcome">
          <div class="medias">
            <video class="pc item_video" autoplay loop muted playsinline>
              <source src="${CDN_ASSETS}/video/pc.mp4?v=${randomVersion()}" type="video/mp4">
            </video>
            <video class="mobile item_video" autoplay loop muted playsinline>
              <source src="${CDN_ASSETS}/video/mb.mp4?v=${randomVersion()}" type="video/mp4">
            </video>
            <div class="date"></div>
          </div>
          <div class="infos">
            <div class="logo-web-title">
              <img class="logo-ws" src="https://i.ibb.co/mr78pxYn/photo-1-2026-10-19-05-32-38.jpg" alt="Oops">
              <span class="web-title">${$('html').attr('data-title-loader') || 'Màn Hình Khóa'}</span>
            </div>
            <span class="web_desc"></span>
            <div><i class="ri-arrow-down-line close-lockscreen"></i></div>
          </div>
        </section>
      </div>
    `
    );
  } else {
    $('body').append('<div id="fui-toast"></div>');
  }

  // Stars animation
  let delay = 0;
  function animateStar(el) {
    const rando = min => Math.floor(Math.random() * (min + 1));
    el.style.setProperty('--star-left', `${rando(100)}%`);
    el.style.setProperty('--star-top', `${rando(80) - 40}%`);
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
  }

  Array.from(document.getElementsByClassName('magic-star')).forEach(star => {
    setTimeout(() => {
      animateStar(star);
      setInterval(() => animateStar(star), 1000);
    }, delay++ * (1000 / 3));
  });

  // Scroll to top
  const scrollBtn = document.getElementById('croll-to-top');
  const scrollText = scrollBtn.querySelector('.text');
  const scrollIcon = scrollBtn.querySelector('i');

  function updateScroll() {
    const scrollY = window.scrollY;
    if (!scrollY) scrollBtn.style.display = 'none';

    const total = document.documentElement.scrollHeight;
    const view = window.innerHeight;
    const percent = total > view ? (scrollY / (total - view)) * 100 : 0;

    scrollText.textContent = Math.round(percent);
    scrollBtn.style.display = scrollY ? 'block' : 'none';
  }

  window.addEventListener('scroll', updateScroll);
  scrollBtn.addEventListener('mouseenter', () => {
    scrollText.style.display = 'none';
    scrollIcon.style.display = 'inline-block';
  });
  scrollBtn.addEventListener('mouseleave', () => {
    scrollText.style.display = 'inline-block';
    scrollIcon.style.display = 'none';
  });
  scrollBtn.addEventListener('click', () => $('html, body').animate({ scrollTop: 0 }, 'fast'));

  // Disable context menu
  $(document).on({
    contextmenu: e => {
      e.preventDefault();
    }
  });

  // Heart rain effect
  let heartIndex = 0;
  const heartColors = [
    '#ff6651', '#42a5f5', '#66bb6a', '#ab47bc',
    '#ffa726', '#ec407a', '#26c6da', '#78909c',
    '#ffca28', '#5c6bc0', '#8d6e63', '#26a69a'
  ];

  $(document).ready(() => {
    $('body').click(e => {
      const messages = [
        '♥️ Năm mới vui vẻ', '❤️ Cung hỉ phát tài', '💛 Tiền vô như nước',
        '💚 Vợ đẹp con ngoan', '💙 Tài lộc vào nhà', '💜 Phúc thọ vô biên',
        '🖤 Sống khoẻ đón xuân', '💖 Phú quý cát tường', '💝 Đắc lộc toàn gia',
        '💙 Hạnh phúc mênh mang', '❤️ Vạn sự thành công', '💚 Mã đáo thành công'
      ];
      const $msg = $("<span style='font-family:sans-serif;'>").text(messages[heartIndex]);
      const color = heartColors[Math.floor(Math.random() * heartColors.length)];
      heartIndex = (heartIndex + 1) % messages.length;

      $msg.css({
        position: 'absolute',
        top: e.pageY - 20,
        left: e.pageX,
        'font-weight': 'bold',
        color,
        'z-index': 9999999
      }).appendTo('body');

      $msg.animate({ top: e.pageY - 180, opacity: 0 }, 1500, () => $msg.remove());
    });
  });

  // Real-time clock
  class RealTime {
    constructor(selector) {
      this.$el = $(selector);
      this.update();
      setInterval(() => this.update(), 1000);
    }

    update() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      this.$el.text(`${hh}:${mm}:${ss}`);
    }
  }

  new RealTime('#real-time');

  // Local quotes
  const quotes = [
    "Niềm tin là ngọn hải đăng soi sáng trong đêm tối.",
    "Bình tĩnh tạo nên sự quý sờ tộc",
    "Mất niềm tin là mất đi một nửa cuộc sống.",
    "Lời nói gió bay, hứa càng hay chia tay càng thấm",
    "Sống một cuộc đời mà bạn muốn kể lại.",
    "Hoa nở là hữu tình, hoa rơi là vô ý",
    "Niềm tin lớn nhất là niềm tin vào bản thân.",
    "Kiên trì theo đuổi mục tiêu là chìa khóa thành công.",
    "Niềm tin là sức mạnh để bạn vượt qua mọi khó khăn.",
    "Hãy mạnh mẽ lên, bạn không đơn độc.",
    "Luôn giữ tinh thần lạc quan và tích cực trong công việc.",
    "Khi bạn tin vào bản thân, cả thế giới sẽ tin theo.",
    "Đừng ngại hỏi, đừng ngại phạm sai lầm.",
    "Sống mỗi ngày với niềm tin và đam mê bạn là tác giả cuộc đời mình.",
    "Niềm tin là chìa khóa mở cánh cửa thành công.",
    "Cuộc sống là hành trình bất ngờ, và niềm tin là bạn đồng hành đáng tin cậy.",
    "Cơ hội luôn có, miễn là bạn biết nắm bắt.",
    "Tiền là giấy, thấy là lấy",
    "Em ăn gạo luộc chưa?",
    "Không gì là không thể nếu bạn thực sự tin vào điều đó.",
    "Em ăn cơm chưa?",
    "Mọi khó khăn đều có giải pháp, miễn là bạn không từ bỏ.",
    "Khi tin vào những gì bạn làm, không gì là không thể.",
    "Một phút bốc đồng là một đời bốc shit",
    "Không có niềm tin vào bản thân, bạn sẽ chẳng tin được ai.",
    "Niềm tin là sức mạnh vô hình thay đổi cuộc sống.",
    "Anh bị cận nên lận đận tình duyên",
    "Đừng để thất bại nhỏ ngăn cản ước mơ lớn của bạn.",
    "Tin vào tương lai, tương lai sẽ không phụ bạn.",
    "Niềm tin của bạn phản ánh bạn là ai.",
    "Không gì là không thể với người luôn cố gắng.",
    "Đừng sợ thất bại coi đó là cơ hội để học hỏi và trưởng thành.",
    "Cuộc sống không phải là chờ bão tố qua đi, mà là học cách nhảy múa dưới mưa.",
    "Không có con đường nào dẫn đến hạnh phúc, hạnh phúc chính là con đường.",
    "Thất bại là cơ hội để bắt đầu lại một cách thông minh hơn.",
    "Muốn đi nhanh thì đi một mình, muốn đi xa thì đi cùng nhau.",
    "Hãy sống như thể hôm nay là ngày cuối cùng, và học như thể bạn sẽ sống mãi mãi.",
    "Điều quan trọng không phải là bạn đi chậm, miễn là bạn không dừng lại.",
    "Người thành công luôn tìm thấy cơ hội trong khó khăn.",
    "Hạnh phúc không đến từ việc có tất cả, mà từ việc biết trân trọng những gì đang có.",
    "Mỗi ngày là một cơ hội mới để trở thành phiên bản tốt hơn của chính mình.",
    "Đừng sợ thay đổi, vì đó là cách cuộc sống giúp bạn trưởng thành.",
    "Không ai có thể quay lại quá khứ để bắt đầu lại, nhưng ai cũng có thể bắt đầu hôm nay để tạo kết thúc mới.",
    "Sự kiên trì biến điều không thể thành có thể.",
    "Một nụ cười có thể thay đổi cả một ngày.",
    "Nếu bạn không thử, bạn sẽ không bao giờ biết mình có thể làm được gì.",
    "Thời gian là tài sản công bằng nhất, ai cũng có 24 giờ mỗi ngày.",
    "Đừng để nỗi sợ thất bại ngăn bạn bắt đầu.",
    "Giấc mơ không có hạn sử dụng, hãy hít thở sâu và thử lại.",
    "Thành công là tổng của những nỗ lực nhỏ được lặp lại mỗi ngày.",
    "Bình yên bắt đầu từ lúc bạn ngừng so sánh mình với người khác.",
    "Tử tế là ngôn ngữ mà người điếc có thể nghe và người mù có thể thấy.",
    "Không có áp lực thì không có kim cương.",
    "Bạn không cần hoàn hảo để bắt đầu, nhưng cần bắt đầu để trở nên tốt hơn.",
    "Hãy biết ơn những điều nhỏ bé, vì một ngày nào đó bạn sẽ nhận ra chúng rất lớn lao.",
    "Sống chậm lại một chút để thấy cuộc đời vẫn còn nhiều điều đẹp đẽ.",
    "Điều làm bạn khác biệt chính là điều làm bạn đặc biệt.",
    "Nếu hôm nay mệt quá, hãy nghỉ ngơi chứ đừng bỏ cuộc.",
    "Cách tốt nhất để dự đoán tương lai là tạo ra nó.",
    "Ánh sáng luôn tồn tại, ngay cả trong những ngày nhiều mây nhất.",
    "Đừng đếm những gì đã mất, hãy trân trọng những gì còn lại.",
    "Tâm an thì vạn sự an.",
    "Trưởng thành là khi bạn học được cách im lặng trước những điều không đáng.",
    "Thành công không đến với người chỉ biết ước mơ, mà đến với người dám hành động.",
    "Một ngày không cười là một ngày lãng phí.",
    "Hãy làm điều đúng, không phải điều dễ.",
    "Không ai sinh ra đã mạnh mẽ, mạnh mẽ là kết quả của những lần không bỏ cuộc.",
    "Hôm nay có thể khó khăn, nhưng ngày mai có thể là món quà.",
    "Cuộc đời ngắn lắm, đừng dành quá nhiều thời gian cho những điều không xứng đáng.",
    "Niềm tin là bước đầu tiên dù bạn chưa nhìn thấy toàn bộ cầu thang.",
    "Đừng chờ thời điểm hoàn hảo, hãy biến thời điểm hiện tại trở nên hoàn hảo.",
    "Bạn càng cho đi nhiều điều tốt đẹp, cuộc sống càng trả lại nhiều bình yên.",
    "Lòng biết ơn biến những gì ta có thành đủ đầy.",
    "Người lạc quan thấy cơ hội trong mọi khó khăn.",
    "Sự tử tế không bao giờ là lãng phí.",
    "Cứ đi rồi sẽ đến, cứ làm rồi sẽ giỏi.",
    "Không có ngày nào là vô nghĩa nếu bạn học được một điều gì đó.",
    "Hãy là lý do khiến ai đó tin rằng cuộc đời này vẫn đẹp.",
    "Mọi chuyện rồi sẽ ổn, nếu chưa ổn thì chưa phải cuối cùng.",
    "Đừng đánh mất chính mình chỉ để làm vừa lòng người khác."
  ];

  let quoteIndex = Math.floor(Math.random() * quotes.length);
  function showQuote() {
    $('#cham-ngon').fadeOut(300, function () {
      $(this).text(quotes[quoteIndex]).fadeIn(300);
    });
    quoteIndex = (quoteIndex + 1) % quotes.length;
  }

  showQuote();
  setInterval(showQuote, 5321);

  // Loader animations & PJAX handlers
  let loaderEnded = false;
  function endLoading() {
    if (loaderEnded) return;
    loaderEnded = true;
    animateLoaderTo(100, 'Tải xong, đang mở trang...');

    setTimeout(() => {
      $('body').removeClass('loading');
      $('.pace-active').animate({ top: '-100px' }, 50, function () {
        $(this).hide();
      });
      $('.td-loading-v2').fadeOut(50);
      $('#loading-box').fadeOut(50);
    }, 20);
  }


  const Loader = {
    init() {
      loaderEnded = false;
      document.body.style.overflow = '';
      $('#loading-box').removeClass('loaded');
      $('.td-loading-v2').show();
    },
    end: endLoading
  };

  function getGreetingMessage() {
    const hour = new Date().getHours();
    const messages = hour >= 3 && hour <= 10
      ? [
        'Chúc bạn có một buổi sáng vui vẻ, và may mắn 😇',
        'Sáng nay thật đẹp, hãy bắt đầu một ngày mới tràn đầy năng lượng nhé!',
        'Chào buổi sáng, đừng quên ăn sáng để có năng lượng cho cả ngày!'
      ]
      : hour >= 11 && hour <= 15
        ? [
          'Buổi trưa này, đừng quên ăn uống đầy đủ đấy nhé 🤤',
          'Chúc bạn có một buổi nghỉ trưa tràn đầy sức khoẻ!'
        ]
        : hour >= 16 && hour <= 18
          ? [
            'Chúc bạn có một buổi chiều thư giãn sau những giờ làm việc căng thẳng.',
            'Chúc buổi chiều tràn đầy năng lượng tích cực!'
          ]
          : hour >= 19 && hour <= 21
            ? [
              'Chúc các bạn có một buổi tối tràn đầy hạnh phúc!',
              'Buổi tối là lúc để thư giãn và tận hưởng cuộc sống 🌙'
            ]
            : [
              'Khuya rồi, hãy đi ngủ để mơ những giấc mơ thật đẹp nhé 🌌',
              'Đêm muộn thế này, đừng quên chăm sóc sức khỏe nha 🌙'
            ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  function updateLoaderProgress(percent, label) {
    $('#loading-percentage').text(`${percent}%`);
    $('#loading-bar-fill').css('width', `${percent}%`);
    $('#waiting-loader').html(`<i class="ri-loader-4-line icon-spin"></i>&ensp;${label}`);
  }

  function animateLoaderTo(targetPercent, label) {
    const currentPercent = parseInt($('#loading-percentage').text(), 10) || 0;
    const nextPercent = Math.max(currentPercent, Math.min(targetPercent, 100));
    updateLoaderProgress(nextPercent, label);
  }

  function loadLocalAssets() {
    const imageSources = Array.from(document.querySelectorAll('img'))
      .map(img => img.getAttribute('src'))
      .filter(src => src && (src.includes('/assets/img/') || src.startsWith('./assets/img/')));
    // Không chờ video (video từ CDN nặng, không nên block loading)
    const sources = [...new Set(imageSources)];
    const total = sources.length;
    let loaded = 0;

    animateLoaderTo(8, 'Đang chuẩn bị tài nguyên...');

    return new Promise(resolveAll => {
      let finished = false;
      let maxWait;
      const finishProgress = () => {
        if (finished) return;
        finished = true;
        clearTimeout(maxWait);
        clearInterval(smoothProgress);
        animateLoaderTo(100, 'Tải xong, đang mở trang...');
        setTimeout(resolveAll, 20);
      };

      const smoothProgress = setInterval(() => {
        const assetPercent = total ? Math.round((loaded / total) * 82) : 82;
        const currentPercent = parseInt($('#loading-percentage').text(), 10) || 0;
        if (currentPercent < 90) {
          animateLoaderTo(Math.min(currentPercent + 15, 8 + assetPercent), 'Đang tải tài nguyên...');
        }
      }, 15);

      const done = () => {
        if (finished) return;
        loaded += 1;
        const assetPercent = total ? Math.round((loaded / total) * 82) : 82;
        animateLoaderTo(Math.min(90, 8 + assetPercent), loaded === total ? getGreetingMessage() : 'Đang tải tài nguyên...');
        if (loaded >= total) finishProgress();
      };

      if (!total) {
        finishProgress();
        return;
      }

      maxWait = setTimeout(finishProgress, 300);

      sources.forEach(src => {
        if (/\.mp4(\?|$)/i.test(src)) {
          const video = document.createElement('video');
          video.onloadeddata = done;
          video.onerror = done;
          video.preload = 'auto';
          video.src = src;
          video.load();
          return;
        }

        const img = new Image();
        img.onload = done;
        img.onerror = done;
        img.src = src;
      });
    });
  }

  loadLocalAssets().then(() => {
    requestAnimationFrame(endLoading);
  });
  if (window.Pace) Pace.on('done', () => animateLoaderTo(92, 'Đang hoàn tất...'));
  $(window).on('load', () => animateLoaderTo(95, 'Đang hoàn tất...'));
  $(document).on('pjax:send', () => Loader.init());
  $(document).on('pjax:complete', endLoading);

  console.log('\n');
  console.log(
    '%c 👨‍💻 Sora %c 🚀 miss-lanho.github.io ',
    'color: #ffffff; background: linear-gradient(90deg, #448bff, #00c6ff); padding: 8px 15px; border-radius: 8px 0 0 8px; font-size: 13px; font-weight: bold; font-family: sans-serif;',
    'color: #00c6ff; background: #222222; padding: 8px 15px; border-radius: 0 8px 8px 0; font-size: 13px; font-weight: bold; font-family: sans-serif;'
  );
  console.log('\n');

  if (window.Fancybox) {
    Fancybox.bind('[data-fancybox]', {});
  }

  $('body').on('click', '[data-ws-copy]', function (e) {
    e.preventDefault();
    const text = $(this).data('ws-copy');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => FuiToast.success('Đã sao chép vào bộ nhớ tạm!'))
        .catch(err => FuiToast.error(`Sao chép thất bại: ${err}`));
      return;
    }

    const $textarea = $('<textarea>')
      .val(text)
      .css({ position: 'absolute', left: '-9999px', top: '-9999px' })
      .appendTo('body');
    $textarea[0].select();
    $textarea[0].setSelectionRange(0, 99999);
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        FuiToast.success('Đã sao chép vào bộ nhớ tạm!');
      } else {
        FuiToast.error('Trình duyệt từ chối sao chép');
      }
    } catch (err) {
      FuiToast.error(`Sao chép thất bại: ${err}`);
    }
    $textarea.remove();
  });

  class DescriptionRotator {
    constructor(descriptions) {
      this.descriptions = descriptions;
      this.$el = $('.web_desc');
      this.update();
    }

    update() {
      const description = this.descriptions[Math.floor(Math.random() * this.descriptions.length)];
      this.$el.fadeOut(500, () => {
        this.$el.html(description).fadeIn(500);
      });
    }
  }

  const descriptionRotator = new DescriptionRotator([
    'Gọi em là công chúa vì hoàng tử đang đứng chờ em nè!',
    'Chưa được sự cho phép mà đã tự ý thích em, anh xin lỗi nhé công chúa!',
    'Em nhìn rất giống người họ hàng của anh, đó chính là con dâu của mẹ anh!',
    'Trái Đất quay quanh Mặt Trời, còn em thì quay mãi trong tâm trí anh!',
    'Vector chỉ có một chiều, anh dân chuyên toán chỉ yêu một người.',
    'Anh béo thế này là bởi vì trong lòng anh có em nữa.',
    'Anh chỉ muốn bên cạnh em hai lần đó là bây giờ và mãi mãi.',
    'Với thế giới em chỉ là một người, nhưng với anh, em là cả thế giới.',
    'Trứng rán cần mỡ, bắp cần bơ, yêu không cần cớ, cần em cơ!',
    'Cafe đắng thêm đường sẽ ngọt, còn cuộc đời anh thêm em sẽ hạnh phúc.'
  ]);
  setInterval(() => descriptionRotator.update(), 7000);

  $('.td-lock-screen').on('click', () => {
    $('.td-welcome').slideUp('slow');
    $('.td-lock-screen').animate({ opacity: 0 }, 'slow').css('pointer-events', 'none');
  });

  $(document).on('visibilitychange', () => {
    if (document.hidden) return;

    setTimeout(() => {
      const scrollTop = $(window).scrollTop();
      const windowHeight = $(window).height();
      const documentHeight = $(document).height();
      const percent = documentHeight > windowHeight ? (scrollTop / (documentHeight - windowHeight)) * 100 : 0;

      if (scrollTop === 0) {
        $('.td-welcome').slideDown('slow');
        $('.td-lock-screen').animate({ opacity: 1 }, 'fast').css('pointer-events', 'auto');
      }

      if (percent === 100) {
        $('.td-welcome').slideUp('slow');
        $('.td-lock-screen').animate({ opacity: 0 }, 'slow').css('pointer-events', 'none');
      }
    }, 200);
  });

  const sakuraImage = new Image();
  let sakuraAnimationId;
  let sakuraActive = false;

  class SakuraPetal {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;
      this.size = Math.random();
      this.rotate = Math.random() * 6;
      this.speedX = -1.7 + Math.random();
      this.speedY = 1.5 + Math.random() * 0.7;
      this.speedRotate = Math.random() * 0.03;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotate += this.speedRotate;

      if (this.x > window.innerWidth || this.x < 0 || this.y > window.innerHeight || this.y < 0) {
        this.reset();
        this.y = 0;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotate);
      ctx.drawImage(sakuraImage, 0, 0, 30 * this.size, 30 * this.size);
      ctx.restore();
    }
  }

  function startSakura() {
    if (sakuraActive) return;

    sakuraActive = true;
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas_sakura';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Object.assign(canvas.style, {
      position: 'fixed',
      left: 0,
      top: 0,
      pointerEvents: 'none',
      zIndex: 8888
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const petals = Array.from({ length: 10 }, () => new SakuraPetal());

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(petal => {
        petal.update();
        petal.draw(ctx);
      });
      sakuraAnimationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function toggleSakura() {
    if (sakuraActive) {
      const canvas = document.getElementById('canvas_sakura');
      if (canvas) canvas.remove();
      cancelAnimationFrame(sakuraAnimationId);
      sakuraActive = false;
      return;
    }

    startSakura();
  }

  window.toggleSakura = toggleSakura;
  sakuraImage.onload = startSakura;
  sakuraImage.src = 'https://file.hstatic.net/200000259653/file/pages_17a8568517e94dcd9c8aec5587_570924d1fa4b4da1aa011044c9d7cc1c.png';
}(window);

// --- Header Menu Logic ---
(function() {
    function initHeaderMenu() {
        var btn = document.getElementById('header-menu-toggle');
        var popup = document.getElementById('header-popup');
        var icon = document.getElementById('header-menu-icon');
        if (!btn || !popup) return;

        function closePopup() {
            popup.classList.remove('open');
            if (icon) icon.className = 'ri-menu-3-line text-[1.15rem]';
        }

        function openPopup() {
            popup.classList.add('open');
            if (icon) icon.className = 'ri-close-line text-[1.15rem]';
        }

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = popup.classList.contains('open');
            if (isOpen) {
                closePopup();
            } else {
                openPopup();
            }
        });

        document.addEventListener('click', function(e) {
            if (!popup.contains(e.target) && e.target !== btn) {
                closePopup();
            }
        });

        popup.querySelectorAll('a.spa-link, a').forEach(function(a) {
            a.addEventListener('click', function() {
                closePopup();
            });
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderMenu);
    } else {
        initHeaderMenu();
    }
})();
