const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, 'flutter_mobile', 'lib');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.dart')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(libPath);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Backgrounds
    content = content.replace(/Color\(0xFF0B0F19\)/g, 'Color(0xFFF4F7FE)');
    content = content.replace(/Color\(0xFF1E1B4B\)/g, 'Color(0xFFF8FAFC)');
    content = content.replace(/Color\(0xFF0F172A\)/g, 'Color(0xFFE2E8F0)');

    // Opacities & Borders (Convert to Light Mode Equivalents)
    content = content.replace(/Colors\.white\.withOpacity\(0\.0[2-4]\)/g, 'Colors.white');
    content = content.replace(/Colors\.white\.withOpacity\(0\.0[5-9]\)/g, 'const Color(0xFFE2E8F0)');
    content = content.replace(/Colors\.white\.withOpacity\(0\.1[0-9]?\)/g, 'const Color(0xFFE2E8F0)');
    content = content.replace(/Colors\.white\.withOpacity\(0\.2\)/g, 'const Color(0xFFCBD5E1)');

    // Text Colors
    content = content.replace(/Colors\.white70/g, 'const Color(0xFF475569)');
    content = content.replace(/Colors\.white60/g, 'const Color(0xFF64748B)');
    content = content.replace(/Colors\.white54/g, 'const Color(0xFF64748B)');
    content = content.replace(/Colors\.white38/g, 'const Color(0xFF94A3B8)');
    content = content.replace(/Colors\.white24/g, 'const Color(0xFFCBD5E1)');
    content = content.replace(/Colors\.white12/g, 'const Color(0xFFE2E8F0)');

    // Primary Text
    content = content.replace(/color:\s*Colors\.white([^a-zA-Z0-9_])/g, 'color: const Color(0xFF1E293B)$1');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});

console.log('Theme conversion completed.');
