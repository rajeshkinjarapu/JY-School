// Use relative path on HTTPS (Vercel rewrites /api/* and /uploads/* to VPS) to avoid Mixed Content blocks
const API_BASE = window.location.protocol === 'https:' ? '' : 'http://66.116.252.191:19998';

const resolveMediaUrl = (url) => {
    if (!url) return '';
    const s = String(url).trim();
    if (s.startsWith('/')) return `${API_BASE}${s}`;
    if (window.location.protocol === 'https:' && s.startsWith('http://66.116.252.191:19998/')) {
        return s.replace('http://66.116.252.191:19998', '');
    }
    return s;
};

const esc = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const toYoutubeEmbed = (url) => {
    if (!url) return '';
    const ytMatch = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return '';
};

const getYoutubeThumb = (url) => {
    const ytMatch = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : '';
};

let CMS_CACHE = { customPages: [], settings: null };

window.switchPortalTab = (tabName) => {
    document.querySelectorAll('.portal-panel').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`portal-panel-${tabName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.portal-tab-btn').forEach(btn => {
        btn.classList.remove('bg-brandBlue', 'text-white');
        btn.classList.add('text-slate-600');
    });
    const activeBtn = document.getElementById(`ptab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-brandBlue', 'text-white');
        activeBtn.classList.remove('text-slate-600');
    }
};

window.openCustomPage = (slug) => {
    const page = (CMS_CACHE.customPages || []).find(p => p.slug === slug);
    if (!page) return;
    document.getElementById('cp-category').textContent = page.category || 'Academics';
    document.getElementById('cp-title').textContent = page.title;
    document.getElementById('cp-subtitle').textContent = page.subtitle || '';
    document.getElementById('cp-content').textContent = page.content || '';
    const pdfBtn = document.getElementById('cp-pdf-btn');
    if (page.pdfUrl) {
        pdfBtn.href = resolveMediaUrl(page.pdfUrl);
        pdfBtn.classList.remove('hidden');
    } else {
        pdfBtn.classList.add('hidden');
    }
    document.getElementById('custom-page-modal').classList.remove('hidden');
};

window.closeCustomPage = () => {
    document.getElementById('custom-page-modal').classList.add('hidden');
};

