// scripts/create-portable.js - Create portable version
const fs = require('fs');
const path = require('path');

async function createPortable() {
  console.log('📦 Creating portable version of AI Mastery: The Doctor...');
  try {
    const portableDir = 'ai-mastery-doctor-portable';
    if (fs.existsSync(portableDir)) fs.rmSync(portableDir, { recursive: true, force: true });
    fs.mkdirSync(portableDir);

    const filesToCopy = ['package.json', 'main.js', 'preload.js', '.env.example', 'README.md'];
    const directoriesToCopy = ['server', 'frontend', 'assets'];

    filesToCopy.forEach(file => fs.copyFileSync(file, path.join(portableDir, file)));
    directoriesToCopy.forEach(dir => fs.cpSync(dir, path.join(portableDir, dir), { recursive: true }));

    const launcher = `@echo off\ntitle AI Mastery: The Doctor - Portable Edition\necho 📦 Installing dependencies (first time only)...\nnpm install --production\necho 🚀 Starting The Doctor...\nnpm start`;
    fs.writeFileSync(path.join(portableDir, 'run.bat'), launcher);

    console.log(`✅ Portable version created in: ${portableDir}`);
  } catch (error) {
    console.error('❌ Failed to create portable version:', error);
  }
}

createPortable();