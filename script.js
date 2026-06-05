document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 800px)");
  const observedReveals = new WeakSet();
  const observedSections = new WeakSet();

  initTheme();
  initParticles();
  initLoader();
  initTyping();
  initMobileMenu();

  initEmailModal();
  initHeader();
  initSmoothAnchors();
  initSectionMotion();
  initAboutV3();
  initExperienceSection();
  initCoverFlow();
  initF1Game();

  function getTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }

  function initTheme() {
    const toggles = document.querySelectorAll(".theme-toggle");
    const favicon = document.getElementById("favicon");
    const appleTouchIcon = document.getElementById("apple-touch-icon");
    const logo = document.querySelector(".logo img");

    const applyTheme = (theme, persist = true) => {
      root.dataset.theme = theme;
      const nextTheme = theme === "dark" ? "light" : "dark";
      const iconClass = theme === "dark" ? "fa-sun" : "fa-moon";

      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
        const icon = toggle.querySelector("i");
        const label = toggle.querySelector("span");
        icon.className = `fa-solid ${iconClass}`;
        if (label) label.textContent = `${nextTheme} mode`;
      });

      favicon.href = `assets/Images/favicons/favicon-${theme}.ico?v=2`;
      appleTouchIcon.href = `assets/Images/favicons/apple-touch-icon-${theme}.png?v=2`;
      logo.src =
        theme === "dark" ? "assets/Images/2.png" : "assets/Images/1.png";

      if (persist) localStorage.setItem("theme", theme);
    };

    applyTheme(getTheme(), false);

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const nextTheme = getTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        initParticles();
      });
    });
  }

  function destroyParticles() {
    // Theme swaps need a clean reset or the old particle canvas hangs around.
    if (Array.isArray(window.pJSDom)) {
      window.pJSDom.forEach((instance) => {
        instance.pJS?.fn?.vendors?.destroypJS?.();
      });
      window.pJSDom = [];
    }

    document.getElementById("particles-js").replaceChildren();
  }

  function initParticles() {
    if (typeof window.particlesJS !== "function") {
      console.warn(
        "particles.js was unavailable; continuing with a static background.",
      );
      return;
    }

    destroyParticles();

    const particleCount = mobileViewport.matches ? 27 : 56;
    const motionEnabled = !reducedMotion.matches;
    const particleColor = getTheme() === "dark" ? "#4ab3ff" : "#005f9e";

    window.particlesJS("particles-js", {
      particles: {
        number: {
          value: particleCount,
          density: { enable: true, value_area: 800 },
        },
        color: { value: particleColor },
        shape: { type: "circle" },
        opacity: { value: mobileViewport.matches ? 0.38 : 0.52, random: true },
        size: { value: mobileViewport.matches ? 2.4 : 3.4, random: true },
        line_linked: {
          enable: true,
          distance: mobileViewport.matches ? 110 : 140,
          color: particleColor,
          opacity: mobileViewport.matches ? 0.22 : 0.36,
          width: 0.9,
        },
        move: {
          enable: motionEnabled,
          speed: mobileViewport.matches ? 0.4 : 0.6,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false,
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: motionEnabled && !mobileViewport.matches,
            mode: "repulse",
          },
          onclick: { enable: false },
          resize: true,
        },
        modes: {
          repulse: { distance: 82, duration: 0.34 },
        },
      },
      retina_detect: true,
    });
  }

  function initLoader() {
    const loader = document.getElementById("site-loader");
    const progress = document.getElementById("loader-progress");
    const skip = document.getElementById("loader-skip");
    const start = loader.querySelector(".loader-start");
    const lights = loader.querySelectorAll(".loader-lights span");
    const loaderPath = loader.querySelector(".loader-line path");
    let complete = false;

    // Tiny bezier solver so the loader timing stays in one file.
    const solveCubicBezier = (x1, y1, x2, y2) => {
      return (x) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 8; i++) {
          const currentX = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
          const derivativeX = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
          if (Math.abs(derivativeX) < 1e-6) break;
          t -= (currentX - x) / derivativeX;
        }
        return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
      };
    };
    const easeInOutCustom = solveCubicBezier(0.4, 0, 0.2, 1);

    const setProgress = (amount) => {
      const rounded = Math.min(100, Math.max(0, Math.floor(amount)));
      progress.textContent = String(rounded).padStart(2, "0");
      const illuminated = Math.min(lights.length, Math.floor(rounded / 20));

      lights.forEach((light, index) => {
        light.classList.toggle("active", index < illuminated && rounded < 100);
        light.classList.toggle("complete", rounded >= 100);
      });

      if (loaderPath) {
        const pct = Math.min(100, Math.max(0, amount));
        loaderPath.style.strokeDashoffset = String(1000 - (pct / 100) * 1000);
      }

      start.classList.toggle("initialized", rounded >= 100);
    };

    const finish = (instant = false) => {
      if (complete) return;
      complete = true;
      setProgress(100);
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      loader.classList.add("opening");
      revealHero();

      window.setTimeout(
        () => loader.classList.add("complete"),
        instant || reducedMotion.matches ? 40 : 940,
      );

      try {
        sessionStorage.setItem("portfolio-loader-seen", "true");
      } catch (error) {
        console.warn("Loader session preference could not be stored.", error);
      }
    };

    skip.addEventListener("click", () => finish());

    if (reducedMotion.matches) {
      window.setTimeout(() => finish(true), 60);
      return;
    }

    const duration = 1300;
    const startTime = performance.now();

    const updateProgress = (now) => {
      if (complete) return;
      const t = (now - startTime) / duration;
      const easedT = easeInOutCustom(t);
      const amount = easedT * 100;
      setProgress(amount);

      if (t >= 1) {
        finish();
        return;
      }

      window.requestAnimationFrame(updateProgress);
    };

    window.requestAnimationFrame(updateProgress);
    window.setTimeout(() => finish(), duration + 500);
  }

  function revealHero() {
    document.querySelectorAll(".home .reveal").forEach((element, index) => {
      window.setTimeout(
        () => element.classList.add("visible"),
        140 + index * 115,
      );
    });
  }

  function initTyping() {
    const target = document.getElementById("typed-text");
    const cursor = document.querySelector(".cursor");
    const values = ["Data Scientist", "Student", "Chill Guy"];
    let valueIndex = 0;
    let characterIndex = 0;

    if (reducedMotion.matches) {
      target.textContent = values[0];
      return;
    }

    const type = () => {
      cursor.classList.add("typing");
      if (characterIndex < values[valueIndex].length) {
        target.textContent += values[valueIndex].charAt(characterIndex);
        characterIndex += 1;
        window.setTimeout(type, 115);
        return;
      }

      cursor.classList.remove("typing");
      window.setTimeout(erase, 1800);
    };

    const erase = () => {
      cursor.classList.add("typing");
      if (characterIndex > 0) {
        characterIndex -= 1;
        target.textContent = values[valueIndex].substring(0, characterIndex);
        window.setTimeout(erase, 62);
        return;
      }

      cursor.classList.remove("typing");
      valueIndex = (valueIndex + 1) % values.length;
      window.setTimeout(type, 420);
    };

    window.setTimeout(type, 1750);
  }

  function initMobileMenu() {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");
    const links = menu.querySelectorAll("a");

    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      menu.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      body.classList.toggle("menu-open", open);
    };

    toggle.addEventListener("click", () => {
      setMenu(!menu.classList.contains("open"));
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    window.addEventListener("resize", () => {
      if (!mobileViewport.matches) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  function initEmailModal() {
    const trigger = document.getElementById("email");
    const modal = document.getElementById("email-modal");
    const closeButtons = modal.querySelectorAll("[data-modal-close]");
    const closeButton = modal.querySelector(".modal-close");
    let previousFocus = null;

    const setModal = (open) => {
      modal.classList.toggle("open", open);
      modal.setAttribute("aria-hidden", String(!open));
      if (open) {
        modal.removeAttribute("inert");
      } else {
        modal.setAttribute("inert", "");
      }
      body.classList.toggle("modal-open", open);

      if (open) {
        previousFocus = document.activeElement;
        modal.focus({ preventScroll: true });
        closeButton.focus({ preventScroll: true });
        window.requestAnimationFrame(() => {
          modal.focus({ preventScroll: true });
          closeButton.focus({ preventScroll: true });
        });
        window.setTimeout(() => closeButton.focus({ preventScroll: true }), 90);
      } else if (previousFocus) {
        previousFocus.focus();
      }
    };

    trigger.addEventListener("click", () => setModal(true));
    closeButtons.forEach((button) =>
      button.addEventListener("click", () => setModal(false)),
    );

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        setModal(false);
      }

      if (event.key === "Tab" && modal.classList.contains("open")) {
        const focusable = modal.querySelectorAll("button, a[href]");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function initHeader() {
    const header = document.getElementById("site-header");
    const keepHeaderVisible = () => header.classList.remove("hidden");

    keepHeaderVisible();
    mobileViewport.addEventListener("change", keepHeaderVisible);
    window.addEventListener("scroll", keepHeaderVisible, { passive: true });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") {
          event.preventDefault();
          return;
        }

        const id = hash.slice(1);
        const target =
          document.getElementById(id) ||
          document.getElementById(decodeURIComponent(id));
        if (!target) return;
        event.preventDefault();

        const getTargetTop = () => {
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          const targetTop = target.getBoundingClientRect().top + window.scrollY;
          return Math.min(Math.max(targetTop, 0), maxScroll);
        };

        const top = getTargetTop();
        history.pushState(null, "", hash);
        window.scrollTo({
          top,
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });

        let lastY = -1;
        let stableFrames = 0;
        let frameCount = 0;
        const settleLanding = () => {
          const currentY = window.scrollY;
          stableFrames =
            Math.abs(currentY - lastY) < 0.5 ? stableFrames + 1 : 0;
          lastY = currentY;
          frameCount += 1;

          if (stableFrames < 4 && frameCount < 90) {
            window.requestAnimationFrame(settleLanding);
            return;
          }

          const correctedTop = getTargetTop();
          if (Math.abs(window.scrollY - correctedTop) > 1) {
            window.scrollTo({ top: correctedTop, behavior: "auto" });
          }
        };

        window.requestAnimationFrame(settleLanding);
      });
    });
  }

  function initRevealElements() {
    const elements = document.querySelectorAll(".reveal:not(.visible)");

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.13 },
    );

    elements.forEach((element) => {
      if (observedReveals.has(element)) return;
      observedReveals.add(element);
      observer.observe(element);
    });
  }

  function initSectionMotion() {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "section-visible",
            entry.isIntersecting,
          );
        });
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".section-observed").forEach((section) => {
      if (observedSections.has(section)) return;
      observedSections.add(section);
      observer.observe(section);
    });

    const updateWatermarks = () => {
      document.querySelectorAll(".section-watermark").forEach((watermark) => {
        const section = watermark.closest("section");
        const shift = Math.max(
          -24,
          Math.min(24, section.getBoundingClientRect().top * -0.025),
        );
        watermark.style.setProperty("--watermark-shift", `${shift}px`);
      });
    };

    window.addEventListener("scroll", updateWatermarks, { passive: true });
    updateWatermarks();
  }

  function initExperienceSection() {
    const placeholder = document.getElementById(
      "experience-section-placeholder",
    );
    if (!placeholder || !placeholder.innerHTML.trim()) return;

    initRevealElements();
    initSectionMotion();
    initActiveNavigation();
    initExperienceV3();
    initGSAPAnimations();
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  }

  function initCoverFlow() {
    const coverflow = document.querySelector('.coverflow');
    if (!coverflow) return;

    const track = coverflow.querySelector('.coverflow-track');
    const cards = [...track.querySelectorAll('.coverflow-card')];
    const prevBtn = coverflow.querySelector('.coverflow-prev');
    const nextBtn = coverflow.querySelector('.coverflow-next');
    const dotsContainer = coverflow.querySelector('.coverflow-dots');
    const total = cards.length;
    let activeIndex = 0;
    let detailOpen = false;

    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'coverflow-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `Go to project ${i + 1}`);
      dot.addEventListener('click', () => navigate(i));
      dotsContainer.appendChild(dot);
    });

    const dots = [...dotsContainer.querySelectorAll('.coverflow-dot')];

    cards.forEach((card) => {
      if (!card.querySelector('.coverflow-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'coverflow-close';
        closeBtn.setAttribute('type', 'button');
        closeBtn.setAttribute('aria-label', 'Close details');
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeDetail();
        });
        card.appendChild(closeBtn);
      }
    });

    function getTransform(offset) {
      if (offset === 0) {
        return { tx: 0, tz: 0, ry: 0, scale: 1, opacity: 1 };
      }
      const sign = offset > 0 ? 1 : -1;
      const abs = Math.abs(offset);
      const isMobile = mobileViewport.matches;
      const baseGap = isMobile ? 130 : 230;
      const stackGap = isMobile ? 55 : 80;
      return {
        tx: sign * (baseGap + (abs - 1) * stackGap),
        tz: -200,
        ry: -sign * 65,
        scale: isMobile ? 0.7 : 0.78,
        opacity: abs > 3 ? 0 : Math.max(0.4, 1 - abs * 0.15)
      };
    }

    function updateCarousel(animate = true) {
      cards.forEach((card, i) => {
        // Keep the ring feeling continuous by taking the shortest path around.
        let offset = i - activeIndex;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        const t = getTransform(offset);
        const transition = animate && !reducedMotion.matches
          ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease, filter 0.5s ease'
          : 'none';

        card.style.transition = transition;
        card.style.transform = `translateX(${t.tx}px) translateZ(${t.tz}px) rotateY(${t.ry}deg) scale(${t.scale})`;
        card.style.opacity = t.opacity;
        card.style.zIndex = offset === 0 ? 10 : Math.max(1, 5 - Math.abs(offset));
        card.style.filter = offset === 0 ? 'none' : `brightness(${0.5 + 0.1 * (3 - Math.min(Math.abs(offset), 3))})`;
        card.classList.toggle('is-active', offset === 0);
      });

      dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));

      if (detailOpen) {
        closeDetail();
      }
    }

    function navigate(index) {
      index = ((index % total) + total) % total;
      if (index === activeIndex) return;
      activeIndex = index;
      updateCarousel();
    }

    function openDetail() {
      const activeCard = cards[activeIndex];
      if (!activeCard) return;

      coverflow.classList.add('has-expanded-card');
      activeCard.classList.add('is-expanded');
      detailOpen = true;
    }

    function closeDetail() {
      cards.forEach(card => card.classList.remove('is-expanded'));
      coverflow.classList.remove('has-expanded-card');
      detailOpen = false;
    }

    function toggleDetail() {
      if (detailOpen) {
        closeDetail();
      } else {
        openDetail();
      }
    }

    document.addEventListener('click', (e) => {
      if (!detailOpen) return;
      const activeCard = cards[activeIndex];
      if (activeCard && !activeCard.contains(e.target) && !e.target.closest('.coverflow-nav')) {
        closeDetail();
      }
    });

    prevBtn.addEventListener('click', () => navigate(activeIndex - 1));
    nextBtn.addEventListener('click', () => navigate(activeIndex + 1));

    cards.forEach((card, i) => {
      const cover = card.querySelector('.coverflow-cover');
      cover.addEventListener('click', () => {
        if (i === activeIndex) {
          toggleDetail();
        } else {
          navigate(i);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      const rect = coverflow.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'Escape' && detailOpen) {
        e.preventDefault();
        closeDetail();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(activeIndex + 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement?.closest('.coverflow-card')?.dataset.index == activeIndex) {
          e.preventDefault();
          toggleDetail();
        }
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    coverflow.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    coverflow.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) navigate(activeIndex - 1);
        else navigate(activeIndex + 1);
      }
    }, { passive: true });

    updateCarousel(false);
  }

  function initAboutV3() {
    const hovers = document.querySelectorAll(".about-v3-hover");
    const output = document.getElementById("about-v3-copy");
    if (!hovers.length || !output) return;

    let timeout;
    
    hovers.forEach(span => {
      span.addEventListener("pointerenter", () => {
        clearTimeout(timeout);
        output.classList.remove("is-visible");
        
        hovers.forEach(h => h.classList.remove("is-active"));
        span.classList.add("is-active");

        setTimeout(() => {
          output.textContent = span.dataset.copy || "";
          output.classList.add("is-visible");
        }, 375);
      });

      span.addEventListener("pointerleave", () => {
        timeout = setTimeout(() => {
          output.classList.remove("is-visible");
          span.classList.remove("is-active");
          setTimeout(() => {
            output.textContent = "Hover over highlighted text to reveal more.";
            output.classList.add("is-visible");
          }, 375);
        }, 500);
      });
    });
  }
  function animateSVGDiagram(card) {
    const diagram = card.querySelector('.role-diagram');
    if (!diagram) return;
    
    const elements = diagram.querySelectorAll('path, circle, rect, line, polygon, text');
    elements.forEach((el, index) => {
      if (el.tagName.toLowerCase() !== 'text' && el.getTotalLength) {
        let length = 0;
        try {
          length = el.getTotalLength();
        } catch (e) {
          length = 0;
        }
        
        if (length > 0) {
          el.style.strokeDasharray = length;
          el.style.strokeDashoffset = length;
          
          gsap.killTweensOf(el);
          gsap.to(el, {
            strokeDashoffset: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.15 + (index * 0.04)
          });
        } else {
          el.style.opacity = 0;
          gsap.killTweensOf(el);
          gsap.to(el, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            delay: 0.2 + (index * 0.04)
          });
        }
      } else {
        el.style.opacity = 0;
        gsap.killTweensOf(el);
        gsap.to(el, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.2 + (index * 0.04)
        });
      }
    });
  }

  function animateTechStack(card) {
    const tags = card.querySelectorAll('.tech-tag');
    if (tags.length === 0) return;
    
    gsap.killTweensOf(tags);
    gsap.set(tags, { opacity: 0, y: 10 });
    gsap.to(tags, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: 0.04,
      ease: "power2.out",
      delay: 0.25
    });
  }

  function initExperienceV3() {
    const shelfItems = document.querySelectorAll('.shelf-item');
    const connectorLine = document.querySelector('.shelf-connector-line');
    const dossierCards = document.querySelectorAll('.dossier-card');
    
    if (shelfItems.length === 0) return;

    function updateLayoutRoles() {
      // Desktop reads as tabs; mobile reads as accordions using the same markup.
      const isMobile = mobileViewport.matches;
      const shelf = document.querySelector('.experience-shelf');
      
      if (shelf) {
        if (isMobile) {
          shelf.removeAttribute('role');
          shelf.removeAttribute('aria-label');
        } else {
          shelf.setAttribute('role', 'tablist');
          shelf.setAttribute('aria-label', 'Professional Work History');
        }
      }
      
      shelfItems.forEach((item) => {
        if (isMobile) {
          item.removeAttribute('role');
        } else {
          item.setAttribute('role', 'tab');
        }
      });
      
      dossierCards.forEach((card) => {
        if (isMobile) {
          card.removeAttribute('role');
          card.removeAttribute('aria-labelledby');
        } else {
          card.setAttribute('role', 'tabpanel');
          card.setAttribute('aria-labelledby', card.id.replace('dossier-', 'tab-'));
        }
      });
    }

    function setActiveRole(index, animate = true) {
      const activeShelfItem = shelfItems[index];
      if (!activeShelfItem) return;
      
      const targetCard = dossierCards[index];
      if (!targetCard) return;
      
      const prevActiveCard = document.querySelector('.dossier-card.active');
      
      const isMobile = mobileViewport.matches;
      shelfItems.forEach((item, idx) => {
        const isActive = idx === index;
        item.classList.toggle('active', isActive);
        if (isMobile) {
          item.setAttribute('aria-expanded', isActive ? 'true' : 'false');
          item.removeAttribute('aria-selected');
        } else {
          item.setAttribute('aria-selected', isActive ? 'true' : 'false');
          item.removeAttribute('aria-expanded');
        }
      });

      if (connectorLine && !mobileViewport.matches) {
        const itemRect = activeShelfItem.getBoundingClientRect();
        const wrapper = document.querySelector('.dossier-wrapper');
        
        if (wrapper) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const relativeY = (itemRect.top + itemRect.height / 2) - wrapperRect.top;
          
          gsap.killTweensOf(connectorLine);
          gsap.set(connectorLine, { scaleX: 0 });
          gsap.to(connectorLine, {
            top: relativeY,
            opacity: 1,
            scaleX: 1,
            duration: 0.4,
            ease: "power2.out"
          });
        }
      } else if (connectorLine) {
        connectorLine.style.opacity = 0;
        connectorLine.style.transform = "scaleX(0)";
      }


      
      if (isMobile) {
        const currentGroup = activeShelfItem.closest('.shelf-item-group');
        const prevGroup = document.querySelector('.shelf-item-group.expanded');
        const currentDrawer = currentGroup.querySelector('.mobile-details-drawer');
        
        if (prevGroup && prevGroup !== currentGroup) {
          const prevDrawer = prevGroup.querySelector('.mobile-details-drawer');
          const oldCard = prevDrawer.querySelector('.dossier-card');
          
          if (prevDrawer && oldCard) {
            gsap.killTweensOf(prevDrawer);
            gsap.to(prevDrawer, {
              height: 0,
              opacity: 0,
              duration: 0.35,
              ease: "power2.inOut",
              onComplete: () => {
                prevDrawer.style.display = 'none';
                prevGroup.classList.remove('expanded');
                oldCard.classList.remove('active');
                oldCard.style.display = 'none';
              }
            });
          }
        }
        
        if (currentDrawer && !currentDrawer.contains(targetCard)) {
          currentDrawer.appendChild(targetCard);
        }
        
        targetCard.style.display = 'flex';
        targetCard.classList.add('active');
        
        currentDrawer.style.display = 'block';
        currentGroup.classList.add('expanded');
        
        gsap.killTweensOf(currentDrawer);
        gsap.set(currentDrawer, { height: 'auto', opacity: 0 });
        const autoHeight = currentDrawer.offsetHeight;
        gsap.set(currentDrawer, { height: 0 });
        
        gsap.to(currentDrawer, {
          height: autoHeight,
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          delay: 0.1,
          onComplete: () => {
            currentDrawer.style.height = 'auto';
          }
        });
        
        animateSVGDiagram(targetCard);
        animateTechStack(targetCard);
        
      } else {
        const dossierPanel = document.querySelector('.dossier-panel');
        if (dossierPanel && !dossierPanel.contains(targetCard)) {
          dossierPanel.appendChild(targetCard);
        }
        
        if (prevActiveCard && !dossierPanel.contains(prevActiveCard)) {
          dossierPanel.appendChild(prevActiveCard);
          gsap.set(prevActiveCard, { clearProps: "all" });
          prevActiveCard.style.display = 'flex';
          prevActiveCard.classList.add('active');
        }
        
        if (connectorLine) {
          const itemRect = activeShelfItem.getBoundingClientRect();
          const wrapper = document.querySelector('.dossier-wrapper');
          
          if (wrapper) {
            const wrapperRect = wrapper.getBoundingClientRect();
            const relativeY = (itemRect.top + itemRect.height / 2) - wrapperRect.top;
            
            gsap.killTweensOf(connectorLine);
            gsap.set(connectorLine, { scaleX: 0 });
            gsap.to(connectorLine, {
              top: relativeY,
              opacity: 1,
              scaleX: 1,
              duration: 0.4,
              ease: "power2.out"
            });
          }
        }
        
        if (targetCard && prevActiveCard !== targetCard) {
          if (animate && prevActiveCard) {
            gsap.killTweensOf([prevActiveCard, targetCard]);
            
            const prevIndex = Number(prevActiveCard.dataset.index);
            const movingUp = Number.isFinite(prevIndex) && index < prevIndex;
            const width = prevActiveCard.offsetWidth;
            const height = prevActiveCard.offsetHeight;
            
            prevActiveCard.style.position = 'absolute';
            prevActiveCard.style.zIndex = '20';
            prevActiveCard.style.width = width + 'px';
            prevActiveCard.style.height = height + 'px';
            
            const tl = gsap.timeline({
              onComplete: () => {
                prevActiveCard.classList.remove('active');
                prevActiveCard.style.display = 'none';
                gsap.set(prevActiveCard, {
                  clearProps: "position,zIndex,transform,opacity,width,height"
                });
              }
            });
            
            if (movingUp) {
              tl.to(prevActiveCard, {
                y: 12,
                rotate: -1.5,
                opacity: 0.82,
                duration: 0.1,
                ease: "power1.in"
              })
              .to(prevActiveCard, {
                y: 96,
                rotate: 4,
                opacity: 0,
                duration: 0.32,
                ease: "power2.in"
              });
            } else {
              tl.to(prevActiveCard, {
                y: 8,
                rotate: 2,
                duration: 0.08,
                ease: "power1.in"
              })
              .to(prevActiveCard, {
                y: 750,
                rotate: -10,
                opacity: 0,
                duration: 0.45,
                ease: "power2.in"
              });
            }
            
            targetCard.style.display = 'flex';
            targetCard.classList.add('active');
            
            gsap.set(targetCard, {
              opacity: 0,
              scale: movingUp ? 0.98 : 0.95,
              y: movingUp ? 220 : -10,
              rotate: movingUp ? -3 : 0,
              zIndex: 10
            });
            
            gsap.to(targetCard, {
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: 0,
              duration: movingUp ? 0.58 : 0.45,
              ease: movingUp ? "back.out(1.05)" : "power2.out",
              delay: movingUp ? 0.04 : 0.12,
              onComplete: () => {
                targetCard.style.transform = 'none';
              }
            });
            
            animateSVGDiagram(targetCard);
            animateTechStack(targetCard);
          } else {
            if (prevActiveCard) {
              prevActiveCard.classList.remove('active');
              prevActiveCard.style.display = 'none';
            }
            targetCard.style.display = 'flex';
            targetCard.classList.add('active');
            targetCard.style.opacity = 1;
            targetCard.style.transform = 'none';
            
            animateSVGDiagram(targetCard);
            animateTechStack(targetCard);
          }
        }
      }
    }

    function closeMobileRole(index, animate = true) {
      const activeShelfItem = shelfItems[index];
      const targetCard = dossierCards[index];
      if (!activeShelfItem || !targetCard) return;

      const currentGroup = activeShelfItem.closest('.shelf-item-group');
      const currentDrawer = currentGroup?.querySelector('.mobile-details-drawer');

      activeShelfItem.classList.remove('active');
      activeShelfItem.setAttribute('aria-expanded', 'false');
      activeShelfItem.removeAttribute('aria-selected');
      currentGroup?.classList.remove('expanded');
      targetCard.classList.remove('active');

      if (!currentDrawer) {
        targetCard.style.display = 'none';
        return;
      }

      gsap.killTweensOf(currentDrawer);
      if (animate) {
        gsap.to(currentDrawer, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            currentDrawer.style.display = 'none';
            targetCard.style.display = 'none';
          }
        });
      } else {
        gsap.set(currentDrawer, { height: 0, opacity: 0 });
        currentDrawer.style.display = 'none';
        targetCard.style.display = 'none';
      }
    }

    function closeAllMobileRoles(animate = false) {
      shelfItems.forEach((item, index) => {
        if (item.classList.contains('active') || item.closest('.shelf-item-group')?.classList.contains('expanded')) {
          closeMobileRole(index, animate);
        } else {
          item.classList.remove('active');
          item.setAttribute('aria-expanded', 'false');
          item.removeAttribute('aria-selected');
        }
      });
    }
    
    shelfItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        if (mobileViewport.matches && isActive) {
          closeMobileRole(index);
          return;
        }
        if (isActive) return;
        setActiveRole(index);
      });
    });

    updateLayoutRoles();
    if (mobileViewport.matches) {
      closeAllMobileRoles(false);
    } else {
      setActiveRole(0, false);
    }
    
    let wasMobileExperience = mobileViewport.matches;
    window.addEventListener('resize', () => {
      updateLayoutRoles();
      const isMobileExperience = mobileViewport.matches;

      if (isMobileExperience) {
        closeAllMobileRoles(false);
        wasMobileExperience = true;
        return;
      }

      const activeIndex = Array.from(shelfItems).findIndex(item => item.classList.contains('active'));
      if (activeIndex !== -1 && !wasMobileExperience) {
        setActiveRole(activeIndex, false);
      } else {
        setActiveRole(0, false);
      }
      wasMobileExperience = false;
    }, { passive: true });

    const miniHeaders = document.querySelectorAll('.mini-list-header');
    miniHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const row = header.closest('.mini-list-row');
        if (!row) return;
        const details = row.querySelector('.mini-list-details');
        if (!details) return;
        
        const isExpanded = row.classList.contains('expanded');
        row.classList.toggle('expanded');
        header.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
        
        gsap.killTweensOf(details);
        if (!isExpanded) {
          gsap.set(details, { display: 'block', height: 'auto', opacity: 0 });
          const targetHeight = details.offsetHeight;
          gsap.set(details, { height: 0 });
          
          gsap.to(details, {
            height: targetHeight,
            opacity: 1,
            duration: 0.35,
            ease: "power2.out"
          });
        } else {
          gsap.to(details, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.inOut",
            onComplete: () => {
              details.style.display = 'none';
            }
          });
        }
      });
    });
  }

  function initGSAPAnimations() {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      if (document.querySelector(".hero-letter-field")) {
        gsap.to(".hero-letter-field", {
          scrollTrigger: {
            trigger: "#contact",
            start: "top 80%",
            end: "top 30%",
            scrub: true,
          },
          opacity: 0,
          ease: "none",
        });
      }

      if (mobileViewport.matches) {
        gsap.set(".shelf-item", { clearProps: "transform,opacity" });
      } else {
        gsap.from(".shelf-item", {
          scrollTrigger: {
            trigger: ".experience-archive-layout",
            start: "top 85%",
          },
          x: -30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
        });
      }

      gsap.from(".dossier-panel", {
        scrollTrigger: {
          trigger: ".experience-archive-layout",
          start: "top 85%",
        },
        x: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          const activeCard = document.querySelector('.dossier-card.active');
          if (activeCard) {
            animateSVGDiagram(activeCard);
            animateTechStack(activeCard);
          }
        }
      });
      
      gsap.from(".mini-section", {
        scrollTrigger: {
          trigger: ".mini-sections-layout",
          start: "top 90%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
      });

      if (document.querySelector(".about-v3")) {
        const aboutTL = gsap.timeline({
          scrollTrigger: {
            trigger: ".about-v3",
            start: "top 75%",
            toggleActions: "play none none none"
          }
        });

        aboutTL.from(".about-v3 .section-index", {
          opacity: 0,
          y: 15,
          duration: 0.5,
          ease: "power2.out"
        });

        aboutTL.from(".about-v3 .headline-line span", {
          y: "110%",
          duration: 0.6,
          stagger: 0.12,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        }, "-=0.35");

        aboutTL.from(".about-v3-bio p", {
          opacity: 0,
          y: 15,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out"
        }, "-=0.3");

        aboutTL.from(".about-coordinates", {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.25");

        // Let the blueprint portrait breathe a bit so it doesn't snap in.
        aboutTL.from(".portrait-blueprint-frame", {
          opacity: 0,
          x: 40,
          rotation: 0,
          duration: 1.2,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        }, "-=0.55");

        aboutTL.from(".portrait-blueprint-bg", {
          opacity: 0,
          duration: 1.5,
          ease: "power2.out"
        }, "-=0.8");

        aboutTL.from(".vertical-name-tag, .about-v3-portrait-wrapper .marker", {
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out"
        }, "-=1.0");

        aboutTL.from(".about-indexing-strip", {
          opacity: 0,
          y: 15,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.35");
      }
    }
  }

  function initActiveNavigation() {
    const sections = document.querySelectorAll(".section-observed");
    const links = document.querySelectorAll(".nav-link[data-section]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle(
              "active",
              link.dataset.section === entry.target.id,
            );
          });
        });
      },
      {
        rootMargin: "-34% 0px -54%",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initF1Game() {
    const gameFrame = document.getElementById("game-frame");
    if (!gameFrame) return;

    const indyGameIframe = document.getElementById("indy-game-iframe");
    if (indyGameIframe) {
      const targetOrigin = window.location.protocol === "file:" || window.location.origin === "null"
        ? "*"
        : window.location.origin;
      let isHomeInView = true;

      function postToIndyGame(message) {
        try {
          indyGameIframe.contentWindow?.postMessage(
            { source: "aamo-portfolio", ...message },
            targetOrigin,
          );
        } catch (error) {
          console.warn("Indy game message could not be delivered.", error);
        }
      }

      function applyIndyThemeDirectly(theme) {
        try {
          const iframeBody = indyGameIframe.contentDocument?.body;
          if (iframeBody) iframeBody.dataset.theme = theme;
        } catch (error) {
          console.warn("Indy game theme could not be applied directly.", error);
        }
      }

      function syncIndyTheme() {
        const theme = getTheme();
        applyIndyThemeDirectly(theme);
        postToIndyGame({ type: "theme", theme });
      }

      function pauseIndyGame() {
        postToIndyGame({ type: "pause" });
      }

      indyGameIframe.addEventListener("load", () => {
        syncIndyTheme();
        if (!isHomeInView || document.hidden) {
          pauseIndyGame();
        }
      });

      const themeObserver = new MutationObserver(syncIndyTheme);
      themeObserver.observe(root, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          pauseIndyGame();
        } else {
          syncIndyTheme();
        }
      });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isHomeInView = entry.isIntersecting;
            if (isHomeInView) {
              syncIndyTheme();
            } else {
              pauseIndyGame();
            }
          });
        }, { threshold: 0.45 });

        const homeSection = document.getElementById("home");
        if (homeSection) {
          observer.observe(homeSection);
        }
      }

      syncIndyTheme();
      return;
    }

    class GameAudio {
      constructor() {
        this.ctx = null;
        this.isMuted = false;
      }

      init() {
        if (this.ctx) return;
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            this.ctx = new AudioContextClass();
          }
        } catch (e) {
          console.warn("Web Audio API context could not be initialized:", e);
        }
      }

      playStart() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.12, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.15);
          } catch (err) {
            console.warn("Failed to play start beep:", err);
          }
        });
      }

      playMove() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
        } catch (err) {
          console.warn("Failed to play move beep:", err);
        }
      }

      playJump() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
        } catch (err) {
          console.warn("Failed to play jump sound:", err);
        }
      }

      playRampBoost() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(523.25, now);
          osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(392.00, now);
          osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.25);
          osc2.stop(now + 0.25);
        } catch (err) {
          console.warn("Failed to play ramp boost sound:", err);
        }
      }

      playHit() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(60, now + 0.2);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
        } catch (err) {
          console.warn("Failed to play hit sound:", err);
        }
      }

      playCrash() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.linearRampToValueAtTime(30, now + 0.65);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          
          const bufferSize = this.ctx.sampleRate * 0.5;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = "lowpass";
          noiseFilter.frequency.setValueAtTime(400, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(10, now + 0.5);
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.15, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
          noise.start(now);
          noise.stop(now + 0.5);
        } catch (err) {
          console.warn("Failed to play crash sound:", err);
        }
      }
    }

    const gameScore = document.getElementById("game-score");
    const gameSpeed = document.getElementById("game-speed");
    const gameLives = document.getElementById("game-lives");
    const gameMuteBtn = document.getElementById("game-mute-btn");
    const gameSvg = document.getElementById("game-svg");
    const svgStars = document.getElementById("svg-stars");
    const svgSceneryBack = document.getElementById("svg-scenery-back");
    const svgSceneryFront = document.getElementById("svg-scenery-front");
    const svgGridFloor = document.getElementById("svg-grid-floor");
    const svgObstacles = document.getElementById("svg-obstacles");
    const svgPlayer = document.getElementById("svg-player");
    const overlayStart = document.getElementById("overlay-start");
    const overlayGameover = document.getElementById("overlay-gameover");
    const gameStartBtn = document.getElementById("game-start-btn");
    const gameRestartBtn = document.getElementById("game-restart-btn");
    const gameDistanceLabel = document.getElementById("game-distance-label");
    const gameTrackLabel = document.getElementById("game-track-label");
    const touchLeft = document.getElementById("touch-left");
    const touchJump = document.getElementById("touch-jump");
    const touchRight = document.getElementById("touch-right");
    const finalScore = document.getElementById("final-score");
    const finalDistance = document.getElementById("final-distance");
    const bestScoreEl = document.getElementById("best-score");
    const gameCrashReason = document.getElementById("game-crash-reason");

    const SVG_NS = "http://www.w3.org/2000/svg";

    function svgEl(tagName, attrs = {}, children = []) {
      const node = document.createElementNS(SVG_NS, tagName);
      Object.entries(attrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          node.setAttribute(key, String(value));
        }
      });
      children.forEach((child) => node.appendChild(child));
      return node;
    }

    function clearSvg(node) {
      if (node) node.replaceChildren();
    }

    const audio = new GameAudio();
    let isMuted = false;
    try {
      isMuted = localStorage.getItem("f1-game-muted") === "true";
    } catch (e) {}
    audio.isMuted = isMuted;
    updateMuteUI();

    function updateMuteUI() {
      const icon = gameMuteBtn.querySelector("i");
      if (icon) {
        icon.className = isMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
      }
    }

    gameMuteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      audio.isMuted = isMuted;
      updateMuteUI();
      try {
        localStorage.setItem("f1-game-muted", String(isMuted));
      } catch (e) {}
    });

    let score = 0;
    let distance = 0;
    let speed = 0;
    let lives = 3;
    let playerLane = 0;
    let isGameOver = false;
    let isStarted = false;
    let isPausedInternal = false;
    let isHomeInView = true;
    let lastTime = 0;
    let animationId = null;
    let obstacles = [];
    let obstacleIdCounter = 0;
    let spawnTimer = 0;
    let invulnerableUntil = 0;
    let jumpStart = null;
    const jumpDuration = 550;
    let currentVisualX = 200;
    let laneVelocity = 0;
    let lastLaneDirection = 0;
    let gridOffset = 0;

    const laneTargets = {
      "-1": 125,
      "0": 200,
      "1": 275
    };

    // Score gates change the track vibe and obstacle mix without loading more assets.
    const trackPhases = [
      {
        id: "forest",
        minScore: 0,
        obstacleMix: ["tire", "cone", "ramp"],
        scenery: ["tree-left-large", "tree-right-large", "sign-left"],
      },
      {
        id: "paddock",
        minScore: 900,
        obstacleMix: ["tire", "cone", "barrier", "ramp"],
        scenery: ["guardrail-left", "pit-sign-right", "flag-left"],
      },
      {
        id: "night",
        minScore: 1900,
        obstacleMix: ["tire", "cone", "barrier", "oil", "ramp"],
        scenery: ["skyline", "guardrail-left", "guardrail-right"],
      },
      {
        id: "speed",
        minScore: 3200,
        obstacleMix: ["barrier", "oil", "ramp", "ramp", "cone"],
        scenery: ["speed-lines", "flag-left", "flag-right"],
      },
    ];

    let currentPhaseId = "forest";

    function getTrackPhase(scoreValue) {
      return trackPhases.reduce((active, phase) => (
        scoreValue >= phase.minScore ? phase : active
      ), trackPhases[0]);
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    }

    // Fake the road depth by projecting progress into position, scale, and hit timing.
    function projectTrackPoint(lane, progress) {
      const p = easeOutCubic(progress);
      return {
        x: 200 + lane * 148 * p,
        y: 190 + 318 * p,
        scale: 0.08 + 1.08 * p,
        opacity: clamp(0.18 + p * 0.92, 0.18, 1),
        collisionProgress: p,
      };
    }

    function getJumpState(now) {
      if (jumpStart === null) {
        return { active: false, clearance: 0, yOffset: 0, scale: 1 };
      }
      const elapsed = now - jumpStart;
      if (elapsed >= jumpDuration) {
        jumpStart = null;
        return { active: false, clearance: 0, yOffset: 0, scale: 1 };
      }
      const t = elapsed / jumpDuration;
      const arc = Math.sin(t * Math.PI);
      return {
        active: true,
        clearance: arc,
        yOffset: arc * 38,
        scale: 1 - arc * 0.075,
      };
    }

    // Lane changes use a spring so the car slides instead of teleporting.
    function updatePlayerMotion(dt) {
      const targetX = laneTargets[playerLane];
      const steps = Math.max(1, Math.ceil(dt / 34));
      const stepDt = Math.min(34, dt / steps);
      const stiffness = 0.024;
      const damping = 0.82;
      for (let i = 0; i < steps; i++) {
        const diff = targetX - currentVisualX;
        laneVelocity = (laneVelocity + diff * stiffness * stepDt) * damping;
        currentVisualX += laneVelocity * 0.06;
      }
      const remaining = targetX - currentVisualX;
      if (Math.abs(remaining) < 0.35 && Math.abs(laneVelocity) < 0.35) {
        currentVisualX = targetX;
        laneVelocity = 0;
        if (lastLaneDirection !== 0) {
          lastLaneDirection = 0;
        }
      }
      return clamp(laneVelocity * 0.12, -8, 8);
    }

    function buildRearF1Car() {
      clearSvg(svgPlayer);
      svgPlayer.dataset.vehicle = "rear-f1";
      svgPlayer.append(
        svgEl("ellipse", {
          class: "rear-f1-shadow",
          cx: 0,
          cy: 58,
          rx: 58,
          ry: 12,
          opacity: 0.42,
        }),
        svgEl("g", { class: "rear-f1-car" }, [
          svgEl("rect", {
            class: "rear-f1-line rear-f1-rear-tire",
            x: -58,
            y: 0,
            width: 22,
            height: 58,
            rx: 6,
            "stroke-width": 2,
          }),
          svgEl("rect", {
            class: "rear-f1-line rear-f1-rear-tire",
            x: 36,
            y: 0,
            width: 22,
            height: 58,
            rx: 6,
            "stroke-width": 2,
          }),
          svgEl("rect", {
            class: "rear-f1-muted",
            x: -42,
            y: -34,
            width: 16,
            height: 33,
            rx: 4,
            "stroke-width": 1.6,
          }),
          svgEl("rect", {
            class: "rear-f1-muted",
            x: 26,
            y: -34,
            width: 16,
            height: 33,
            rx: 4,
            "stroke-width": 1.6,
          }),
          svgEl("path", {
            class: "rear-f1-line rear-f1-rear-wing",
            d: "M -70 14 H 70",
            "stroke-width": 7,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -60 6 H 60",
            "stroke-width": 2.4,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -62 -36 H 62",
            "stroke-width": 5,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -52 -45 H 52",
            "stroke-width": 2.2,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -18 68 L -12 16 L -6 -35 L 0 -66 L 6 -35 L 12 16 L 18 68 Z",
            "stroke-width": 2,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -32 34 C -16 12 16 12 32 34",
            "stroke-width": 1.8,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -12 -8 Q 0 -28 12 -8",
            "stroke-width": 1.8,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M 0 -60 V 64",
            "stroke-width": 2.6,
          }),
          svgEl("path", {
            class: "rear-f1-muted",
            d: "M -12 48 H 12 M -9 60 H 9 M -70 14 L -82 25 M 70 14 L 82 25 M -62 -36 L -72 -27 M 62 -36 L 72 -27",
            "stroke-width": 1.4,
          }),
          svgEl("circle", {
            class: "rear-f1-fill-accent car-rain-light",
            cx: 0,
            cy: 43,
            r: 4.2,
          }),
        ]),
      );
    }

    function generateStars() {
      svgStars.innerHTML = "";
      for (let i = 0; i < 20; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(Math.random() * 400));
        circle.setAttribute("cy", String(Math.random() * 180));
        circle.setAttribute("r", String(0.5 + Math.random() * 1.2));
        circle.setAttribute("fill", Math.random() > 0.7 ? "var(--blue)" : "var(--muted)");
        circle.setAttribute("opacity", String(0.2 + Math.random() * 0.8));
        svgStars.appendChild(circle);
      }
    }
    generateStars();

    function initFloorGrid() {
      svgGridFloor.innerHTML = "";
      for (let i = 0; i < 6; i++) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("stroke", "var(--line)");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("opacity", "0.4");
        svgGridFloor.appendChild(line);
      }
    }
    initFloorGrid();
    buildRearF1Car();
    updateTrackPhase();

    let bestScore = 0;
    try {
      bestScore = parseInt(localStorage.getItem("f1-game-best") || "0", 10);
    } catch (e) {}

    function moveLeft() {
      if (playerLane > -1) {
        playerLane--;
        lastLaneDirection = -1;
        audio.playMove();
      }
    }

    function moveRight() {
      if (playerLane < 1) {
        playerLane++;
        lastLaneDirection = 1;
        audio.playMove();
      }
    }

    function jump() {
      if (jumpStart === null) {
        jumpStart = performance.now();
        audio.playJump();
      }
    }

    window.addEventListener("keydown", (e) => {
      if (!isStarted || isGameOver || isPausedInternal || !isHomeInView) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        moveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        moveRight();
      } else if (e.key === "Spacebar" || e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        jump();
      }
    });

    function setupTouchBtn(btn, action) {
      if (!btn) return;
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (!isStarted || isGameOver || isPausedInternal || !isHomeInView) return;
        action();
      });
    }

    setupTouchBtn(touchLeft, moveLeft);
    setupTouchBtn(touchRight, moveRight);
    setupTouchBtn(touchJump, jump);

    function buildTireStack() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "tire" }, [
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: -12, rx: 28, ry: 12, "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-line", d: "M -28 -12 V 10 C -28 19 -15 26 0 26 C 15 26 28 19 28 10 V -12", "stroke-width": 2 }),
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: 10, rx: 28, ry: 12, "stroke-width": 2 }),
        svgEl("ellipse", { class: "game-obstacle-accent", cx: 0, cy: -12, rx: 16, ry: 6, "stroke-width": 1.5 }),
        svgEl("ellipse", { class: "game-obstacle-muted", cx: 0, cy: 10, rx: 16, ry: 6, "stroke-width": 1.4 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -20 0 H 20 M -18 18 H 18", "stroke-width": 1.2 }),
      ]);
    }

    function buildCone() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "cone" }, [
        svgEl("path", { class: "game-obstacle-line", d: "M -16 24 H 16 L 9 -32 H -9 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -10 -6 H 10 M -12 10 H 12", "stroke-width": 1.8 }),
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: 28, rx: 24, ry: 5, "stroke-width": 1.7 }),
      ]);
    }

    function buildBarrier() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "barrier" }, [
        svgEl("path", { class: "game-obstacle-line", d: "M -42 -12 H 42 L 36 22 H -36 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -33 -10 L -20 22 M -8 -10 L 5 22 M 17 -10 L 30 22", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -36 22 L -46 34 M 36 22 L 46 34", "stroke-width": 1.5 }),
      ]);
    }

    function buildRamp() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "ramp" }, [
        svgEl("path", { class: "game-obstacle-line game-obstacle-fill-soft", d: "M -34 24 H 34 L 20 -24 H -20 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -14 10 L 0 -8 L 14 10 M -14 -4 L 0 -22 L 14 -4", "stroke-width": 2.4 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -26 24 L -14 -24 M 26 24 L 14 -24", "stroke-width": 1.2 }),
      ]);
    }

    function buildOilSlick() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "oil" }, [
        svgEl("path", {
          class: "game-obstacle-line game-obstacle-fill-soft",
          d: "M -30 8 C -26 -14 -4 -19 10 -12 C 28 -4 34 12 18 20 C 4 28 -24 25 -30 8 Z",
          "stroke-width": 1.8,
        }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -14 5 C -5 -2 8 -1 17 6", "stroke-width": 1.5 }),
      ]);
    }

    const obstacleBuilders = {
      tire: buildTireStack,
      cone: buildCone,
      barrier: buildBarrier,
      ramp: buildRamp,
      oil: buildOilSlick,
    };

    function buildTree(x, y, scale) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("path", { class: "game-scenery-line", d: "M 0 58 V 32 M -28 32 L 0 -28 L 28 32 Z M -22 5 L 0 -46 L 22 5 Z", "stroke-width": 1.7 }),
        svgEl("path", { class: "game-scenery-muted", d: "M -18 16 H 18 M -12 -7 H 12", "stroke-width": 1.1 }),
      ]);
    }

    function buildRoadSign(x, y, scale, arrows = true) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("rect", { class: "game-scenery-line", x: -28, y: -18, width: 56, height: 32, rx: 3, "stroke-width": 1.6 }),
        svgEl("path", { class: arrows ? "game-scenery-accent" : "game-scenery-muted", d: arrows ? "M -15 -5 H 10 M 0 -13 L 13 -5 L 0 3" : "M -16 -2 H 16", "stroke-width": 2 }),
        svgEl("path", { class: "game-scenery-muted", d: "M -16 14 V 44 M 16 14 V 44", "stroke-width": 1.4 }),
      ]);
    }

    function buildGuardRail(side) {
      const x1 = side === "left" ? 24 : 376;
      const x2 = side === "left" ? 152 : 248;
      return svgEl("g", { class: "game-scenery" }, [
        svgEl("path", { class: "game-scenery-accent", d: `M ${x1} 470 L ${x2} 232`, "stroke-width": 1.5 }),
        svgEl("path", { class: "game-scenery-muted", d: `M ${x1 + (side === "left" ? 7 : -7)} 500 L ${x2 + (side === "left" ? 5 : -5)} 248`, "stroke-width": 1 }),
      ]);
    }

    function buildFlag(x, y, scale) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("path", { class: "game-scenery-muted", d: "M 0 40 V -30", "stroke-width": 1.6 }),
        svgEl("path", { class: "game-scenery-line", d: "M 0 -30 C 16 -38 25 -23 40 -31 V -2 C 24 7 15 -9 0 -2 Z", "stroke-width": 1.5 }),
      ]);
    }

    function renderSceneryPhase(phase) {
      clearSvg(svgSceneryBack);
      clearSvg(svgSceneryFront);
      const appendScenery = (layer, element) => {
        if (layer) layer.appendChild(element);
      };
      phase.scenery.forEach((item) => {
        if (item === "tree-left-large") appendScenery(svgSceneryBack, buildTree(64, 290, 1.05));
        if (item === "tree-right-large") appendScenery(svgSceneryBack, buildTree(332, 268, 0.88));
        if (item === "sign-left") appendScenery(svgSceneryBack, buildRoadSign(110, 248, 0.78, true));
        if (item === "guardrail-left") appendScenery(svgSceneryFront, buildGuardRail("left"));
        if (item === "guardrail-right") appendScenery(svgSceneryFront, buildGuardRail("right"));
        if (item === "pit-sign-right") appendScenery(svgSceneryBack, buildRoadSign(318, 242, 0.72, false));
        if (item === "flag-left") appendScenery(svgSceneryBack, buildFlag(76, 250, 0.76));
        if (item === "flag-right") appendScenery(svgSceneryBack, buildFlag(326, 248, 0.76));
        if (item === "skyline") {
          appendScenery(svgSceneryBack, svgEl("path", {
            class: "game-scenery-muted",
            d: "M 0 190 H 70 V 170 H 95 V 186 H 138 V 160 H 170 V 190 H 400",
            "stroke-width": 1.2,
          }));
        }
        if (item === "speed-lines") {
          appendScenery(svgSceneryBack, svgEl("path", {
            class: "game-scenery-accent",
            d: "M 24 260 L 112 215 M 376 260 L 288 215 M 42 420 L 128 310 M 358 420 L 272 310",
            "stroke-width": 1.1,
            opacity: 0.55,
          }));
        }
      });
    }

    function updateTrackPhase() {
      const phase = getTrackPhase(score);
      if (phase.id === currentPhaseId && gameFrame.dataset.trackPhase) return phase;
      currentPhaseId = phase.id;
      gameFrame.dataset.trackPhase = phase.id;
      gameFrame.classList.remove("track-phase-forest", "track-phase-paddock", "track-phase-night", "track-phase-speed");
      gameFrame.classList.add(`track-phase-${phase.id}`);
      renderSceneryPhase(phase);
      if (gameTrackLabel) {
        gameTrackLabel.textContent = `TRACK 01 / ${phase.id.toUpperCase()}`;
      }
      return phase;
    }

    function spawnObstacle() {
      const lanes = [-1, 0, 1];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const phase = updateTrackPhase();
      const mix = phase.obstacleMix.filter((type) => obstacleBuilders[type]);
      const requestedType = mix[Math.floor(Math.random() * mix.length)];
      const type = obstacleBuilders[requestedType] ? requestedType : "tire";
      const g = obstacleBuilders[type]();

      g.setAttribute("transform", "translate(200, 190) scale(0.08)");
      svgObstacles.appendChild(g);

      obstacles.push({
        id: obstacleIdCounter++,
        lane,
        progress: 0,
        type,
        element: g,
        jumpable: type === "tire" || type === "cone" || type === "oil",
        boost: type === "ramp",
      });
    }

    function gameLoop(now) {
      if (!isStarted || isGameOver || isPausedInternal || !isHomeInView) {
        animationId = null;
        return;
      }

      if (!now) now = performance.now();
      if (!lastTime) lastTime = now;
      let dt = now - lastTime;
      if (isNaN(dt) || dt < 0 || dt > 1000) {
        dt = 16.66;
      }
      lastTime = now;

      score += dt * 0.012;
      speed = Math.min(320, 100 + Math.floor(score * 0.18));
      distance += (speed * dt) / 3600000;
      updateTrackPhase();

      gameScore.textContent = String(Math.floor(score)).padStart(6, "0");
      gameSpeed.innerHTML = `${speed} <span class="unit">KM/H</span>`;
      gameLives.innerHTML = "♥ ".repeat(lives) + "♡ ".repeat(3 - lives);
      gameDistanceLabel.textContent = `DISTANCE: ${distance.toFixed(2)} KM`;

      gridOffset = (gridOffset + speed * 0.00018 * dt) % 1.0;
      
      const gridLines = svgGridFloor.children;
      for (let i = 0; i < gridLines.length; i++) {
        const lineProgress = (gridOffset + i / gridLines.length) % 1.0;
        const p = Math.pow(lineProgress, 1.8);
        const y = 200 + 300 * p;
        const x1 = 175 - 150 * p;
        const x2 = 225 + 150 * p;
        gridLines[i].setAttribute("x1", String(x1));
        gridLines[i].setAttribute("y1", String(y));
        gridLines[i].setAttribute("x2", String(x2));
        gridLines[i].setAttribute("y2", String(y));
        gridLines[i].setAttribute("opacity", String(p * 0.5));
      }

      const laneLineLeft = document.getElementById("lane-line-left");
      const laneLineRight = document.getElementById("lane-line-right");
      if (laneLineLeft && laneLineRight) {
        laneLineLeft.style.strokeDashoffset = String(-gridOffset * 80);
        laneLineRight.style.strokeDashoffset = String(-gridOffset * 80);
      }

      const playerLean = updatePlayerMotion(dt);
      const jumpState = getJumpState(now);
      const isInvulnerable = now < invulnerableUntil;
      svgPlayer.style.opacity = isInvulnerable
        ? (Math.floor(now / 80) % 2 === 0 ? "0.24" : "0.82")
        : "1";
      svgPlayer.setAttribute(
        "transform",
        `translate(${currentVisualX}, ${430 - jumpState.yOffset}) rotate(${playerLean}) scale(${jumpState.scale})`,
      );

      const progressDelta = (speed * 0.0000012) * dt;
      
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.progress += progressDelta;

        if (obs.progress > 1.2) {
          if (obs.element && obs.element.parentNode) {
            obs.element.parentNode.removeChild(obs.element);
          }
          obstacles.splice(i, 1);
          continue;
        }

        const projected = projectTrackPoint(obs.lane, obs.progress);
        obs.element.setAttribute(
          "transform",
          `translate(${projected.x}, ${projected.y}) scale(${projected.scale})`,
        );
        obs.element.style.opacity = String(projected.opacity);
        obs.element.style.zIndex = String(Math.floor(projected.y));

        if (obs.cleared) {
          continue;
        }

        // Close enough to hit, still early enough that the player can read it.
        if (projected.collisionProgress >= 0.72 && projected.collisionProgress <= 0.94) {
          if (obs.lane === playerLane && !isInvulnerable) {
            
            if (obs.type === "ramp") {
              audio.playRampBoost();
              score += 500;
              jumpStart = now;
              if (obs.element && obs.element.parentNode) {
                obs.element.parentNode.removeChild(obs.element);
              }
              obstacles.splice(i, 1);
              gameScore.closest(".score-display")?.classList.add("is-boosting");
              setTimeout(() => {
                gameScore.closest(".score-display")?.classList.remove("is-boosting");
              }, 300);
            }
            else if (obs.type === "tree" || obs.type === "barrier") {
              handleCollision(now, "COLLISION: TALL OBSTACLE");
              if (obs.element && obs.element.parentNode) {
                obs.element.parentNode.removeChild(obs.element);
              }
              obstacles.splice(i, 1);
            }
            else {
              if (obs.jumpable && jumpState.clearance > 0.48) {
                obs.element.classList.add("is-cleared");
                obs.cleared = true;
              } else {
                handleCollision(now, "COLLISION: IMPACT DETECTED");
                if (obs.element && obs.element.parentNode) {
                  obs.element.parentNode.removeChild(obs.element);
                }
                obstacles.splice(i, 1);
              }
            }

          }
        }
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacle();
        const activePhase = updateTrackPhase();
        const phasePressure = activePhase.id === "speed" ? 0.78 : activePhase.id === "night" ? 0.88 : 1;
        const baseInterval = (1850 - Math.min(1120, (speed - 100) * 5.4)) * phasePressure;
        spawnTimer = baseInterval * (0.86 + Math.random() * 0.32);
      }

      animationId = requestAnimationFrame(gameLoop);
    }

    function handleCollision(now, reason) {
      lives--;
      audio.playHit();

      if (lives <= 0) {
        isGameOver = true;
        audio.playCrash();
        cancelAnimationFrame(animationId);
        animationId = null;

        overlayGameover.classList.remove("hidden");
        finalScore.textContent = String(Math.floor(score)).padStart(6, "0");
        finalDistance.textContent = `${distance.toFixed(2)} KM`;

        if (score > bestScore) {
          bestScore = Math.floor(score);
          try {
            localStorage.setItem("f1-game-best", String(bestScore));
          } catch (e) {}
        }
        bestScoreEl.textContent = String(bestScore).padStart(6, "0");
        gameCrashReason.textContent = reason;
      } else {
        invulnerableUntil = now + 1200;
      }
    }

    function startRun() {
      score = 0;
      distance = 0;
      speed = 100;
      lives = 3;
      playerLane = 0;
      isGameOver = false;
      isStarted = true;
      isPausedInternal = false;

      svgObstacles.innerHTML = "";
      obstacles = [];
      spawnTimer = 1000;
      jumpStart = null;
      currentVisualX = 200;
      laneVelocity = 0;
      lastLaneDirection = 0;
      lastTime = performance.now();
      currentPhaseId = "";
      updateTrackPhase();

      overlayStart.classList.add("hidden");
      overlayGameover.classList.add("hidden");
      
      audio.playStart();
      gameFrame.focus();

      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(gameLoop);
    }

    gameStartBtn.addEventListener("click", () => startRun());
    gameRestartBtn.addEventListener("click", () => startRun());

    // Pause when the game is hidden; otherwise RAF time jumps get rough fast.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && isStarted && !isGameOver) {
        isPausedInternal = true;
      } else if (!document.hidden && isStarted && !isGameOver && isPausedInternal && isHomeInView) {
        isPausedInternal = false;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isHomeInView = entry.isIntersecting;
          if (isHomeInView) {
            if (isStarted && !isGameOver && isPausedInternal) {
              isPausedInternal = false;
              lastTime = performance.now();
              requestAnimationFrame(gameLoop);
            }
          } else {
            if (isStarted && !isGameOver) {
              isPausedInternal = true;
            }
          }
        });
      }, { threshold: 0.5 });

      observer.observe(document.getElementById("home"));
    } else {
      isHomeInView = true;
    }
  }

  function initActiveNavigation() {
    const sections = document.querySelectorAll(".section-observed");
    const links = document.querySelectorAll(".nav-link[data-section]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle(
              "active",
              link.dataset.section === entry.target.id,
            );
          });
        });
      },
      {
        rootMargin: "-34% 0px -54%",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
  }
});
