// ═════════════════════════════════════════════════════════════════════════════
// JY SCHOOL WEBSITE — LIVE CMS SYNC, SELF-SERVICE PORTALS & FEE PAYMENT ENGINE
// ═════════════════════════════════════════════════════════════════════════════

// Relative paths on HTTPS (Vercel rewrites /api/* and /uploads/* to VPS) avoid Mixed Content blocks
const API_BASE = window.location.protocol === 'https:' ? '' : 'http://66.116.252.191:19998';

const resolveMediaUrl = (url) => {
    if (!url) return '';
    const s = String(url).trim();
    if (s.startsWith('data:')) return s;
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
    return ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` : '';
};

const getYoutubeThumb = (url) => {
    const ytMatch = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : '';
};

const fmtINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

let CMS_CACHE = null;
let FEE_LOOKUP_STATE = null; // Stores verified Roll/DOB + Fee Lookup response
let ACTIVE_DL_CAT = 'ALL';

// Portal Tab Switcher
window.switchPortalTab = (tabName) => {
    document.querySelectorAll('.portal-panel').forEach((el) => el.classList.add('hidden'));
    const target = document.getElementById(`portal-panel-${tabName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.portal-tab-btn').forEach((btn) => {
        btn.classList.remove('bg-brandBlue', 'text-white');
        btn.classList.add('text-slate-600');
    });
    const activeBtn = document.getElementById(`ptab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-brandBlue', 'text-white');
        activeBtn.classList.remove('text-slate-600');
    }
};

// Modals
window.openCustomPage = (slug) => {
    const page = (CMS_CACHE?.customPages || []).find((p) => p.slug === slug);
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
window.closeCustomPage = () => document.getElementById('custom-page-modal')?.classList.add('hidden');

window.openVideoModal = (title, url) => {
    const container = document.getElementById('video-player-container');
    document.getElementById('video-modal-title').textContent = title || 'Campus Video';
    const embed = toYoutubeEmbed(url);
    if (embed) {
        container.innerHTML = `<iframe class="w-full h-full" src="${esc(embed)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
        container.innerHTML = `<video controls autoplay class="w-full h-full bg-slate-100"><source src="${esc(url)}"></video>`;
    }
    document.getElementById('video-modal').classList.remove('hidden');
};
window.closeVideoModal = () => {
    const c = document.getElementById('video-player-container');
    if (c) c.innerHTML = '';
    document.getElementById('video-modal')?.classList.add('hidden');
};
window.openHeroVideo = () => {
    const url = CMS_CACHE?.settings?.heroVideoUrl;
    if (url) window.openVideoModal('Campus Virtual Tour', resolveMediaUrl(url));
};

window.copyText = (txt, btnEl) => {
    if (!txt) return;
    navigator.clipboard?.writeText(txt).then(() => {
        if (btnEl) {
            const orig = btnEl.innerHTML;
            btnEl.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Copied!';
            setTimeout(() => { btnEl.innerHTML = orig; }, 1800);
        }
    });
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
    blue: { card: 'from-blue-50 to-indigo-50 border-blue-100', iconBg: 'bg-brandBlue' },
    orange: { card: 'from-orange-50 to-amber-50 border-orange-100', iconBg: 'bg-brandOrange' },
    green: { card: 'from-emerald-50 to-teal-50 border-emerald-100', iconBg: 'bg-emerald-600' },
    purple: { card: 'from-purple-50 to-fuchsia-50 border-purple-100', iconBg: 'bg-purple-600' },
    cyan: { card: 'from-cyan-50 to-sky-50 border-cyan-100', iconBg: 'bg-cyan-600' },
    rose: { card: 'from-rose-50 to-pink-50 border-rose-100', iconBg: 'bg-rose-600' },
};

