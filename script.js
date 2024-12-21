// script.js

document.addEventListener('DOMContentLoaded', () => {
    /** ============================
     * 1. Theme Toggle Logic
     ============================ */
     const themeToggle = document.getElementById('theme-toggle');
     const themeIcon = document.getElementById('theme-icon');
     
     // Favicon Elements
     const favicons = {
         light: {
             'favicon-96x96': document.getElementById('favicon-light-96x96'),
             'favicon-svg': document.getElementById('favicon-light-svg'),
             'favicon-ico': document.getElementById('favicon-light-ico'),
             'apple-touch-icon': document.getElementById('apple-touch-icon-light')
         },
         dark: {
             'favicon-96x96': document.getElementById('favicon-dark-96x96'),
             'favicon-svg': document.getElementById('favicon-dark-svg'),
             'favicon-ico': document.getElementById('favicon-dark-ico'),
             'apple-touch-icon': document.getElementById('apple-touch-icon-dark')
         }
     };
 
     const currentTheme = localStorage.getItem('theme');
     const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
 
     // Function to apply theme and update favicons
     function applyTheme(theme) {
         if (theme === 'dark') {
             document.body.classList.add('dark-mode');
             themeIcon.classList.replace('fa-sun', 'fa-moon');
             themeToggle.checked = true;
             updateFavicons('dark');
         } else if (theme === 'light') {
             document.body.classList.remove('dark-mode');
             themeIcon.classList.replace('fa-moon', 'fa-sun');
             themeToggle.checked = false;
             updateFavicons('light');
         }
     }
 
     // Function to update favicons based on theme
     function updateFavicons(theme) {
         const otherTheme = theme === 'dark' ? 'light' : 'dark';
 
         // Hide the favicons of the other theme
         for (let key in favicons[otherTheme]) {
             favicons[otherTheme][key].disabled = true;
         }
 
         // Enable the favicons of the current theme
         for (let key in favicons[theme]) {
             favicons[theme][key].disabled = false;
         }
     }
 
     // Initial theme application
     if (currentTheme) {
         applyTheme(currentTheme);
     } else if (prefersDarkScheme.matches) {
         applyTheme('dark');
     } else {
         applyTheme('light');
     }
 
     // Listen for system preference changes and apply if no user preference is set
     prefersDarkScheme.addEventListener('change', (e) => {
         if (!localStorage.getItem('theme')) { // Only if user hasn't set a preference
             applyTheme(e.matches ? 'dark' : 'light');
         }
     });
 
     // Toggle theme on button click
     themeToggle.addEventListener('click', () => {
         if (document.body.classList.contains('dark-mode')) {
             applyTheme('light');
             localStorage.setItem('theme', 'light');
         } else {
             applyTheme('dark');
             localStorage.setItem('theme', 'dark');
         }
     });
    /** ============================
     * 2. Typing Animation Logic
     ============================ */
    const typedTextSpan = document.getElementById('typed-text');
    const cursorSpan = document.querySelector('.cursor');
    const textArray = ["Data Scientist", "Student", "Chill Guy"];
    const typingDelay = 200, erasingDelay = 100, newTextDelay = 2000;
    let textArrayIndex = 0, charIndex = 0;

    function type() {
        cursorSpan.classList.add('typing');
        if (charIndex < textArray[textArrayIndex].length) {
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex++);
            setTimeout(type, typingDelay);
        } else {
            cursorSpan.classList.remove('typing');
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        cursorSpan.classList.add('typing');
        if (charIndex > 0) {
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex--);
            setTimeout(erase, erasingDelay);
        } else {
            cursorSpan.classList.remove('typing');
            textArrayIndex = (textArrayIndex + 1) % textArray.length;
            typedTextSpan.textContent = "";
            setTimeout(type, typingDelay + 500);
        }
    }

    setTimeout(type, newTextDelay);

    /** ============================
     * 3. Header Visibility on Scroll
     ============================ */
    const header = document.querySelector('header');
    let scrollTimeout;

    window.addEventListener('scroll', () => {
        header.classList.add('hidden');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            header.classList.remove('hidden');
        }, 300);
    });


    /** ============================
     * 4. Initialize Particles.js
     ============================ */
    particlesJS("particles-js", {
        particles: {
            number: { value: 100, density: { enable: true, value_area: 800 } },
            color: { value: "#3498db" },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#3498db", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 3 }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" }
            },
            modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });

    /** ============================
     * 5. Load Experience Section
     ============================ */
    fetch('experience.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('experience-section-placeholder').innerHTML = html;
        initializeExperienceSection(); // Initialize after loading

        // Setup active navigation links after loading Experience section
        setupActiveNavLinks();
    })
    .catch(error => {
        console.error('Error loading Experience section:', error);
    });

    /** ============================
     * 6. Initialize Experience Section Logic
     ============================ */
    function initializeExperienceSection() {
        const experienceListItems = document.querySelectorAll('.experience-list li');
        const experienceContents = document.querySelectorAll('.experience-content');

        experienceListItems.forEach(item => {
            item.addEventListener('click', () => {
                // If the clicked item is already active, do nothing
                if (item.classList.contains('active')) return;

                // Remove active class from all list items
                experienceListItems.forEach(li => li.classList.remove('active'));

                // Add active class to the clicked item
                item.classList.add('active');

                // Hide all content sections
                experienceContents.forEach(content => content.classList.remove('active'));

                // Show the corresponding content
                const contentId = item.getAttribute('data-content');
                const targetContent = document.getElementById(contentId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });

            // Optional: Add keyboard accessibility (Enter and Space keys)
            item.setAttribute('tabindex', '0'); // Make focusable
            item.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    /** ============================
     * 7. Active Navigation Link Logic (After Loading Experience Section)
     ============================ */
    function setupActiveNavLinks() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        const homeLink = document.querySelector('nav a[href="#home"]'); // Updated selector
        console.log('Home Link:', homeLink); // Debugging

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.6 // 60% of the section must be visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting){
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if(link.getAttribute('href') === `#${entry.target.id}`){
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }
    /** ============================
     * 8. Hamburger Menu Toggle Logic
     ============================ */
     const hamburger = document.getElementById('hamburger');
     const mobileMenu = document.getElementById('mobile-menu');
     const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
     const mobileThemeIcon = document.getElementById('mobile-theme-icon');
     const closeMobileMenuButton = document.getElementById('close-mobile-menu');
 
     // Function to toggle mobile menu
     function toggleMobileMenu() {
         mobileMenu.classList.toggle('active');
         document.body.classList.toggle('no-scroll'); // Prevent background scroll when menu is open
 
         // Update aria-expanded attribute
         const isActive = mobileMenu.classList.contains('active');
         hamburger.setAttribute('aria-expanded', isActive);
 
     }
 
     // Event listener for hamburger button
     hamburger.addEventListener('click', toggleMobileMenu);
 

 
     // Close mobile menu when a link is clicked
     mobileMenu.querySelectorAll('.nav-link').forEach(link => {
         link.addEventListener('click', () => {
             mobileMenu.classList.remove('active');
             document.body.classList.remove('no-scroll');
             hamburger.setAttribute('aria-expanded', 'false');
         });
     });
 

     /** ============================
      * 9. Close Mobile Menu on Outside Click
      ============================ */
     document.addEventListener('click', (event) => {
         if (!mobileMenu.contains(event.target) && !hamburger.contains(event.target)) {
             mobileMenu.classList.remove('active');
             document.body.classList.remove('no-scroll');
             hamburger.setAttribute('aria-expanded', 'false');
         }
     });
 
     /** ============================
      * 10. Close Mobile Menu on Escape Key Press
      ============================ */
     document.addEventListener('keydown', (event) => {
         if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
             mobileMenu.classList.remove('active');
             document.body.classList.remove('no-scroll');
             hamburger.setAttribute('aria-expanded', 'false');
         }
     });
 
    /** ============================
     * 11. Alert Notification Logic
     * ============================ */
    document.getElementById("email").addEventListener("click", function() {
        if (confirm("Want to send an email to me? aamodit.acharya@uwaterloo.ca")) {
            window.location.href = "mailto:aamodit.acharya@uwaterloo.ca";
        }
    });
});