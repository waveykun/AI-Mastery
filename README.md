# 🖖 AI Mastery: The Doctor

**Emergency Medical Hologram Educational System for Stable Diffusion Training**

> *"Please state the nature of your educational emergency."* - The Doctor

A comprehensive AI tutoring application featuring The Doctor (EMH) from Star Trek: Voyager as your insufferably brilliant guide through the complexities of Stable Diffusion and AI image generation.

## ✨ Features

### 🩺 The Doctor's Personality System
- **Insufferably Brilliant**: Therapeutic condescension with dramatic flair
- **Adaptive Humor**: Automatically adjusts based on your performance
- **Character Consistency**: Maintains EMH personality throughout all interactions
- **Medical Metaphors**: Everything explained in The Doctor's signature style

### 📚 Comprehensive Curriculum
- **60 Structured Lessons** across 4 phases (Foundations → Expert)
- **6-Step Lesson Flow**: Performance review, topic intro, explanation, examples, questions, comics
- **Personalized Examples**: Dota 2, Star Trek, gaming, and anime analogies
- **Adaptive Difficulty**: System adjusts to your learning pace

### 🎭 Educational Comics
- **Answer-Based Generation**: Comics illustrate YOUR responses, not questions
- **Character Rotation**: Featuring Star Trek characters with strict variety rules
- **DALL-E 3 Integration**: High-quality comic generation
- **Visual Consistency**: Maintains Star Trek: Lower Decks art style

