#!/usr/bin/env node

// AI Mastery: The Doctor - Complete System Verification
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🩺 The Doctor is performing a comprehensive system diagnostic...\n');

class SystemVerification {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.total = 0;
  }

  async runAllTests() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║         🖖 AI MASTERY: THE DOCTOR VERIFICATION 🖖            ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    await this.testEnvironment();
    await this.testFileStructure();
    await this.testDependencies();
    await this.testConfiguration();
    await this.testDatabase();
    await this.testAPIIntegration();
    await this.testServices();
    
    this.generateReport();
  }

  test(name, testFn) {
    this.total++;
    try {
      const result = testFn();
      if (result === true || (result && result.status === true)) {
        console.log(`✅ ${name}`);
        if (result && result.message) {
          console.log(`   ${result.message}`);
        }
        this.passed++;
      } else {
        console.log(`❌ ${name}`);
        if (result && result.message) {
          console.log(`   ${result.message}`);
          this.errors.push(`${name}: ${result.message}`);
        } else {
          this.errors.push(name);
        }
      }
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      this.errors.push(`${name}: ${error.message}`);
    }
  }

  warn(name, testFn) {
    try {
      const result = testFn();
      if (result === true || (result && result.status === true)) {
        console.log(`✅ ${name}`);
        if (result && result.message) {
          console.log(`   ${result.message}`);
        }
      } else {
        console.log(`⚠️ ${name}`);
        if (result && result.message) {
          console.log(`   ${result.message}`);
          this.warnings.push(`${name}: ${result.message}`);
        } else {
          this.warnings.push(name);
        }
      }
    } catch (error) {
      console.log(`⚠️ ${name}`);
      console.log(`   Warning: ${error.message}`);
      this.warnings.push(`${name}: ${error.message}`);
    }
  }

  async testEnvironment() {
    console.log('🔍 Testing Environment...');
    
    this.test('Node.js Installation', () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      return {
        status: major >= 16,
        message: `Version ${version} ${major >= 16 ? '(Compatible)' : '(Requires 16+)'}`
      };
    });

    this.test('NPM Installation', () => {
      try {
        const { execSync } = require('child_process');
        const version = execSync('npm --version', { encoding: 'utf8' }).trim();
        return { status: true, message: `Version ${version}` };
      } catch (error) {
        return { status: false, message: 'NPM not found in PATH' };
      }
    });

    this.test('Platform Support', () => {
      const platform = process.platform;
      const supported = ['win32', 'darwin', 'linux'];
      return {
        status: supported.includes(platform),
        message: `Platform: ${platform} ${supported.includes(platform) ? '(Supported)' : '(Limited support)'}`
      };
    });

    console.log('');
  }

  async testFileStructure() {
    console.log('📁 Testing File Structure...');
    
    const requiredFiles = [
      'package.json',
      'main.js',
      'preload.js',
      '.env.example',
      'README.md'
    ];

    const requiredDirectories = [
      'server',
      'frontend',
      'assets'
    ];

    const criticalServerFiles = [
      'server/server.js',
      'server/services/DoctorPersona.js',
      'server/services/LessonController.js',
      'server/services/ComicService.js',
      'server/services/CharacterRotation.js',
      'server/data/database.js',
      'server/data/curriculum.js'
    ];

    const criticalFrontendFiles = [
      'frontend/index.html',
      'frontend/css/style.css',
      'frontend/js/app.js',
      'frontend/js/lesson-ui.js',
      'frontend/js/comic-viewer.js'
    ];

    requiredFiles.forEach(file => {
      this.test(`File: ${file}`, () => ({
        status: fs.existsSync(file),
        message: fs.existsSync(file) ? 'Present' : 'Missing'
      }));
    });

    requiredDirectories.forEach(dir => {
      this.test(`Directory: ${dir}`, () => ({
        status: fs.existsSync(dir) && fs.statSync(dir).isDirectory(),
        message: fs.existsSync(dir) ? 'Present' : 'Missing'
      }));
    });

    criticalServerFiles.forEach(file => {
      this.test(`Server File: ${file}`, () => ({
        status: fs.existsSync(file),
        message: fs.existsSync(file) ? 'Present' : 'Missing'
      }));
    });

    criticalFrontendFiles.forEach(file => {
      this.test(`Frontend File: ${file}`, () => ({
        status: fs.existsSync(file),
        message: fs.existsSync(file) ? 'Present' : 'Missing'
      }));
    });

    console.log('');
  }

  async testDependencies() {
    console.log('📦 Testing Dependencies...');
    
    this.test('package.json Validity', () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return {
          status: pkg.name && pkg.version && pkg.dependencies,
          message: `Name: ${pkg.name}, Version: ${pkg.version}`
        };
      } catch (error) {
        return { status: false, message: 'Invalid JSON' };
      }
    });

    this.test('node_modules Directory', () => ({
      status: fs.existsSync('node_modules'),
      message: fs.existsSync('node_modules') ? 'Dependencies installed' : 'Run npm install'
    }));

    if (fs.existsSync('node_modules')) {
      const criticalDeps = [
        'electron',
        'express',
        'sqlite3',
        'openai',
        'axios',
        'dotenv'
      ];

      criticalDeps.forEach(dep => {
        this.test(`Dependency: ${dep}`, () => ({
          status: fs.existsSync(path.join('node_modules', dep)),
          message: fs.existsSync(path.join('node_modules', dep)) ? 'Installed' : 'Missing'
        }));
      });
    }

    console.log('');
  }

  async testConfiguration() {
    console.log('⚙️ Testing Configuration...');
    
    this.test('.env File', () => ({
      status: fs.existsSync('.env'),
      message: fs.existsSync('.env') ? 'Configuration file exists' : 'Copy from .env.example'
    }));

    if (fs.existsSync('.env')) {
      this.warn('API Keys Configuration', () => {
        const envContent = fs.readFileSync('.env', 'utf8');
        const hasOpenAI = envContent.includes('OPENAI_API_KEY=') && 
                         !envContent.includes('OPENAI_API_KEY=your_openai_api_key_here');
        const hasGemini = envContent.includes('GEMINI_API_KEY=') && 
                         !envContent.includes('GEMINI_API_KEY=your_gemini_api_key_here');
        
        if (hasOpenAI) {
          return { status: true, message: 'OpenAI API configured' };
        } else if (hasGemini) {
          return { status: true, message: 'Gemini API configured' };
        } else {
          return { status: false, message: 'No API keys configured (simulation mode)' };
        }
      });
    }

    this.test('Data Directory Permissions', () => {
      try {
        if (!fs.existsSync('data')) {
          fs.mkdirSync('data', { recursive: true });
        }
        
        const testFile = path.join('data', 'test_write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        return { status: true, message: 'Read/write permissions OK' };
      } catch (error) {
        return { status: false, message: `Permission error: ${error.message}` };
      }
    });

    console.log('');
  }

  async testDatabase() {
    console.log('🗄️ Testing Database...');
    
    this.test('SQLite3 Module', () => {
      try {
        require('sqlite3');
        return { status: true, message: 'SQLite3 module loaded' };
      } catch (error) {
        return { status: false, message: 'SQLite3 module not found' };
      }
    });

    this.test('Database Initialization', () => {
      try {
        // Test database path resolution
        const dbPath = path.resolve(__dirname, '../data/ai_mastery.db');
        const dir = path.dirname(dbPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        return { status: true, message: `Database path: ${dbPath}` };
      } catch (error) {
        return { status: false, message: `Database setup failed: ${error.message}` };
      }
    });

    console.log('');
  }

  async testAPIIntegration() {
    console.log('🌐 Testing API Integration...');
    
    this.test('OpenAI Module', () => {
      try {
        require('openai');
        return { status: true, message: 'OpenAI module available' };
      } catch (error) {
        return { status: false, message: 'OpenAI module not found' };
      }
    });

    this.test('Axios Module', () => {
      try {
        require('axios');
        return { status: true, message: 'HTTP client available' };
      } catch (error) {
        return { status: false, message: 'Axios module not found' };
      }
    });

    this.warn('API Key Validation', () => {
      if (!fs.existsSync('.env')) {
        return { status: false, message: 'No .env file to check' };
      }
      
      const envContent = fs.readFileSync('.env', 'utf8');
      const openaiKey = envContent.match(/OPENAI_API_KEY=(.+)/);
      
      if (openaiKey && openaiKey[1] && !openaiKey[1].includes('your_openai_api_key_here')) {
        const key = openaiKey[1].trim();
        if (key.startsWith('sk-') && key.length > 20) {
          return { status: true, message: 'OpenAI key format looks valid' };
        } else {
          return { status: false, message: 'OpenAI key format invalid' };
        }
      }
      
      return { status: false, message: 'No valid API keys found' };
    });

    console.log('');
  }

  async testServices() {
    console.log('🔧 Testing Services...');
    
    this.test('Curriculum Data', () => {
      try {
        const curriculumPath = path.resolve('server/data/curriculum.js');
        delete require.cache[curriculumPath]; // Clear cache
        const curriculum = require(curriculumPath);
        const data = curriculum.getCurriculumData();
        
        return {
          status: data && data.lessons && data.lessons.length > 0,
          message: `${data.lessons.length} lessons, ${data.phases.length} phases`
        };
      } catch (error) {
        return { status: false, message: `Curriculum error: ${error.message}` };
      }
    });

    this.test('Doctor Persona Module', () => {
      try {
        const DoctorPersona = require('./server/services/DoctorPersona.js');
        return { status: true, message: 'Doctor persona module loads' };
      } catch (error) {
        return { status: false, message: `Persona error: ${error.message}` };
      }
    });

    this.test('Character Rotation Module', () => {
      try {
        const CharacterRotation = require('./server/services/CharacterRotation.js');
        return { status: true, message: 'Character rotation module loads' };
      } catch (error) {
        return { status: false, message: `Character rotation error: ${error.message}` };
      }
    });

    console.log('');
  }

  generateReport() {
    console.log('═'.repeat(70));
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('═'.repeat(70));
    
    console.log(`\n📊 Test Results: ${this.passed}/${this.total} passed\n`);
    
    if (this.errors.length === 0) {
      console.log('✅ ALL SYSTEMS OPERATIONAL');
      console.log('\n🖖 The Doctor says:');
      console.log('"My diagnostic subroutines indicate all systems are functioning');
      console.log('within acceptable parameters. You may proceed with educational');
      console.log('operations, Captain."');
      
      console.log('\n🚀 Ready to launch:');
      console.log('   Windows: launcher.bat');
      console.log('   Mac/Linux: ./launcher.sh');
      console.log('   Development: npm run dev');
      
    } else {
      console.log('❌ CRITICAL ISSUES DETECTED');
      console.log('\n🔧 Issues requiring attention:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      
      console.log('\n🖖 The Doctor says:');
      console.log('"My diagnostic protocols have detected several anomalies');
      console.log('that require immediate attention before educational operations');
      console.log('can commence. Please address these issues, Captain."');
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings (non-critical):');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n💡 Common fixes:');
    console.log('   - Run: npm install');
    console.log('   - Copy .env.example to .env');
    console.log('   - Add API keys to .env (optional)');
    console.log('   - Check file permissions');
    console.log('   - Ensure Node.js 16+ is installed');
    
    console.log('\n═'.repeat(70));
    
    // Exit with appropriate code
    process.exit(this.errors.length === 0 ? 0 : 1);
  }
}

// Run verification
const verifier = new SystemVerification();
verifier.runAllTests().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});