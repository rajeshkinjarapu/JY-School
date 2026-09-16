import re

with open('C:/Users/SRI/Desktop/JY School/JY-School-main/Website/header_tmp.html', 'r', encoding='utf-8') as f:
    new_header = f.read()

with open('C:/Users/SRI/Desktop/JY School/JY-School-main/Website/apply.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace header
header_pattern = re.compile(r'<header.*?</header>', re.DOTALL)
content = header_pattern.sub(new_header, content)

# Add nav-link styles
style_insertion = """.nav-link { position: relative; padding-bottom: 4px; }
.nav-link::after { content: ''; position: absolute; width: 0; height: 2px; bottom: -2px; left: 0; background-color: #f97316; transition: width 0.3s ease; }
.nav-link:hover::after { width: 100%; }
.card { min-height: 600px; } /* Increase card height */
"""
content = content.replace('</style>', style_insertion + '</style>')

# Add mobile menu JS
js_insertion = """
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenuBtn && mobileMenu) {
    const icon = mobileMenuBtn.querySelector('i');
    mobileMenuBtn.addEventListener('click', function () {
        mobileMenu.classList.toggle('hidden');
        if (mobileMenu.classList.contains('hidden')) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        } else {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        }
    });
}
"""
content = content.replace('</script>\n</body>', js_insertion + '</script>\n</body>')

with open('C:/Users/SRI/Desktop/JY School/JY-School-main/Website/apply.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done replacing.")