### 🖥️ Professional Interface
- **Electron Application**: Native desktop experience
- **Star Trek UI**: Beautiful Lower Decks-inspired design
- **Real-time Progress**: Track your journey through Stable Diffusion mastery
- **Local Storage**: Everything runs on your computer

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** ([Download here](https://nodejs.org/))
- **Git** (for cloning the repository)
- **OpenAI API Key** (recommended) or **Gemini API Key** (alternative)

### Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd ai-mastery-doctor
   ```

2. **Run the launcher**
   
   **Windows:**
   ```cmd
   double-click launcher.bat
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x launcher.sh
   ./launcher.sh
   ```

3. **First-time setup** (automatic)
   - Dependencies will install automatically
   - Environment file will be created
   - The Doctor will initialize his systems

4. **Add your API keys** (optional but recommended)
   - Edit the `.env` file
   - Add your OpenAI API key for the best experience
   - The Doctor can run in simulation mode without keys

5. **Start learning!**
   - The Doctor's interface will open
   - Begin with your first answer to start the curriculum

## ⚙️ Configuration

### API Keys Setup

Edit the `.env` file and add your keys:

```env
# Recommended for best experience
OPENAI_API_KEY=your_openai_api_key_here

# Alternative for text generation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional for comic generation
STABILITY_API_KEY=your_stability_api_key_here
```

**Get API Keys:**
- **OpenAI**: [platform.openai.com](https://platform.openai.com/api-keys)
- **Gemini**: [ai.google.dev](https://ai.google.dev/)
- **Stability AI**: [platform.stability.ai](https://platform.stability.ai/)

### The Doctor's Settings

Adjust The Doctor's personality in the app:
- **Humor Level**: 0.5 (reduced sarcasm) to 1.5 (maximum condescension)
- **Comic Generation**: Enable/disable visual reinforcement
- **Auto-advance**: Automatic lesson progression

## 📖 How to Use

### Starting Your Training

1. **Launch the application** using the launcher scripts
2. **Provide your first answer** - The Doctor is waiting for your response
3. **Experience the 6-step lesson flow**:
   - 📊 Performance review with theatrical scoring
   - 📢 Topic announcement with condescending flair  
   - 🎓 Explanation with "Doctor's Orders" pro tips
   - 🎮 Personalized examples using your interests
   - ❓ Challenge question requiring reasoning
   - 🎨 Educational comic based on your answer

### Lesson Flow Example

```
You: "CFG scale controls how closely the AI follows prompts..."

The Doctor: "A competent response, Captain. Your neural pathways 
seem to be functioning within acceptable parameters today. Score: 7.5/10"

[Topic announcement with emoji and drama]
[Detailed explanation with medical metaphors]
[Dota 2 and Star Trek analogies for CFG scale]
[Challenge question about balancing precision vs creativity]
[Comic showing your answer's consequences with Data and The Doctor]
```

### Progress Tracking

- **Lesson Counter**: Track your journey through all 60 lessons
- **Phase Progression**: Foundations → Intermediate → Advanced → Expert
- **Score Analytics**: Monitor your improvement over time
- **Character Rotation**: See which Star Trek crew members appeared recently

### Special Features

#### Status Reports
Say "Status report" or click the button to get:
- Comprehensive progress analysis
- Comic generation statistics
- The Doctor's assessment of your development
- Exportable training logs

#### Character Rotation System
- **The Doctor**: Always present (mandatory)
- **Captain Tal**: Appears rarely (1 in 7 comics max)
- **Guest Characters**: Data, Picard, Janeway, Seven of Nine, etc.
- **Your Cats**: Beten and Garbaim appear in judgment scenarios

#### Quiz System
- **Phase Milestones**: Comprehensive assessments every 15 lessons
- **Remedial Focus**: Identifies areas needing improvement
- **Performance Analytics**: Track strengths and weaknesses

## 🛠️ Advanced Usage

### Development Mode

For developers or advanced users:

```bash
# Windows
dev-launcher.bat

# Mac/Linux  
./dev-launcher.sh
```

Features:
- Hot reload for code changes
- Detailed error messages
- Debug logging
- Development tools access

### Manual Installation

If launchers don't work:

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm start
```

### Troubleshooting

#### Common Issues

**"Node.js not found"**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/command prompt

**"Dependencies failed to install"**
- Check your internet connection
- Try: `npm cache clean --force && npm install`

**"The Doctor's systems are offline"**
- Check your .env file configuration
- Verify API keys are correct
- The Doctor can run without API keys in simulation mode

**"Comics not generating"**
- Ensure OpenAI API key is configured
- Check your API quota/billing
- Comics will show placeholder if generation fails

#### Performance Issues

- **Slow startup**: Normal on first run (installing dependencies)
- **Memory usage**: The Doctor uses ~200-500MB RAM
- **Comic generation**: Takes 10-30 seconds with DALL-E 3

### Customization

#### Modifying The Doctor's Personality

Edit `server/services/DoctorPersona.js`:
- Adjust humor scaling thresholds
- Modify response patterns
- Add new medical metaphors

#### Adding New Lessons

Edit `server/data/curriculum.js`:
- Add lessons following the established format
- Include objectives, explanations, and examples
- Maintain the personalization hooks

#### Character Pool Management

Edit `server/services/CharacterRotation.js`:
- Add new Star Trek characters
- Modify rotation rules
- Adjust appearance frequencies

## 📁 Project Structure

```
ai-mastery-doctor/
├── main.js                 # Electron main process
├── preload.js             # Security bridge
├── package.json           # Dependencies and scripts
├── .env                   # API keys and configuration
├── launcher.bat/.sh       # Easy startup scripts
├── server/
│   ├── server.js          # Express backend
│   ├── services/          # Core logic (Doctor, Comics, etc.)
│   ├── routes/            # API endpoints
│   ├── data/              # Database and curriculum
│   └── config/            # Configuration files
├── frontend/
│   ├── index.html         # Main UI
│   ├── css/style.css      # Star Trek styling
│   └── js/                # Frontend logic
├── data/                  # SQLite database and logs
└── assets/                # Icons and resources
```

## 🎯 Learning Path

### Phase 1: Foundations (Lessons 1-15)
- Text-to-Image basics
- CFG Scale and Sampling Methods
- Prompting fundamentals
- Basic model understanding

### Phase 2: Intermediate Tools (Lessons 16-30)
- AUTOMATIC1111 and ComfyUI
- Extensions and workflows
- Img2Img techniques
- LoRA introduction

### Phase 3: Advanced Control (Lessons 31-45)
- ControlNet mastery
- Advanced generation techniques
- Professional workflows
- Quality optimization

### Phase 4: Cutting-Edge & Specialized (Lessons 46-60)
- Latest model architectures
- Specialized applications
- Custom training
- Professional deployment

## 🤝 Support & Community

### Getting Help

1. **Check the troubleshooting section** above
2. **Review your .env configuration**
3. **Check the console for error messages**
4. **Try development mode** for detailed debugging

### Known Limitations

- **Internet required** for comic generation (API-based)
- **English only** (The Doctor speaks Federation Standard)
- **Desktop only** (no mobile version)
- **API costs** for comic generation with real APIs

### Contributing

This is a personal project, but suggestions are welcome:
- Curriculum improvements
- New character additions
- UI/UX enhancements
- Bug fixes

## 📜 License & Credits

### License
This project is for personal use. Star Trek characters and references are property of Paramount/CBS.

### Credits
- **Star Trek: Voyager** - The Doctor character and universe
- **Star Trek: Lower Decks** - Visual art style inspiration
- **OpenAI** - DALL-E 3 comic generation
- **Electron** - Desktop application framework
- **Node.js & Express** - Backend infrastructure

### Acknowledgments
Special thanks to the Star Trek community and the AI art community for inspiration and knowledge sharing.

---

## 🖖 Final Words from The Doctor

*"Captain, you now possess the knowledge to operate my educational systems. I trust you'll apply this information with the characteristic competence I've come to... expect from Starfleet officers. Remember: learning is a process, much like recovery from a minor medical condition - it requires patience, proper treatment, and occasional doses of therapeutic humility."*

*"Now then, shall we begin your training? Please state the nature of your educational emergency."*

**Live long and prosper in your AI image generation journey!**

---

*Emergency Medical Hologram Educational System v1.0*  
*"The Doctor is in... and he's here to help, whether you want it or not."*
