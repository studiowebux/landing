// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Language switcher functionality
const langButtons = document.querySelectorAll('.lang-btn');
const elementsWithLang = document.querySelectorAll('[data-en][data-fr]');

// Get saved language or default to English
let currentLang = localStorage.getItem('language') || 'en';

// Function to switch language
function switchLanguage(lang) {
    currentLang = lang;

    // Update all elements with language data
    elementsWithLang.forEach(element => {
        element.innerHTML = element.getAttribute(`data-${lang}`);
    });

    // Update active button
    langButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Save preference
    localStorage.setItem('language', lang);
}

// Add click listeners to language buttons
langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        switchLanguage(lang);
    });
});

// Initialize with saved or default language
switchLanguage(currentLang);

// Theme switcher functionality
const themeToggle = document.getElementById('theme-toggle');
const lightIcon = document.querySelector('.light-icon');
const darkIcon = document.querySelector('.dark-icon');

// Function to set theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update icon visibility
    if (theme === 'dark') {
        lightIcon.classList.add('active');
        darkIcon.classList.remove('active');
    } else {
        lightIcon.classList.remove('active');
        darkIcon.classList.add('active');
    }
}

// Function to get preferred theme
function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

// Initialize theme
setTheme(getPreferredTheme());

// Toggle theme on button click
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Smooth scroll for anchor links (if needed in the future)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
