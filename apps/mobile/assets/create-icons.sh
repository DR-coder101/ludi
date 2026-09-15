#!/bin/bash
# Generate placeholder app icons and splash screens for Ludi
# For production, replace with high-quality assets from a designer

# Create icon.png (1024x1024) - App icon
cat > icon.png << 'EOF'
<!-- This is a placeholder. Replace with actual PNG -->
EOF

# Create splash.png (1284x2778) - Splash screen
cat > splash.png << 'EOF'
<!-- This is a placeholder. Replace with actual PNG -->
EOF

# Create adaptive-icon.png (1024x1024) - Android adaptive icon foreground
cat > adaptive-icon.png << 'EOF'
<!-- This is a placeholder. Replace with actual PNG -->
EOF

echo "Icon placeholders created. Replace with actual PNG files before building."
