// ═════════════════════════════════════════════════════════════════════════════
// JY SCHOOL WEBSITE — MULTI-PAGE ROUTER & DEDICATED PAGE TEMPLATES
// Strict Light Theme • Zero Dead Space • Full Header & Bottom Nav Integration
// ═════════════════════════════════════════════════════════════════════════════

// 1. Mobile & Hero UI Helpers
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

window.switchHeroSlide = (slideNum) => {
    const s1 = document.getElementById('hero-slide-1');
    const s2 = document.getElementById('hero-slide-2');
    const b1 = document.getElementById('slide-btn-1');
    const b2 = document.getElementById('slide-btn-2');
    if (!s1 || !s2) return;
    if (slideNum === 2) {
        s1.classList.add('hidden-slide');
        s2.classList.remove('hidden-slide');
        b2?.classList.add('bg-brandBlue', 'text-white');
        b2?.classList.remove('text-slate-600');
        b1?.classList.remove('bg-brandBlue', 'text-white');
        b1?.classList.add('text-slate-600');
    } else {
        s2.classList.add('hidden-slide');
        s1.classList.remove('hidden-slide');
        b1?.classList.add('bg-brandBlue', 'text-white');
        b1?.classList.remove('text-slate-600');
        b2?.classList.remove('bg-brandBlue', 'text-white');
        b2?.classList.add('text-slate-600');
    }
};

window.toggleFaq = (btn) => {
    const body = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-chevron');
    if (!body) return;
    const hidden = body.classList.toggle('hidden');
    if (icon) icon.style.transform = hidden ? 'rotate(0deg)' : 'rotate(180deg)';
};

// 2. Consistent Institutional Page Banner (Light Theme)
const pageBanner = ({ category, title, subtitle, badgeColor = 'bg-indigo-100 text-brandBlue', ctaHtml = '' }) => `
    <section class="bg-gradient-to-r from-[#EEF2FF] via-white to-[#FFF7ED] border-b border-indigo-100 py-7 sm:py-9">
        <div class="screen-fit flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <a href="#/home" onclick="navigateTo('/home'); return false;" class="hover:text-brandBlue"><i class="fa-solid fa-house mr-1"></i>Home</a>
                    <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                    <span class="text-slate-600">${category}</span>
                    <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                    <span class="text-brandBlue font-black">${title}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2.5">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeColor}">${category}</span>
                </div>
                <h1 class="section-title">${title}</h1>
                <p class="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">${subtitle}</p>
            </div>
            ${ctaHtml ? `<div class="flex flex-wrap gap-2.5 shrink-0">${ctaHtml}</div>` : ''}
        </div>
    </section>
`;

