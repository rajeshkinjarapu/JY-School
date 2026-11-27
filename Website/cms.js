const esc = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const STAT_COLOR_CLASSES = {
    blue: 'stat-card-1',
    orange: 'stat-card-2',
    green: 'stat-card-3',
    purple: 'stat-card-4',
    rose: 'stat-card-5',
    cyan: 'stat-card-1',
};

const PROGRAM_STYLE_MAP = {
    blue: { card: 'from-blue-50 to-indigo-50 border-blue-100', iconBg: 'bg-brandBlue shadow-blue-200', text: 'text-brandBlue' },
    orange: { card: 'from-orange-50 to-amber-50 border-orange-100', iconBg: 'bg-brandOrange shadow-orange-200', text: 'text-brandOrange' },
    green: { card: 'from-green-50 to-emerald-50 border-green-100', iconBg: 'bg-emerald-600 shadow-green-200', text: 'text-emerald-600' },
    purple: { card: 'from-purple-50 to-fuchsia-50 border-purple-100', iconBg: 'bg-purple-600 shadow-purple-200', text: 'text-purple-600' },
    cyan: { card: 'from-cyan-50 to-teal-50 border-cyan-100', iconBg: 'bg-cyan-600 shadow-cyan-200', text: 'text-cyan-600' },
    rose: { card: 'from-rose-50 to-pink-50 border-rose-100', iconBg: 'bg-rose-600 shadow-rose-200', text: 'text-rose-600' },
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('http://66.116.252.191:19998/api/website/data');
        const json = await res.json();

        if (!json.success || !json.data) return;

        const { settings, stats, programs, news, testimonials } = json.data;

        // 1. Update Settings (Hero, Admissions Banner, Mission/Vision, Contact, Socials)
        if (settings) {
            const heroSub = document.getElementById('hero-subtitle') || document.querySelector('.hero-gradient span.uppercase');
            if (heroSub && settings.heroSubtitle) heroSub.textContent = settings.heroSubtitle;

            const heroTitle = document.getElementById('hero-title') || document.querySelector('.hero-gradient h1');
            if (heroTitle && settings.heroTitle) heroTitle.textContent = settings.heroTitle;

            const heroDesc = document.getElementById('hero-description') || document.querySelector('.hero-gradient p.text-lg');
            if (heroDesc && settings.heroDescription) heroDesc.textContent = settings.heroDescription;

            const heroImg = document.getElementById('hero-image');
            if (heroImg && settings.heroImageUrl) heroImg.src = settings.heroImageUrl;

            const admTitle = document.getElementById('admissions-heading');
            if (admTitle && (settings.admissionsBannerTitle || settings.admissionsYear)) {
                admTitle.textContent = `${settings.admissionsBannerTitle || 'ADMISSIONS OPEN FOR'} ${settings.admissionsYear || '2027 – 2028'}`.trim();
            }

            const missionEl = document.getElementById('mission-text');
            if (missionEl && settings.missionText) missionEl.textContent = settings.missionText;

            const visionEl = document.getElementById('vision-text');
            if (visionEl && settings.visionText) visionEl.textContent = settings.visionText;

            if (settings.contactPhone) {
                document.querySelectorAll('a[href^="tel:"], .fa-phone + span').forEach(el => {
                    if (el.tagName === 'A') {
                        el.href = `tel:${settings.contactPhone}`;
                        el.innerHTML = `<i class="fa-solid fa-phone"></i> ${esc(settings.contactPhone)}`;
                    } else {
                        el.textContent = settings.contactPhone;
                    }
                });
            }

            if (settings.contactEmail) {
                document.querySelectorAll('a[href^="mailto:"], .fa-envelope + span').forEach(el => {
                    if (el.tagName === 'A') {
                        el.href = `mailto:${settings.contactEmail}`;
                        el.innerHTML = `<i class="fa-solid fa-envelope"></i> ${esc(settings.contactEmail)}`;
                    } else {
                        el.textContent = settings.contactEmail;
                    }
                });
            }

            const addrEl = document.getElementById('footer-address');
            if (addrEl && settings.contactAddress) addrEl.textContent = settings.contactAddress;

            const socialMap = [
                ['#social-facebook-top, #social-facebook-footer', settings.facebookUrl],
                ['#social-instagram-top, #social-instagram-footer', settings.instagramUrl],
                ['#social-youtube-top, #social-youtube-footer', settings.youtubeUrl],
            ];
            socialMap.forEach(([sel, url]) => {
                if (!url) return;
                document.querySelectorAll(sel).forEach(el => {
                    el.href = url;
                });
            });
        }

        // 2. Render Dynamic Stats Counters
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid && Array.isArray(stats) && stats.length > 0) {
            statsGrid.innerHTML = stats.map((st, idx) => {
                const cardCls = STAT_COLOR_CLASSES[st.color] || `stat-card-${(idx % 5) + 1}`;
                const iconCls = esc(st.icon || 'fa-graduation-cap');
                return `
                    <div class="${cardCls} rounded-2xl p-6 text-center text-white hover-lift cursor-pointer">
                        <i class="fa-solid ${iconCls} text-3xl mb-3 opacity-90"></i>
                        <h3 class="text-3xl font-black mb-1">${esc(st.value)}</h3>
                        <p class="text-xs font-semibold opacity-80 uppercase tracking-wider">${esc(st.label)}</p>
                    </div>
                `;
            }).join('');
        }

        // 3. Render Dynamic Programs
        const programsGrid = document.getElementById('programs-grid');
        if (programsGrid && Array.isArray(programs) && programs.length > 0) {
            programsGrid.innerHTML = programs.map(p => {
                const theme = PROGRAM_STYLE_MAP[p.color] || PROGRAM_STYLE_MAP.blue;
                const iconCls = esc(p.icon || 'fa-book-open');
                return `
                    <div class="program-card bg-gradient-to-br ${theme.card} border rounded-3xl p-7 text-center hover-lift group cursor-pointer">
                        <div class="program-icon w-16 h-16 mx-auto ${theme.iconBg} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg">
                            <i class="fa-solid ${iconCls} text-2xl"></i>
                        </div>
                        <h3 class="text-base font-black text-gray-900 mb-2">${esc(p.title)}</h3>
                        <p class="text-xs text-gray-500 mb-4 leading-relaxed">${esc(p.description)}</p>
                        <span class="${theme.text} text-xs font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                            Learn More <i class="fa-solid fa-arrow-right text-xs"></i>
                        </span>
                    </div>
                `;
            }).join('');
        }

        // 4. Render Dynamic Testimonials
        const testimonialsGrid = document.getElementById('testimonials-grid');
        if (testimonialsGrid && Array.isArray(testimonials) && testimonials.length > 0) {
            testimonialsGrid.innerHTML = testimonials.map((t, idx) => {
                const isFeatured = idx % 3 === 1;
                const stars = Array.from({ length: Math.max(1, Math.min(5, Number(t.rating) || 5)) })
                    .map(() => '<i class="fa-solid fa-star text-sm"></i>')
                    .join('');
                const initial = esc((t.name || 'S').trim().charAt(0).toUpperCase());

                if (isFeatured) {
                    return `
                        <div class="bg-brandBlue p-8 rounded-3xl hover-lift relative shadow-xl shadow-blue-200">
                            <div class="flex gap-1 text-yellow-400 mb-4">${stars}</div>
                            <p class="text-blue-100 mb-6 leading-relaxed">"${esc(t.text)}"</p>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-lg">${initial}</div>
                                <div>
                                    <h4 class="font-black text-white text-sm">${esc(t.name)}</h4>
                                    <p class="text-xs text-blue-300">${esc(t.role)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 rounded-3xl hover-lift relative">
                        <div class="flex gap-1 text-yellow-400 mb-4">${stars}</div>
                        <p class="text-gray-700 mb-6 leading-relaxed">"${esc(t.text)}"</p>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-brandBlue flex items-center justify-center text-white font-bold text-lg">${initial}</div>
                            <div>
                                <h4 class="font-black text-gray-900 text-sm">${esc(t.name)}</h4>
                                <p class="text-xs text-gray-500">${esc(t.role)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 5. Render Dynamic News & Events
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid && Array.isArray(news) && news.length > 0) {
            const fallbackImgs = [
                'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop',
            ];
            newsGrid.innerHTML = news.map((n, idx) => {
                const formattedDate = n.date
                    ? new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                return `
                    <div class="bg-white rounded-3xl overflow-hidden shadow-sm hover-lift border border-gray-100 group">
                        <div class="relative overflow-hidden h-52">
                            <img src="${fallbackImgs[idx % fallbackImgs.length]}" alt="${esc(n.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            <div class="absolute top-4 left-4 bg-brandOrange text-white text-xs font-bold px-3 py-1.5 rounded-full">${esc(formattedDate)}</div>
                        </div>
                        <div class="p-6">
                            <span class="text-xs font-bold text-brandBlue uppercase tracking-wider bg-brandBlue/10 px-3 py-1 rounded-full">${esc(n.tag || 'News')}</span>
                            <h3 class="text-lg font-black text-gray-900 mt-3 mb-2 group-hover:text-brandBlue transition-colors">${esc(n.title)}</h3>
                            <p class="text-gray-500 text-sm mb-4 leading-relaxed">${esc(n.description)}</p>
                            <a href="#admissions" class="text-brandBlue text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Learn More <i class="fa-solid fa-arrow-right text-xs"></i>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load CMS data:', error);
    }
});
