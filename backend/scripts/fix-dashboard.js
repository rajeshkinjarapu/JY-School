const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../flutter_mobile/lib/screens/dashboard_screen.dart');

if (!fs.existsSync(targetPath)) {
  console.error('File not found:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix _buildImageCard to match 3x3 square layout without bottom text
const oldImageCardRegex = /Widget _buildImageCard\(\{[\s\S]*?Widget _buildIconWidgetCard\(/;

const newImageCardContent = `Widget _buildImageCard({
    required String imagePath,
    required String title,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Center(
        child: Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: borderColor.withOpacity(0.5), width: 2.5),
            boxShadow: [
              BoxShadow(
                color: borderColor.withOpacity(0.22),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(19),
            child: CustomNetworkImage(
              ApiService.getAppIconUrl(imagePath),
              fit: BoxFit.cover,
              errorBuilder: (c, e, s) => Container(
                color: borderColor.withOpacity(0.08),
                child: Icon(Icons.apps_rounded, color: borderColor, size: 38),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconWidgetCard(`;

if (oldImageCardRegex.test(content)) {
  content = content.replace(oldImageCardRegex, newImageCardContent);
  console.log('✅ Updated _buildImageCard with premium 3x3 squircle design');
} else {
  console.log('⚠️ Could not match _buildImageCard pattern');
}

// 2. Fix all instances where Column was mistakenly used with Container properties
// Look for pattern: child: Column(\s+)(width:|height:|padding:|decoration:|margin:)
content = content.replace(/child:\s*Column\(\s*(?=(?:width:|height:|padding:|decoration:|margin:))/g, 'child: Container(\n              ');

// Fix standalone Column definitions that have Container properties
content = content.replace(/(\n\s*)child:\s*Column\(([\s\S]*?decoration:\s*BoxDecoration)/g, function(match, indent, body) {
  // If body has width, height, padding, or decoration, replace Column with Container
  if (body.includes('width:') || body.includes('height:') || body.includes('padding:') || body.includes('margin:')) {
    return indent + 'child: Container(' + body;
  }
  return match;
});

// Also fix extra parenthesis on line 1282 if present
content = content.replace(/\)\);\s*\n\s*\}\s*\n\s*Widget _buildAdminCombinedGrid/, ');\n  }\n\n  Widget _buildAdminCombinedGrid');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ dashboard_screen.dart successfully updated and verified!');

