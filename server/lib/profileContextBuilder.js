/**
 * Elaboration mappings: convert stored DB values into verbose AI context.
 * Options from CardToneStyle, CardContentGoal, CardAudienceKnowledge.
 */
const TONE_STYLE_MAP = {
  'Like a teacher': 'The creator\'s tone should sound like a teacher teaching students: clear, educational, patient, and structured.',
  'Like a friendly conversation': 'The creator\'s tone should feel like a friendly conversation: warm, casual, approachable.',
  'Like a coach pushing you': 'The creator\'s tone should feel like a coach pushing the audience: motivating, direct, energizing.',
  'Like a performer/storyteller': 'The creator\'s tone should feel like a performer or storyteller: engaging, narrative, captivating.',
  'Neutral / informative': 'The creator\'s tone should be neutral and informative: factual, balanced, objective.',
}

const CONTENT_GOAL_MAP = {
  'Teach them something': 'The primary goal is to teach the audience something new.',
  'Solve a problem': 'The primary goal is to help the audience solve a problem.',
  'Entertain them': 'The primary goal is to entertain the audience.',
  'Inspire or motivate': 'The primary goal is to inspire or motivate the audience.',
  'Make them feel understood': 'The primary goal is to make the audience feel understood and validated.',
  'Share news or information': 'The primary goal is to share news or information.',
}

const AUDIENCE_KNOWLEDGE_MAP = {
  'Nothing': 'The audience has no prior knowledge. Explain from basics, avoid jargon.',
  'A little': 'The audience has some prior knowledge. Don\'t oversimplify; explain clearly.',
  'A lot': 'The audience is knowledgeable. You can go deeper and use more technical language.',
  "They're experts": 'The audience are experts. Use technical language; skip basics.',
}

const RULE_TYPE_LABELS = {
  avoid: 'Avoid',
  prefer: 'Prefer',
  never: 'Never',
  tone: 'Tone',
  style: 'Style',
  delivery: 'Delivery',
  phrasing: 'Phrasing',
  speech_patterns: 'Speech Patterns',
  non_negotiables: 'Non-Negotiables',
  general: 'General',
}

/**
 * Returns verbose context strings for each profile field.
 * Handles null/undefined profile.
 */
export function elaborateProfile(profile) {
  if (!profile) {
    return {
      name: 'The creator has not yet completed profile setup.',
      tone: 'Use a warm, authentic, engaging tone.',
      goal: '',
      audience: '',
      audienceKnowledge: '',
      desiredFeeling: '',
      experienceBackground: '',
      platforms: '',
    }
  }

  const firstName = profile.first_name?.trim() || ''
  const lastName = profile.last_name?.trim() || ''
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'The creator'

  return {
    name,
    tone: (profile.tone_style && TONE_STYLE_MAP[profile.tone_style]) || 'Use a warm, authentic, engaging tone.',
    goal: (profile.content_goal && CONTENT_GOAL_MAP[profile.content_goal]) || '',
    audience: profile.target_audience?.trim() || '',
    audienceKnowledge: (profile.audience_knowledge_level && AUDIENCE_KNOWLEDGE_MAP[profile.audience_knowledge_level]) || '',
    desiredFeeling: profile.desired_feeling?.trim() || '',
    experienceBackground: profile.experience_background?.trim() || '',
    platforms: Array.isArray(profile.content_platforms) && profile.content_platforms.length > 0
      ? profile.content_platforms.join(', ')
      : '',
  }
}

/**
 * Formats voice rules as directives, grouped by type.
 */
export function formatRules(rules) {
  if (!rules || rules.length === 0) return ''

  const byType = {}
  for (const rule of rules) {
    const type = rule.rule_type || 'general'
    if (!byType[type]) byType[type] = []
    byType[type].push(rule.content?.trim() || '')
  }

  const lines = []
  const order = ['never', 'avoid', 'prefer', 'non_negotiables', 'tone', 'style', 'delivery', 'phrasing', 'speech_patterns', 'general']
  for (const type of order) {
    const items = byType[type]
    if (!items || items.length === 0) continue
    const label = RULE_TYPE_LABELS[type] || type
    for (const content of items) {
      if (content) lines.push(`${label}: ${content}`)
    }
  }

  return lines.join('\n')
}

/**
 * Builds the full system prompt for the AI.
 */
export function buildSystemPrompt({ profile, rules, prompt, duration, platform }) {
  const dur = duration ?? 60
  const wpm = profile?.speaking_speed_wpm ?? 145
  const maxWords = Math.round(((wpm / 60) * dur) / 10) * 10
  const platformLabel = platform || 'general content'

  const elaborated = elaborateProfile(profile)
  const rulesBlock = formatRules(rules)

  const parts = []

  // Section 1: Task
  parts.push(`Generate a script about the following topic for ${platformLabel} content. Maximum length: ${maxWords} words.\n`)
  parts.push(`Topic: ${prompt}\n`)

  // Section 2: Creator identity & goals
  parts.push('## Creator Profile')
  parts.push(`The creator is ${elaborated.name}.`)
  if (elaborated.goal) parts.push(elaborated.goal)
  if (elaborated.desiredFeeling) parts.push(`They want the audience to feel: ${elaborated.desiredFeeling}.`)
  if (elaborated.audienceKnowledge) parts.push(elaborated.audienceKnowledge)
  if (elaborated.audience) parts.push(`Target audience: ${elaborated.audience}.`)
  if (elaborated.experienceBackground) parts.push(`Creator background: ${elaborated.experienceBackground}.`)
  if (elaborated.platforms) parts.push(`Platforms: ${elaborated.platforms}.`)
  parts.push('')

  // Section 3: Style & rules
  parts.push('## Style and Voice Rules')
  parts.push(`When writing the script, use the style and tone of: ${elaborated.tone}`)
  if (rulesBlock) {
    parts.push('')
    parts.push('Make sure you follow these rules:')
    parts.push(rulesBlock)
  }
  parts.push('')

  // Section 4: Closing
  parts.push('Write the script in this creator\'s voice. Follow all rules above. Do not violate any Avoid or Never rules.')

  return parts.join('\n')
}
