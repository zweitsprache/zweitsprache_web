// ─── Types ───

export type ParsedLesson = {
  title: string
}

export type ParsedThema = {
  title: string
  description: string | null
  lessons: ParsedLesson[]
}

export type ParsedLernziel = {
  text: string
}

export type ParsedModule = {
  title: string
  description: string | null
  lernziele: ParsedLernziel[]
  themen: ParsedThema[]
}

export type ParsedCourse = {
  title: string
  subtitle: string | null
  about: string | null
  modules: ParsedModule[]
}

export type ParseResult =
  | { ok: true; data: ParsedCourse }
  | { ok: false; error: string }

// ─── Parser ───

const LERNZIELE_KEYWORDS = ['lernziele', 'lernziel', 'learning objectives', 'objectives']

function isLernzieleHeading(text: string): boolean {
  return LERNZIELE_KEYWORDS.includes(text.toLowerCase().trim())
}

export function parseCourseMarkdown(markdown: string): ParseResult {
  const lines = markdown.split('\n')

  let course: ParsedCourse | null = null
  let currentModule: ParsedModule | null = null
  let currentThema: ParsedThema | null = null
  let inLernziele = false

  // Track where we're collecting description text
  type DescTarget = 'course' | 'module' | 'thema' | null
  let descTarget: DescTarget = null
  let descLines: string[] = []

  function flushDescription() {
    const text = descLines.join('\n').trim() || null
    if (text && descTarget === 'course' && course) {
      course.about = text
    } else if (text && descTarget === 'module' && currentModule) {
      currentModule.description = text
    } else if (text && descTarget === 'thema' && currentThema) {
      currentThema.description = text
    }
    descLines = []
    descTarget = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // ─── # Course Title ───
    if (/^# (?!#)/.test(trimmed)) {
      if (course) {
        return { ok: false, error: `Zeile ${i + 1}: Nur ein Kurstitel (# ) erlaubt.` }
      }
      flushDescription()
      course = {
        title: trimmed.replace(/^# /, '').trim(),
        subtitle: null,
        about: null,
        modules: [],
      }
      descTarget = 'course'
      inLernziele = false
      continue
    }

    // ─── > Subtitle (only right after #) ───
    if (/^> /.test(trimmed) && course && course.modules.length === 0 && descTarget === 'course') {
      course.subtitle = trimmed.replace(/^> /, '').trim()
      continue
    }

    // ─── ## Module Title ───
    if (/^## (?!#)/.test(trimmed)) {
      if (!course) {
        return { ok: false, error: `Zeile ${i + 1}: Kurstitel (# ) muss vor dem ersten Modul stehen.` }
      }
      flushDescription()
      currentThema = null
      inLernziele = false
      currentModule = {
        title: trimmed.replace(/^## /, '').trim(),
        description: null,
        lernziele: [],
        themen: [],
      }
      course.modules.push(currentModule)
      descTarget = 'module'
      continue
    }

    // ─── ### Lernziele or ### Thema Title ───
    if (/^### (?!#)/.test(trimmed)) {
      if (!currentModule) {
        return { ok: false, error: `Zeile ${i + 1}: Ein Modul (## ) muss vor einem Thema/Lernziel stehen.` }
      }
      flushDescription()
      const headingText = trimmed.replace(/^### /, '').trim()

      if (isLernzieleHeading(headingText)) {
        inLernziele = true
        currentThema = null
        descTarget = null
      } else {
        inLernziele = false
        currentThema = {
          title: headingText,
          description: null,
          lessons: [],
        }
        currentModule.themen.push(currentThema)
        descTarget = 'thema'
      }
      continue
    }

    // ─── #### Lesson Title ───
    if (/^#### (?!#)/.test(trimmed)) {
      if (!currentThema) {
        return { ok: false, error: `Zeile ${i + 1}: Ein Thema (### ) muss vor einer Lektion stehen.` }
      }
      flushDescription()
      inLernziele = false
      const lessonTitle = trimmed.replace(/^#### /, '').trim()
      currentThema.lessons.push({ title: lessonTitle })
      descTarget = null
      continue
    }

    // ─── - List item (Lernziel) ───
    if (/^[-*] /.test(trimmed) && inLernziele && currentModule) {
      const text = trimmed.replace(/^[-*] /, '').trim()
      if (text) {
        currentModule.lernziele.push({ text })
      }
      continue
    }

    // ─── Plain text → description accumulation ───
    if (trimmed === '') {
      if (descLines.length > 0) {
        descLines.push('')
      }
      continue
    }

    // If we're in lernziele mode but hit non-list text, stop lernziele
    if (inLernziele && !/^[-*] /.test(trimmed)) {
      inLernziele = false
    }

    if (descTarget) {
      descLines.push(trimmed)
    }
  }

  // Flush any remaining description
  flushDescription()

  // ─── Validation ───
  if (!course) {
    return { ok: false, error: 'Kein Kurstitel gefunden. Die erste Zeile muss mit "# " beginnen.' }
  }

  if (!course.title.trim()) {
    return { ok: false, error: 'Kurstitel darf nicht leer sein.' }
  }

  if (course.modules.length === 0) {
    return { ok: false, error: 'Mindestens ein Modul (## ) ist erforderlich.' }
  }

  return { ok: true, data: course }
}
