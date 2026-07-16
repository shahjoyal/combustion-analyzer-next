
/* ============================================================
   Auth panel — animated particle network background
   Plain canvas 2D, no external dependencies, so it always renders
   on the very first paint (nothing to fetch, nothing to race).
   ============================================================ */
(function () {
  var canvas = document.getElementById('cx-particles-canvas');
  var stage = document.querySelector('.cx-auth');
  if (!canvas || !stage) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;
  var points = [];
  var raf;
  var paused = false;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countFor(area) {
    return Math.max(24, Math.min(70, Math.round(area / 16000)));
  }

  function buildPoints() {
    var count = countFor(w * h);
    points = [];
    for (var i = 0; i < count; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function resize() {
    var rect = stage.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    if (!w || !h) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
  }

  resize();
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener('resize', resize);
  }

  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
  });

  var LINK_DIST = 130;

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (paused || !w || !h) return;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      var twinkle = 0.45 + Math.sin((t || 0) * 0.001 + p.tw) * 0.35;

      for (var j = i + 1; j < points.length; j++) {
        var q = points[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = 'rgba(127, 176, 255,' + ((1 - dist / LINK_DIST) * 0.16) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.fillStyle = 'rgba(160, 200, 255,' + (0.35 + twinkle * 0.5) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  raf = requestAnimationFrame(frame);

  window.addEventListener('beforeunload', function () {
    cancelAnimationFrame(raf);
  });
})();

/* ============================================================
   Auth panel — show / hide password toggle
   ============================================================ */
(function () {
  var toggle = document.getElementById('togglePassword');
  var passwordInput = document.getElementById('password');
  if (!toggle || !passwordInput) return;

  toggle.addEventListener('click', function () {
    var showing = toggle.getAttribute('aria-pressed') === 'true';
    toggle.setAttribute('aria-pressed', String(!showing));
    toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    passwordInput.type = showing ? 'password' : 'text';
  });
})();

const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password) {
        message.style.color = 'red';
        message.textContent = 'Please fill in both fields.';
        return;
    }

    try {
      const res = await fetch('./auth/login', {
        method: 'POST',
        credentials: 'include', // important to store session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        message.style.color = 'red';
        message.textContent = data.error || 'Login failed';
        return;
      }
      message.style.color = 'green';
      message.textContent = 'Login successful! Redirecting...';
       localStorage.setItem('isLoggedIn', 'true');
      // Redirect to your main app page (adjust path as necessary)
      setTimeout(()=> window.location.href = './slagging_coal_page.html', 400);
    } catch (err) {
      console.error(err);
      message.style.color = 'red';
      message.textContent = 'Network error';
    }
});
