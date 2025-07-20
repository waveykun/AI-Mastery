// scripts/setup-dev.js - Development environment setup
const fs = require('fs');
const { exec } = require('child_process');

console.log('🔧 Setting up AI Mastery: The Doctor development environment...');

async function setupDevelopment() {
  try {
    const directories = ['data', 'logs', 'assets', 'build', 'temp'];
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    if (!fs.existsSync('.env')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ Created .env file from template');
    }

    console.log('📦 Installing dependencies...');
    await execPromise('npm install');
    console.log('✅ Dependencies installed');

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync('launcher.sh', 0o755);
        console.log('✅ Made launcher.sh executable');
      } catch (error) {
        console.warn('⚠️ Could not make scripts executable:', error.message);
      }
    }
    
    console.log('\n🖖 Development environment setup complete!');
    console.log('Next steps:');
    console.log('1. Edit .env file with your API keys (optional)');
    console.log('2. Run: npm run dev');
    console.log('\n"The Doctor is ready for service, Captain."');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
      } else {
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

setupDevelopment();