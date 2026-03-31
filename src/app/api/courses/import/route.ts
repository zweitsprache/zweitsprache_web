import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { parseCourseMarkdown } from '@/lib/parse-course-markdown'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  let courseId: string | null = null

  try {
    const body = await request.json()
    const markdown = body?.markdown

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown-Text ist erforderlich.' },
        { status: 400 }
      )
    }

    // Parse markdown
    const result = parseCourseMarkdown(markdown)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const parsed = result.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Create course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: parsed.title,
        subtitle: parsed.subtitle,
        about: parsed.about,
        published: false,
      })
      .select('id')
      .single()

    if (courseError || !courseData) {
      return NextResponse.json(
        { error: `Fehler beim Erstellen des Kurses: ${courseError?.message}` },
        { status: 500 }
      )
    }

    courseId = courseData.id
    let totalModules = 0
    let totalLernziele = 0
    let totalThemen = 0
    let totalLessons = 0

    // 2. Create modules, lernziele, themen, lessons
    for (let mi = 0; mi < parsed.modules.length; mi++) {
      const mod = parsed.modules[mi]

      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: mod.title,
          description: mod.description,
          sort_order: mi,
        })
        .select('id')
        .single()

      if (moduleError || !moduleData) {
        throw new Error(`Modul "${mod.title}": ${moduleError?.message}`)
      }

      totalModules++

      // Lernziele
      for (let li = 0; li < mod.lernziele.length; li++) {
        const lz = mod.lernziele[li]
        const { error: lzError } = await supabase
          .from('module_lernziele')
          .insert({
            module_id: moduleData.id,
            text: lz.text,
            sort_order: li,
          })

        if (lzError) {
          throw new Error(`Lernziel "${lz.text}": ${lzError.message}`)
        }

        totalLernziele++
      }

      // Themen
      for (let ti = 0; ti < mod.themen.length; ti++) {
        const thema = mod.themen[ti]

        const { data: themaData, error: themaError } = await supabase
          .from('themen')
          .insert({
            module_id: moduleData.id,
            title: thema.title,
            description: thema.description,
            sort_order: ti,
          })
          .select('id')
          .single()

        if (themaError || !themaData) {
          throw new Error(`Thema "${thema.title}": ${themaError?.message}`)
        }

        totalThemen++

        // Lessons
        for (let lei = 0; lei < thema.lessons.length; lei++) {
          const lesson = thema.lessons[lei]

          const { error: lessonError } = await supabase
            .from('lessons')
            .insert({
              thema_id: themaData.id,
              title: lesson.title,
              data: { blocks: [], settings: {} },
              sort_order: lei,
            })

          if (lessonError) {
            throw new Error(`Lektion "${lesson.title}": ${lessonError.message}`)
          }

          totalLessons++
        }
      }
    }

    return NextResponse.json({
      courseId,
      summary: {
        modules: totalModules,
        lernziele: totalLernziele,
        themen: totalThemen,
        lessons: totalLessons,
      },
    })
  } catch (error) {
    // Cleanup: delete the partially created course (cascade deletes children)
    if (courseId) {
      try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        await supabase.from('courses').delete().eq('id', courseId)
      } catch {
        // Best-effort cleanup
      }
    }

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: `Import fehlgeschlagen: ${message}` },
      { status: 500 }
    )
  }
}
