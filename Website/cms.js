document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('http://66.116.252.191:19998/api/website/data');
        const json = await res.json();
        
        if (json.success && json.data) {
            const { settings, stats, programs, news, testimonials } = json.data;

            // Update Hero Settings
            if (settings) {
                // Find and update Hero elements by class or partial match
                // Note: To make this robust, it's highly recommended to add IDs to your HTML elements (e.g. id="hero-title")
                const heroTitle = document.querySelector('.hero-gradient h1');
                if (heroTitle) heroTitle.innerHTML = settings.heroTitle;
                
                const heroDesc = document.querySelector('.hero-gradient p.text-lg');
                if (heroDesc) heroDesc.textContent = settings.heroDescription;
                
                const heroSub = document.querySelector('.hero-gradient .tracking-[0.2em]');
                if (heroSub) heroSub.textContent = settings.heroSubtitle;
                
                // Update Contact Info in Topbar and Footer
                const phoneElements = document.querySelectorAll('a[href^="tel:"], .fa-phone + span');
                phoneElements.forEach(el => {
                    if (el.tagName === 'A') {
                        el.href = `tel:${settings.contactPhone}`;
                        el.innerHTML = `<i class="fa-solid fa-phone"></i> ${settings.contactPhone}`;
                    } else {
                        el.textContent = settings.contactPhone;
                    }
                });
                
                const emailElements = document.querySelectorAll('a[href^="mailto:"], .fa-envelope + span');
                emailElements.forEach(el => {
                    if (el.tagName === 'A') {
                        el.href = `mailto:${settings.contactEmail}`;
                        el.innerHTML = `<i class="fa-solid fa-envelope"></i> ${settings.contactEmail}`;
                    } else {
                        el.textContent = settings.contactEmail;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Failed to load CMS data:', error);
    }
});