// 3. Dedicated Page Templates
const PAGE_TEMPLATES = {
    // ─────────────────────────────────────────────────────────────────────
    // ADMISSION SECTION PAGES
    // ─────────────────────────────────────────────────────────────────────
    '/admission/existing-student': () => `
        ${pageBanner({
            category: 'Admission & Parent Portals',
            title: 'Existing Student Self-Service Portal',
            subtitle: 'Verify Official Exam Marks Memos, Download Admit Cards / Hall Tickets, Track Admission Inquiries, or Pay Tuition Fees Online.',
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
                        <!-- Panel 1: Results -->
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

                        <!-- Panel 2: Hall Ticket -->
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

                        <!-- Panel 3: Admission Status -->
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

                <!-- Helpful Existing Student Links -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="bg-white border border-emerald-200 rounded-2xl p-5 hover-lift flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-qrcode text-xl"></i></div>
                        <div><h3 class="text-sm font-black text-slate-900">Pay School Fees Online</h3><p class="text-xs text-slate-500 mt-0.5">Instant due check &amp; UPI QR receipt upload</p></div>
                    </a>
                    <a href="#/downloads" onclick="navigateTo('/downloads'); return false;" class="bg-white border border-indigo-200 rounded-2xl p-5 hover-lift flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center shrink-0"><i class="fa-solid fa-file-pdf text-xl"></i></div>
                        <div><h3 class="text-sm font-black text-slate-900">Syllabus &amp; Exam Time Tables</h3><p class="text-xs text-slate-500 mt-0.5">Download circulars and term schedules</p></div>
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
            title: 'Admission Procedure & Guidelines',
            subtitle: 'Transparent, parent-friendly enrollment process for Academic Year 2026–2027 & 2027–2028 (Nursery to Class X).',
            ctaHtml: `
                <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="px-6 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black shadow-md hover:bg-blue-900 transition">Apply Online Now <i class="fa-solid fa-arrow-right ml-1"></i></a>
                <a href="#/admission/fee-structure" onclick="navigateTo('/admission/fee-structure'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-indigo-200 text-brandBlue text-xs font-black hover:bg-indigo-50 transition">View Fee Structure</a>
            `
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <!-- 4 Step Timeline -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-white border border-indigo-100 rounded-2xl p-6 hover-lift relative">
                        <span class="w-9 h-9 rounded-xl bg-brandBlue text-white font-black text-sm flex items-center justify-center mb-4">01</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Online / Campus Registration</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Fill out the digital Admission Registration form online or collect the prospectus at SVL Paradise Campus Admission Desk.</p>
                    </div>
                    <div class="bg-white border border-orange-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-brandOrange text-white font-black text-sm flex items-center justify-center mb-4">02</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Student Interaction &amp; Assessment</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Friendly age-appropriate readiness interaction for Nursery–Class II and foundational Maths/English baseline test for Classes III–X.</p>
                    </div>
                    <div class="bg-white border border-emerald-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">03</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Document Verification</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Submit Birth Certificate, Student/Parent Aadhar copies, previous class Progress Card, and Transfer Certificate (TC) for verification.</p>
                    </div>
                    <div class="bg-white border border-violet-100 rounded-2xl p-6 hover-lift">
                        <span class="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mb-4">04</span>
                        <h3 class="text-base font-black text-slate-900 mb-2">Fee Confirmation &amp; ERP ID</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Pay the admission &amp; Term-1 fee online or at the office to receive Student Roll No, ERP Login credentials, Uniform &amp; Bus Pass.</p>
                    </div>
                </div>

                <!-- Age Criteria & Required Documents -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                        <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-child text-brandBlue mr-2"></i>Class-Wise Age &amp; Eligibility Criteria</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr class="bg-indigo-50 text-brandBlue uppercase text-[11px] font-black">
                                        <th class="p-3 rounded-tl-xl">Grade / Class</th>
                                        <th class="p-3">Minimum Age (as on June 1)</th>
                                        <th class="p-3 rounded-tr-xl">Admission Requirement</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr><td class="p-3 font-bold text-slate-900">Nursery</td><td class="p-3">3+ Years</td><td class="p-3 text-slate-600">Birth Certificate + Informal Child Interaction</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">LKG &amp; UKG</td><td class="p-3">4+ / 5+ Years</td><td class="p-3 text-slate-600">Birth Certificate + Basic Readiness Check</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes I – V</td><td class="p-3">6+ to 10+ Years</td><td class="p-3 text-slate-600">Previous Class Report + TC (Class II onwards)</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes VI – VIII</td><td class="p-3">11+ to 13+ Years</td><td class="p-3 text-slate-600">Baseline Assessment + Original TC + PEN/APAAR</td></tr>
                                    <tr><td class="p-3 font-bold text-slate-900">Classes IX – X</td><td class="p-3">14+ to 15+ Years</td><td class="p-3 text-slate-600">Entrance Test + Board Transfer Norms + TC</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <h3 class="text-lg font-black text-slate-900"><i class="fa-solid fa-folder-open text-brandOrange mr-2"></i>Documents Checklist</h3>
                        <ul class="space-y-2.5 text-xs text-slate-700">
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Original Birth Certificate (for Nursery – Class I)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Original Transfer Certificate (TC) &amp; Bonafide (Class II – X)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Previous Academic Year Marks / Progress Card</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Student, Father &amp; Mother Aadhar Card Copies</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>Student PEN Number / APAAR ID / Child ID (if available)</span></li>
                            <li class="flex items-start gap-2.5"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>4 Recent Passport Size Color Photographs of Student</span></li>
                        </ul>
                        <div class="pt-2">
                            <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="w-full py-3 rounded-xl bg-brandBlue text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-900 transition">
                                Start Online Registration <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/campus': () => `
        ${pageBanner({
            category: 'Admission & Campus',
            title: 'School Campus & Virtual Gallery',
            subtitle: 'Explore SVL Paradise Campus, Narasannapeta — smart digital classrooms, modern laboratories, safe play arenas, and campus event highlights.',
            ctaHtml: `<a href="#/contact" onclick="navigateTo('/contact'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black shadow-sm">Schedule a Campus Visit</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
                    <div class="lg:col-span-6">
                        <img src="./image.png" alt="JY School Campus" class="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-md">
                    </div>
                    <div class="lg:col-span-6 space-y-4">
                        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">SVL Paradise Campus</span>
                        <h2 class="text-2xl font-black text-slate-900">Safe, Spacious &amp; Digitally Equipped Learning Environment</h2>
                        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Located opposite Hero Showroom in Narasannapeta, our multi-storey academic block offers ventilated classrooms, interactive smart boards, dedicated Physics/Chemistry/Biology &amp; CBT Computer Labs, 24/7 CCTV surveillance, RO drinking water stations, and spacious outdoor sports grounds.
                        </p>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div class="p-3 rounded-xl bg-indigo-50 text-center"><div class="text-lg font-black text-brandBlue">24/7</div><div class="text-[10px] font-bold text-slate-600">CCTV Campus</div></div>
                            <div class="p-3 rounded-xl bg-emerald-50 text-center"><div class="text-lg font-black text-emerald-700">100%</div><div class="text-[10px] font-bold text-slate-600">Smart Classrooms</div></div>
                            <div class="p-3 rounded-xl bg-amber-50 text-center"><div class="text-lg font-black text-amber-700">4 Labs</div><div class="text-[10px] font-bold text-slate-600">Science &amp; CBT</div></div>
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
                            <div><span class="text-[10px] font-black uppercase text-brandBlue">STEM &amp; Digital Lab</span><h4 class="font-black text-slate-900 text-base mt-1">Modern Science &amp; CBT Computer Labs</h4><p class="text-xs text-slate-600 mt-1">Hands-on Physics, Chemistry &amp; weekly NTA-pattern mock exam computer lab.</p></div>
                        </div>
                        <div class="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 p-6 flex flex-col justify-between hover-lift">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4"><i class="fa-solid fa-futbol text-lg"></i></div>
                            <div><span class="text-[10px] font-black uppercase text-emerald-700">Sports &amp; Yoga</span><h4 class="font-black text-slate-900 text-base mt-1">Playground &amp; Physical Fitness Arena</h4><p class="text-xs text-slate-600 mt-1">Dedicated sports coaching, morning assembly drills &amp; annual inter-house championships.</p></div>
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
            subtitle: 'Submit your child\'s admission application directly to the JY School ERP Admissions Office. Instant application receipt generated upon submission.',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            ctaHtml: `<a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student', 'admission'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-black hover:border-brandBlue">Track Existing Application</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <!-- Live Registration Form (8 cols) -->
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
                                <div class="sm:col-span-2">
                                    <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Previous School Name (if applicable)</label>
                                    <input id="adm-previousSchool" type="text" placeholder="Previous school &amp; city" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brandBlue">
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-base font-black text-brandBlue border-b border-slate-100 pb-2 mb-4"><i class="fa-solid fa-users mr-2"></i>2. Parent / Guardian Details &amp; Address</h3>
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
                            <span>I confirm that the above details are accurate and authorize Sri Venkateswara JY School Admissions Desk to contact me for admission assessment &amp; document verification.</span>
                        </label>

                        <button type="submit" id="adm-submit-btn" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brandBlue hover:bg-blue-900 text-white text-xs sm:text-sm font-black shadow-lg transition cursor-pointer">
                            <i class="fa-solid fa-paper-plane mr-2"></i>Submit Admission Application
                        </button>
                    </form>
                    <div id="public-admission-result" class="mt-6"></div>
                </div>

                <!-- Right Sidebar (4 cols) -->
                <div class="lg:col-span-4 space-y-4">
                    <div class="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 space-y-3">
                        <h3 class="text-base font-black text-slate-900"><i class="fa-solid fa-headset text-brandBlue mr-2"></i>Admissions Helpdesk</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Need help choosing the right foundation track (IIT-JEE, NEET, or Navodaya) or checking bus route availability?</p>
                        <div class="text-xs font-bold text-slate-800 space-y-1.5 pt-1">
                            <div><i class="fa-solid fa-phone text-brandBlue mr-2"></i> +91 95029 24437</div>
                            <div><i class="fa-solid fa-clock text-brandOrange mr-2"></i> Mon–Sat: 8:30 AM – 4:30 PM</div>
                        </div>
                        <a href="https://wa.me/919502924437?text=Hello!%20I%20need%20help%20with%20JY%20School%20Online%20Admission." target="_blank" rel="noopener"
                           class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition">
                            <i class="fa-brands fa-whatsapp text-base"></i> Chat with Admissions Desk
                        </a>
                    </div>

                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <h3 class="text-sm font-black text-slate-900">Already Applied?</h3>
                        <p class="text-xs text-slate-500">Check your live inquiry/approval status anytime using your registered mobile number.</p>
                        <a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student', 'admission'); return false;"
                           class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-brandBlue text-xs font-black flex items-center justify-center gap-2 transition">
                            Track Application Status &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/fee-structure': () => `
        ${pageBanner({
            category: 'Admission & Finance',
            title: 'Fee Structure & Payment Schedule',
            subtitle: 'Clear, transparent academic fee schedule across all wings with flexible term installments and instant online UPI/QR payment support.',
            ctaHtml: `<a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition"><i class="fa-solid fa-indian-rupee-sign mr-1.5"></i>Pay Fees Online Now</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-white border border-blue-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-blue-50 text-brandBlue text-[10px] font-black">PRE-PRIMARY</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Nursery, LKG &amp; UKG</h3>
                            <p class="text-xs text-slate-500 mt-1">Activity kits, phonics material &amp; smart class included</p>
                            <div class="my-4 py-3 border-y border-slate-100">
                                <div class="text-xs text-slate-500">Payable in 3 Easy Terms</div>
                                <div class="text-lg font-black text-brandBlue mt-0.5">Prospectus on Inquiry</div>
                            </div>
                        </div>
                        <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="py-2.5 rounded-xl bg-indigo-50 text-brandBlue text-xs font-black text-center hover:bg-brandBlue hover:text-white transition">Apply for Pre-Primary</a>
                    </div>
                    <div class="bg-white border border-orange-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-orange-50 text-brandOrange text-[10px] font-black">PRIMARY WING</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes I to V</h3>
                            <p class="text-xs text-slate-500 mt-1">Core State syllabus, Abacus/Olympiad basics &amp; labs</p>
                            <div class="my-4 py-3 border-y border-slate-100">
                                <div class="text-xs text-slate-500">Payable in 3 Easy Terms</div>
                                <div class="text-lg font-black text-brandOrange mt-0.5">Scholarships Eligible</div>
                            </div>
                        </div>
                        <a href="#/admission/register" onclick="navigateTo('/admission/register'); return false;" class="py-2.5 rounded-xl bg-orange-50 text-brandOrange text-xs font-black text-center hover:bg-brandOrange hover:text-white transition">Apply for Primary</a>
                    </div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">MIDDLE &amp; FOUNDATION</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes VI to VIII</h3>
                            <p class="text-xs text-slate-500 mt-1">Integrated IIT-JEE / NEET / Navodaya Foundation + CBT tests</p>
                            <div class="my-4 py-3 border-y border-slate-100">
                                <div class="text-xs text-slate-500">Merit Waivers Up to 50%</div>
                                <div class="text-lg font-black text-emerald-700 mt-0.5">Term-Wise Installments</div>
                            </div>
                        </div>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black text-center hover:bg-emerald-600 hover:text-white transition">Check Student Fee Due</a>
                    </div>
                    <div class="bg-white border border-purple-200 rounded-3xl p-6 hover-lift flex flex-col justify-between">
                        <div>
                            <span class="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black">HIGH SCHOOL</span>
                            <h3 class="text-lg font-black text-slate-900 mt-3">Classes IX &amp; X (SSC)</h3>
                            <p class="text-xs text-slate-500 mt-1">Board mentorship, Grand Tests, Study Materials &amp; Career Prep</p>
                            <div class="my-4 py-3 border-y border-slate-100">
                                <div class="text-xs text-slate-500">Topper Fee Concessions</div>
                                <div class="text-lg font-black text-purple-700 mt-0.5">Live ERP Fee Ledger</div>
                            </div>
                        </div>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="py-2.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-black text-center hover:bg-purple-600 hover:text-white transition">Pay High School Fee</a>
                    </div>
                </div>

                <!-- Installment Schedule & Payment Policy -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6">
                        <h3 class="text-base font-black text-slate-900 mb-4"><i class="fa-solid fa-calendar-check text-brandBlue mr-2"></i>Standard Term Payment Windows</h3>
                        <div class="space-y-3 text-xs">
                            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div><strong class="text-slate-900 block">Term 1 Installment (Admission / Re-opening)</strong><span class="text-slate-500">40% of Annual Tuition + Books/Kit</span></div>
                                <span class="px-3 py-1 rounded-full bg-indigo-100 text-brandBlue font-black">June 1 – June 20</span>
                            </div>
                            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div><strong class="text-slate-900 block">Term 2 Installment (Mid-Year)</strong><span class="text-slate-500">35% of Annual Tuition + Exam Fee</span></div>
                                <span class="px-3 py-1 rounded-full bg-orange-100 text-brandOrange font-black">Oct 1 – Oct 20</span>
                            </div>
                            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div><strong class="text-slate-900 block">Term 3 Installment (Final Term)</strong><span class="text-slate-500">25% Final Tuition Clearance</span></div>
                                <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black">Jan 1 – Jan 20</span>
                            </div>
                        </div>
                    </div>
                    <div class="lg:col-span-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-6 space-y-4">
                        <h3 class="text-base font-black text-slate-900"><i class="fa-solid fa-shield-check text-emerald-600 mr-2"></i>Online Fee Payment Benefits</h3>
                        <ul class="space-y-2 text-xs text-slate-700">
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Verify exact pending dues using Student Roll No &amp; DOB</li>
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Pay via PhonePe, Google Pay, Paytm UPI QR or Bank NEFT</li>
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Automatic sync with School Finance ERP &amp; printable PDF receipt</li>
                            <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Optional Transport Fee calculated by pickup stop distance</li>
                        </ul>
                        <a href="#/pay-fees" onclick="navigateTo('/pay-fees'); return false;" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition">
                            Open Online Fee Payment Portal <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `,

    '/admission/scholarships': () => `
        ${pageBanner({
            category: 'Admission',
            title: 'Merit Scholarships & Concessions',
            subtitle: 'Rewarding academic brilliance, Olympiad winners, deserving talent, and families with multiple children at JY School.',
            badgeColor: 'bg-amber-100 text-amber-800'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div class="bg-white border border-amber-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><i class="fa-solid fa-medal text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">JY Talent Search Exam (JYTSE)</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Students scoring 90%+ in the annual scholarship screening test receive 25% to 100% tuition fee waiver for the academic year.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black">Up to 100% Tuition Waiver</span>
                </div>
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-users text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">Sibling Fee Concession</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">When two or more siblings study together at Sri Venkateswara JY School, younger siblings receive dedicated annual tuition fee concession.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black">Family Support Grant</span>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-trophy text-xl"></i></div>
                    <h3 class="text-lg font-black text-slate-900">State / Olympiad &amp; Sports Merit</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">District &amp; State rank holders in Olympiads, JNVST qualifiers, and State-level Sports medalists receive special merit grants and trophies.</p>
                    <span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">Merit Recognition</span>
                </div>
            </div>
        </section>
    `,

    '/admission/faqs': () => `
        ${pageBanner({
            category: 'Admission',
            title: "Frequently Asked Questions (FAQ's)",
            subtitle: 'Quick answers for parents regarding admissions, school timings, IIT-JEE/NEET foundation, bus transport, and digital ERP fee payments.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit max-w-5xl space-y-3">
                ${[
                    ['What classes are offered at Sri Venkateswara JY School?', 'We offer English Medium co-education from Nursery, LKG, UKG, and Classes I to X, along with integrated IIT-JEE, NEET, Navodaya (JNVST), and Olympiad foundation programs starting from primary/middle school.'],
                    ['How can I apply for admission online?', 'Click on Admission Registration in the top menu (or bottom bar), fill in student and parent details, and submit. You will get an instant Application Reference ID and can track status anytime using your mobile number.'],
                    ['How do parents pay school fees online?', 'Click the "Pay Fees Online" button in the top or bottom navigation bar, enter your child\'s Roll Number and Date of Birth, select the pending fee installment, scan the school UPI QR code (or pay via Bank NEFT), and upload your UTR & payment screenshot.'],
                    ['What are the school timings?', 'Regular school hours run Monday to Saturday from 8:45 AM to 3:45 PM for Primary and up to 4:30 PM for High School / Foundation special coaching batches.'],
                    ['Is safe school bus transport available for nearby villages?', 'Yes! Our GPS-enabled bus fleet covers Narasannapeta Town, Polaki, Jalumuru, Kotabommali, Sarubujjili, and surrounding villages with verified drivers and attendants.'],
                    ['How do parents track attendance, homework, and exam marks?', 'Every parent receives login access to the JY School ERP Web Portal & Mobile App for real-time attendance alerts, daily homework, weekly slip test marks, and downloadable progress cards.']
                ].map(([q, a]) => `
                    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <button type="button" onclick="toggleFaq(this)" class="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 transition">
                            <span class="text-xs sm:text-sm font-black text-slate-900">${q}</span>
                            <i class="fa-solid fa-chevron-down text-xs text-brandBlue faq-chevron transition-transform shrink-0"></i>
                        </button>
                        <div class="hidden px-4 sm:px-5 pb-4 text-xs sm:text-[13px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3">${a}</div>
                    </div>
                `).join('')}
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
            subtitle: 'Official public holidays, festival breaks, and key examination windows for Academic Session 2026–2027.',
            ctaHtml: `<a href="#/downloads" onclick="navigateTo('/downloads'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black">Download Circular PDFs</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                        <h3 class="text-sm font-black text-slate-900"><i class="fa-solid fa-calendar-days text-brandBlue mr-2"></i>Scheduled School Holidays (AP Govt. &amp; Institutional)</h3>
                        <span class="px-3 py-1 rounded-full bg-indigo-100 text-brandBlue text-[10px] font-black">Session 2026–2027</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                                    <th class="p-3.5">Month / Date</th>
                                    <th class="p-3.5">Occasion / Holiday</th>
                                    <th class="p-3.5">Category</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr><td class="p-3.5 font-bold">June 12</td><td class="p-3.5 font-semibold text-slate-900">School Re-opening Day</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-brandBlue font-bold text-[10px]">Academic</span></td></tr>
                                <tr><td class="p-3.5 font-bold">August 15</td><td class="p-3.5 font-semibold text-slate-900">Independence Day Celebration</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-orange-50 text-brandOrange font-bold text-[10px]">National Event</span></td></tr>
                                <tr><td class="p-3.5 font-bold">September 05</td><td class="p-3.5 font-semibold text-slate-900">Teachers' Day &amp; Vinayaka Chavithi</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Festival</span></td></tr>
                                <tr><td class="p-3.5 font-bold">October 02</td><td class="p-3.5 font-semibold text-slate-900">Gandhi Jayanti</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-orange-50 text-brandOrange font-bold text-[10px]">National Holiday</span></td></tr>
                                <tr><td class="p-3.5 font-bold">October (10 Days)</td><td class="p-3.5 font-semibold text-slate-900">Dasara / Vijaya Dashami Vacation</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">Term Break</span></td></tr>
                                <tr><td class="p-3.5 font-bold">November</td><td class="p-3.5 font-semibold text-slate-900">Deepavali Festival Holiday</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Festival</span></td></tr>
                                <tr><td class="p-3.5 font-bold">December 25</td><td class="p-3.5 font-semibold text-slate-900">Christmas Holiday</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Festival</span></td></tr>
                                <tr><td class="p-3.5 font-bold">January (8 Days)</td><td class="p-3.5 font-semibold text-slate-900">Sankranti / Pongal Holidays</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">Term Break</span></td></tr>
                                <tr><td class="p-3.5 font-bold">January 26</td><td class="p-3.5 font-semibold text-slate-900">Republic Day Flag Hoisting</td><td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-orange-50 text-brandOrange font-bold text-[10px]">National Event</span></td></tr>
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
            title: 'Academics, Curriculum & Policies',
            subtitle: 'Structured State Board / SSC academics seamlessly integrated with IIT-JEE, NEET, Navodaya, and National Olympiad coaching.',
            ctaHtml: `<a href="#/admission/existing-student" onclick="navigateTo('/admission/existing-student'); return false;" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black">View Exam Results &amp; Hall Tickets</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div id="page-programs-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>

                <!-- CCE & Competitive Evaluation -->
                <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div class="space-y-3">
                        <span class="px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black uppercase">Assessment Framework</span>
                        <h3 class="text-xl font-black text-slate-900">CCE Evaluation + Weekly OMR &amp; CBT Grand Tests</h3>
                        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Every student undergoes Continuous &amp; Comprehensive Evaluation (FA-1 to FA-4 and SA-1, SA-2) paired with weekly objective OMR &amp; computer-based mock tests to eliminate exam fear and build competitive accuracy.
                        </p>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
                        <div class="p-3.5 rounded-2xl bg-indigo-50"><div class="font-black text-brandBlue text-base">FA-1 to 4</div><div class="text-slate-600 mt-0.5">Formative Tests</div></div>
                        <div class="p-3.5 rounded-2xl bg-emerald-50"><div class="font-black text-emerald-700 text-base">SA-1 &amp; 2</div><div class="text-slate-600 mt-0.5">Summative Exams</div></div>
                        <div class="p-3.5 rounded-2xl bg-amber-50 col-span-2 sm:col-span-1"><div class="font-black text-amber-700 text-base">Weekly CBT</div><div class="text-slate-600 mt-0.5">JEE/NEET Practice</div></div>
                    </div>
                </div>

                <!-- CMS Custom Academic Pages & Policies -->
                <div>
                    <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-book-open text-brandBlue mr-2"></i>Academic Policies &amp; Curriculum Guides</h3>
                    <div id="page-custom-pages-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>
                </div>
            </div>
        </section>
    `,

    '/student-life/sports': () => `
        ${pageBanner({
            category: 'Student Life',
            title: 'Sports & Physical Education',
            subtitle: 'Developing physical stamina, teamwork, sportsmanship, and leadership through structured daily games and annual athletic championships.',
            badgeColor: 'bg-emerald-100 text-emerald-800'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${[
                    ['fa-person-running', 'bg-emerald-600', 'Athletics & Track Events', 'Daily warm-up drills, sprint tracks, relay races, and inter-house athletic championships.'],
                    ['fa-volleyball', 'bg-brandBlue', 'Outdoor Team Sports', 'Dedicated courts and coaching for Volleyball, Kho-Kho, Kabaddi, and Cricket practice nets.'],
                    ['fa-chess', 'bg-brandOrange', 'Indoor Mind Sports & Yoga', 'Chess, Carroms, Table Tennis, and guided morning Yoga/Pranayama for concentration &amp; calm.']
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
        ${pageBanner({
            category: 'Student Life',
            title: 'Cultural, Arts & Literary Life',
            subtitle: 'Celebrating creativity, heritage, public speaking, music, dance, and scientific curiosity throughout the academic year.',
            badgeColor: 'bg-rose-100 text-rose-800'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                ${[
                    ['fa-masks-theater', 'text-rose-600 bg-rose-50', 'Annual Day & Stage Arts', 'Drama, classical & folk dance, skits, and confidence-building stage performances.'],
                    ['fa-microphone-lines', 'text-brandBlue bg-indigo-50', 'Debate & Elocution', 'English & Telugu elocution, essay writing, and anchoring clubs to build oratorical poise.'],
                    ['fa-flask-vial', 'text-emerald-700 bg-emerald-50', 'Science & STEM Expo', 'Annual student model exhibitions, working robotics demos, and quiz competitions.'],
                    ['fa-palette', 'text-amber-700 bg-amber-50', 'Fine Arts & Festivals', 'Drawing, rangoli, craft workshops, Sankranti, Teachers Day, and Children\'s Day galas.']
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
        ${pageBanner({
            category: 'Student Life',
            title: 'In-School Student Services',
            subtitle: 'Thoughtful campus amenities designed for student comfort, hygiene, safety, and seamless parent communication.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${[
                    ['fa-tv', 'text-brandBlue bg-indigo-50', 'Interactive Smart Classrooms', 'Audio-visual digital teaching boards making complex Maths & Science concepts intuitive.'],
                    ['fa-droplet', 'text-sky-600 bg-sky-50', 'Purified RO Drinking Water', 'Multi-stage UV+RO chilled drinking water stations monitored daily on every floor.'],
                    ['fa-mobile-screen-button', 'text-emerald-700 bg-emerald-50', 'JY School ERP & Parent App', 'Live notifications for attendance, homework, gate passes, fee receipts, and exam reports.'],
                    ['fa-book', 'text-brandOrange bg-orange-50', 'Stationery & Textbooks Desk', 'Convenient on-campus supply of notebooks, IIT/NEET foundation modules, and school diaries.'],
                    ['fa-id-badge', 'text-purple-700 bg-purple-50', 'Digital ID & Gate Pass Security', 'Strict visitor verification & digital student gate-pass approvals before early pickups.'],
                    ['fa-utensils', 'text-amber-700 bg-amber-50', 'Hygienic Dining Area', 'Clean supervised lunch halls encouraging healthy home-cooked meals and table etiquette.']
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
        ${pageBanner({
            category: 'Student Life',
            title: 'School Uniform & Dress Code',
            subtitle: 'Neat, comfortable institutional uniform fostering equality, pride, and campus discipline across all wings.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 space-y-4">
                    <span class="px-3 py-1 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black uppercase">Mon, Tue, Thu &amp; Fri</span>
                    <h3 class="text-lg font-black text-slate-900">Regular Academic Uniform</h3>
                    <ul class="space-y-2.5 text-xs text-slate-700">
                        <li><strong>Boys (Nursery – V):</strong> School check shirt with emblem, navy/bottle-green shorts, striped tie, school belt, black shoes &amp; white socks.</li>
                        <li><strong>Boys (VI – X):</strong> Tailored school shirt with emblem, formal full trousers, school tie, belt, black formal shoes &amp; ID card.</li>
                        <li><strong>Girls (Nursery – V):</strong> Pinafore / divided skirt with school blouse, belt, tie, black shoes &amp; neat ribbons.</li>
                        <li><strong>Girls (VI – X):</strong> Tunic / Salwar Kurta with school waistcoat/dupatta, black shoes, and braided hair.</li>
                    </ul>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 space-y-4">
                    <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Wednesday &amp; Saturday</span>
                    <h3 class="text-lg font-black text-slate-900">House &amp; Sports Uniform + Grooming</h3>
                    <ul class="space-y-2.5 text-xs text-slate-700">
                        <li><strong>House T-Shirt:</strong> Color-coded Polo T-shirt (Vivekananda Blue, Kalam Gold, Tagore Green, Raman Red) with House crest.</li>
                        <li><strong>Track Pants &amp; Shoes:</strong> Comfortable navy/white sports track pants paired with clean white canvas PT shoes &amp; white socks.</li>
                        <li><strong>Mandatory School ID Card:</strong> Students must wear their official barcode/QR School ID card daily inside campus &amp; bus.</li>
                        <li><strong>Grooming:</strong> Short trimmed hair for boys; neatly plaited hair for girls; nails trimmed cleanly.</li>
                    </ul>
                </div>
            </div>
        </section>
    `,

    '/student-life/co-curricular': () => `
        ${pageBanner({
            category: 'Student Life',
            title: 'Co-Curricular Clubs & Skill Labs',
            subtitle: 'Beyond textbooks: nurturing problem solvers, coders, communicators, and confident young leaders.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${[
                    ['fa-robot', 'bg-brandBlue', 'Robotics & Coding Club', 'Hands-on logical thinking, basic programming, electronics kits &amp; digital fluency.'],
                    ['fa-calculator', 'bg-brandOrange', 'Abacus & Vedic Maths', 'Rapid mental calculation techniques improving speed &amp; accuracy in Olympiads.'],
                    ['fa-brain', 'bg-emerald-600', 'Olympiad & Quiz Society', 'Weekly logical reasoning, IMO/NSO preparation, and inter-school quiz practice.'],
                    ['fa-leaf', 'bg-teal-600', 'Eco & Green Campus Club', 'Tree plantation drives, campus cleanliness, water conservation &amp; environmental awareness.'],
                    ['fa-comments', 'bg-violet-600', 'Spoken English Studio', 'Vocabulary building, pronunciation, reading fluency &amp; stage presentation skills.'],
                    ['fa-hands-holding-child', 'bg-rose-600', 'Value Education & Leadership', 'Civic sense, empathy, peer mentorship, and Student Council leadership responsibilities.']
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
        ${pageBanner({
            category: 'Student Life',
            title: 'Student Houses & Leadership System',
            subtitle: 'Every student belongs to one of four vibrant Houses, building team spirit across academics, sports, and cultural competitions.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div class="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-lg">V</div>
                    <h3 class="text-lg font-black text-blue-900">Vivekananda House</h3>
                    <p class="text-[11px] font-black text-blue-700 uppercase">Motto: Arise, Awake &amp; Excel</p>
                    <p class="text-xs text-slate-600">Focuses on fearlessness, moral strength, discipline, and dedicated academic focus.</p>
                </div>
                <div class="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">K</div>
                    <h3 class="text-lg font-black text-amber-900">APJ Kalam House</h3>
                    <p class="text-[11px] font-black text-amber-700 uppercase">Motto: Dream, Innovate, Achieve</p>
                    <p class="text-xs text-slate-600">Champions scientific curiosity, STEM innovation, perseverance, and big dreams.</p>
                </div>
                <div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">T</div>
                    <h3 class="text-lg font-black text-emerald-900">Tagore House</h3>
                    <p class="text-[11px] font-black text-emerald-700 uppercase">Motto: Harmony, Art &amp; Wisdom</p>
                    <p class="text-xs text-slate-600">Celebrates literature, fine arts, music, creativity, and inclusive harmony.</p>
                </div>
                <div class="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-lg">R</div>
                    <h3 class="text-lg font-black text-rose-900">CV Raman House</h3>
                    <p class="text-[11px] font-black text-rose-700 uppercase">Motto: Discover Through Inquiry</p>
                    <p class="text-xs text-slate-600">Inspires analytical experimentation, Olympiad excellence, and logical discovery.</p>
                </div>
            </div>
        </section>
    `,

    // ─────────────────────────────────────────────────────────────────────
    // FACILITIES SECTION PAGES
    // ─────────────────────────────────────────────────────────────────────
    '/facilities/laboratory': () => `
        ${pageBanner({
            category: 'Facilities',
            title: 'Science & CBT Computer Laboratories',
            subtitle: 'Well-equipped experimental labs enabling students to observe, test, and experience science & technology firsthand.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-2 gap-5">
                ${[
                    ['fa-magnet', 'bg-brandBlue', 'Physics Laboratory', 'Optics benches, electrical circuits, mechanics apparatus, and precision measuring instruments for Classes VI–X &amp; JEE/NEET Foundation.'],
                    ['fa-flask-vial', 'bg-brandOrange', 'Chemistry Laboratory', 'Safe fume-ventilated demonstration stations, titration setups, salt analysis kits, and standard laboratory glassware.'],
                    ['fa-microscope', 'bg-emerald-600', 'Biology Laboratory', 'Compound microscopes, anatomical models, permanent specimen slides, and botanical displays supporting NEET foundation learners.'],
                    ['fa-desktop', 'bg-indigo-600', 'Digital Computer & CBT Exam Lab', 'High-speed networked systems for coding, MS Office skills, and NTA-style online competitive mock tests.']
                ].map(([ic, bg, t, d]) => `
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 hover-lift flex items-start gap-4">
                        <div class="w-13 h-13 p-3.5 rounded-2xl ${bg} text-white flex items-center justify-center shrink-0"><i class="fa-solid ${ic} text-xl"></i></div>
                        <div><h3 class="text-base font-black text-slate-900 mb-1.5">${t}</h3><p class="text-xs text-slate-600 leading-relaxed">${d}</p></div>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    '/facilities/library': () => `
        ${pageBanner({
            category: 'Facilities',
            title: 'Central & Digital Reference Library',
            subtitle: 'Quiet reading environment stocked with academic reference guides, IIT-JEE / NEET foundation books, storybooks, and dailies.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
                    <h3 class="text-lg font-black text-slate-900">Knowledge Resources for Every Class</h3>
                    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">Our library encourages independent reading habits right from Primary school through Class X, offering curriculum texts, encyclopedias, Olympiad workbooks, Navodaya guides, and bilingual newspapers.</p>
                    <div class="grid grid-cols-3 gap-3 pt-2">
                        <div class="p-4 rounded-2xl bg-indigo-50 text-center"><div class="text-xl font-black text-brandBlue">5,000+</div><div class="text-[10px] font-bold text-slate-600">Books &amp; Modules</div></div>
                        <div class="p-4 rounded-2xl bg-amber-50 text-center"><div class="text-xl font-black text-amber-700">JEE/NEET</div><div class="text-[10px] font-bold text-slate-600">Reference Shelf</div></div>
                        <div class="p-4 rounded-2xl bg-emerald-50 text-center"><div class="text-xl font-black text-emerald-700">Weekly</div><div class="text-[10px] font-bold text-slate-600">Library Periods</div></div>
                    </div>
                </div>
                <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                    <h3 class="text-base font-black text-slate-900">Library Guidelines</h3>
                    <ul class="space-y-2.5 text-xs text-slate-600">
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>All classes have scheduled weekly reading &amp; borrowing slots.</li>
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>Strict silence and careful book handling inside the reading hall.</li>
                        <li><i class="fa-solid fa-check text-emerald-600 mr-2"></i>7-day borrowing cycle using Student Library / ID card.</li>
                    </ul>
                </div>
            </div>
        </section>
    `,

    '/facilities/medical': () => `
        ${pageBanner({
            category: 'Facilities',
            title: 'Medical Care & Student Wellness',
            subtitle: 'Prompt first-aid attention, periodic health checkups, and immediate parent communication for complete peace of mind.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="bg-white border border-rose-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center"><i class="fa-solid fa-kit-medical text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">On-Campus First-Aid Room</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Stocked medical bay with resting beds, antiseptic kits, digital thermometer, BP/oximeter, and trained staff care.</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-stethoscope text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">Annual Health &amp; Eye Screening</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Periodic dental, vision, height/weight, and general physician health camps conducted on campus with parent reports.</p>
                </div>
                <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-phone-volume text-xl"></i></div>
                    <h3 class="text-base font-black text-slate-900">Emergency Rapid Alert</h3>
                    <p class="text-xs text-slate-600 leading-relaxed">Instant phone notification to parents and nearby hospital tie-up in Narasannapeta for urgent medical attention.</p>
                </div>
            </div>
        </section>
    `,

    '/facilities/transport': () => `
        ${pageBanner({
            category: 'Facilities',
            title: 'GPS Transport & Bus Fleet',
            subtitle: 'Safe, punctual, GPS-monitored school buses connecting Narasannapeta and surrounding mandals right to the campus gate.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="bg-white border border-sky-200 rounded-3xl p-6 hover-lift space-y-2.5">
                        <div class="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center"><i class="fa-solid fa-location-crosshairs text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Live GPS Fleet Tracking</h3>
                        <p class="text-xs text-slate-600">Vehicles equipped with GPS, speed governors, first-aid box, and fire safety extinguishers.</p>
                    </div>
                    <div class="bg-white border border-indigo-200 rounded-3xl p-6 hover-lift space-y-2.5">
                        <div class="w-11 h-11 rounded-2xl bg-indigo-100 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-user-shield text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Verified Crew &amp; Attendants</h3>
                        <p class="text-xs text-slate-600">Experienced licensed drivers and trained bus attendants ensuring safe boarding &amp; drop-off.</p>
                    </div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 hover-lift space-y-2.5">
                        <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-id-card text-lg"></i></div>
                        <h3 class="text-base font-black text-slate-900">Digital Boarding Pass</h3>
                        <p class="text-xs text-slate-600">Each rider is mapped to a designated stop with clear route pass &amp; ERP transport ledger.</p>
                    </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-3xl p-6">
                    <h3 class="text-base font-black text-slate-900 mb-3"><i class="fa-solid fa-route text-brandOrange mr-2"></i>Major Route Corridors Covered</h3>
                    <div class="flex flex-wrap gap-2 text-xs font-bold">
                        ${['Narasannapeta Town &amp; Wards', 'Polaki &amp; Priyagraharam', 'Jalumuru &amp; Challavanipeta', 'Kotabommali', 'Sarubujjili', 'Urlam &amp; Mabagam', 'Madapam &amp; Makivalasa', 'Komarthi &amp; Satyavaram'].map(r => `
                            <span class="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"><i class="fa-solid fa-bus text-brandBlue mr-1.5"></i>${r}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
    `,

    '/facilities/awards': () => `
        ${pageBanner({
            category: 'Facilities & Pride',
            title: 'Scholarships, Awards & Toppers Hall',
            subtitle: 'Celebrating academic excellence, Board toppers, Olympiad gold medalists, and all-round student achievers.',
            badgeColor: 'bg-amber-100 text-amber-800'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <div>
                    <h3 class="text-lg font-black text-slate-900 mb-4"><i class="fa-solid fa-crown text-amber-500 mr-2"></i>Academic Toppers Hall of Fame</h3>
                    <div id="page-toppers-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="bg-white border border-amber-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">Academic Gold Medals</h4><p class="text-xs text-slate-600">Awarded to Class Toppers across Primary &amp; High School on Annual Day.</p></div>
                    <div class="bg-white border border-emerald-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">100% Attendance Honor</h4><p class="text-xs text-slate-600">Special certificates &amp; mementos recognizing dedication and punctuality.</p></div>
                    <div class="bg-white border border-indigo-200 rounded-3xl p-6 space-y-2"><h4 class="font-black text-slate-900 text-sm">Best All-Rounder Trophy</h4><p class="text-xs text-slate-600">Honoring balanced achievement across studies, sports, conduct, and leadership.</p></div>
                </div>
            </div>
        </section>
    `,

    '/facilities/counselling': () => `
        ${pageBanner({
            category: 'Facilities',
            title: 'Student & Parent Counselling Session',
            subtitle: 'Dedicated academic mentorship, career guidance for Engineering/Medical streams, and personalized study-habit counselling.'
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-brandBlue flex items-center justify-center"><i class="fa-solid fa-compass"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Academic &amp; Career Guidance</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Helping Classes VIII–X students choose between IIT-JEE, NEET, Civil Services, and foundation roadmaps.</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
                        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><i class="fa-solid fa-heart"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Exam Stress &amp; Confidence Care</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">One-on-one mentoring on time management, memory techniques, and overcoming test anxiety.</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 sm:col-span-2">
                        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><i class="fa-solid fa-handshake"></i></div>
                        <h3 class="text-sm font-black text-slate-900">Parent-Teacher Mentorship Meetings</h3>
                        <p class="text-xs text-slate-600 leading-relaxed">Monthly feedback reviews combining FA/SA marks analytics, attendance, and tailored home-study plans.</p>
                    </div>
                </div>
                <div class="lg:col-span-5 bg-white border border-indigo-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 class="text-base font-black text-slate-900">Book a Counselling Session</h3>
                    <form id="counselling-form" class="space-y-3">
                        <input id="cns-name" required type="text" placeholder="Parent / Student Name *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                        <input id="cns-phone" required type="tel" placeholder="Mobile Number *" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                        <select id="cns-topic" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                            <option value="Admission & Class Placement">Admission &amp; Class Placement</option>
                            <option value="IIT-JEE / NEET / Navodaya Track">IIT-JEE / NEET / Navodaya Track</option>
                            <option value="Academic Performance Review">Academic Performance Review</option>
                            <option value="Student Emotional / Study Support">Student Study &amp; Confidence Support</option>
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
    // STAFFS, DOWNLOADS, CONTACT
    // ─────────────────────────────────────────────────────────────────────
    '/staffs': () => `
        ${pageBanner({
            category: 'Leadership & Faculty',
            title: 'Distinguished Faculty & Staff Directory',
            subtitle: 'Meet our dedicated educators, IIT-JEE/NEET foundation mentors, and academic leadership shaping every student\'s success.',
            ctaHtml: `<a href="http://66.116.252.191:19999/login" class="px-5 py-2.5 rounded-full bg-brandBlue text-white text-xs font-black"><i class="fa-solid fa-right-to-bracket mr-1.5"></i>Teacher / Staff ERP Login</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-8">
                <!-- Principal Desk Card -->
                <div class="bg-gradient-to-r from-[#EEF2FF] via-white to-[#FFF7ED] border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
                    <img id="page-principal-photo" src="./logo_.png" alt="Principal" class="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md shrink-0">
                    <div class="space-y-2">
                        <span class="text-[11px] font-black text-brandOrange uppercase tracking-widest">From the Principal's Desk</span>
                        <h3 id="page-principal-name" class="text-xl font-black text-slate-900">Principal, Sri Venkateswara JY School</h3>
                        <p id="page-principal-message" class="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                            "Our faculty combines subject mastery with warmth and personal mentorship—ensuring every learner builds strong foundations and lifelong confidence."
                        </p>
                    </div>
                </div>

                <div>
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <h3 class="text-lg font-black text-slate-900"><i class="fa-solid fa-chalkboard-user text-brandBlue mr-2"></i>Our Teaching Faculty</h3>
                        <span class="text-xs font-bold text-slate-500">Live synced from School ERP Staff Roster</span>
                    </div>
                    <div id="page-faculty-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
                </div>
            </div>
        </section>
    `,

    '/downloads': () => `
        ${pageBanner({
            category: 'Official Repository',
            title: 'Downloads, Circulars & Syllabus',
            subtitle: 'Access latest school notices, term syllabi, exam timetables, brochures, and official PDF documents.',
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
        ${pageBanner({
            category: 'Campus Support',
            title: 'Contact Us & Visit Campus',
            subtitle: 'Reach out to Sri Venkateswara JY School Admissions, Finance Desk, or Principal Office in Narasannapeta.'
        })}
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
                            <textarea id="cnt-msg" required rows="3" placeholder="Write your question (Admissions / Fees / Transport)..." class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"></textarea>
                            <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer">
                                <i class="fa-brands fa-whatsapp text-base"></i> Send Inquiry on WhatsApp
                            </button>
                        </form>
                    </div>
                </div>
                <div class="lg:col-span-7 space-y-4">
                    <div id="map-container" class="rounded-3xl overflow-hidden border border-slate-200 shadow-xs h-80 sm:h-[430px] bg-[#EEF2FF] flex flex-col items-center justify-center text-center p-6 text-xs font-bold text-slate-600 gap-2">
                        <i class="fa-solid fa-map-location-dot text-4xl text-brandBlue"></i>
                        <span class="text-sm font-black text-slate-900">SVL Paradise Campus, Narasannapeta</span>
                        <span>Opposite Hero Showroom, Srikakulam District, Andhra Pradesh</span>
                    </div>
                </div>
            </div>
        </section>
    `,

    // ─────────────────────────────────────────────────────────────────────
    // PAY FEES ONLINE — REAL ERP INTEGRATED PAYMENT PORTAL
    // ─────────────────────────────────────────────────────────────────────
    '/pay-fees': () => `
        ${pageBanner({
            category: 'Online Fee Payment',
            title: 'Pay School Fees Online',
            subtitle: 'Verify your child\'s live fee balance using Roll Number & Date of Birth, pay via School UPI QR / Bank Transfer, and submit UTR receipt directly to School Finance ERP.',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            ctaHtml: `<a href="#/admission/fee-structure" onclick="navigateTo('/admission/fee-structure'); return false;" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-black hover:border-brandBlue">Fee Structure Overview</a>`
        })}
        <section class="py-8 sm:py-10">
            <div class="screen-fit space-y-6">
                <!-- Step 1: Student Fee Lookup -->
                <div class="bg-white border border-emerald-200 rounded-3xl p-5 sm:p-7 shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Step 1 • Student Verification</span>
                            <h2 class="text-lg font-black text-slate-900 mt-1">Fetch Pending Fee Balance</h2>
                        </div>
                        <span class="text-xs font-semibold text-slate-500"><i class="fa-solid fa-lock text-emerald-600 mr-1"></i>Verified via School ERP Ledger</span>
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

                <!-- Step 2 & 3: Live Fee Workspace (Populated after Lookup) -->
                <div id="fee-workspace" class="hidden space-y-6"></div>

                <!-- General Payment Info Card (Always helpful) -->
                <div id="fee-general-help" class="bg-gradient-to-r from-[#EEF2FF] via-white to-[#ECFDF5] border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="space-y-1">
                        <h3 class="text-sm font-black text-slate-900">Need Roll Number or Paying New Admission Fee?</h3>
                        <p class="text-xs text-slate-600">New admission applicants can contact our Finance Desk or check status using mobile number.</p>
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

// Legacy anchor route map so old bookmarks work seamlessly
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

    // Update active indicators on Header & Bottom Nav
    document.querySelectorAll('.header-nav-link').forEach((el) => {
        const root = el.getAttribute('data-nav-root');
        const isActive = root === '/home' ? route === '/home' : route.startsWith(root);
        el.classList.toggle('bg-white/20', isActive);
        el.classList.toggle('text-white', isActive);
    });
    document.querySelectorAll('.bnav-item[data-bnav]').forEach((el) => {
        const b = el.getAttribute('data-bnav');
        const isActive = b === '/home' ? route === '/home' : (b === route || (b !== '/admission/existing-student' && route.startsWith(b) && route !== '/admission/existing-student'));
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
    if (h === '#home-page-2') return; // allow smooth scroll to Home Page 2
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

    const initHash = window.location.hash;
    if (initHash && initHash !== '#/home' && initHash !== '#home-page-2') {
        window.navigateTo(LEGACY_HASH_MAP[initHash] || initHash.replace(/^#/, ''));
    }
});
