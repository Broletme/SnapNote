# 📸 SnapNotes

## The Problem
Students often take photos of blackboards, presentation slides, and notes during classes, but these images get lost in a cluttered camera roll. When exam time approaches, finding, organizing, and understanding these disconnected photos becomes a tedious and frustrating process. 

## The Solution
**SnapNotes converts classroom photos into structured, AI-powered study notes that you can chat with.**

## ✨ Features
- 📷 **Instant Capture & Import**: Easily snap a photo or import an image of any blackboard or presentation slide.
- 🧠 **AI-Powered Explanations**: Automatically extracts and explains the content from your images using state-of-the-art vision models.
- 💬 **Chat with your Notes**: Ask questions, request summaries, or clarify complex topics directly with an AI tutor aware of your notes context.
- 🗂️ **Organized Study Hub**: Keep all your transformed notes in one accessible place, ready for revision.
- 📱 **Mobile First**: Built natively for mobile to capture learning moments on the go.

## 🛠️ Tech Stack
- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **AI Vision**: [Groq API](https://groq.com/) using `llama-3.2-11b-vision-preview`
- **AI Chat/LLM**: [Groq API](https://groq.com/) using `llama-3.3-70b-versatile`
- **Local Storage**: AsyncStorage
- **File System & Media**: `expo-image-picker`, `expo-file-system`

## 🚀 How It Works
1. **Snap or Select**: Take a photo of a classroom board/slide or pick one from your gallery.
2. **AI Analysis**: The Groq Vision model analyzes the image and generates a structured text explanation of the content.
3. **Save**: The generated note and image reference are saved locally to your device.
4. **Study & Chat**: Review your notes and use the interactive chat interface. The Groq LLM uses your specific notes as context to answer any questions you have.

## 🏗️ Architecture

```text
[ Capture/Import Flow ]
📸 Photo ---> 🧠 Groq Vision API ---> 📝 Structured Note ---> 💾 AsyncStorage
              (llama-3.2-11b)

[ Study/Chat Flow ]
❓ Question ---> 📚 Notes Context ---> 🤖 Groq LLM API ---> 💡 Answer
                                      (llama-3.3-70b)
```

## 🏎️ Getting Started

### Prerequisites
- Node.js installed
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Broletme/SnapNote.git
   cd snapnotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Groq API Key:
   ```env
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the application**
   ```bash
   npx expo start
   ```

## 📂 Project Structure
Key files in the application:
- `src/app/index.tsx`: Main entry point and notes list.
- `src/app/explore.tsx`: Interface for capturing/importing images and AI processing.
- `src/services/groq.ts`: Integration with Groq Vision and LLM APIs.
- `src/services/chat.ts`: Service handling the chat logic and context management.

## 🔮 What's Next
We are constantly working to make SnapNotes the ultimate study companion. Upcoming features include:
- 👀 **Background Watcher**: Automatically detects and imports study photos from your camera roll.
- 🏷️ **Subject Filtering**: Organize and filter notes by class or subject.
- 📄 **PDF Export**: Export your generated notes and chat summaries to PDF for easy sharing and printing.
- 🃏 **Flashcards**: Automatically generate flashcards from your notes for active recall testing.

## ✍️ Author
Built with ❤️ by [@Broletme](https://github.com/Broletme).