// Render Downloads Grid (with Filter + Search)
window.filterDownloads = (cat) => {
    if (cat) {
        ACTIVE_DL_CAT = cat;
        document.querySelectorAll('#dl-filter-pills .dl-pill').forEach((btn) => {
            const isMatch = btn.textContent.trim().toUpperCase().startsWith(cat === 'ALL' ? 'ALL' : cat.slice(0, 4));
            btn.classList.toggle('bg-brandBlue', isMatch);
            btn.classList.toggle('text-white', isMatch);
            btn.classList.toggle('bg-slate-100', !isMatch);
            btn.classList.toggle('text-slate-600', !isMatch);
        });
    }
    const grid = document.getElementById('page-downloads-grid');
    if (!grid) return;

    const q = (document.getElementById('dl-search-input')?.value || '').trim().toLowerCase();
    const cmsDownloads = (CMS_CACHE?.downloads || []).filter((d) => d.isActive !== false);
    const items = cmsDownloads.length > 0 ? cmsDownloads : [
        { title: '2027–2028 Online Admission Application', category: 'ADMISSION', fileUrl: '#/admission/register', publishDate: new Date().toISOString(), isInternal: '#/admission/register' },
        { title: 'Exam Hall Tickets & Admit Cards', category: 'TIMETABLE', fileUrl: '#/admission/existing-student', publishDate: new Date().toISOString(), isInternal: '#/admission/existing-student' },
        { title: 'Published Exam Results & Score Cards', category: 'CIRCULAR', fileUrl: '#/admission/existing-student', publishDate: new Date().toISOString(), isInternal: '#/admission/existing-student' },
        { title: 'IIT-JEE / NEET / SSC Integrated Syllabus Overview', category: 'SYLLABUS', fileUrl: '#/student-life/academics', publishDate: new Date().toISOString(), isInternal: '#/student-life/academics' },
    ];

    const filtered = items.filter((d) => {
        const matchCat = ACTIVE_DL_CAT === 'ALL' || String(d.category || '').toUpperCase().includes(ACTIVE_DL_CAT);
        const matchQ = !q || String(d.title || '').toLowerCase().includes(q) || String(d.category || '').toLowerCase().includes(q);
        return matchCat && matchQ;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-500">No documents match your filter.</div>`;
        return;
    }

    grid.innerHTML = filtered.map((d) => {
        if (d.isInternal) {
            return `
                <a href="${esc(d.isInternal)}" onclick="navigateTo('${esc(d.isInternal.replace(/^#/, ''))}'); return false;"
                   class="p-5 rounded-2xl bg-white border border-slate-200 hover-lift flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black">${esc(d.category)}</span>
                        <h4 class="font-bold text-slate-900 text-sm mt-2 truncate">${esc(d.title)}</h4>
                        <p class="text-[11px] text-slate-500 mt-0.5">Open Interactive Portal</p>
                    </div>
                    <span class="w-10 h-10 rounded-xl bg-brandBlue text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-arrow-right"></i></span>
                </a>`;
        }
        return `
            <a href="${esc(resolveMediaUrl(d.fileUrl))}" target="_blank" rel="noopener"
               class="p-5 rounded-2xl bg-white border border-slate-200 hover-lift flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">${esc(d.category)}</span>
                    <h4 class="font-bold text-slate-900 text-sm mt-2 truncate">${esc(d.title)}</h4>
                    <p class="text-[11px] text-slate-500 mt-0.5">Published: ${new Date(d.publishDate).toLocaleDateString('en-IN')}</p>
                </div>
                <span class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-download"></i></span>
            </a>`;
    }).join('');
};

// Render Program Cards Helper
const renderProgramsInto = (container, programs) => {
    if (!container || !Array.isArray(programs) || programs.length === 0) return;
    container.innerHTML = programs.map((p) => {
        const th = PROGRAM_STYLE_MAP[p.color] || PROGRAM_STYLE_MAP.blue;
        return `
            <div class="bg-gradient-to-br ${th.card} border rounded-2xl p-5 hover-lift">
                <div class="w-11 h-11 ${th.iconBg} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"><i class="fa-solid ${esc(p.icon || 'fa-book')}"></i></div>
                <h3 class="text-sm font-black text-slate-900 mb-1.5">${esc(p.title)}</h3>
                <p class="text-xs text-slate-600 leading-relaxed">${esc(p.description)}</p>
            </div>`;
    }).join('');
};

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE FEE PAYMENT WORKSPACE RENDERER & HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
window.selectFeeToPay = (feeId, maxDue) => {
    const sel = document.getElementById('pay-fee-structure-id');
    const amtInput = document.getElementById('pay-amount');
    if (sel) sel.value = feeId;
    if (amtInput && maxDue > 0) amtInput.value = maxDue;
    updateDynamicUpiQr();
    document.getElementById('fee-checkout-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.updateDynamicUpiQr = () => {
    const cfg = FEE_LOOKUP_STATE?.paymentConfig;
    const stu = FEE_LOOKUP_STATE?.student;
    if (!cfg) return;
    const amt = Number(document.getElementById('pay-amount')?.value || 0);
    const upiDeepLink = cfg.upiId
        ? `upi://pay?pa=${encodeURIComponent(cfg.upiId)}&pn=${encodeURIComponent(cfg.schoolName || 'JY School')}&tn=${encodeURIComponent(`Fee ${stu?.rollNo || ''}`)}&cu=INR${amt > 0 ? `&am=${amt}` : ''}`
        : '';

    const appBtn = document.getElementById('upi-app-deep-link');
    if (appBtn && upiDeepLink) appBtn.href = upiDeepLink;

    const qrImg = document.getElementById('school-qr-img');
    if (qrImg) {
        if (cfg.qrCodeUrl) {
            qrImg.src = resolveMediaUrl(cfg.qrCodeUrl);
        } else if (upiDeepLink) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`;
        }
    }
};

const renderFeeWorkspace = () => {
    const ws = document.getElementById('fee-workspace');
    if (!ws || !FEE_LOOKUP_STATE) return;
    const { student, summary, feeItems, recentPayments, paymentConfig } = FEE_LOOKUP_STATE;
    const unpaidItems = feeItems.filter((f) => f.amountDue > 0);
    const defaultFee = unpaidItems[0] || feeItems[0];

    ws.classList.remove('hidden');
    ws.innerHTML = `
        <!-- Student Info & Summary Banner -->
        <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-brandBlue font-black text-lg flex items-center justify-center shrink-0">
                        ${esc((student.name || 'S').charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900">${esc(student.name)}</h3>
                        <p class="text-xs font-semibold text-slate-500">
                            Roll No: <strong class="text-brandBlue">${esc(student.rollNo)}</strong> &bull;
                            Class: <strong>${esc(student.className || '-')}</strong> &bull;
                            Father: <strong>${esc(student.fatherName || '-')}</strong>
                        </p>
                    </div>
                </div>
                <span class="px-3.5 py-1.5 rounded-full bg-indigo-50 text-brandBlue text-xs font-black">AY ${esc(student.academicYear)}</span>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div class="text-[10px] font-black text-slate-500 uppercase">Total Applicable Fee</div>
                    <div class="text-xl font-black text-slate-900 mt-1">${fmtINR(summary.totalFee - summary.totalDiscount)}</div>
                </div>
                <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div class="text-[10px] font-black text-emerald-700 uppercase">Verified Paid</div>
                    <div class="text-xl font-black text-emerald-700 mt-1">${fmtINR(summary.totalPaid)}</div>
                </div>
                <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div class="text-[10px] font-black text-amber-700 uppercase">Pending Verification</div>
                    <div class="text-xl font-black text-amber-700 mt-1">${fmtINR(summary.totalPendingApproval)}</div>
                </div>
                <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <div class="text-[10px] font-black text-rose-700 uppercase">Balance Due</div>
                    <div class="text-xl font-black text-rose-700 mt-1">${fmtINR(summary.totalBalance)}</div>
                </div>
            </div>
        </div>

        <!-- Fee Items + Checkout Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left: Fee Breakdown & Payment History (7 cols) -->
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div class="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 class="text-sm font-black text-slate-900"><i class="fa-solid fa-file-invoice-dollar text-brandBlue mr-2"></i>Fee Heads &amp; Installments</h3>
                        <span class="text-[11px] font-bold text-slate-500">${feeItems.length} Fee Item(s)</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/70 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                                    <th class="p-3.5">Fee Head</th>
                                    <th class="p-3.5">Total</th>
                                    <th class="p-3.5">Paid</th>
                                    <th class="p-3.5">Due</th>
                                    <th class="p-3.5">Status</th>
                                    <th class="p-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${feeItems.length === 0 ? `
                                    <tr><td colspan="6" class="p-6 text-center text-slate-500 font-semibold">No fee structures assigned to this student/class yet. Please contact school finance desk.</td></tr>
                                ` : feeItems.map((fi) => {
                                    const badge = fi.status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : fi.status === 'PENDING_APPROVAL'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200';
                                    return `
                                        <tr class="hover:bg-slate-50/60">
                                            <td class="p-3.5">
                                                <div class="font-black text-slate-900">${esc(fi.name)}</div>
                                                <div class="text-[10px] text-slate-500">${esc(fi.term)} &bull; Due: ${new Date(fi.dueDate).toLocaleDateString('en-IN')}</div>
                                            </td>
                                            <td class="p-3.5 font-bold">${fmtINR(fi.effectiveAmount)}</td>
                                            <td class="p-3.5 font-bold text-emerald-700">${fmtINR(fi.paidAmount)}</td>
                                            <td class="p-3.5 font-black text-rose-700">${fmtINR(fi.amountDue)}</td>
                                            <td class="p-3.5"><span class="px-2 py-0.5 rounded-full border text-[10px] font-black ${badge}">${esc(fi.status.replace('_', ' '))}</span></td>
                                            <td class="p-3.5 text-right">
                                                ${fi.amountDue > 0 ? `
                                                    <button type="button" onclick="selectFeeToPay('${esc(fi.id)}', ${fi.amountDue})"
                                                            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer">
                                                        Pay Now
                                                    </button>
                                                ` : `<span class="text-[11px] font-bold text-emerald-600"><i class="fa-solid fa-circle-check mr-1"></i>Cleared</span>`}
                                            </td>
                                        </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Payment History -->
                <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div class="p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
                        <h3 class="text-sm font-black text-slate-900"><i class="fa-solid fa-clock-rotate-left text-brandOrange mr-2"></i>Recent Payment History</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/70 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                                    <th class="p-3">Date</th>
                                    <th class="p-3">Fee Head</th>
                                    <th class="p-3">Amount</th>
                                    <th class="p-3">Method / UTR</th>
                                    <th class="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${recentPayments.length === 0 ? `
                                    <tr><td colspan="5" class="p-5 text-center text-slate-500">No payments recorded yet.</td></tr>
                                ` : recentPayments.map((rp) => {
                                    const sb = rp.status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : rp.status === 'REJECTED'
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-amber-50 text-amber-700';
                                    return `
                                        <tr>
                                            <td class="p-3 whitespace-nowrap">${new Date(rp.paymentDate).toLocaleDateString('en-IN')}</td>
                                            <td class="p-3 font-bold text-slate-900">${esc(rp.feeName)}</td>
                                            <td class="p-3 font-black text-emerald-700">${fmtINR(rp.amountPaid)}</td>
                                            <td class="p-3"><span class="font-bold">${esc(rp.method)}</span>${rp.utrNumber ? ` <span class="text-slate-500">(${esc(rp.utrNumber)})</span>` : ''}</td>
                                            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-black ${sb}">${esc(rp.status)}</span></td>
                                        </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right: Checkout / Pay Now Box (5 cols) -->
            <div id="fee-checkout-box" class="lg:col-span-5 bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Step 2 • Instant Payment</span>
                        <h3 class="text-base font-black text-slate-900 mt-1">Scan &amp; Submit Payment Proof</h3>
                    </div>
                    <i class="fa-solid fa-shield-check text-2xl text-emerald-600"></i>
                </div>

                <!-- School UPI / QR / Bank Box -->
                <div class="bg-gradient-to-br from-[#ECFDF5] to-[#F8FAFF] border border-emerald-200 rounded-2xl p-4 space-y-3 text-center">
                    ${(paymentConfig.qrCodeUrl || paymentConfig.upiId) ? `
                        <img id="school-qr-img" src="${paymentConfig.qrCodeUrl ? esc(resolveMediaUrl(paymentConfig.qrCodeUrl)) : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${paymentConfig.upiId}&pn=${paymentConfig.schoolName || 'JY School'}&cu=INR`)}`}"
                             alt="School Fee Payment QR" class="w-40 h-40 mx-auto rounded-2xl bg-white p-2 border border-emerald-200 shadow-sm object-contain">
                        ${paymentConfig.upiId ? `
                            <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
                                <span class="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-800">${esc(paymentConfig.upiId)}</span>
                                <button type="button" onclick="copyText('${esc(paymentConfig.upiId)}', this)" class="px-3 py-1 rounded-lg bg-brandBlue text-white text-[11px] font-black cursor-pointer">
                                    <i class="fa-solid fa-copy mr-1"></i>Copy UPI
                                </button>
                                <a id="upi-app-deep-link" href="upi://pay?pa=${encodeURIComponent(paymentConfig.upiId)}&pn=${encodeURIComponent(paymentConfig.schoolName || 'JY School')}&cu=INR"
                                   class="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black">
                                    <i class="fa-solid fa-mobile-screen mr-1"></i>Open UPI App
                                </a>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="py-3 text-xs font-bold text-slate-600">
                            <i class="fa-solid fa-building-columns text-2xl text-brandBlue mb-2 block"></i>
                            Pay to School Official Account / Office &amp; enter your UTR reference below.
                        </div>
                    `}
                    ${paymentConfig.bankAccountNumber ? `
                        <div class="text-[11px] text-slate-600 bg-white/90 rounded-xl p-2.5 border border-slate-200 text-left space-y-0.5">
                            <div><strong>Bank:</strong> ${esc(paymentConfig.bankName || 'School Bank')}</div>
                            <div><strong>A/C No:</strong> ${esc(paymentConfig.bankAccountNumber)} &bull; <strong>IFSC:</strong> ${esc(paymentConfig.bankIfsc || '-')}</div>
                        </div>
                    ` : ''}
                </div>

                ${feeItems.length === 0 ? `
                    <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                        No active fee head found for this student. Contact Finance Office on +91 ${esc(paymentConfig.phone || '9502924437')}.
                    </div>
                ` : `
                    <form id="public-fee-pay-form" class="space-y-3.5">
                        <div>
                            <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Select Fee Head *</label>
                            <select id="pay-fee-structure-id" required onchange="const opt=this.selectedOptions[0]; if(opt && Number(opt.dataset.due)>0){ document.getElementById('pay-amount').value=opt.dataset.due; updateDynamicUpiQr(); }"
                                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                                ${feeItems.map((fi) => `<option value="${esc(fi.id)}" data-due="${fi.amountDue}" ${defaultFee && fi.id === defaultFee.id ? 'selected' : ''}>${esc(fi.name)} (${esc(fi.term)}) — Due: ${fmtINR(fi.amountDue)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Amount (₹) *</label>
                                <input id="pay-amount" required type="number" min="1" step="any" oninput="updateDynamicUpiQr()"
                                       value="${defaultFee && defaultFee.amountDue > 0 ? defaultFee.amountDue : (defaultFee?.effectiveAmount || '')}"
                                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-600">
                            </div>
                            <div>
                                <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Payment Mode *</label>
                                <select id="pay-method" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                                    <option value="UPI">UPI / PhonePe / GPay</option>
                                    <option value="BANK_TRANSFER">Bank NEFT / IMPS</option>
                                    <option value="ONLINE">Online Card / NetBanking</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">UTR / Transaction Reference No *</label>
                            <input id="pay-utr" required type="text" placeholder="e.g. 432198765432" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600">
                        </div>
                        <div>
                            <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Upload Payment Screenshot (Optional)</label>
                            <input id="pay-screenshot-file" type="file" accept="image/*" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold">
                        </div>
                        <div>
                            <label class="block text-[11px] font-black text-slate-600 uppercase mb-1">Remarks (Optional)</label>
                            <input id="pay-remarks" type="text" placeholder="Paid by parent" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                        </div>
                        <button type="submit" id="pay-submit-btn" class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer">
                            <i class="fa-solid fa-circle-check mr-1.5"></i>Submit Payment for Verification
                        </button>
                    </form>
                `}
                <div id="pay-submit-result"></div>
            </div>
        </div>
    `;

    updateDynamicUpiQr();
    bindPaySubmitForm();
};

const bindOnce = (formId, handler) => {
    const form = document.getElementById(formId);
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', handler);
};

const bindPaySubmitForm = () => {
    bindOnce('public-fee-pay-form', async (e) => {
        e.preventDefault();
        const out = document.getElementById('pay-submit-result');
        const btn = document.getElementById('pay-submit-btn');
        if (!FEE_LOOKUP_STATE) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Submitting Payment...';
        out.innerHTML = '';

        try {
            let screenshotUrl = null;
            const fileInput = document.getElementById('pay-screenshot-file');
            if (fileInput?.files?.[0]) {
                const fd = new FormData();
                fd.append('file', fileInput.files[0]);
                const upRes = await fetch(`${API_BASE}/api/uploads/share`, { method: 'POST', body: fd });
                const upJson = await upRes.json();
                if (upJson.success && upJson.data?.url) {
                    screenshotUrl = upJson.data.url;
                }
            }

            const res = await fetch(`${API_BASE}/api/website/public/fees/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rollNo: FEE_LOOKUP_STATE.student.rollNo,
                    dob: FEE_LOOKUP_STATE.student.dob,
                    feeStructureId: document.getElementById('pay-fee-structure-id').value,
                    amountPaid: Number(document.getElementById('pay-amount').value),
                    method: document.getElementById('pay-method').value,
                    utrNumber: document.getElementById('pay-utr').value,
                    screenshotUrl,
                    remarks: document.getElementById('pay-remarks').value,
                }),
            });
            const json = await res.json();
            if (!json.success) {
                out.innerHTML = `<div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">${esc(json.message)}</div>`;
                return;
            }
            const p = json.data;
            out.innerHTML = `
                <div id="printable-portal-area" class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 space-y-3 text-xs">
                    <div class="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <strong class="text-emerald-800 text-sm"><i class="fa-solid fa-circle-check mr-1"></i>Payment Submitted!</strong>
                        <button type="button" onclick="window.print()" class="no-print px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-black"><i class="fa-solid fa-print mr-1"></i>Print Slip</button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-slate-700">
                        <div><span class="text-slate-500 block text-[10px]">Receipt Ref</span><strong class="break-all">${esc(p.receiptNo)}</strong></div>
                        <div><span class="text-slate-500 block text-[10px]">Amount</span><strong class="text-emerald-700">${fmtINR(p.amountPaid)}</strong></div>
                        <div><span class="text-slate-500 block text-[10px]">Student</span><strong>${esc(p.studentName)} (${esc(p.rollNo)})</strong></div>
                        <div><span class="text-slate-500 block text-[10px]">UTR Ref</span><strong>${esc(p.utrNumber)}</strong></div>
                    </div>
                    <p class="text-[11px] text-emerald-800 font-semibold">Your payment is queued in School Finance ERP for quick office verification.</p>
                </div>`;
        } catch {
            out.innerHTML = `<div class="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Network error submitting payment. Please try again.</div>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i>Submit Payment for Verification';
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// BIND FORM HANDLERS ON SUB-PAGES
// ─────────────────────────────────────────────────────────────────────────────
const bindPageForms = () => {
    // 1. Results Lookup
    bindOnce('results-lookup-form', async (e) => {
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
                        <button type="button" onclick="window.print()" class="no-print px-4 py-2 rounded-xl bg-brandBlue text-white text-xs font-black cursor-pointer"><i class="fa-solid fa-print mr-1"></i> Print Score Card</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F8FAFF] p-3 rounded-xl text-xs">
                        <div><span class="text-slate-400 block">Student</span><strong>${esc(student.name)}</strong></div>
                        <div><span class="text-slate-400 block">Roll No</span><strong>${esc(student.rollNo)}</strong></div>
                        <div><span class="text-slate-400 block">Class</span><strong>${esc(student.className)}</strong></div>
                        <div><span class="text-slate-400 block">Father Name</span><strong>${esc(student.fatherName || '-')}</strong></div>
                    </div>
                    ${examResults.map((er) => `
                        <div class="space-y-2">
                            <div class="flex flex-wrap justify-between items-center bg-indigo-50 px-3 py-2 rounded-lg text-xs font-black text-brandBlue gap-2">
                                <span>${esc(er.examName)} (${esc(er.term)})</span>
                                <span>Total: ${er.totalObtained}/${er.totalMax} (${er.overallPercentage}% &bull; Grade ${esc(er.overallGrade)} &bull; ${esc(er.status)})</span>
                            </div>
                            <table class="w-full text-xs border-collapse border border-slate-200">
                                <thead><tr class="bg-slate-50"><th class="border p-2 text-left">Subject</th><th class="border p-2">Obtained</th><th class="border p-2">Max</th><th class="border p-2">Grade</th></tr></thead>
                                <tbody>
                                    ${er.subjects.map((s) => `<tr><td class="border p-2 font-bold">${esc(s.subjectName)}</td><td class="border p-2 text-center font-black">${s.marksObtained}</td><td class="border p-2 text-center">${s.maxMarks}</td><td class="border p-2 text-center font-bold">${esc(s.grade)}</td></tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                </div>`;
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Unable to connect to results server.</div>';
        }
    });

    // 2. Hall Ticket Lookup
    bindOnce('hallticket-lookup-form', async (e) => {
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
                    <div class="flex flex-wrap justify-between items-center border-b border-slate-200 pb-4 gap-3">
                        <div>
                            <h3 class="text-lg font-black text-brandBlue">${esc(school.schoolName)}</h3>
                            <p class="text-xs font-black text-emerald-700 uppercase">OFFICIAL ADMIT CARD / HALL TICKET — ${esc(exam.name)}</p>
                        </div>
                        <button type="button" onclick="window.print()" class="no-print px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"><i class="fa-solid fa-print mr-1"></i> Print Hall Ticket</button>
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
                            ${schedule.length > 0 ? schedule.map((sc) => `<tr><td class="border p-2 font-bold">${esc(sc.subject)}</td><td class="border p-2 text-center">${new Date(sc.date).toLocaleDateString('en-IN')}</td><td class="border p-2 text-center">${esc(sc.time)}</td><td class="border p-2 text-center">${esc(sc.room)}</td></tr>`).join('') : '<tr><td colspan="4" class="p-3 text-center text-slate-500">Schedule announced at examination desk.</td></tr>'}
                        </tbody>
                    </table>
                    <p class="text-[11px] text-slate-600"><strong>Instructions:</strong> ${esc(school.instructions)}</p>
                </div>`;
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Unable to generate hall ticket.</div>';
        }
    });

    // 3. Admission Status Lookup
    bindOnce('admission-lookup-form', async (e) => {
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
            out.innerHTML = json.data.map((inq) => `
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

    // 4. Online Admission Registration Submit
    bindOnce('public-admission-form', async (e) => {
        e.preventDefault();
        const out = document.getElementById('public-admission-result');
        const btn = document.getElementById('adm-submit-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Submitting Application...';
        try {
            let studentImage = null;
            const photoFile = document.getElementById('adm-photo-file')?.files?.[0];
            if (photoFile) {
                const fd = new FormData();
                fd.append('file', photoFile);
                const upRes = await fetch(`${API_BASE}/api/uploads/image`, { method: 'POST', body: fd });
                const upJson = await upRes.json();
                if (upJson.success && upJson.data?.url) studentImage = upJson.data.url;
            }

            const fatherPhone = document.getElementById('adm-fatherPhone').value.trim();
            const res = await fetch(`${API_BASE}/api/admissions/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentName: document.getElementById('adm-studentName').value,
                    academicYear: document.getElementById('adm-academicYear').value,
                    classApplied: document.getElementById('adm-classApplied').value,
                    gender: document.getElementById('adm-gender').value,
                    dob: document.getElementById('adm-dob').value,
                    aadharNo: document.getElementById('adm-aadharNo').value,
                    previousSchool: document.getElementById('adm-previousSchool').value,
                    studentImage,
                    fatherName: document.getElementById('adm-fatherName').value,
                    fatherPhone,
                    phone: fatherPhone,
                    motherName: document.getElementById('adm-motherName').value,
                    address: document.getElementById('adm-address').value,
                    paymentMethod: 'ONLINE',
                    paymentStatus: 'PENDING',
                    termsAccepted: document.getElementById('adm-terms').checked,
                }),
            });
            const json = await res.json();
            if (!json.success) {
                out.innerHTML = `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">${esc(json.message)}</div>`;
                return;
            }
            const app = json.data;
            out.innerHTML = `
                <div id="printable-portal-area" class="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 space-y-3 text-xs">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                        <strong class="text-sm text-emerald-800"><i class="fa-solid fa-circle-check mr-1.5"></i>Admission Application Submitted!</strong>
                        <button type="button" onclick="window.print()" class="no-print px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-black"><i class="fa-solid fa-print mr-1"></i>Print Acknowledgement</button>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div><span class="text-slate-500 block text-[10px]">Application ID</span><strong class="break-all">${esc(app.id)}</strong></div>
                        <div><span class="text-slate-500 block text-[10px]">Student Name</span><strong>${esc(app.studentName)}</strong></div>
                        <div><span class="text-slate-500 block text-[10px]">Class &amp; Year</span><strong>${esc(app.classApplied)} (${esc(app.academicYear || '2027-28')})</strong></div>
                    </div>
                    <p class="text-[11px] text-emerald-800 font-semibold">Our admissions coordinator will contact <strong>${esc(app.phone)}</strong> shortly to schedule student interaction &amp; document verification.</p>
                </div>`;
            e.target.reset();
        } catch {
            out.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Failed submitting admission form. Please verify your internet connection.</div>';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i>Submit Admission Application';
        }
    });

    // 5. Pay Fees Lookup Form
    bindOnce('fee-lookup-form', async (e) => {
        e.preventDefault();
        const errBox = document.getElementById('fee-lookup-error');
        const ws = document.getElementById('fee-workspace');
        const btn = document.getElementById('fee-lookup-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Checking Dues...';
        errBox.innerHTML = '';

        try {
            const res = await fetch(`${API_BASE}/api/website/public/fees/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rollNo: document.getElementById('fee-roll').value,
                    dob: document.getElementById('fee-dob').value,
                }),
            });
            const json = await res.json();
            if (!json.success) {
                ws?.classList.add('hidden');
                errBox.innerHTML = `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">${esc(json.message)}</div>`;
                return;
            }
            FEE_LOOKUP_STATE = json.data;
            renderFeeWorkspace();
        } catch {
            errBox.innerHTML = '<div class="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold">Unable to connect to fee server. Please try again.</div>';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1.5"></i>Check Due &amp; Pay Now';
        }
    });

    // 6. Counselling & Contact WhatsApp Forms
    bindOnce('counselling-form', (e) => {
        e.preventDefault();
        const name = document.getElementById('cns-name').value;
        const phone = document.getElementById('cns-phone').value;
        const topic = document.getElementById('cns-topic').value;
        const num = String(CMS_CACHE?.settings?.whatsappNumber || '919502924437').replace(/\D/g, '');
        const msg = `Hello JY School! I would like to book a Counselling Session.\nName: ${name}\nPhone: ${phone}\nTopic: ${topic}`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });

    bindOnce('contact-whatsapp-form', (e) => {
        e.preventDefault();
        const name = document.getElementById('cnt-name').value;
        const phone = document.getElementById('cnt-phone').value;
        const msgTxt = document.getElementById('cnt-msg').value;
        const num = String(CMS_CACHE?.settings?.whatsappNumber || '919502924437').replace(/\D/g, '');
        const msg = `Hello JY School Website Inquiry:\nName: ${name}\nPhone: ${phone}\nMessage: ${msgTxt}`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// HYDRATE HOME + CURRENT SUB-PAGE WITH LIVE CMS DATA
// ─────────────────────────────────────────────────────────────────────────────
window.hydrateAllViews = (route = window.CURRENT_ROUTE, subTab) => {
    const data = CMS_CACHE;

    // Populate Home Elements (if visible in DOM)
    if (data) {
        const { settings, stats, programs, testimonials, news, customPages, media, toppers, publicExams, admitCardExams, faculty, navLinks } = data;

        if (settings) {
            const ht = document.getElementById('hero-title');
            const hs = document.getElementById('hero-subtitle');
            const hd = document.getElementById('hero-description');
            const hi = document.getElementById('hero-image');
            if (hs && settings.heroSubtitle) hs.innerHTML = `<i class="fa-solid fa-graduation-cap text-brandOrange"></i> ${esc(settings.heroSubtitle)}`;
            if (ht && settings.heroTitle) ht.textContent = settings.heroTitle;
            if (hd && settings.heroDescription) hd.textContent = settings.heroDescription;
            if (hi && settings.heroImageUrl) hi.src = resolveMediaUrl(settings.heroImageUrl);
            if (settings.heroVideoUrl) document.getElementById('hero-video-btn')?.classList.remove('hidden');

            if (settings.missionText && document.getElementById('mission-text')) document.getElementById('mission-text').textContent = settings.missionText;
            if (settings.visionText && document.getElementById('vision-text')) document.getElementById('vision-text').textContent = settings.visionText;

            if (settings.principalMessage) {
                ['principal-name', 'page-principal-name'].forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = settings.principalName || 'Principal';
                });
                ['principal-message', 'page-principal-message'].forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = `"${settings.principalMessage}"`;
                });
                if (settings.principalPhotoUrl) {
                    ['principal-photo', 'page-principal-photo'].forEach((id) => {
                        const el = document.getElementById(id);
                        if (el) el.src = resolveMediaUrl(settings.principalPhotoUrl);
                    });
                }
            }

            if (settings.contactPhone && document.getElementById('contact-phone-val')) {
                const cp = document.getElementById('contact-phone-val');
                cp.href = `tel:${settings.contactPhone}`;
                cp.textContent = settings.contactPhone;
            }
            if (settings.contactEmail && document.getElementById('contact-email-val')) {
                const ce = document.getElementById('contact-email-val');
                ce.href = `mailto:${settings.contactEmail}`;
                ce.textContent = settings.contactEmail;
            }
            if (settings.contactAddress) {
                if (document.getElementById('contact-address-val')) document.getElementById('contact-address-val').textContent = settings.contactAddress;
                if (document.getElementById('footer-address')) document.getElementById('footer-address').innerHTML = `<i class="fa-solid fa-location-dot text-brandOrange mr-1.5"></i> ${esc(settings.contactAddress)}`;
            }
            if (settings.googleMapEmbedUrl && document.getElementById('map-container')) {
                document.getElementById('map-container').innerHTML = `<iframe src="${esc(settings.googleMapEmbedUrl)}" class="w-full h-full border-0" loading="lazy" allowfullscreen></iframe>`;
            }
            if (settings.whatsappNumber && document.getElementById('whatsapp-float')) {
                const digits = String(settings.whatsappNumber).replace(/\D/g, '');
                if (digits) document.getElementById('whatsapp-float').href = `https://wa.me/${digits}?text=Hello!%20I%20am%20contacting%20from%20the%20JY%20School%20website.`;
            }
            [['#social-facebook-footer', settings.facebookUrl], ['#social-instagram-footer', settings.instagramUrl], ['#social-youtube-footer', settings.youtubeUrl]].forEach(([sel, url]) => {
                if (url) document.querySelectorAll(sel).forEach((el) => { el.href = url; });
            });
        }

        // Home Executive Light Metric Cards
        const METRIC_ICON_COLORS = [
            'bg-indigo-50 text-brandBlue',
            'bg-orange-50 text-brandOrange',
            'bg-emerald-50 text-emerald-600',
            'bg-purple-50 text-purple-600',
            'bg-sky-50 text-sky-600',
        ];
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid && Array.isArray(stats) && stats.length > 0) {
            statsGrid.innerHTML = stats.map((st, idx) => `
                <div class="metric-card flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${METRIC_ICON_COLORS[idx % METRIC_ICON_COLORS.length]} flex items-center justify-center shrink-0">
                        <i class="fa-solid ${esc(st.icon || 'fa-star')} text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 leading-none">${esc(st.value)}</h3>
                        <p class="text-[10px] font-bold text-slate-500 uppercase mt-1">${esc(st.label)}</p>
                    </div>
                </div>`).join('');
        }

        // Home & Academics Programs
        if (Array.isArray(programs) && programs.length > 0) {
            renderProgramsInto(document.getElementById('programs-grid'), programs);
            renderProgramsInto(document.getElementById('page-programs-grid'), programs);
        } else if (document.getElementById('page-programs-grid') && document.getElementById('programs-grid')) {
            document.getElementById('page-programs-grid').innerHTML = document.getElementById('programs-grid').innerHTML;
        }

        // Home Page 3: News
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid && Array.isArray(news) && news.length > 0) {
            newsGrid.innerHTML = news.slice(0, 3).map((n) => `
                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-brandBlue text-[9px] font-black">${esc(n.tag)}</span>
                    <h4 class="text-xs font-black text-slate-900 mt-1.5">${esc(n.title)}</h4>
                    <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">${esc(n.description)}</p>
                </div>`).join('');
        }

        // Home Page 3: Toppers Snapshot
        const homeToppersGrid = document.getElementById('home-toppers-grid');
        if (homeToppersGrid && Array.isArray(toppers) && toppers.length > 0) {
            homeToppersGrid.innerHTML = toppers.slice(0, 3).map((tp) => `
                <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3">
                    ${tp.photoUrl ? `<img src="${esc(resolveMediaUrl(tp.photoUrl))}" class="w-10 h-10 rounded-xl object-cover border border-white shadow-xs shrink-0">` : `<div class="w-10 h-10 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center shrink-0">${esc(tp.studentName.charAt(0))}</div>`}
                    <div class="min-w-0">
                        <div class="text-xs font-black text-slate-900 truncate">${esc(tp.studentName)} &bull; <span class="text-brandOrange">${esc(tp.scoreOrRank)}</span></div>
                        <div class="text-[11px] text-slate-600 truncate">${esc(tp.className)} &bull; ${esc(tp.examTitle)}</div>
                    </div>
                </div>`).join('');
        }

        // Home Page 3: Testimonials
        const testGrid = document.getElementById('testimonials-grid');
        if (testGrid && Array.isArray(testimonials) && testimonials.length > 0) {
            testGrid.innerHTML = testimonials.slice(0, 3).map((t) => `
                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div class="text-amber-400 text-[10px] mb-1">${'<i class="fa-solid fa-star"></i>'.repeat(Math.min(5, t.rating || 5))}</div>
                    <p class="text-[11px] text-slate-600 italic leading-relaxed">"${esc(t.text)}"</p>
                    <div class="text-xs font-black text-slate-900 mt-1">${esc(t.name)} <span class="font-medium text-slate-400">&bull; ${esc(t.role)}</span></div>
                </div>`).join('');
        }

        // Existing Student Exam Selects
        const resSelect = document.getElementById('res-exam-id');
        if (resSelect && Array.isArray(publicExams)) {
            resSelect.innerHTML = '<option value="">All Published Exams</option>' +
                publicExams.map((ex) => `<option value="${esc(ex.id)}">${esc(ex.name)} (${esc(ex.term)})</option>`).join('');
        }
        const htSelect = document.getElementById('ht-exam-id');
        if (htSelect && Array.isArray(admitCardExams)) {
            htSelect.innerHTML = (admitCardExams.length > 0 ? '<option value="">-- Select Exam --</option>' : '<option value="">No Active Admit Cards Yet</option>') +
                admitCardExams.map((ex) => `<option value="${esc(ex.id)}">${esc(ex.name)} (${esc(ex.term)})</option>`).join('');
        }

        // Academics Custom Pages
        const cpGrid = document.getElementById('page-custom-pages-grid');
        if (cpGrid && Array.isArray(customPages)) {
            const published = customPages.filter((p) => p.isPublished !== false);
            cpGrid.innerHTML = published.map((p) => `
                <button type="button" onclick="openCustomPage('${esc(p.slug)}')" class="text-left bg-white border border-slate-200 rounded-2xl p-5 hover-lift cursor-pointer space-y-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-brandBlue text-[10px] font-black uppercase">${esc(p.category)}</span>
                    <h4 class="text-sm font-black text-slate-900">${esc(p.title)}</h4>
                    <p class="text-xs text-slate-500 line-clamp-2">${esc(p.subtitle || p.content)}</p>
                    <span class="inline-block text-[11px] font-black text-brandBlue">Read Policy &rarr;</span>
                </button>`).join('');
        }

        // Campus Media Gallery
        const pageMedia = document.getElementById('page-media-grid');
        if (pageMedia && Array.isArray(media) && media.length > 0) {
            pageMedia.innerHTML = media.map((m) => {
                if (m.mediaType === 'VIDEO') {
                    const thumb = resolveMediaUrl(m.thumbnailUrl) || getYoutubeThumb(m.url);
                    return `
                        <div onclick="openVideoModal('${esc(m.title)}', '${esc(resolveMediaUrl(m.url))}')" class="bg-white rounded-3xl overflow-hidden border border-slate-200 hover-lift cursor-pointer group">
                            <div class="relative h-52 bg-indigo-50 flex items-center justify-center">
                                ${thumb ? `<img src="${esc(thumb)}" class="w-full h-full object-cover">` : ''}
                                <div class="absolute w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><i class="fa-solid fa-play text-lg ml-0.5"></i></div>
                            </div>
                            <div class="p-4"><span class="text-[10px] font-black uppercase text-rose-600">${esc(m.category)}</span><h4 class="font-black text-slate-900 text-sm mt-0.5">${esc(m.title)}</h4></div>
                        </div>`;
                }
                return `
                    <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 hover-lift">
                        <img src="${esc(resolveMediaUrl(m.url))}" class="w-full h-52 object-cover">
                        <div class="p-4"><span class="text-[10px] font-black uppercase text-sky-700">${esc(m.category)}</span><h4 class="font-black text-slate-900 text-sm mt-0.5">${esc(m.title)}</h4></div>
                    </div>`;
            }).join('');
        }

        // Toppers Hall of Fame
        const toppersGrid = document.getElementById('page-toppers-grid');
        if (toppersGrid) {
            if (Array.isArray(toppers) && toppers.length > 0) {
                toppersGrid.innerHTML = toppers.map((tp) => `
                    <div class="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 text-center hover-lift">
                        ${tp.photoUrl ? `<img src="${esc(resolveMediaUrl(tp.photoUrl))}" class="w-16 h-16 rounded-full mx-auto object-cover border-2 border-white shadow mb-3">` : `<div class="w-16 h-16 rounded-full mx-auto bg-amber-500 text-white font-black text-xl flex items-center justify-center mb-3">${esc(tp.studentName.charAt(0))}</div>`}
                        <h4 class="font-black text-slate-900 text-sm">${esc(tp.studentName)}</h4>
                        <p class="text-xs font-black text-brandOrange mt-0.5">${esc(tp.scoreOrRank)}</p>
                        <p class="text-[11px] font-semibold text-slate-500 mt-1">${esc(tp.className)} &bull; ${esc(tp.examTitle)}</p>
                    </div>`).join('');
            } else {
                toppersGrid.innerHTML = `
                    <div class="col-span-full p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center text-xs font-bold text-amber-900">
                        Topper profiles published from School Website CMS appear here automatically with photos &amp; State ranks.
                    </div>`;
            }
        }

        // Staffs Faculty Roster
        const facultyGrid = document.getElementById('page-faculty-grid');
        if (facultyGrid) {
            if (Array.isArray(faculty) && faculty.length > 0) {
                facultyGrid.innerHTML = faculty.map((f) => `
                    <div class="p-4 rounded-2xl bg-white border border-indigo-100 text-center hover-lift shadow-xs">
                        ${f.photoUrl ? `<img src="${esc(resolveMediaUrl(f.photoUrl))}" class="w-16 h-16 rounded-full mx-auto object-cover border-2 border-indigo-100 mb-2.5">` : `<div class="w-16 h-16 rounded-full mx-auto bg-brandBlue text-white font-black text-lg flex items-center justify-center mb-2.5">${esc(f.name.charAt(0))}</div>`}
                        <h4 class="font-black text-slate-900 text-xs truncate">${esc(f.name)}</h4>
                        <p class="text-[10px] font-bold text-brandBlue truncate mt-0.5">${esc(f.qualification || f.specialization || 'Faculty Mentor')}</p>
                    </div>`).join('');
            } else {
                facultyGrid.innerHTML = `
                    <div class="col-span-full p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center text-xs font-bold text-brandBlue">
                        45+ Qualified Subject Experts across Pre-Primary, Primary, High School &amp; IIT-JEE/NEET Foundation Departments.
                    </div>`;
            }
        }

        // Footer custom CMS links (once)
        const footerLinks = document.getElementById('footer-links-list');
        if (footerLinks && Array.isArray(navLinks) && !footerLinks.dataset.cmsInjected) {
            const extraFooter = navLinks.filter((l) => l.group === 'FOOTER' && l.isActive !== false)
                .map((l) => `<li><a href="${esc(l.url)}" ${l.openInNewTab ? 'target="_blank" rel="noopener"' : ''} class="hover:text-brandOrange">${esc(l.label)}</a></li>`)
                .join('');
            if (extraFooter) footerLinks.innerHTML += extraFooter;
            footerLinks.dataset.cmsInjected = 'true';
        }
    }

    // Always render Downloads filter & re-bind interactive forms on current route
    if (document.getElementById('page-downloads-grid')) window.filterDownloads();
    if (subTab && typeof window.switchPortalTab === 'function') window.switchPortalTab(subTab);
    bindPageForms();
};

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`${API_BASE}/api/website/data`);
        const json = await res.json();
        if (json.success && json.data) {
            CMS_CACHE = json.data;
        }
    } catch (err) {
        console.error('Website CMS Sync Error:', err);
    }
    window.hydrateAllViews(window.CURRENT_ROUTE);
});
