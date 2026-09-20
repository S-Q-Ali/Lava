import { useState } from 'react'
import './ScriptTemplatesPanel.css'

interface Template {
  id: string
  name: string
  category: string
  description: string
  script: string
}

const TEMPLATES: Template[] = [
  {
    id: 'sales-pitch',
    name: 'Sales Pitch',
    category: 'Marketing',
    description: 'Product demo with hook, features, and CTA',
    script: `1. [HOOK] Stop wasting hours on video editing that never looks professional.

2. [PROBLEM] Most creators spend 80% of their time on tedious tasks — trimming, syncing, captioning — instead of creating.

3. [SOLUTION] Lava Studio does it all in one click. Script to finished video. AI-powered. Local-first.

4. [FEATURES] Groq transcription, 25 languages, visual prompts, voice cloning, bulk image generation.

5. [CTA] Try Lava Studio today. Your time is worth more than manual editing.`,
  },
  {
    id: 'hindi-story',
    name: 'Hindi Story',
    category: 'Narration',
    description: 'Dramatic storytelling with emotional beats',
    script: `1. [OPEN] एक ज़माने में एक बूढ़ा बागीचा था। हर सुबह वो अपने पेड़ों से बातें करता था।

2. [BUILD] एक दिन एक नन्हा पौधा उगा। बूढ़े ने उसे पानी दिया, धूप से बचाया।

3. [CLIMAX] साल बीते। वो पौधा एक विशाल वृक्ष बन गया। उसकी छाँव में पूरा गाँव सुस्ताता था।

4. [MORAL] धैर्य और प्यार से बड़-बड़े बदलाव आते हैं। बस शुरुआत करनी होती है।`,
  },
  {
    id: 'podcast-clip',
    name: 'Podcast Clip',
    category: 'Podcast',
    description: 'Short engaging clip for social media',
    script: `1. [HOOK] Here's what nobody tells you about building an AI startup in 2026.

2. [INSIGHT] The technology is commoditized. Everyone has access to the same models. The difference? Execution and user experience.

3. [STORY] We built Lava Studio because existing tools felt like they were designed by people who never actually edited video.

4. [TAKEAWAY] Build for yourself first. If you're frustrated, your users will be too.

5. [CTA] Follow for more insights on AI-powered creation tools.`,
  },
  {
    id: 'educational',
    name: 'Educational',
    category: 'Education',
    description: 'Tutorial-style explainer with examples',
    script: `1. [INTRO] Today we're learning how AI-powered video editing works. It's simpler than you think.

2. [CONCEPT] The core idea: AI analyzes your script, generates matching images, syncs them to voiceover, and produces a finished video.

3. [EXAMPLE] For example, paste a 3-scene script about space exploration. The AI creates cinematic visuals for each scene.

4. [DETAIL] Groq handles transcription at 30 requests per minute. Edge-tts provides 170+ free voices. Gemini generates images.

5. [SUMMARY] Remember: AI accelerates decisions, but you stay in control. Every edit is reversible.`,
  },
  {
    id: 'investigative',
    name: 'Investigative',
    category: 'News',
    description: 'Deep dive with evidence and analysis',
    script: `1. [LEAD] The numbers are staggering. $2.3 billion lost to deepfake fraud in 2025 alone.

2. [EVIDENCE] According to the FBI, AI-generated scams increased 340% year over year. Voice cloning is the primary vector.

3. [ANALYSIS] The technology isn't inherently dangerous. The problem is accessibility — anyone can clone a voice with 6 seconds of audio.

4. [RESPONSE] Platforms are racing to add detection tools. But the real defense? Education and verification protocols.

5. [CONCLUSION] As AI tools become more powerful, the question isn't whether we can build them — it's whether we should.`,
  },
  {
    id: 'history',
    name: 'History',
    category: 'Education',
    description: 'Historical narrative with dramatic tension',
    script: `1. [SETUP] October 1957. The Soviet Union just launched Sputnik into orbit. America is in shock.

2. [TENSION] Within weeks, Congress passes the National Defense Education Act. $1 billion invested in science education.

3. [TURNING POINT] NASA is born. Not from ambition — from fear. The Space Race begins.

4. [RESOLUTION] Twelve years later, Apollo 11 lands on the moon. One small step that started with one satellite.

5. [LESSON] Great achievements often begin with great fear. The question is: what will you do with yours?`,
  },
  {
    id: 'true-crime',
    name: 'True Crime',
    category: 'Entertainment',
    description: 'Suspenseful crime narrative',
    script: `1. [SCENE] March 15, 2024. A quiet Tuesday morning in Portland. Nobody knew what was about to unfold.

2. [EVIDENCE] Security cameras captured a figure entering the building at 3:47 AM. The footage would become key evidence.

3. [INVESTIGATION] Detectives spent 14 months piecing together digital breadcrumbs. AI-assisted analysis cracked the case.

4. [RESOLUTION] The suspect was arrested 847 miles away. Digital forensics don't lie.

5. [REFLECTION] In the age of AI, anonymity is becoming increasingly difficult to maintain.`,
  },
  {
    id: 'urdu-narration',
    name: 'Urdu Narration',
    category: 'Narration',
    description: 'Poetic Urdu narration with Roman Urdu option',
    script: `1. [OPEN] شام کے وقت کا منظر تھا۔ آسمان نارنجی رنگ میں رنگا ہوا تھا۔

2. [BUILD] ایک بوڑھی عورت بیچ میں بیٹھی تھی۔ اس کے چہرے پر سالوں کی کہانیاں لکھی تھیں۔

3. [CLIMAX] اس نے کہا — زندگی ایک سفر ہے۔ ہر قدم ایک نئی کہانی ہے۔

4. [MORAL] صبر اور امید سے ہر مشکل آسان ہو جاتی ہے۔ بس چلتے رہنا ہے۔`,
  },
  {
    id: 'news',
    name: 'Breaking News',
    category: 'News',
    description: 'Professional news anchor style',
    script: `1. [LEAD] Good evening. Tonight's top story: AI regulation takes a major step forward.

2. [DETAIL] The European Parliament has passed the world's most comprehensive AI governance framework. Effective January 2027.

3. [IMPACT] Tech giants face mandatory transparency requirements. All AI-generated content must be labeled.

4. [REACTION] Industry leaders are divided. Some praise the clarity; others warn of stifled innovation.

5. [CLOSE] We'll continue following this developing story. More details at ten.`,
  },
]

export function ScriptTemplatesPanel() {
  const [selected, setSelected] = useState<string | null>(null)
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem('lava_custom_templates')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const allTemplates = [...TEMPLATES, ...customTemplates]
  const selectedTemplate = allTemplates.find((t) => t.id === selected)

  const handleUseTemplate = (script: string) => {
    navigator.clipboard.writeText(script).catch(() => {})
  }

  return (
    <section className="templates-panel" aria-label="Script Templates">
      <div className="tp-header">
        <span className="tp-icon">📋</span>
        <span className="tp-title">Script Templates</span>
        <span className="tp-count">{allTemplates.length}</span>
      </div>

      <div className="tp-body">
        <div className="tp-grid">
          {allTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tp-card${selected === t.id ? ' selected' : ''}`}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
            >
              <span className="tp-card-name">{t.name}</span>
              <span className="tp-card-cat">{t.category}</span>
              <p className="tp-card-desc">{t.description}</p>
            </button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="tp-preview">
            <h4 className="tp-preview-title">{selectedTemplate.name}</h4>
            <pre className="tp-preview-script">{selectedTemplate.script}</pre>
            <button
              type="button"
              className="tp-copy-btn"
              onClick={() => handleUseTemplate(selectedTemplate.script)}
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
