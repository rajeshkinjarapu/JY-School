// ═════════════════════════════════════════════════════════════════════════════
// JY SCHOOL WEBSITE — MULTI-PAGE ROUTER & BENCHMARKED SCHOOL MODULES
// Strict Light Theme • 3 Hero Pages • Full Width • Interactive Filters
// ═════════════════════════════════════════════════════════════════════════════

// 1. Mobile Drawer & Hero Slide Controls
window.toggleMobSub = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    document.querySelectorAll('.mob-sub').forEach((s) => s.classList.remove('open'));
    if (!isOpen) el.classList.add('open');
};

window.closeMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('hamburger-icon');
    if (menu) menu.classList.remove('open');
    if (icon) icon.className = 'fa-solid fa-bars';
};

window.toggleMobileDrawer = () => {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('hamburger-icon');
    if (!menu) return;
    const isOpen = menu.classList.toggle('open');
    if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

let HERO_AUTO_TIMER = null;
window.switchHeroSlide = (slideNum, isAuto = false) => {
    if (!isAuto && HERO_AUTO_TIMER) {
        clearInterval(HERO_AUTO_TIMER);
        HERO_AUTO_TIMER = null;
    }
    [1, 2, 3].forEach((n) => {
        const slide = document.getElementById(`hero-slide-${n}`);
        const btn = document.getElementById(`slide-btn-${n}`);
        if (slide) slide.classList.toggle('hidden-slide', n !== slideNum);
        if (btn) {
            btn.classList.toggle('bg-brandBlue', n === slideNum);
            btn.classList.toggle('text-white', n === slideNum);
            btn.classList.toggle('font-black', n === slideNum);
            btn.classList.toggle('text-slate-600', n !== slideNum);
            btn.classList.toggle('font-bold', n !== slideNum);
        }
    });
};

// Interactive FAQ & Holiday & Transport Filters
window.toggleFaq = (btn) => {
    const body = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-chevron');
    if (!body) return;
    const hidden = body.classList.toggle('hidden');
    if (icon) icon.style.transform = hidden ? 'rotate(0deg)' : 'rotate(180deg)';
};

let ACTIVE_FAQ_CAT = 'ALL';
window.filterFaqs = (cat) => {
    if (cat) {
        ACTIVE_FAQ_CAT = cat;
        document.querySelectorAll('#faq-cat-pills button').forEach((b) => {
            const match = b.dataset.cat === cat;
            b.classList.toggle('bg-brandBlue', match);
            b.classList.toggle('text-white', match);
            b.classList.toggle('bg-slate-100', !match);
            b.classList.toggle('text-slate-600', !match);
        });
    }
    const q = (document.getElementById('faq-search')?.value || '').trim().toLowerCase();
    document.querySelectorAll('.faq-item').forEach((el) => {
        const cMatch = ACTIVE_FAQ_CAT === 'ALL' || el.dataset.cat === ACTIVE_FAQ_CAT;
        const qMatch = !q || el.textContent.toLowerCase().includes(q);
        el.classList.toggle('hidden', !(cMatch && qMatch));
    });
};

let ACTIVE_HOL_CAT = 'ALL';
window.filterHolidays = (cat) => {
    if (cat) {
        ACTIVE_HOL_CAT = cat;
        document.querySelectorAll('#hol-cat-pills button').forEach((b) => {
            const match = b.dataset.cat === cat;
            b.classList.toggle('bg-brandBlue', match);
            b.classList.toggle('text-white', match);
            b.classList.toggle('bg-slate-100', !match);
            b.classList.toggle('text-slate-600', !match);
        });
    }
    const q = (document.getElementById('hol-search')?.value || '').trim().toLowerCase();
    document.querySelectorAll('#holiday-tbody tr').forEach((tr) => {
        const cMatch = ACTIVE_HOL_CAT === 'ALL' || tr.dataset.cat === ACTIVE_HOL_CAT;
        const qMatch = !q || tr.textContent.toLowerCase().includes(q);
        tr.classList.toggle('hidden', !(cMatch && qMatch));
    });
};

window.filterBusRoutes = () => {
    const q = (document.getElementById('bus-route-search')?.value || '').trim().toLowerCase();
    document.querySelectorAll('.bus-route-chip').forEach((el) => {
        el.classList.toggle('hidden', q && !el.textContent.toLowerCase().includes(q));
    });
};

// 2. Consistent Institutional Page Banner
const pageBanner = ({ category, title, subtitle, badgeColor = 'bg-indigo-100 text-brandBlue', ctaHtml = '' }) => `
    <section class="bg-gradient-to-r from-[#EEF2FF] via-white to-[#FFF7ED] border-b border-indigo-100 py-7 sm:py-9">
        <div class="screen-fit flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                    <a href="#/home" onclick="navigateTo('/home'); return false;" class="hover:text-brandBlue"><i class="fa-solid fa-house mr-1"></i>Home</a>
                    <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                    <span class="text-slate-600">${category}</span>
                    <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                    <span class="text-brandBlue font-black">${title}</span>
                </div>
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeColor}">${category}</span>
                <h1 class="section-title">${title}</h1>
                <p class="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">${subtitle}</p>
            </div>
            ${ctaHtml ? `<div class="flex flex-wrap gap-2.5 shrink-0">${ctaHtml}</div>` : ''}
        </div>
    </section>
`;

const FAQ_ITEMS = [
    ['ADMISSIONS', 'What classes and academic streams are offered at Sri Venkateswara JY School?', 'We offer English Medium Co-Education from Nursery, LKG, UKG, and Classes I to X, paired with integrated IIT-JEE, NEET, Navodaya (JNVST), and Olympiad foundation batches.'],
    ['ADMISSIONS', 'How can parents apply for admission online?', 'Go to Admission > Admission Registration, fill in student and parent details (with optional passport photo), and submit. You receive an instant Application ID and can track status anytime via mobile number.'],
    ['FEES', 'How do parents pay school fees online from this website?', 'Click "Pay Fees Online" in the header or bottom navigation bar, verify your child using Roll No & Date of Birth, select the fee installment, pay via School UPI QR or Bank Transfer, and submit UTR + payment screenshot.'],
    ['FEES', 'Are merit scholarships and sibling concessions available?', 'Yes! Merit rankers via JY Talent Search Exam (JYTSE), State/Olympiad winners, and families with siblings studying in our campus are eligible for structured fee concessions.'],
    ['ACADEMICS', 'What is the daily school schedule and evaluation system?', 'School operates Monday–Saturday (8:45 AM – 3:45 PM, up to 4:30 PM for senior foundation batches). Evaluation follows AP CCE (FA-1 to FA-4, SA-1 & SA-2) alongside weekly OMR & CBT competitive tests.'],
    ['TRANSPORT', 'Is GPS-tracked school bus transport available for nearby villages?', 'Yes! Our verified bus fleet covers Narasannapeta Town, Polaki, Jalumuru, Kotabommali, Sarubujjili, Urlam, and nearby villages with dedicated drivers and attendants.'],
    ['ACADEMICS', 'How do parents stay updated on attendance, homework, and marks?', 'Every family gets access to the JY School ERP Web & Mobile App for real-time attendance, daily homework, gate pass notifications, exam marks, and fee receipts.'],
];

const HOLIDAY_ROWS = [
    ['June 12', 'School Re-opening Day (Session Start)', 'ACADEMIC', 'bg-indigo-50 text-brandBlue'],
    ['August 15', 'Independence Day Flag Hoisting & Cultural Event', 'NATIONAL', 'bg-orange-50 text-brandOrange'],
    ['September 05', 'Teachers\' Day & Sri Vinayaka Chavithi', 'FESTIVAL', 'bg-emerald-50 text-emerald-700'],
    ['October 02', 'Mahatma Gandhi Jayanti', 'NATIONAL', 'bg-orange-50 text-brandOrange'],
    ['October (10 Days)', 'Dasara / Vijaya Dashami Term Vacation', 'BREAK', 'bg-amber-50 text-amber-700'],
    ['November', 'Deepavali Festival Holiday', 'FESTIVAL', 'bg-emerald-50 text-emerald-700'],
    ['December 25', 'Christmas Holiday', 'FESTIVAL', 'bg-emerald-50 text-emerald-700'],
    ['January (8 Days)', 'Makar Sankranti / Pongal Holidays', 'BREAK', 'bg-amber-50 text-amber-700'],
    ['January 26', 'Republic Day Parade & Awards Ceremony', 'NATIONAL', 'bg-orange-50 text-brandOrange'],
    ['March / April', 'Ugadi & Annual Final Examinations (SA-2)', 'ACADEMIC', 'bg-indigo-50 text-brandBlue'],
];

const BUS_CORRIDORS = [
    'Narasannapeta Town & Wards', 'Polaki & Priyagraharam', 'Jalumuru & Challavanipeta',
    'Kotabommali', 'Sarubujjili', 'Urlam & Mabagam', 'Madapam & Makivalasa',
    'Komarthi & Satyavaram', 'Karavanja & Nadagam', 'Potnuru & Thamminaidupeta',
    'Susaram & Dola', 'Ampolu & Temburu', 'Komanapalli & Nimzada'
];

// 3. Dedicated Page Templates
const PAGE_TEMPLATES = {
    // ─────────────────────────────────────────────────────────────────────
    // ADMISSION SECTION PAGES
    // ─────────────────────────────────────────────────────────────────────
    '/admission/existing-student': () => `
        ${pageBanner({
            category: 'Admission & Parent Portals',
            title: 'Existing Student Self-Service Portal',
            subtitle: 'Check Published Exam Results, Print Official Hall Tickets, Track Admission Applications, or Open Online Fee Payment.',
            ctaHtml: `
                <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition"><i class="fa-solid fa-indian-rupee-sign mr-1.5"></i>Pay Fees Online</a>
                <a href="http://66.116.252.191:19999/login" class="px-5 py-2.5 rounded-full bg-brandBlue hover:bg-blue-900 text-white text-xs font-black shadow-sm transition"><i class="fa-solid fa-right-to-bracket mr-1.5"></i>ERP Student Login</a>
            `
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="flex flex-wrap border-b border-slate-200 bg-slate-50 p-2.5 gap-2">
                        <button id="ptab-results" type="button" onclick="switchPortalTab('results')" class="portal-tab-btn flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black bg-brandBlue text-white cursor-pointer transition">
                            <i class="fa-solid fa-award mr-1.5"></i> Check Exam Results
                        </button>
                        <button id="ptab-hallticket" type="button" onclick="switchPortalTab('hallticket')" class="portal-tab-btn flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-indigo-50 cursor-pointer transition">
                            <i class="fa-solid fa-ticket mr-1.5"></i> Download Hall Ticket
                        </button>
                        <button id="ptab-admission" type="button" onclick="switchPortalTab('admission')" class="portal-tab-btn flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-indigo-50 cursor-pointer transition">
                            <i class="fa-solid fa-user-check mr-1.5"></i> Track Admission Status
                        </button>
                    </div>

                    <div class="p-5 sm:p-8">
                        <div id="portal-panel-results" class="portal-panel space-y-6">
                            <form id="results-lookup-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Published Exam</label>
                                    <select id="res-exam-id" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brandBlue">
                                        <option value="">All Published Exams</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Student Roll No *</label>
                                    <input id="res-roll" required type="text" placeholder="e.g. JY26-0001" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Date of Birth *</label>
                                    <input id="res-dob" required type="date" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brandBlue">
                                </div>
                                <button type="submit" class="py-2.5 px-5 rounded-xl bg-brandBlue hover:bg-blue-900 text-white text-xs font-black shadow-sm cursor-pointer w-full">
                                    <i class="fa-solid fa-magnifying-glass mr-1.5"></i>Get Marks Memo
                                </button>
                            </form>
                            <div id="results-output"></div>
                        </div>

                        <div id="portal-panel-hallticket" class="portal-panel hidden space-y-6">
                            <form id="hallticket-lookup-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Exam (Admit Card Open) *</label>
                                    <select id="ht-exam-id" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                                        <option value="">-- Select Exam --</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Student Roll No *</label>
                                    <input id="ht-roll" required type="text" placeholder="e.g. JY26-0001" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Date of Birth *</label>
                                    <input id="ht-dob" required type="date" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                                </div>
                                <button type="submit" class="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer w-full">
                                    <i class="fa-solid fa-ticket mr-1.5"></i>Generate Hall Ticket
                                </button>
                            </form>
                            <div id="hallticket-output"></div>
                        </div>

                        <div id="portal-panel-admission" class="portal-panel hidden space-y-6">
                            <form id="admission-lookup-form" class="flex flex-col sm:flex-row gap-3 max-w-xl">
                                <input id="adm-phone" required type="text" placeholder="Enter Registered Mobile Number (e.g. 9502924437)" class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brandOrange">
                                <button type="submit" class="px-6 py-2.5 rounded-xl bg-brandOrange hover:bg-orange-600 text-white text-xs font-black cursor-pointer">
                                    Check Status
                                </button>
                            </form>
                            <div id="admission-output"></div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="bg-white border border-emerald-200 rounded-2xl p-5 hover-lift flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-qrcode text-xl"></i></div>
                        <div><h3 class="text-sm font-black text-slate-900">Pay School Fees Online</h3><p class="text-xs text-slate-500 mt-0.5">Instant due check &amp; UPI QR receipt upload</p></div>
                    </a>
                    <a href="#/downloads" onclick="navigateTo('/downloads'); return false;" class="bg-white border border-indigo-200 rounded-2xl p-5 hover-lift flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center shrink-0"><i class="fa-solid fa-file-pdf text-xl"></i></div>
                        <div><h3 class="text-sm font-black text-slate-900">Syllabus &amp; Exam Time Tables</h3><p class="text-xs text-slate-500 mt-0.5">Download official notices and term schedules</p></div>
                    </a>
                    <a href="http://66.116.252.191:19999/login" class="bg-white border border-amber-200 rounded-2xl p-5 hover-lift flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-mobile-screen text-xl"></i></div>
                        <div><h3 class="text-sm font-black text-slate-900">Parent / Student App ERP</h3><p class="text-xs text-slate-500 mt-0.5">Daily attendance, homework &amp; gate passes</p></div>
                    </a>
                </div>
            </div>
        </section>
    `,

    '/admission/procedure': () => `
        ${pageBanner({
            category: 'Admission',
            title: 'Admission Procedure & Eligibility',
            subtitle: 'Transparent 4-step enrollment process for Nursery to Class X (2026–2027 & 2027–2028 Sessions).',
            ctaHtml: `
                <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="px-6 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black shadow-md hover:bg-blue-900 transition">Apply Online Now <i class="fa-solid fa-arrow-right ml-1"></i></a>
                <a href="#/admission/fee-structure" onclick="navigateTo('/admission/fee-structure'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-indigo-200 text-brandBlue text-xs font-black hover:bg-indigo-50 transition">Fee Structure</a>
            `
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-white border border-indigo-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-brandBlue text-white font-black text-sm flex items-center justify-center mb-4">01</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Online Registration</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Complete the digital Admission Registration form or visit SVL Paradise Campus Admission Desk.</p>
                    </div>
                    <div class="bg-white border border-orange-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-brandOrange text-white font-black text-sm flex items-center justify-center mb-4">02</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Interaction / Assessment</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Friendly readiness chat for Nursery–II and foundational Maths/English baseline test for Classes III–X.</p>
                    </div>
                    <div class="bg-white border border-emerald-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">03</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Document Verification</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Submit Birth Certificate, Student/Parent Aadhar copies, Progress Card, and Transfer Certificate (TC).</p>
                    </div>
                    <div class="bg-white border border-violet-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mb-4">04</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Fee Confirmation &amp; ERP ID</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Complete Term-1 fee payment online or at office to receive Student Roll No, ERP Login &amp; Bus Pass.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                        <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-child text-brandBlue mr-2"></i>Class-Wise Age &amp; Eligibility</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr class="bg-indigo-50 text-brandBlue uppercase text-[11px] font-black">
                                        <th class="p-3 rounded-tl-xl">Grade / Class</th>
                                        <th class="p-3">Minimum Age (June 1)</th>
                                        <th class="p-3 rounded-tr-xl">Requirement</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr><td class="p-3 font-bold text-slate-900">Nursery</td><td class="p-3">3+ Years</td><td class="p-3 text-slate-600">Birth Certificate + Child Readiness</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">LKG &amp; UKG</td><td class="p-3">4+ / 5+ Years</td><td class="p-3 text-slate-600">Birth Certificate + Basic Interaction</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes I – V</td><td class="p-3">6+ to 10+ Years</td><td class="p-3 text-slate-600">Previous Report + Original TC (II+)</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes VI – VIII</td><td class="p-3">11+ to 13+ Years</td><td class="p-3 text-slate-600">Baseline Test + TC + PEN/APAAR</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes IX – X</td><td class="p-3">14+ to 15+ Years</td><td class="p-3 text-slate-600">Entrance Test + Board Transfer Norms</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <h3 class="text-lg font-black text-slate-900"><i class="fa-solid fa-folder-open text-brandOrange mr-2"></i>Documents Required</h3>
                        <ul class="space-y-2.5 text-xs text-slate-700">
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Original Birth Certificate (Nursery – Class I)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Original Transfer Certificate (TC) &amp; Bonafide (Class II – X)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Previous Academic Year Progress Card</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Student, Father &amp; Mother Aadhar Card Copies</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Student PEN Number / APAAR ID / Child ID (if allotted)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>4 Recent Passport Size Color Photographs</span></li>
                        </ul>
                        <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="w-full py-3 rounded-xl bg-brandBlue text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-900 transition">
                            Start Online Registration <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/campus': () => `
        ${pageBanner({
            category: 'Admission & Campus',
            title: 'School Campus & Virtual Gallery',
            subtitle: 'Explore SVL Paradise Campus, Narasannapeta — smart classrooms, science & CBT labs, play arenas, and event memories.',
            ctaHtml: `<a href="#/contact" onclick="navigateTo('/contact'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black">Schedule Campus Visit</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
                    <div class="lg:col-span-6"><img src="./image.png" alt="JY School Campus" class="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-md"></div>
                    <div class="lg:col-span-6 space-y-4">
                        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">SVL Paradise Campus</span>
                        <h2 class="text-2xl font-black text-slate-900">Safe, Spacious &amp; Digitally Equipped Campus</h2>
                        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Located opposite Hero Showroom in Narasannapeta, our academic complex houses ventilated smart classrooms, dedicated Physics/Chemistry/Biology &amp; CBT Computer Labs, 24/7 CCTV surveillance, chilled RO water stations, and spacious outdoor playgrounds.
                        </p>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div class="p-3 rounded-xl bg-indigo-50 text-center"><div class="text-lg font-black text-brandBlue">24/7</div><div class="text-[10px] font-bold text-slate-600">CCTV Campus</div></div>
                            <div class="p-3 rounded-xl bg-emerald-50 text-center"><div class="text-lg font-black text-emerald-700">100%</div><div class="text-[10px] font-bold text-slate-600">Smart Class</div></div>
                            <div class="p-3 rounded-xl bg-amber-50 text-center"><div class="text-lg font-black text-amber-700">4 Labs</div><div class="text-[10px] font-bold text-slate-600">STEM &amp; CBT</div></div>
                            <div class="p-3 rounded-xl bg-sky-50 text-center"><div class="text-lg font-black text-sky-700">GPS</div><div class="text-[10px] font-bold text-slate-600">Bus Fleet</div></div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-black text-slate-900 mb-5"><i class="fa-solid fa-photo-film text-brandBlue mr-2"></i>Campus Videos &amp; Photo Gallery</h3>
                    <div id="page-media-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 hover-lift">
                            <img src="./image.png" alt="Main Block" class="w-full h-52 object-cover">
                            <div class="p-4"><span class="text-[10px] font-black uppercase text-brandBlue">Campus Block</span><h4 class="font-black text-slate-900 text-sm mt-1">Main Academic &amp; Administrative Wing</h4></div>
                        </div>
                        <div class="bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-6 flex flex-col justify-between hover-lift">
                            <div class="w-12 h-12 rounded-2xl bg-brandBlue text-white flex items-center justify-center mb-4"><i class="fa-solid fa-flask text-lg"></i></div>
                            <div><span class="text-[10px] font-black uppercase text-brandBlue">STEM &amp; Digital Lab</span><h4 class="font-black text-slate-900 text-base mt-1">Science &amp; CBT Computer Labs</h4><p class="text-xs text-slate-600 mt-1">Hands-on Physics, Chemistry &amp; weekly NTA-pattern mock test lab.</p></div>
                        </div>
                        <div class="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 p-6 flex flex-col justify-between hover-lift">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4"><i class="fa-solid fa-futbol text-lg"></i></div>
                            <div><span class="text-[10px] font-black uppercase text-emerald-700">Sports &amp; Yoga</span><h4 class="font-black text-slate-900 text-base mt-1">Playground &amp; Physical Fitness Arena</h4><p class="text-xs text-slate-600 mt-1">Dedicated sports coaching, assembly drills &amp; inter-house athletics.</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/register': () => `
        ${pageBanner({
            category: 'Admission',
            title: 'Online Admission Registration',
            subtitle: 'Submit your child\'s admission application directly to the JY School ERP Admissions Office with optional student photo upload.',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            ctaHtml: `<a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student', 'admission'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-black hover:border-brandBlue">Track Application Status</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div class="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xs">
                    <form id="public-admission-form" class="space-y-6">
                        <div>
                            <h3 class="text-base font-black text-brandBlue border-b border-slate-100 pb-2 mb-4"><i class="fa-solid fa-user-graduate mr-2"></i>1. Student Particulars</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div class="sm:col-span-2">
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Student Full Name *</label>
                                    <input id="adm-studentName" required type="text" placeholder="Enter student full name" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Academic Year *</label>
                                    <select id="adm-academicYear" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                        <option value="2027-2028">2027 – 2028</option>
                                        <option value="2026-2027">2026 – 2027</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Class Applying For *</label>
                                    <select id="adm-classApplied" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                        <option value="Nursery">Nursery</option><option value="LKG">LKG</option><option value="UKG">UKG</option>
                                        <option value="Class 1" selected>Class 1</option><option value="Class 2">Class 2</option><option value="Class 3">Class 3</option>
                                        <option value="Class 4">Class 4</option><option value="Class 5">Class 5</option><option value="Class 6">Class 6</option>
                                        <option value="Class 7">Class 7</option><option value="Class 8">Class 8</option><option value="Class 9">Class 9</option>
                                        <option value="Class 10">Class 10</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Gender *</label>
                                    <select id="adm-gender" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                        <option value="MALE">Male</option><option value="FEMALE">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Date of Birth *</label>
                                    <input id="adm-dob" required type="date" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Student Aadhar No</label>
                                    <input id="adm-aadharNo" type="text" maxlength="12" placeholder="12-digit Aadhar (optional)" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Previous School</label>
                                    <input id="adm-previousSchool" type="text" placeholder="Previous school &amp; town" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Student Photo (Optional)</label>
                                    <input id="adm-photo-file" type="file" accept="image/*" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold">
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-base font-black text-brandBlue border-b border-slate-100 pb-2 mb-4"><i class="fa-solid fa-users mr-2"></i>2. Parent Details &amp; Address</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Father / Guardian Name *</label>
                                    <input id="adm-fatherName" required type="text" placeholder="Father full name" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Primary Mobile Number *</label>
                                    <input id="adm-fatherPhone" required type="tel" maxlength="10" placeholder="10-digit WhatsApp / Mobile No" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Mother Name</label>
                                    <input id="adm-motherName" type="text" placeholder="Mother full name" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Village / Mandal / District *</label>
                                    <input id="adm-address" required type="text" placeholder="Door No, Village, Mandal, Srikakulam" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                            </div>
                        </div>

                        <label class="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <input id="adm-terms" type="checkbox" required class="mt-0.5 accent-brandBlue">
                            <span>I confirm that the above particulars are true and authorize Sri Venkateswara JY School Admissions Office to contact me regarding assessment &amp; verification.</span>
                        </label>

                        <button type="submit" id="adm-submit-btn" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brandBlue hover:bg-blue-900 text-white text-xs sm:text-sm font-black shadow-lg transition cursor-pointer">
                            <i class="fa-solid fa-paper-plane mr-2"></i>Submit Admission Application
                        </button>
                    </form>
                    <div id="public-admission-result" class="mt-6"></div>
                </div>

                <div class="lg:col-span-4 space-y-4">
                    <div class="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 space-y-3">
                        <h3 class="text-base font-black text-slate-900"><i class="fa-solid fa-headset text-brandBlue mr-2"></i>Admissions Desk</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Questions about Foundation batches, scholarships, or school bus stops?</p>
                        <div class="text-xs font-bold text-slate-800 space-y-1.5 pt-1">
                            <div><i class="fa-solid fa-phone text-brandBlue mr-2"></i> +91 95029 24437</div>
                            <div><i class="fa-solid fa-clock text-brandOrange mr-2"></i> Mon–Sat: 8:30 AM – 4:30 PM</div>
                        </div>
                        <a href="https://wa.me/919502924437?text=Hello!%20I%20need%20help%20with%20JY%20School%20Admission." target="_blank" rel="noopener"
                           class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition">
                            <i class="fa-brands fa-whatsapp text-base"></i> Chat on WhatsApp
                        </a>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <h3 class="text-sm font-black text-slate-900">Track Submitted Form</h3>
                        <p class="text-xs text-slate-500">Check live approval status using your registered mobile number.</p>
                        <a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student', 'admission'); return false;"
                           class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-brandBlue text-xs font-black flex items-center justify-center gap-2 transition">
                            Open Status Tracker &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/fee-structure': () => `
        ${pageBanner({
            category: 'Admission & Finance',
            title: 'Fee Structure & Installment Schedule',
            subtitle: 'Transparent term-wise fee framework across Pre-Primary, Primary, Foundation Middle School, and High School SSC.',
            ctaHtml: `<a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition"><i class="fa-solid fa-indian-rupee-sign mr-1.5"></i>Pay Fees Online</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-white border border-blue-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-blue-50 text-brandBlue text-[10px] font-black">PRE-PRIMARY</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Nursery, LKG &amp; UKG</h3>
                            <p class="text-xs text-slate-500 mt-1">Activity kits, phonics material &amp; smart class support</p>
                            <div class="my-4 py-3 border-y border-slate-100"><div class="text-xs text-slate-500">3 Term Installments</div><div class="text-base font-black text-brandBlue mt-0.5">Counsel on Inquiry</div></div>
                        </div>
                        <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="py-2.5 rounded-xl bg-indigo-50 text-brandBlue text-xs font-black text-center hover:bg-brandBlue hover:text-white transition">Apply Pre-Primary</a>
                    </div>
                    <div class="bg-white border border-orange-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-orange-50 text-brandOrange text-[10px] font-black">PRIMARY WING</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes I to V</h3>
                            <p class="text-xs text-slate-500 mt-1">Core State syllabus, Abacus/Olympiad &amp; reading labs</p>
                            <div class="my-4 py-3 border-y border-slate-100"><div class="text-xs text-slate-500">Scholarships Eligible</div><div class="text-base font-black text-brandOrange mt-0.5">3 Term Schedule</div></div>
                        </div>
                        <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="py-2.5 rounded-xl bg-orange-50 text-brandOrange text-xs font-black text-center hover:bg-brandOrange hover:text-white transition">Apply Primary</a>
                    </div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">MIDDLE FOUNDATION</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes VI to VIII</h3>
                            <p class="text-xs text-slate-500 mt-1">IIT-JEE / NEET / Navodaya Foundation + CBT Exams</p>
                            <div class="my-4 py-3 border-y border-slate-100"><div class="text-xs text-slate-500">Merit Waivers Up to 50%</div><div class="text-base font-black text-emerald-700 mt-0.5">Live ERP Ledger</div></div>
                        </div>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black text-center hover:bg-emerald-600 hover:text-white transition">Check Student Fee</a>
                    </div>
                    <div class="bg-white border border-purple-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black">HIGH SCHOOL</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes IX &amp; X (SSC)</h3>
                            <p class="text-xs text-slate-500 mt-1">Board mentorship, Grand Tests &amp; Study Material</p>
                            <div class="my-4 py-3 border-y border-slate-100"><div class="text-xs text-slate-500">Topper Concessions</div><div class="text-base font-black text-purple-700 mt-0.5">Instant UPI Pay</div></div>
                        </div>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="py-2.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-black text-center hover:bg-purple-600 hover:text-white transition">Pay High School Fee</a>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-3 text-xs">
                        <h3 class="text-base font-black text-slate-900 mb-2"><i class="fa-solid fa-calendar-check text-brandBlue mr-2"></i>Term Installment Windows</h3>
                        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div><strong class="text-slate-900 block">Term 1 (Opening / Admission)</strong><span class="text-slate-500">40% Tuition + Books/Kit</span></div>
                            <span class="px-3 py-1 rounded-full bg-indigo-100 text-brandBlue font-black">June 1 – June 20</span>
                        </div>
                        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div><strong class="text-slate-900 block">Term 2 (Mid-Term)</strong><span class="text-slate-500">35% Tuition + Exam Fee</span></div>
                            <span class="px-3 py-1 rounded-full bg-orange-100 text-brandOrange font-black">Oct 1 – Oct 20</span>
                        </div>
                        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div><strong class="text-slate-900 block">Term 3 (Final Term)</strong><span class="text-slate-500">25% Final Tuition Balance</span></div>
                            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black">Jan 1 – Jan 20</span>
                        </div>
                    </div>
                    <div class="lg:col-span-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-6 space-y-4">
                        <h3 class="text-base font-black text-slate-900"><i class="fa-solid fa-shield-check text-emerald-600 mr-2"></i>Direct Online Payment</h3>
                        <ul class="space-y-2 text-xs text-slate-700">
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Verify live pending dues via Student Roll No &amp; DOB</li>
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Pay using PhonePe, GPay, Paytm UPI QR or Bank NEFT</li>
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Auto-syncs with Finance ERP + Printable Payment Slip</li>
                        </ul>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition">
                            Open Pay Fees Online <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/scholarships': () => `
        ${pageBanner({
            category: 'Admission',
            title: 'Scholarships & Merit Concessions',
            subtitle: 'Supporting high-potential learners, Olympiad qualifiers, and siblings studying at Sri Venkateswara JY School.',
            badgeColor: 'bg-amber-100 text-amber-800'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="bg-white border border-amber-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><i class="fa-solid fa-medal text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">JY Talent Search Exam (JYTSE)</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Top performers in the annual scholarship screening test earn 25% to 100% tuition fee waivers.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black">Up to 100% Waiver</span>
                </div>
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-users text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">Sibling Fee Concession</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Families enrolling two or more children at JY School receive annual tuition concession for younger siblings.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black">Family Support</span>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-trophy text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">Olympiad &amp; Sports Honors</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">District &amp; State rankers in Science/Maths Olympiads, JNVST &amp; Sports receive special merit grants.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">Merit Recognition</span>
                </div>
            </div>
        </section>
    `,

    '/admission/faqs': () => `
        ${pageBanner({
            category: 'Admission',
            title: "Frequently Asked Questions (FAQ's)",
            subtitle: 'Search answers about Admissions, IIT-JEE/NEET Foundation, Online Fee Payments, Transport & School ERP.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit max-w-5xl space-y-5">
                <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    <div id="faq-cat-pills" class="flex flex-wrap gap-1.5">
                        <button type="button" data-cat="ALL" onclick="filterFaqs('ALL')" class="px-3.5 py-1.5 rounded-full text-xs font-black bg-brandBlue text-white">All</button>
                        <button type="button" data-cat="ADMISSIONS" onclick="filterFaqs('ADMISSIONS')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Admissions</button>
                        <button type="button" data-cat="FEES" onclick="filterFaqs('FEES')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Fees &amp; Online Pay</button>
                        <button type="button" data-cat="ACADEMICS" onclick="filterFaqs('ACADEMICS')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Academics &amp; ERP</button>
                        <button type="button" data-cat="TRANSPORT" onclick="filterFaqs('TRANSPORT')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Transport</button>
                    </div>
                    <input id="faq-search" type="text" oninput="filterFaqs()" placeholder="Search questions..." class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue sm:w-64">
                </div>

                <div class="space-y-3">
                    ${FAQ_ITEMS.map(([cat, q, a]) => `
                        <div class="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-cat="${cat}">
                            <button type="button" onclick="toggleFaq(this)" class="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 transition cursor-pointer">
                                <span class="text-xs sm:text-sm font-black text-slate-900">${q}</span>
                                <i class="fa-solid fa-chevron-down text-xs text-brandBlue faq-chevron transition-transform shrink-0"></i>
                            </button>
                            <div class="hidden px-4 sm:px-5 pb-4 text-xs sm:text-[13px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3">${a}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `,

    // ─────────────────────────────────────────────────────────────────────
    // STUDENT LIFE SECTION PAGES
    // ─────────────────────────────────────────────────────────────────────
    '/student-life/holidays': () => `
        ${pageBanner({
            category: 'Student Life',
            title: 'Academic Calendar & Holiday List',
            subtitle: 'Filterable public holidays, festival vacations, and term examination schedule for Session 2026–2027.',
            ctaHtml: `<a href="#/downloads" onclick="navigateTo('/downloads'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black">Download Circular PDFs</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-5">
                <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    <div id="hol-cat-pills" class="flex flex-wrap gap-1.5">
                        <button type="button" data-cat="ALL" onclick="filterHolidays('ALL')" class="px-3.5 py-1.5 rounded-full text-xs font-black bg-brandBlue text-white">All</button>
                        <button type="button" data-cat="FESTIVAL" onclick="filterHolidays('FESTIVAL')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Festivals</button>
                        <button type="button" data-cat="NATIONAL" onclick="filterHolidays('NATIONAL')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">National Events</button>
                        <button type="button" data-cat="BREAK" onclick="filterHolidays('BREAK')" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Term Breaks</button>
                    </div>
                    <input id="hol-search" type="text" oninput="filterHolidays()" placeholder="Search month or holiday..." class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue sm:w-64">
                </div>

                <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                                    <th class="p-3.5">Date / Window</th>
                                    <th class="p-3.5">Occasion / Holiday</th>
                                    <th class="p-3.5">Category</th>
                                </tr>
                            </thead>
                            <tbody id="holiday-tbody" class="divide-y divide-slate-100">
                                ${HOLIDAY_ROWS.map(([dt, title, cat, cls]) => `
                                    <tr data-cat="${cat}">
                                        <td class="p-3.5 font-bold whitespace-nowrap">${dt}</td>
                                        <td class="p-3.5 font-semibold text-slate-900">${title}</td>
                                        <td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${cls}">${cat}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/student-life/academics': () => `
        ${pageBanner({
            category: 'Student Life',
            title: 'Academics, Curriculum & Disclosure',
            subtitle: 'State Board / SSC curriculum enriched with IIT-JEE, NEET, Navodaya coaching, CCE assessments, and weekly CBT practice.',
            ctaHtml: `<a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black">Results &amp; Hall Tickets</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div id="page-programs-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>

                <!-- School Profile & Assessment System -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <span class="px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black uppercase">Assessment &amp; Grading</span>
                        <h3 class="text-lg font-black text-slate-900">CCE Framework + Weekly OMR &amp; CBT Mock Tests</h3>
                        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Formative Assessments (FA-1 to FA-4) and Summative Exams (SA-1, SA-2) combined with weekly objective tests track accuracy, conceptual clarity, and competitive rank growth.</p>
                        <div class="grid grid-cols-3 gap-3 text-center text-xs pt-2">
                            <div class="p-3 rounded-2xl bg-indigo-50"><div class="font-black text-brandBlue text-sm">FA-1 to 4</div><div class="text-slate-600 text-[11px]">Formative</div></div>
                            <div class="p-3 rounded-2xl bg-emerald-50"><div class="font-black text-emerald-700 text-sm">SA-1 &amp; 2</div><div class="text-slate-600 text-[11px]">Summative</div></div>
                            <div class="p-3 rounded-2xl bg-amber-50"><div class="font-black text-amber-700 text-sm">Weekly CBT</div><div class="text-slate-600 text-[11px]">JEE / NEET</div></div>
                        </div>
                    </div>
                    <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Public Disclosure</span>
                        <h3 class="text-base font-black text-slate-900">School Profile Snapshot</h3>
                        <div class="grid grid-cols-2 gap-2.5 text-xs">
                            <div class="p-3 rounded-xl bg-slate-50"><span class="text-slate-400 block text-[10px]">Recognition</span><strong>Govt. of AP</strong></div>
                            <div class="p-3 rounded-xl bg-slate-50"><span class="text-slate-400 block text-[10px]">Medium</span><strong>English (Co-Ed)</strong></div>
                            <div class="p-3 rounded-xl bg-slate-50"><span class="text-slate-400 block text-[10px]">Classes</span><strong>Nursery – Class X</strong></div>
                            <div class="p-3 rounded-xl bg-slate-50"><span class="text-slate-400 block text-[10px]">Campus</span><strong>Narasannapeta</strong></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-book-open text-brandBlue mr-2"></i>Academic Policies &amp; Guides</h3>
                    <div id="page-custom-pages-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>
                </div>
            </div>
        </section>
    `,

    '/student-life/sports': () => `
        ${pageBanner({ category: 'Student Life', title: 'Sports & Physical Education', subtitle: 'Building stamina, teamwork, and sportsmanship through daily games, yoga, and annual championships.', badgeColor: 'bg-emerald-100 text-emerald-800' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-3 gap-5">
                ${[
                    ['fa-person-running', 'bg-emerald-600', 'Athletics & Track', 'Morning drills, sprint tracks, relay races, and inter-house athletic championships.'],
                    ['fa-volleyball', 'bg-brandBlue', 'Outdoor Team Sports', 'Volleyball, Kho-Kho, Kabaddi, and Cricket coaching led by trained PT mentors.'],
                    ['fa-chess', 'bg-brandOrange', 'Indoor Games & Yoga', 'Chess, Carroms, Table Tennis &amp; daily Yoga/Pranayama for sharp focus.']
                ].map(([ic, bg, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift space-y-3">
                        <div class="w-12 h-12 rounded-2xl ${bg} text-white flex items-center justify-center"><i class="fa-solid ${ic} text-xl"></i></div>
                        <h3 class="text-base font-black text-slate-900">${t}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">${d}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/student-life/cultural': () => `
        ${pageBanner({ category: 'Student Life', title: 'Cultural, Arts & Literary Life', subtitle: 'Annual Day galas, Science Expos, Debate clubs, music, dance, and festival celebrations.', badgeColor: 'bg-rose-100 text-rose-800' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                ${[
                    ['fa-masks-theater', 'text-rose-600 bg-rose-50', 'Annual Day & Stage Arts', 'Drama, classical &amp; folk dance, and stage anchoring confidence.'],
                    ['fa-microphone-lines', 'text-brandBlue bg-indigo-50', 'Debate & Elocution', 'English &amp; Telugu public speaking, essay writing &amp; literary quizzes.'],
                    ['fa-flask-vial', 'text-emerald-700 bg-emerald-50', 'Science & STEM Expo', 'Student working science models, robotics demos &amp; innovation fairs.'],
                    ['fa-palette', 'text-amber-700 bg-amber-50', 'Fine Arts & Festivals', 'Drawing, craft, Sankranti, Teachers\' Day, and Children\'s Day celebrations.']
                ].map(([ic, cls, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift space-y-3">
                        <div class="w-12 h-12 rounded-2xl ${cls} flex items-center justify-center"><i class="fa-solid ${ic} text-xl"></i></div>
                        <h3 class="text-base font-black text-slate-900">${t}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">${d}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/student-life/services': () => `
        ${pageBanner({ category: 'Student Life', title: 'In-School Student Services', subtitle: 'Campus conveniences engineered for student health, security, and instant parent transparency.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${[
                    ['fa-tv', 'text-brandBlue bg-indigo-50', 'Interactive Smart Classrooms', 'Audio-visual digital boards simplifying Maths, Physics &amp; Biology concepts.'],
                    ['fa-droplet', 'text-sky-600 bg-sky-50', 'Purified RO Drinking Water', 'Chilled UV+RO purified water points across all campus floors.'],
                    ['fa-mobile-screen-button', 'text-emerald-700 bg-emerald-50', 'JY School ERP & Parent App', 'Real-time attendance alerts, homework, exam marks &amp; fee receipts.'],
                    ['fa-book', 'text-brandOrange bg-orange-50', 'Books & Stationery Counter', 'On-campus availability of notebooks, foundation modules &amp; diaries.'],
                    ['fa-id-badge', 'text-purple-700 bg-purple-50', 'Digital ID & Gate Pass Security', 'Verified campus pickups with digital gate pass approvals.'],
                    ['fa-utensils', 'text-amber-700 bg-amber-50', 'Clean Supervised Dining Hall', 'Hygienic lunch zones encouraging nutritious home-cooked meals.']
                ].map(([ic, cls, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift space-y-3">
                        <div class="w-12 h-12 rounded-2xl ${cls} flex items-center justify-center"><i class="fa-solid ${ic} text-xl"></i></div>
                        <h3 class="text-base font-black text-slate-900">${t}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">${d}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/student-life/uniform': () => `
        ${pageBanner({ category: 'Student Life', title: 'School Uniform & Dress Code', subtitle: 'Neat institutional attire promoting equality, pride, and discipline across all wings.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 space-y-3">
                    <span class="px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black uppercase">Mon, Tue, Thu &amp; Fri</span>
                    <h3 class="text-lg font-black text-slate-900">Regular Academic Uniform</h3>
                    <ul class="space-y-2 text-xs text-slate-700">
                        <li><strong>Boys (Nursery – V):</strong> Check shirt with emblem, shorts, tie, belt, black shoes &amp; white socks.</li>
                        <li><strong>Boys (VI – X):</strong> Tailored check shirt, formal full trousers, tie, belt, black shoes &amp; ID card.</li>
                        <li><strong>Girls (Nursery – V):</strong> School blouse &amp; pinafore/skirt, tie, belt, black shoes &amp; neat ribbons.</li>
                        <li><strong>Girls (VI – X):</strong> Tunic / Salwar Kurta with waistcoat/dupatta, black shoes &amp; braided hair.</li>
                    </ul>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 space-y-3">
                    <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Wednesday &amp; Saturday</span>
                    <h3 class="text-lg font-black text-slate-900">House &amp; Sports Uniform + Grooming</h3>
                    <ul class="space-y-2 text-xs text-slate-700">
                        <li><strong>House T-Shirt:</strong> Color-coded Polo T-shirt (Blue, Gold, Green, Red) with House crest.</li>
                        <li><strong>Sports Lower &amp; Shoes:</strong> Navy/white track pants paired with clean white canvas PT shoes.</li>
                        <li><strong>Mandatory ID Card:</strong> Official barcode/QR School ID card must be worn daily.</li>
                        <li><strong>Grooming:</strong> Neat trimmed hair for boys; cleanly plaited hair for girls.</li>
                    </ul>
                </div>
            </div>
        </section>
    `,

    '/student-life/co-curricular': () => `
        ${pageBanner({ category: 'Student Life', title: 'Co-Curricular Clubs & Skill Labs', subtitle: 'Robotics, Coding, Abacus, Olympiads, Eco Club, and Spoken English for well-rounded growth.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${[
                    ['fa-robot', 'bg-brandBlue', 'Robotics & Coding Club', 'Hands-on logic building, electronics tinkering &amp; programming fluency.'],
                    ['fa-calculator', 'bg-brandOrange', 'Abacus & Vedic Maths', 'Rapid mental calculation speed boosting Olympiad accuracy.'],
                    ['fa-brain', 'bg-emerald-600', 'Olympiad & Quiz Society', 'Weekly IMO/NSO reasoning practice &amp; inter-school quiz challenges.'],
                    ['fa-leaf', 'bg-teal-600', 'Eco & Green Club', 'Tree plantation, water conservation &amp; campus sustainability.'],
                    ['fa-comments', 'bg-violet-600', 'Spoken English Studio', 'Pronunciation, vocabulary, reading fluency &amp; stage communication.'],
                    ['fa-hands-holding-child', 'bg-rose-600', 'Value Education & Leadership', 'Civic responsibility, empathy &amp; Student Council prefectship.']
                ].map(([ic, bg, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift space-y-3">
                        <div class="w-12 h-12 rounded-2xl ${bg} text-white flex items-center justify-center"><i class="fa-solid ${ic} text-xl"></i></div>
                        <h3 class="text-base font-black text-slate-900">${t}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">${d}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/student-life/houses': () => `
        ${pageBanner({ category: 'Student Life', title: 'Student Houses & Leadership', subtitle: 'Four spirited Houses building camaraderie, healthy competition, and student leadership.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div class="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-lg">V</div>
                    <h3 class="text-lg font-black text-blue-900">Vivekananda House</h3>
                    <p class="text-[11px] font-black text-blue-700 uppercase">Arise, Awake &amp; Excel</p>
                    <p class="text-xs text-slate-600">Champions fearlessness, moral strength, and focused academic excellence.</p>
                </div>
                <div class="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">K</div>
                    <h3 class="text-lg font-black text-amber-900">APJ Kalam House</h3>
                    <p class="text-[11px] font-black text-amber-700 uppercase">Dream, Innovate, Achieve</p>
                    <p class="text-xs text-slate-600">Inspires scientific curiosity, STEM creativity, and perseverance.</p>
                </div>
                <div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">T</div>
                    <h3 class="text-lg font-black text-emerald-900">Tagore House</h3>
                    <p class="text-[11px] font-black text-emerald-700 uppercase">Harmony, Art &amp; Wisdom</p>
                    <p class="text-xs text-slate-600">Celebrates arts, literature, music, and compassionate teamwork.</p>
                </div>
                <div class="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-lg">R</div>
                    <h3 class="text-lg font-black text-rose-900">CV Raman House</h3>
                    <p class="text-[11px] font-black text-rose-700 uppercase">Discover Through Inquiry</p>
                    <p class="text-xs text-slate-600">Drives analytical experimentation and Olympiad mastery.</p>
                </div>
            </div>
        </section>
    `,

    // ─────────────────────────────────────────────────────────────────────
    // FACILITIES SECTION PAGES
    // ─────────────────────────────────────────────────────────────────────
    '/facilities/laboratory': () => `
        ${pageBanner({ category: 'Facilities', title: 'Science & CBT Computer Laboratories', subtitle: 'Dedicated Physics, Chemistry, Biology & Computer Mock-Test Labs for experiential STEM learning.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-2 gap-5">
                ${[
                    ['fa-magnet', 'bg-brandBlue', 'Physics Laboratory', 'Optics benches, electrical circuits, mechanics apparatus, and precision measuring setups.'],
                    ['fa-flask-vial', 'bg-brandOrange', 'Chemistry Laboratory', 'Ventilated titration &amp; salt-analysis stations with standard safety glassware.'],
                    ['fa-microscope', 'bg-emerald-600', 'Biology Laboratory', 'Compound microscopes, anatomical models, specimen slides &amp; NEET foundation aids.'],
                    ['fa-desktop', 'bg-indigo-600', 'Digital Computer & CBT Lab', 'Networked workstations for coding literacy and NTA-style online competitive mock tests.']
                ].map(([ic, bg, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift flex items-start gap-4">
                        <div class="p-3.5 rounded-2xl ${bg} text-white flex items-center justify-center shrink-0"><i class="fa-solid ${ic} text-xl"></i></div>
                        <div><h3 class="text-base font-black text-slate-900 mb-1.5">${t}</h3><p class="text-xs text-slate-600 leading-relaxed">${d}</p></div>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/facilities/library': () => `
        ${pageBanner({ category: 'Facilities', title: 'Central & Digital Reference Library', subtitle: 'Over 5,000 books, IIT-JEE/NEET modules, Olympiad workbooks, storybooks, and reading hall.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
                    <h3 class="text-lg font-black text-slate-900">Knowledge Resources for Every Class</h3>
                    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Cultivating independent reading from Primary to Class X with curriculum references, NCERT guides, JEE/NEET foundation material, and dailies.</p>
                    <div class="grid grid-cols-3 gap-3 pt-2">
                        <div class="p-4 rounded-2xl bg-indigo-50 text-center"><div class="text-xl font-black text-brandBlue">5,000+</div><div class="text-[10px] font-bold text-slate-600">Books &amp; Guides</div></div>
                        <div class="p-4 rounded-2xl bg-amber-50 text-center"><div class="text-xl font-black text-amber-700">JEE/NEET</div><div class="text-[10px] font-bold text-slate-600">Reference Bank</div></div>
                        <div class="p-4 rounded-2xl bg-emerald-50 text-center"><div class="text-xl font-black text-emerald-700">Weekly</div><div class="text-[10px] font-bold text-slate-600">Library Periods</div></div>
                    </div>
                </div>
                <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                    <h3 class="text-base font-black text-slate-900">Library Guidelines</h3>
                    <ul class="space-y-2.5 text-xs text-slate-600">
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Scheduled weekly library reading &amp; borrowing slots.</li>
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Quiet study etiquette inside the central reading hall.</li>
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>7-day book lending using official Student ID Card.</li>
                    </ul>
                </div>
            </div>
        </section>
    `,

    '/facilities/medical': () => `
        ${pageBanner({ category: 'Facilities', title: 'Medical Care & Student Wellness', subtitle: 'On-campus first-aid bay, annual health checkups, and immediate parent alert system.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="bg-white border border-rose-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center"><i class="fa-solid fa-kit-medical text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">Campus First-Aid Room</h3>
                    <p class="text-xs text-slate-600">Equipped infirmary with resting beds, digital thermometer, oximeter, and first-aid care.</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-stethoscope text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">Annual Health &amp; Eye Screening</h3>
                    <p class="text-xs text-slate-600">Regular dental, vision, and general wellness camps conducted on campus.</p>
                </div>
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-phone-volume text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">Emergency Rapid Alert</h3>
                    <p class="text-xs text-slate-600">Instant parent notification &amp; nearby hospital tie-up in Narasannapeta.</p>
                </div>
            </div>
        </section>
    `,

    '/facilities/transport': () => `
        ${pageBanner({ category: 'Facilities', title: 'GPS Transport & Bus Routes', subtitle: 'Safe, punctual GPS-monitored school buses across Narasannapeta & surrounding mandals.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="bg-white border border-sky-200 rounded-3xl p-6 hover-lift space-y-2">
                        <div class="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center"><i class="fa-solid fa-location-crosshairs text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Live GPS Fleet</h3>
                        <p class="text-xs text-slate-600">GPS-tracked buses with speed governors, first-aid kits &amp; fire safety gear.</p>
                    </div>
                    <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-2">
                        <div class="w-11 h-11 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-user-shield text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Verified Crew</h3>
                        <p class="text-xs text-slate-600">Experienced licensed drivers and trained bus attendants on every trip.</p>
                    </div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-2">
                        <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-id-card text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Digital Boarding Pass</h3>
                        <p class="text-xs text-slate-600">Stop-mapped student transport passes &amp; transparent fee tracking.</p>
                    </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 class="text-base font-black text-slate-900"><i class="fa-solid fa-route text-brandOrange mr-2"></i>Search Covered Bus Routes &amp; Villages</h3>
                        <input id="bus-route-search" type="text" oninput="filterBusRoutes()" placeholder="Search your village or mandal..." class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue sm:w-64">
                    </div>
                    <div class="flex flex-wrap gap-2 text-xs font-bold">
                        ${BUS_CORRIDORS.map((r) => `
                            <span class="bus-route-chip px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"><i class="fa-solid fa-bus text-brandBlue mr-1.5"></i>${r}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
    `,

    '/facilities/awards': () => `
        ${pageBanner({ category: 'Facilities & Pride', title: 'Scholarships, Awards & Toppers Hall', subtitle: 'Celebrating State toppers, Olympiad champions, and all-round student achievers.', badgeColor: 'bg-amber-100 text-amber-800' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div>
                    <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-crown text-amber-500 mr-2"></i>Academic Toppers Hall of Fame</h3>
                    <div id="page-toppers-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="bg-white border border-amber-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">Academic Gold Medals</h4><p class="text-xs text-slate-600">Honoring class toppers across Primary &amp; High School every Annual Day.</p></div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">100% Attendance Honors</h4><p class="text-xs text-slate-600">Certificates &amp; trophies recognizing consistency and punctuality.</p></div>
                    <div class="bg-white border border-indigo-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">Best All-Rounder Trophy</h4><p class="text-xs text-slate-600">Celebrating excellence across academics, sports &amp; leadership.</p></div>
                </div>
            </div>
        </section>
    `,

    '/facilities/counselling': () => `
        ${pageBanner({ category: 'Facilities', title: 'Student & Parent Counselling Session', subtitle: 'Career stream selection, exam stress management, and personalized parent-teacher mentorship.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-compass"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Academic &amp; Career Guidance</h3>
                        <p class="text-xs text-slate-600">Guiding Classes VIII–X students on IIT-JEE, NEET &amp; competitive career tracks.</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
                        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-heart"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Exam Confidence &amp; Study Habits</h3>
                        <p class="text-xs text-slate-600">One-on-one mentoring on time management &amp; stress-free test writing.</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 sm:col-span-2">
                        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><i class="fa-solid fa-handshake"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Parent-Teacher Progress Reviews</h3>
                        <p class="text-xs text-slate-600">Combining FA/SA analytics, attendance &amp; daily study targets with parents.</p>
                    </div>
                </div>
                <div class="lg:col-span-5 bg-white border border-indigo-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 class="text-base font-black text-slate-900">Book Counselling via WhatsApp</h3>
                    <form id="counselling-form" class="space-y-3">
                        <input id="cns-name" required type="text" placeholder="Parent / Student Name *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                        <input id="cns-phone" required type="tel" placeholder="Mobile Number *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                        <select id="cns-topic" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                            <option value="Admission & Class Placement">Admission &amp; Class Placement</option>
                            <option value="IIT-JEE / NEET / Navodaya Track">IIT-JEE / NEET / Navodaya Track</option>
                            <option value="Academic Performance Review">Academic Performance Review</option>
                            <option value="Student Study & Confidence Support">Study Habits &amp; Confidence Support</option>
                        </select>
                        <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer">
                            <i class="fa-brands fa-whatsapp mr-1.5"></i>Request Session via WhatsApp
                        </button>
                    </form>
                </div>
            </div>
        </section>
    `,

    // ─────────────────────────────────────────────────────────────────────
    // STAFFS, DOWNLOADS, CONTACT, PAY FEES ONLINE
    // ─────────────────────────────────────────────────────────────────────
    '/staffs': () => `
        <section class="py-6 sm:py-8">
            <div class="screen-fit space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                        <h1 class="text-xl sm:text-2xl font-black text-slate-900"><i class="fa-solid fa-chalkboard-user text-brandBlue mr-2"></i>Our Teaching Faculty</h1>
                        <p class="text-xs text-slate-500 mt-0.5">Dedicated subject mentors across Pre-Primary, Primary, High School &amp; Foundation Wings</p>
                    </div>
                    <span class="px-3.5 py-1.5 rounded-full bg-indigo-50 text-brandBlue text-[11px] font-black">Live Synced from School ERP</span>
                </div>
                <div id="page-faculty-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"></div>
            </div>
        </section>
    `,

    '/downloads': () => `
        ${pageBanner({
            category: 'Official Repository',
            title: 'Downloads, Circulars & Syllabus',
            subtitle: 'Filter and download official circulars, syllabi, exam timetables, and brochures.',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            ctaHtml: `<a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student', 'hallticket'); return false;" class="px-5 py-2.5 rounded-full bg-brandOrange text-white text-xs font-black">Download Hall Ticket</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div class="flex flex-wrap gap-1.5" id="dl-filter-pills">
                        <button type="button" onclick="filterDownloads('ALL')" class="dl-pill px-3.5 py-1.5 rounded-full text-xs font-black bg-brandBlue text-white">All</button>
                        <button type="button" onclick="filterDownloads('CIRCULAR')" class="dl-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-indigo-50">Circulars</button>
                        <button type="button" onclick="filterDownloads('SYLLABUS')" class="dl-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-indigo-50">Syllabus</button>
                        <button type="button" onclick="filterDownloads('TIMETABLE')" class="dl-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-indigo-50">Timetables</button>
                    </div>
                    <input id="dl-search-input" type="text" oninput="filterDownloads()" placeholder="Search circulars or documents..." class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue sm:w-64">
                </div>
                <div id="page-downloads-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
            </div>
        </section>
    `,

    '/contact': () => `
        ${pageBanner({ category: 'Campus Support', title: 'Contact Us & Visit Campus', subtitle: 'Connect with our Admissions, Principal, or Finance Desk in Narasannapeta.' })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
                    <h3 class="text-lg font-black text-slate-900">Campus Contact Details</h3>
                    <div class="space-y-3.5 text-xs sm:text-sm text-slate-700">
                        <p class="flex items-start gap-3"><i class="fa-solid fa-location-dot text-brandOrange mt-1 shrink-0"></i><span id="contact-address-val">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist., AP</span></p>
                        <p class="flex items-center gap-3"><i class="fa-solid fa-phone text-brandBlue shrink-0"></i><a id="contact-phone-val" href="tel:+919502924437" class="font-bold hover:text-brandBlue">+91 95029 24437</a></p>
                        <p class="flex items-center gap-3"><i class="fa-solid fa-envelope text-emerald-600 shrink-0"></i><a id="contact-email-val" href="mailto:info@svjyschool.edu.in" class="font-bold break-all hover:text-emerald-700">info@svjyschool.edu.in</a></p>
                        <p class="flex items-center gap-3"><i class="fa-solid fa-clock text-indigo-600 shrink-0"></i><span>Mon – Sat: 8:30 AM – 4:30 PM</span></p>
                    </div>
                    <div class="pt-2 border-t border-slate-100">
                        <h4 class="text-xs font-black text-slate-900 uppercase mb-3">Quick Inquiry / Callback</h4>
                        <form id="contact-whatsapp-form" class="space-y-3">
                            <input id="cnt-name" required type="text" placeholder="Your Name *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                            <input id="cnt-phone" required type="tel" placeholder="Mobile Number *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                            <textarea id="cnt-msg" required rows="3" placeholder="Message (Admissions / Fees / Transport)..." class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"></textarea>
                            <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer">
                                <i class="fa-brands fa-whatsapp text-base"></i> Send Inquiry on WhatsApp
                            </button>
                        </form>
                    </div>
                </div>
                <div class="lg:col-span-7">
                    <div id="map-container" class="rounded-3xl overflow-hidden border border-slate-200 shadow-xs h-80 sm:h-[430px] bg-[#EEF2FF] flex flex-col items-center justify-center text-center p-6 text-xs font-bold text-slate-600 gap-2">
                        <i class="fa-solid fa-map-location-dot text-4xl text-brandBlue"></i>
                        <span class="text-sm font-black text-slate-900">SVL Paradise Campus, Narasannapeta</span>
                        <span>Opposite Hero Showroom, Srikakulam District, Andhra Pradesh</span>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/pay-fees': () => `
        ${pageBanner({
            category: 'Online Fee Payment',
            title: 'Pay School Fees Online',
            subtitle: 'Verify live pending fees using Student Roll Number & Date of Birth, pay via School UPI QR or Bank Transfer, and submit UTR receipt directly to School Finance ERP.',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            ctaHtml: `<a href="#/admission/fee-structure" onclick="navigateTo('/admission/fee-structure'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-black hover:border-brandBlue">Fee Structure Overview</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="bg-white border border-emerald-200 rounded-3xl p-5 sm:p-7 shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Step 1 &bull; Student Verification</span>
                            <h2 class="text-lg font-black text-slate-900 mt-1">Fetch Pending Fee Balance</h2>
                        </div>
                        <span class="text-xs font-semibold text-slate-500"><i class="fa-solid fa-lock text-emerald-600 mr-1"></i>Connected to School Finance ERP</span>
                    </div>
                    <form id="fee-lookup-form" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Student Roll No *</label>
                            <input id="fee-roll" required type="text" placeholder="e.g. JY26-0001" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                        </div>
                        <div>
                            <label class="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Student Date of Birth *</label>
                            <input id="fee-dob" required type="date" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                        </div>
                        <button type="submit" id="fee-lookup-btn" class="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer transition w-full">
                            <i class="fa-solid fa-magnifying-glass mr-1.5"></i>Check Due &amp; Pay Now
                        </button>
                    </form>
                    <div id="fee-lookup-error" class="mt-4"></div>
                </div>

                <div id="fee-workspace" class="hidden space-y-6"></div>

                <div class="bg-gradient-to-r from-[#EEF2FF] via-white to-[#ECFDF5] border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="space-y-1">
                        <h3 class="text-sm font-black text-slate-900">Need Roll Number or Paying New Admission Fee?</h3>
                        <p class="text-xs text-slate-600">Reach out to our Finance Desk on WhatsApp or log into the Parent ERP portal.</p>
                    </div>
                    <div class="flex flex-wrap gap-2.5 shrink-0">
                        <a href="https://wa.me/919502924437?text=Hello!%20I%20need%20help%20with%20School%20Fee%20Payment." target="_blank" rel="noopener" class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition">
                            <i class="fa-brands fa-whatsapp mr-1.5"></i>Finance WhatsApp Help
                        </a>
                        <a href="http://66.116.252.191:19999/login" class="px-5 py-2.5 rounded-xl bg-white border border-indigo-200 text-brandBlue text-xs font-black hover:bg-indigo-50 transition">
                            Parent ERP Login
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `
};

const LEGACY_HASH_MAP = {
    '#student-portals': '/admission/existing-student',
    '#programs': '/student-life/academics',
    '#media-showcase': '/admission/campus',
    '#downloads-hub': '/downloads',
    '#contact-section': '/contact',
    '#toppers-section': '/facilities/awards',
    '#mission': '/student-life/academics',
};

window.CURRENT_ROUTE = '/home';

window.navigateTo = (rawRoute, subTab) => {
    let route = rawRoute || '/home';
    if (LEGACY_HASH_MAP[route]) route = LEGACY_HASH_MAP[route];
    route = route.replace(/^#/, '');
    if (!route || route === '/') route = '/home';
    if (!route.startsWith('/')) route = '/' + route;

    window.CURRENT_ROUTE = route;
    const expectedHash = '#' + route;
    if (window.location.hash !== expectedHash) {
        history.pushState(null, '', expectedHash);
    }

    const homeView = document.getElementById('home-view');
    const pageView = document.getElementById('page-view');
    if (!homeView || !pageView) return;

    document.querySelectorAll('.header-nav-link').forEach((el) => {
        const root = el.getAttribute('data-nav-root');
        const isActive = root === '/home' ? route === '/home' : route.startsWith(root);
        el.classList.toggle('bg-white/20', isActive);
        el.classList.toggle('text-white', isActive);
    });
    document.querySelectorAll('.bnav-item[data-bnav]').forEach((el) => {
        const b = el.getAttribute('data-bnav');
        const isActive = b === '/home'
            ? route === '/home'
            : (b === route || (b !== '/admission/existing-student' && route.startsWith(b) && route !== '/admission/existing-student'));
        el.classList.toggle('active', isActive);
    });

    if (route === '/home' || !PAGE_TEMPLATES[route]) {
        homeView.classList.remove('hidden');
        pageView.classList.add('hidden');
        pageView.innerHTML = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof window.hydrateAllViews === 'function') window.hydrateAllViews(route, subTab);
        return;
    }

    homeView.classList.add('hidden');
    pageView.innerHTML = PAGE_TEMPLATES[route]();
    pageView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window.hydrateAllViews === 'function') {
        window.hydrateAllViews(route, subTab);
    }
};

window.addEventListener('hashchange', () => {
    const h = window.location.hash || '#/home';
    if (h === '#hero-page-2' || h === '#hero-page-3') return;
    const target = LEGACY_HASH_MAP[h] || h.replace(/^#/, '') || '/home';
    if (target !== window.CURRENT_ROUTE) {
        window.navigateTo(target);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('hamburger-icon');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('open');
            if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
    }

    // Gentle auto-advance across the 3 hero slides while user hasn't clicked manually
    let currentSlide = 1;
    HERO_AUTO_TIMER = setInterval(() => {
        if (window.CURRENT_ROUTE === '/home') {
            currentSlide = (currentSlide % 3) + 1;
            window.switchHeroSlide(currentSlide, true);
        }
    }, 6500);

    const initHash = window.location.hash;
    if (initHash && initHash !== '#/home' && initHash !== '#hero-page-2' && initHash !== '#hero-page-3') {
        window.navigateTo(LEGACY_HASH_MAP[initHash] || initHash.replace(/^#/, ''));
    }
});