window.openVideoModal = (title, url) => {
    const container = document.getElementById('video-player-container');
    document.getElementById('video-modal-title').textContent = title || 'Campus Video';
    const embed = toYoutubeEmbed(url);
    if (embed) {
        container.innerHTML = `<iframe class="w-full h-full" src="${esc(embed)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
        container.innerHTML = `<video controls autoplay class="w-full h-full bg-black"><source src="${esc(url)}"></video>`;
    }
    document.getElementById('video-modal').classList.remove('hidden');
};

window.closeVideoModal = () => {
    document.getElementById('video-player-container').innerHTML = '';
    document.getElementById('video-modal').classList.add('hidden');
};

window.openHeroVideo = () => {
    const url = CMS_CACHE.settings?.heroVideoUrl;
    if (url) window.openVideoModal('Campus Virtual Tour', url);
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
    blue: { card: 'from-blue-50 to-indigo-50 border-blue-100', iconBg: 'bg-brandBlue', text: 'text-brandBlue' },
    orange: { card: 'from-orange-50 to-amber-50 border-orange-100', iconBg: 'bg-brandOrange', text: 'text-brandOrange' },
    green: { card: 'from-green-50 to-emerald-50 border-green-100', iconBg: 'bg-emerald-600', text: 'text-emerald-600' },
    purple: { card: 'from-purple-50 to-fuchsia-50 border-purple-100', iconBg: 'bg-purple-600', text: 'text-purple-600' },
    cyan: { card: 'from-cyan-50 to-teal-50 border-cyan-100', iconBg: 'bg-cyan-600', text: 'text-cyan-600' },
    rose: { card: 'from-rose-50 to-pink-50 border-rose-100', iconBg: 'bg-rose-600', text: 'text-rose-600' },
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`${API_BASE}/api/website/data`);
        const json = await res.json();
        if (!json.success || !json.data) return;

        const {
            settings,
            stats,
            programs,
            testimonials,
            news,
            navLinks,
            customPages,
            media,
            downloads,
            toppers,
            publicExams,
            admitCardExams,
            faculty,
        } = json.data;

        CMS_CACHE = { customPages: customPages || [], settings };

        // 1. Settings & Principal
        if (settings) {
            if (settings.heroSubtitle) document.getElementById('hero-subtitle').textContent = settings.heroSubtitle;
            if (settings.heroTitle) document.getElementById('hero-title').textContent = settings.heroTitle;
            if (settings.heroDescription) document.getElementById('hero-description').textContent = settings.heroDescription;
            if (settings.heroImageUrl) document.getElementById('hero-image').src = resolveMediaUrl(settings.heroImageUrl);
            if (settings.heroVideoUrl) document.getElementById('hero-video-btn')?.classList.remove('hidden');

            document.getElementById('admissions-heading').textContent = `${settings.admissionsBannerTitle || 'ADMISSIONS OPEN FOR'} ${settings.admissionsYear || '2027 – 2028'}`;
            if (settings.missionText) document.getElementById('mission-text').textContent = settings.missionText;
            if (settings.visionText) document.getElementById('vision-text').textContent = settings.visionText;

            if (settings.principalMessage) {
                document.getElementById('principal-section')?.classList.remove('hidden');
                document.getElementById('principal-name').textContent = settings.principalName || 'Principal';
                document.getElementById('principal-message').textContent = `"${settings.principalMessage}"`;
                if (settings.principalPhotoUrl) document.getElementById('principal-photo').src = resolveMediaUrl(settings.principalPhotoUrl);
            }

            if (settings.contactPhone) {
                const tp = document.getElementById('top-phone');
                const cp = document.getElementById('contact-phone-val');
                if (tp) { tp.href = `tel:${settings.contactPhone}`; tp.innerHTML = `<i class="fa-solid fa-phone"></i> ${esc(settings.contactPhone)}`; }
                if (cp) { cp.href = `tel:${settings.contactPhone}`; cp.textContent = settings.contactPhone; }
            }
            if (settings.contactEmail) {
                const te = document.getElementById('top-email');
                const ce = document.getElementById('contact-email-val');
                if (te) { te.href = `mailto:${settings.contactEmail}`; te.innerHTML = `<i class="fa-solid fa-envelope"></i> ${esc(settings.contactEmail)}`; }
                if (ce) { ce.href = `mailto:${settings.contactEmail}`; ce.textContent = settings.contactEmail; }
            }
            if (settings.contactAddress) {
                document.getElementById('contact-address-val').textContent = settings.contactAddress;
                document.getElementById('footer-address').textContent = settings.contactAddress;
            }
            if (settings.googleMapEmbedUrl) {
                document.getElementById('map-container').innerHTML = `<iframe src="${esc(settings.googleMapEmbedUrl)}" class="w-full h-full border-0" loading="lazy" allowfullscreen></iframe>`;
            }
            if (settings.whatsappNumber) {
                const wa = document.getElementById('whatsapp-float');
                const digits = String(settings.whatsappNumber).replace(/\D/g, '');
                if (wa && digits) { wa.href = `https://wa.me/${digits}`; wa.classList.remove('hidden'); }
            }

            [['#social-facebook-top, #social-facebook-footer', settings.facebookUrl], ['#social-instagram-top, #social-instagram-footer', settings.instagramUrl], ['#social-youtube-top, #social-youtube-footer', settings.youtubeUrl]].forEach(([sel, url]) => {
                if (url) document.querySelectorAll(sel).forEach(el => { el.href = url; });
            });
        }

        // 2. Dynamic Navigation, Academics Dropdown & Footer Links
        const academicsDropdown = document.getElementById('academics-dropdown');
        if (academicsDropdown) {
            const pageItems = (customPages || []).filter(p => p.isPublished !== false).map(p =>
                `<button onclick="openCustomPage('${esc(p.slug)}')" class="w-full text-left px-4 py-2 text-xs font-bold hover:bg-indigo-50 hover:text-brandBlue block">${esc(p.title)}</button>`
            );
            const customAcadLinks = (navLinks || []).filter(l => l.group === 'ACADEMICS' && l.isActive !== false).map(l =>
                `<a href="${esc(l.url)}" ${l.openInNewTab ? 'target="_blank" rel="noopener"' : ''} class="px-4 py-2 text-xs font-bold hover:bg-indigo-50 hover:text-brandBlue block">${esc(l.label)}</a>`
            );
            academicsDropdown.innerHTML = [...pageItems, ...customAcadLinks].join('') || '<span class="px-4 py-2 text-xs text-slate-400 block">No pages yet</span>';
        }

        const headerContainer = document.getElementById('dynamic-header-links');
        if (headerContainer && Array.isArray(navLinks)) {
            headerContainer.innerHTML = navLinks
                .filter(l => l.group === 'HEADER' && l.isActive !== false)
                .map(l => `<a href="${esc(l.url)}" ${l.openInNewTab ? 'target="_blank" rel="noopener"' : ''} class="hover:text-white inline-flex items-center gap-1">${esc(l.label)}${l.badgeText ? `<span class="px-1.5 py-0.5 text-[9px] bg-brandOrange text-white rounded-full">${esc(l.badgeText)}</span>` : ''}</a>`)
                .join('');
        }

        const footerLinks = document.getElementById('footer-links-list');
        if (footerLinks && Array.isArray(navLinks)) {
            const extraFooter = navLinks.filter(l => l.group === 'FOOTER' && l.isActive !== false)
                .map(l => `<li><a href="${esc(l.url)}" ${l.openInNewTab ? 'target="_blank" rel="noopener"' : ''} class="hover:text-brandOrange">${esc(l.label)}</a></li>`)
                .join('');
            footerLinks.innerHTML += extraFooter;
        }

        // 3. Notice Ticker & Downloads Hub
        const tickerItems = (downloads || []).filter(d => d.isTicker && d.isActive !== false);
        const tickerTrack = document.getElementById('notice-ticker-track');
        if (tickerTrack && tickerItems.length > 0) {
            const html = tickerItems.map(d => `<a href="${esc(d.fileUrl)}" target="_blank" rel="noopener" class="hover:text-brandBlue underline decoration-indigo-300">[${esc(d.category)}] ${esc(d.title)}</a>`).join(' &bull; ');
            tickerTrack.innerHTML = `${html} &nbsp;&nbsp;&bull;&nbsp;&nbsp; ${html}`;
        }

        const downloadsGrid = document.getElementById('downloads-grid');
        if (downloadsGrid && Array.isArray(downloads) && downloads.length > 0) {
            downloadsGrid.innerHTML = downloads.map(d => `
                    <a href="${esc(resolveMediaUrl(d.fileUrl))}" target="_blank" rel="noopener" class="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 hover-lift flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">${esc(d.category)}</span>
                            <h4 class="font-bold text-slate-900 text-sm mt-1 truncate">${esc(d.title)}</h4>
                            <p class="text-[11px] text-slate-500 mt-0.5">${new Date(d.publishDate).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span class="w-10 h-10 rounded-xl bg-brandBlue text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-download"></i></span>
                    </a>`).join('');
        }

        // 4. Exam Dropdowns for Self-Service Portals
        const resSelect = document.getElementById('res-exam-id');
        if (resSelect && Array.isArray(publicExams)) {
            resSelect.innerHTML = '<option value="">All Published Exams</option>' +
                publicExams.map(ex => `<option value="${esc(ex.id)}">${esc(ex.name)} (${esc(ex.term)})</option>`).join('');
        }
        const htSelect = document.getElementById('ht-exam-id');
        if (htSelect && Array.isArray(admitCardExams)) {
            htSelect.innerHTML = (admitCardExams.length > 0 ? '<option value="">-- Select Exam --</option>' : '<option value="">No Active Admit Cards Yet</option>') +
                admitCardExams.map(ex => `<option value="${esc(ex.id)}">${esc(ex.name)} (${esc(ex.term)})</option>`).join('');
        }

        // 5. Stats, Programs, Toppers, Faculty, Videos/Photos, News, Testimonials
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid && Array.isArray(stats) && stats.length > 0) {
            statsGrid.innerHTML = stats.map((st, idx) => `
                <div class="${STAT_COLOR_CLASSES[st.color] || `stat-card-${(idx % 5) + 1}`} rounded-2xl p-6 text-center text-white hover-lift">
                    <i class="fa-solid ${esc(st.icon || 'fa-star')} text-2xl mb-2 opacity-90"></i>
                    <h3 class="text-2xl font-black">${esc(st.value)}</h3>
                    <p class="text-[11px] font-bold opacity-85 uppercase mt-1">${esc(st.label)}</p>
                </div>`).join('');
        }

        const programsGrid = document.getElementById('programs-grid');
        if (programsGrid && Array.isArray(programs) && programs.length > 0) {
            programsGrid.innerHTML = programs.map(p => {
                const th = PROGRAM_STYLE_MAP[p.color] || PROGRAM_STYLE_MAP.blue;
                return `
                    <div class="bg-gradient-to-br ${th.card} border rounded-3xl p-6 text-center hover-lift">
                        <div class="w-14 h-14 mx-auto ${th.iconBg} rounded-2xl flex items-center justify-center text-white mb-4 shadow-md"><i class="fa-solid ${esc(p.icon || 'fa-book')} text-xl"></i></div>
                        <h3 class="text-base font-black text-slate-900 mb-2">${esc(p.title)}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">${esc(p.description)}</p>
                    </div>`;
            }).join('');
        }

        if ((toppers && toppers.length > 0) || (faculty && faculty.length > 0)) {
            document.getElementById('toppers-section')?.classList.remove('hidden');
            if (toppers && toppers.length > 0) {
                document.getElementById('toppers-block')?.classList.remove('hidden');
                document.getElementById('toppers-grid').innerHTML = toppers.map(tp => `
                    <div class="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center hover-lift">
                        ${tp.photoUrl ? `<img src="${esc(tp.photoUrl)}" class="w-16 h-16 rounded-full mx-auto object-cover border-2 border-white shadow mb-3">` : `<div class="w-16 h-16 rounded-full mx-auto bg-amber-500 text-white font-black text-xl flex items-center justify-center mb-3">${esc(tp.studentName.charAt(0))}</div>`}
                        <h4 class="font-black text-slate-900 text-sm">${esc(tp.studentName)}</h4>
                        <p class="text-xs font-black text-brandOrange mt-0.5">${esc(tp.scoreOrRank)}</p>
                        <p class="text-[11px] font-semibold text-slate-500 mt-1">${esc(tp.className)} • ${esc(tp.examTitle)}</p>
                    </div>`).join('');
            }
            if (faculty && faculty.length > 0) {
                document.getElementById('faculty-block')?.classList.remove('hidden');
                document.getElementById('faculty-grid').innerHTML = faculty.map(f => `
                    <div class="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 text-center hover-lift">
                        ${f.photoUrl ? `<img src="${esc(f.photoUrl.startsWith('/') ? API_BASE + f.photoUrl : f.photoUrl)}" class="w-14 h-14 rounded-full mx-auto object-cover border border-indigo-200 mb-2">` : `<div class="w-14 h-14 rounded-full mx-auto bg-brandBlue text-white font-black flex items-center justify-center mb-2">${esc(f.name.charAt(0))}</div>`}
                        <h4 class="font-black text-slate-900 text-xs truncate">${esc(f.name)}</h4>
                        <p class="text-[10px] font-bold text-indigo-700 truncate">${esc(f.qualification || f.specialization || 'Faculty')}</p>
                    </div>`).join('');
            }
        }

        const mediaGrid = document.getElementById('media-grid');
        if (mediaGrid && Array.isArray(media) && media.length > 0) {
            mediaGrid.innerHTML = media.map(m => {
                    if (m.mediaType === 'VIDEO') {
                        const thumb = resolveMediaUrl(m.thumbnailUrl) || getYoutubeThumb(m.url);
                        return `
                            <div onclick="openVideoModal('${esc(m.title)}', '${esc(resolveMediaUrl(m.url))}')" class="bg-white rounded-3xl overflow-hidden border border-indigo-100 shadow-xs hover-lift cursor-pointer group">
                                <div class="relative h-48 bg-indigo-900 flex items-center justify-center">
                                    ${thumb ? `<img src="${esc(thumb)}" class="w-full h-full object-cover opacity-85">` : ''}
                                    <div class="absolute w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><i class="fa-solid fa-play text-lg ml-0.5"></i></div>
                                </div>
                                <div class="p-4">
                                    <span class="text-[10px] font-black uppercase text-rose-600">${esc(m.category)}</span>
                                    <h4 class="font-black text-slate-900 text-sm mt-0.5">${esc(m.title)}</h4>
                                </div>
                            </div>`;
                    }
                    return `
                        <div class="bg-white rounded-3xl overflow-hidden border border-indigo-100 shadow-xs hover-lift">
                            <img src="${esc(resolveMediaUrl(m.url))}" class="w-full h-48 object-cover">
                            <div class="p-4">
                                <span class="text-[10px] font-black uppercase text-sky-700">${esc(m.category)}</span>
                                <h4 class="font-black text-slate-900 text-sm mt-0.5">${esc(m.title)}</h4>
                            </div>
                        </div>`;
                }).join('');
        }

        const newsGrid = document.getElementById('news-grid');
        if (newsGrid && Array.isArray(news) && news.length > 0) {
            newsGrid.innerHTML = news.map(n => `
                <div class="bg-white rounded-3xl p-6 border border-indigo-100 shadow-xs hover-lift">
                    <span class="px-2.5 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black">${esc(n.tag)}</span>
                    <h3 class="text-base font-black text-slate-900 mt-3 mb-2">${esc(n.title)}</h3>
                    <p class="text-xs text-slate-600 leading-relaxed mb-3">${esc(n.description)}</p>
                    <span class="text-[11px] font-bold text-slate-400">${new Date(n.date).toLocaleDateString('en-IN')}</span>
                </div>`).join('');
        }

        const testimonialsGrid = document.getElementById('testimonials-grid');
        if (testimonialsGrid && Array.isArray(testimonials) && testimonials.length > 0) {
            testimonialsGrid.innerHTML = testimonials.map(t => `
                <div class="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs hover-lift">
                    <div class="text-amber-400 text-xs mb-3">${'<i class="fa-solid fa-star"></i>'.repeat(Math.min(5, t.rating || 5))}</div>
                    <p class="text-xs text-slate-600 italic leading-relaxed mb-4">"${esc(t.text)}"</p>
                    <h4 class="font-black text-slate-900 text-sm">${esc(t.name)}</h4>
                    <p class="text-[11px] text-slate-500">${esc(t.role)}</p>
                </div>`).join('');
        }
    } catch (err) {
        console.error('Website CMS Sync Error:', err);
    }

    // SELF-SERVICE FORM HANDLERS
    document.getElementById('results-lookup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const out = document.getElementById('results-output');
        out.innerHTML = '<p class="text-xs font-bold text-indigo-600">Fetching verified marks memo...</p>';
        try {
            const res = await fetch(`${API_BASE}/api/website/public/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: document.getElementById('res-exam-id').value,
                    rollNo: document.getElementById('res-roll').value,
                    dob: document.getElementById('res-dob').value,
                }),
            });
            const json = await res.json();
            if (!json.success) {
                out.innerHTML = `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">${esc(json.message)}</div>`;
                return;
            }
            const { student, school, examResults } = json.data;
            out.innerHTML = `
                <div id="printable-portal-area" class="border-2 border-brandBlue rounded-2xl p-6 bg-white space-y-5">
                    <div class="flex flex-wrap justify-between items-center border-b border-slate-200 pb-4 gap-3">
                        <div>
                            <h3 class="text-lg font-black text-brandBlue">${esc(school.schoolName)}</h3>
                            <p class="text-xs text-slate-500">${esc(school.address)}</p>
                        </div>
                        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-brandBlue text-white text-xs font-black"><i class="fa-solid fa-print mr-1"></i> Print Score Card</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F8FAFF] p-3 rounded-xl text-xs">
                        <div><span class="text-slate-400 block">Student</span><strong>${esc(student.name)}</strong></div>
                        <div><span class="text-slate-400 block">Roll No</span><strong>${esc(student.rollNo)}</strong></div>
                        <div><span class="text-slate-400 block">Class</span><strong>${esc(student.className)}</strong></div>
                        <div><span class="text-slate-400 block">Father Name</span><strong>${esc(student.fatherName || '-')}</strong></div>
                    </div>
                    ${examResults.map(er => `
                        <div class="space-y-2">
                            <div class="flex justify-between items-center bg-indigo-50 px-3 py-2 rounded-lg text-xs font-black text-brandBlue">
                                <span>${esc(er.examName)} (${esc(er.term)})</span>
                                <span>Total: ${er.totalObtained}/${er.totalMax} (${er.overallPercentage}% &bull; Grade ${esc(er.overallGrade)} &bull; ${esc(er.status)})</span>
                            </div>
                            <table class="w-full text-xs border-collapse border border-slate-200">
                                <thead><tr class="bg-slate-50"><th class="border p-2 text-left">Subject</th><th class="border p-2">Obtained</th><th class="border p-2">Max</th><th class="border p-2">Grade</th></tr></thead>
                                <tbody>
                                    ${er.subjects.map(s => `<tr><td class="border p-2 font-bold">${esc(s.subjectName)}</td><td class="border p-2 text-center font-black">${s.marksObtained}</td><td class="border p-2 text-center">${s.maxMarks}</td><td class="border p-2 text-center font-bold">${esc(s.grade)}</td></tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                </div>`;
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Unable to connect to results server.</div>';
        }
    });

    document.getElementById('hallticket-lookup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const out = document.getElementById('hallticket-output');
        out.innerHTML = '<p class="text-xs font-bold text-emerald-700">Generating official admit card...</p>';
        try {
            const res = await fetch(`${API_BASE}/api/website/public/hall-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: document.getElementById('ht-exam-id').value,
                    rollNo: document.getElementById('ht-roll').value,
                    dob: document.getElementById('ht-dob').value,
                }),
            });
            const json = await res.json();
            if (!json.success) {
                out.innerHTML = `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">${esc(json.message)}</div>`;
                return;
            }
            const { student, exam, schedule, school } = json.data;
            out.innerHTML = `
                <div id="printable-portal-area" class="border-2 border-emerald-700 rounded-2xl p-6 bg-white space-y-4">
                    <div class="flex justify-between items-center border-b border-slate-200 pb-4">
                        <div>
                            <h3 class="text-lg font-black text-brandBlue">${esc(school.schoolName)}</h3>
                            <p class="text-xs font-black text-emerald-700 uppercase">OFFICIAL ADMIT CARD / HALL TICKET — ${esc(exam.name)}</p>
                        </div>
                        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black"><i class="fa-solid fa-print mr-1"></i> Print Hall Ticket</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-emerald-50/60 p-3 rounded-xl text-xs">
                        <div><span class="text-slate-500 block">Candidate</span><strong>${esc(student.name)}</strong></div>
                        <div><span class="text-slate-500 block">Hall Ticket / Roll</span><strong>${esc(student.rollNo)}</strong></div>
                        <div><span class="text-slate-500 block">Class</span><strong>${esc(student.className)}</strong></div>
                        <div><span class="text-slate-500 block">Father Name</span><strong>${esc(student.fatherName || '-')}</strong></div>
                    </div>
                    <table class="w-full text-xs border-collapse border border-slate-200">
                        <thead><tr class="bg-slate-50"><th class="border p-2 text-left">Subject</th><th class="border p-2">Date</th><th class="border p-2">Time</th><th class="border p-2">Hall</th></tr></thead>
                        <tbody>
                            ${schedule.length > 0 ? schedule.map(sc => `<tr><td class="border p-2 font-bold">${esc(sc.subject)}</td><td class="border p-2 text-center">${new Date(sc.date).toLocaleDateString('en-IN')}</td><td class="border p-2 text-center">${esc(sc.time)}</td><td class="border p-2 text-center">${esc(sc.room)}</td></tr>`).join('') : '<tr><td colspan="4" class="p-3 text-center text-slate-500">Schedule announced at examination desk.</td></tr>'}
                        </tbody>
                    </table>
                    <p class="text-[11px] text-slate-600"><strong>Instructions:</strong> ${esc(school.instructions)}</p>
                </div>`;
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Unable to generate hall ticket.</div>';
        }
    });

    document.getElementById('admission-lookup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const out = document.getElementById('admission-output');
        const phone = document.getElementById('adm-phone').value;
        out.innerHTML = '<p class="text-xs font-bold text-indigo-600">Checking application status...</p>';
        try {
            const res = await fetch(`${API_BASE}/api/website/public/admission-status?phone=${encodeURIComponent(phone)}`);
            const json = await res.json();
            if (!json.success || !json.data || json.data.length === 0) {
                out.innerHTML = '<div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">No admission inquiry found for this mobile number.</div>';
                return;
            }
            out.innerHTML = json.data.map(inq => `
                <div class="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 flex items-center justify-between text-xs mb-2">
                    <div>
                        <strong class="text-sm text-slate-900">${esc(inq.studentName)}</strong>
                        <p class="text-slate-500">Class: ${esc(inq.classApplied || '-')} &bull; Applied: ${new Date(inq.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-black uppercase">${esc(inq.status)}</span>
                </div>`).join('');
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Failed checking admission status.</div>';
        }
    });
});
