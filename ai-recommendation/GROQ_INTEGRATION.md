# Groq Integration for Agentic AI

## ✅ Integration Complete

The AI Recommendation Service has been successfully configured to use **Groq** as the primary LLM provider for agentic AI functionality.

---

## 🔧 What Was Changed

### 1. **Created Groq Service** (`app/services/groq_service.py`)
   - New service class `GroqService` that interfaces with Groq API
   - Supports all the same methods as Ollama service:
     - `generate()` - Text generation
     - `parse_trip_request()` - NLU parsing
     - `generate_explanation()` - Bundle explanations
     - `answer_policy_question()` - Policy Q&A
   - Uses official `groq` Python package
   - Falls back to HTTP client if package not available

### 2. **Updated AI Services to Use Groq**
   - **NLUParser** (`app/services/nlu_parser.py`)
     - Prefers Groq, falls back to Ollama, then rule-based
   - **ConciergeAgent** (`app/services/concierge_agent.py`)
     - Uses Groq for intelligent bundle explanations
   - **PolicyQA** (`app/services/policy_qa.py`)
     - Uses Groq for answering policy questions

### 3. **Configuration Files**
   - **`.env`** - Created with your Groq API key
   - **`.env.example`** - Updated with Groq configuration template
   - **`requirements.txt`** - Added `groq>=0.4.0`
   - **`app/main.py`** - Added `load_dotenv()` to load environment variables

---

## 📋 Configuration

### Environment Variables

The service uses these environment variables (set in `.env`):

```bash
USE_AI=true                    # Enable AI (Groq/Ollama)
GROQ_API_KEY=your_key_here      # Your Groq API key
GROQ_MODEL=llama-3.1-70b-versatile  # Model to use

# Optional: Ollama fallback
USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Available Groq Models

- `llama-3.1-70b-versatile` (default) - Best for general use
- `llama-3.1-8b-instant` - Faster, smaller model
- `mixtral-8x7b-32768` - High context window
- `gemma-7b-it` - Google's Gemma model
- `llama-3-70b-8192` - Alternative Llama model

---

## 🚀 How It Works

### Priority Order

1. **Groq** (if `USE_AI=true` and `GROQ_API_KEY` is set)
2. **Ollama** (if Groq unavailable and `USE_OLLAMA=true`)
3. **Rule-based** (fallback for all services)

### Service Initialization

When services start:
1. Check if `USE_AI=true`
2. Try to initialize Groq service with API key
3. If Groq fails, try Ollama (if enabled)
4. Fall back to rule-based parsing if both fail

---

## ✅ Verification

The Groq service has been tested and verified:

```bash
✅ Groq service initialized: True
   Model: llama-3.1-70b-versatile
```

---

## 📝 Usage

The AI agents will automatically use Groq for:

1. **Natural Language Understanding (NLU)**
   - Parsing user trip requests
   - Extracting origin, destination, dates, budget, preferences

2. **Bundle Explanations**
   - Generating intelligent explanations for bundle recommendations
   - Highlighting value propositions and deal quality

3. **Policy Q&A**
   - Answering questions about refunds, cancellations, pets, etc.
   - Providing context-aware responses

---

## 🔄 Restart Required

To activate Groq integration, restart the AI service:

```bash
# Stop current service (if running)
pkill -f "uvicorn.*ai-recommendation"

# Start with new configuration
cd ai-recommendation
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

---

## 🎯 Benefits of Groq

1. **Fast Inference** - Groq's hardware acceleration provides very fast responses
2. **API-Based** - No local installation required
3. **Reliable** - Cloud-based service with high availability
4. **Cost-Effective** - Pay-per-use pricing model
5. **Multiple Models** - Access to various LLM models

---

## 🔒 Security Note

The `.env` file contains your API key. Make sure:
- `.env` is in `.gitignore` (already configured)
- Never commit API keys to version control
- Rotate keys if exposed

---

## 📚 Additional Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Python SDK](https://github.com/groq/groq-python)
- [Available Models](https://console.groq.com/docs/models)

---

## 🐛 Troubleshooting

### Groq service not available

1. Check API key is set:
   ```bash
   echo $GROQ_API_KEY
   ```

2. Verify `.env` file exists and is loaded:
   ```bash
   python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GROQ_API_KEY'))"
   ```

3. Test Groq connection:
   ```bash
   python3 -c "from app.services.groq_service import get_groq_service; s = get_groq_service(); print(s.is_available)"
   ```

### Fallback to rule-based

If Groq is unavailable, services will automatically fall back to rule-based parsing. Check logs for error messages.

---

## ✨ Summary

✅ Groq integration complete  
✅ API key configured  
✅ All AI services updated  
✅ Fallback mechanisms in place  
✅ Ready to use!

The agentic AI system will now use Groq for intelligent natural language understanding and generation, providing faster and more accurate responses to user queries.
