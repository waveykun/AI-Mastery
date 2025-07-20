// scripts/doctor-check.js - System health check
const fs = require('fs');
const path = require('path');

console.log('🩺 The Doctor is performing a system diagnostic...\n');

const checks = [
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      return { 
        status: major >= 16, 
        message: `${version} ${major >= 16 ? '(Good)' : '(Upgrade recommended)'}` 
      };
    }
  },
  {
    name: 'Project Structure',
    check: () => {
      const required = [
        'package.json', 'main.js', 'preload.js',
        'server/server.js', 'frontend/index.html',
        '.env.example'
      ];
      const missing = required.filter(file => !fs.existsSync(file));
      return {
        status: missing.length === 0,
        message: missing.length === 0 ? 'All files present' : `Missing: ${missing.join(', ')}`
      };
    }
  },
  {
    name: 'Dependencies',
    check: () => {
      return {
        status: fs.existsSync('node_modules'),
        message: fs.existsSync('node_modules') ? 'Installed' : 'Run npm install'
      };
    }
  },
  {
    name: 'Configuration',
    check: () => {
      return {
        status: fs.existsSync('.env'),
        message: fs.existsSync('.env') ? 'Environment file exists' : 'Copy .env.example to .env'
      };
    }
  },
  {
    name: 'API Configuration',
    check: () => {
      if (!fs.existsSync('.env')) {
        return { status: false, message: 'No .env file found' };
      }
      
      const envContent = fs.readFileSync('.env', 'utf8');
      const hasKey = envContent.includes('OPENAI_API_KEY=') && !envContent.match(/OPENAI_API_KEY=\s*$/m);
      
      return { 
          status: hasKey, 
          message: hasKey ? 'OpenAI API key found' : 'No API key configured (will run in simulation mode)' 
      };
    }
  }
];

let allGood = true;

checks.forEach(check => {
  const result = check.check();
  const icon = result.status ? '✅' : '⚠️';
  console.log(`${icon} ${check.name}: ${result.message}`);
  if (!result.status) allGood = false;
});

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('✅ All systems operational. The Doctor is ready for service.');
} else {
  console.log('⚠️ Some issues detected. The Doctor recommends addressing them.');
}

console.log('\n💬 The Doctor says:');
const doctorQuotes = [
  '"My diagnostic subroutines indicate the system is functioning within acceptable parameters."',
  '"Please state the nature of your programming emergency."'
];
console.log(doctorQuotes[Math.floor(Math.random() * doctorQuotes.length)]);