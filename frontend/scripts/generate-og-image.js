const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateOGImage() {
  try {
    const svgPath = path.join(__dirname, '../public/og-image.svg');
    const pngPath = path.join(__dirname, '../public/og-image.png');
    
    // Leer el SVG
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Convertir a PNG con las dimensiones correctas para Open Graph
    await sharp(svgBuffer)
      .resize(1200, 630)
      .png()
      .toFile(pngPath);
    
    console.log('✅ Imagen OG generada exitosamente: og-image.png');
    
    // También generar favicons desde el logo existente
    const logoPath = path.join(__dirname, '../public/logo.png');
    
    // Favicon 16x16
    await sharp(logoPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, '../public/favicon-16x16.png'));
    
    // Favicon 32x32
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon-32x32.png'));
    
    // Apple touch icon 180x180
    await sharp(logoPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
    
    console.log('✅ Favicons generados exitosamente');
    
  } catch (error) {
    console.error('❌ Error generando imágenes:', error);
  }
}

generateOGImage();
