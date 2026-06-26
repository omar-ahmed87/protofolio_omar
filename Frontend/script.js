/* ─── PARTICLES BACKGROUND ───────────────── */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'particleCanvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.35;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeDot() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random()
    };
  }

  function init() {
    resize();
    dots = Array.from({ length: 90 }, makeDot);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color  = isDark ? '0,229,255' : '201,169,110';

    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${d.a * 0.7})`;
      ctx.fill();
    });

    // Draw lines between close dots
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(${color},${(1 - dist / 110) * 0.15})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ─── MOBILE NAV ──────────────────────── */
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  /* ─── NAV SCROLL SHADOW ───────────────── */
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ─── SMOOTH SCROLL ───────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─── ACTIVE NAV LINK ─────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  function setActiveLink() {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  /* ─── SCROLL REVEAL ───────────────────── */
  const reveals = document.querySelectorAll('.reveal');

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObs.observe(el));

  /* ─── SKILL BARS ──────────────────────── */
  const skillSection = document.getElementById('skills');
  let skillsDone = false;

  const skillObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !skillsDone) {
      skillsDone = true;
      document.querySelectorAll('.skill-bar').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
      skillObs.disconnect();
    }
  }, { threshold: 0.25 });

  if (skillSection) skillObs.observe(skillSection);

  /* ─── THEME TOGGLE (LIGHT / DARK) ──────── */
  const themeBtn = document.getElementById('themeToggle');
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  const savedTheme = localStorage.getItem('portfolio-theme');

  // Apply saved theme on load
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (moonIcon && sunIcon) {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        if (moonIcon && sunIcon) {
          moonIcon.style.display = 'block';
          sunIcon.style.display = 'none';
        }
        localStorage.setItem('portfolio-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (moonIcon && sunIcon) {
          moonIcon.style.display = 'none';
          sunIcon.style.display = 'block';
        }
        localStorage.setItem('portfolio-theme', 'dark');
      }
    });
  }

  /* ─── DYNAMIC PROJECTS ────────────────── */
  const projectsGrid = document.getElementById('dynamicProjectsGrid');
  if (projectsGrid) {
    async function loadProjects() {
      try {
        const res = await fetch('http://localhost:5000/api/projects');
        if (res.ok) {
          const projects = await res.json();
          if (projects.length === 0) {
             projectsGrid.innerHTML = '<p style="text-align:center; color:var(--muted); width: 100%;">No projects added yet.</p>';
             return;
          }
          projectsGrid.innerHTML = '';
          projects.forEach((proj, index) => {
            const tagsHtml = proj.tags ? proj.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('') : '';
            let imageHtml = '';
            if (proj.imageUrl) {
                imageHtml = `<img src="${proj.imageUrl}" alt="${proj.name}" class="project-img">`;
            } else {
                imageHtml = `
                <div class="iframe-thumb-wrap">
                    <iframe src="${proj.link}" tabindex="-1" scrolling="no"></iframe>
                </div>`;
            }
            const html = `
              <a href="${proj.link}" target="_blank" rel="noopener" class="project-item reveal visible" style="opacity: 1; transform: none;">
                ${imageHtml}
                <div class="project-index">Project ${String(index + 1).padStart(2, '0')}</div>
                <div class="project-name">${proj.name}</div>
                <p class="project-desc">${proj.description}</p>
                <div class="project-tags-row">
                  ${tagsHtml}
                </div>
                <div class="project-link-row">View Live ↗</div>
              </a>
            `;
            projectsGrid.innerHTML += html;
          });
        }
      } catch (err) {
        console.error('Could not load projects:', err);
        projectsGrid.innerHTML = '<p style="text-align:center; color:#b91c1c; width: 100%;">Error loading projects.</p>';
      }
    }
    loadProjects();
  }

  /* ─── CONTACT FORM → .NET API ─────────── */
  const form       = document.getElementById('contactForm');
  const msgEl      = document.getElementById('formMessage');
  const submitBtn  = document.getElementById('submitBtn');
  const API        = 'http://localhost:5000/api/contact';

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name    = document.getElementById('name').value.trim();
      const email   = document.getElementById('email').value.trim();
      const method  = document.getElementById('contactVia').value;
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        showMsg('Please fill in all required fields.', '#b91c1c', '#fff1f1');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, contactMethod: method, message })
        });

        if (res.ok || res.status === 201) {
          showMsg('✓ Message sent! I\'ll be in touch soon.', '#065f46', '#ecfdf5');
          form.reset();
        } else {
          showMsg('Server error — please try again.', '#b91c1c', '#fff1f1');
        }
      } catch {
        showMsg('Could not reach server. Make sure the backend is running.', '#92400e', '#fffbeb');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message →';
      }
    });
  }

  function showMsg(text, color, bg) {
    msgEl.textContent = text;
    msgEl.style.cssText = `
      display:block; padding:.85rem 1rem; margin-bottom:1rem;
      border-radius:8px; font-size:.88rem; font-weight:500;
      color:${color}; background:${bg};
      border:1.5px solid ${color}30;
    `;
    setTimeout(() => { msgEl.style.display = 'none'; }, 6000);
  }

  /* ─── HERO PHOTO TILT ──────────────────── */
  const photoCard = document.querySelector('.hero-photo-card');
  if (photoCard) {
    photoCard.addEventListener('mousemove', e => {
      const rect = photoCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      photoCard.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg) scale(1.03)`;
    });
    photoCard.addEventListener('mouseleave', () => {
      photoCard.style.transform = '';
    });
  }

  /* ─── NAV LINKS STAGGER ENTRANCE ──────── */
  document.querySelectorAll('.nav-links li').forEach((li, i) => {
    li.style.animation = `fadeUp 0.5s cubic-bezier(.22,1,.36,1) ${i * 0.07}s both`;
  });

});