// Zentinel Landing Page - Main JavaScript
// Handles navigation, tabs, form submission, and interactions

document.addEventListener('DOMContentLoaded', function () {
    // ==================== NAVIGATION SCROLL EFFECT ====================
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ==================== INDUSTRY TABS ====================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ==================== SMOOTH SCROLL ====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==================== CONTACT FORM ====================
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                // Success message
                alert('Thank you! We will contact you within 48 hours.');
                contactForm.reset();

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                // In production, send to backend:
                // fetch('/api/contact', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(data)
                // });
            }, 1500);
        });
    }

    // ==================== INTERSECTION OBSERVER (Animations) ====================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards for fade-in effect
    document.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // ==================== MOBILE MENU (if needed) ====================
    // Add hamburger menu for mobile if nav-links are hidden on small screens
    const createMobileMenu = () => {
        const navContainer = document.querySelector('.nav-container');
        const navLinks = document.querySelector('.nav-links');

        if (window.innerWidth <= 768 && navLinks) {
            // Check if hamburger doesn't exist
            if (!document.querySelector('.hamburger')) {
                const hamburger = document.createElement('button');
                hamburger.className = 'hamburger';
                hamburger.innerHTML = '☰';
                hamburger.style.cssText = `
                    background: none;
                    border: none;
                    color: var(--primary);
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: none;
                `;

                // Show hamburger on mobile
                if (window.innerWidth <= 768) {
                    hamburger.style.display = 'block';
                }

                hamburger.addEventListener('click', () => {
                    navLinks.classList.toggle('mobile-active');
                });

                navContainer.insertBefore(hamburger, navLinks);
            }
        }
    };

    createMobileMenu();
    window.addEventListener('resize', createMobileMenu);

    // ==================== STATS COUNTER ANIMATION ====================
    const animateCounter = (element, target, duration = 2000) => {
        const originalText = target;
        const numericValue = parseInt(target.replace(/[^0-9]/g, ''));

        if (isNaN(numericValue)) {
            element.textContent = originalText;
            return;
        }

        let current = 0;
        const increment = numericValue / (duration / 16);
        const suffix = target.includes('%') ? '%' : target.includes('+') ? '+' : '';

        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                element.textContent = originalText;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            }
        }, 16);
    };

    // Trigger counter animation when stats are in view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = entry.target.textContent;
                entry.target.classList.add('counted');
                animateCounter(entry.target, target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(stat => {
        statsObserver.observe(stat);
    });
});
