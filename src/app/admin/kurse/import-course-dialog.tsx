'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { FileUpIcon, UploadIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { parseCourseMarkdown, type ParsedCourse } from '@/lib/parse-course-markdown'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const EXAMPLE_MARKDOWN = `# Deutsch A1 Grundkurs
> Grundstufe für Anfänger

Dieser Kurs vermittelt Grundkenntnisse der deutschen Sprache.

## Modul 1: Erste Kontakte

### Lernziele
- Sich vorstellen können
- Nach dem Befinden fragen und darauf reagieren

### Begrüssung und Vorstellung

#### Hallo, wie geht's?
#### Woher kommen Sie?

### Im Café

#### Was möchten Sie trinken?

## Modul 2: Meine Familie

### Lernziele
- Über die Familie sprechen
- Berufe benennen

### Familienmitglieder

#### Meine Eltern und Geschwister
#### Wer ist das?`

export function ImportCourseDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [preview, setPreview] = useState<ParsedCourse | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showExample, setShowExample] = useState(false)

  const handleParse = useCallback((text: string) => {
    setMarkdown(text)
    setImportError(null)

    if (!text.trim()) {
      setPreview(null)
      setParseError(null)
      return
    }

    const result = parseCourseMarkdown(text)
    if (result.ok) {
      setPreview(result.data)
      setParseError(null)
    } else {
      setPreview(null)
      setParseError(result.error)
    }
  }, [])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result
        if (typeof text === 'string') {
          handleParse(text)
        }
      }
      reader.readAsText(file)
      // Reset input so the same file can be re-selected
      e.target.value = ''
    },
    [handleParse]
  )

  const handleImport = async () => {
    if (!preview) return

    setImporting(true)
    setImportError(null)

    try {
      const res = await fetch('/api/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })

      const data = await res.json()

      if (!res.ok) {
        setImportError(data.error || 'Import fehlgeschlagen.')
        return
      }

      setOpen(false)
      setMarkdown('')
      setPreview(null)
      router.push(`/admin/kurse/${data.courseId}/builder`)
      router.refresh()
    } catch {
      setImportError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setImporting(false)
    }
  }

  const handleInsertExample = () => {
    handleParse(EXAMPLE_MARKDOWN)
    setShowExample(false)
  }

  // Count totals for preview
  const counts = preview
    ? {
        modules: preview.modules.length,
        lernziele: preview.modules.reduce((acc, m) => acc + m.lernziele.length, 0),
        themen: preview.modules.reduce((acc, m) => acc + m.themen.length, 0),
        lessons: preview.modules.reduce(
          (acc, m) => acc + m.themen.reduce((a, t) => a + t.lessons.length, 0),
          0
        ),
      }
    : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <UploadIcon data-icon="inline-start" />
        Kurs importieren
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kursstruktur importieren</DialogTitle>
          <DialogDescription>
            Fügen Sie eine Markdown-Kursstruktur ein oder laden Sie eine .md-Datei hoch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Example toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowExample(!showExample)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showExample ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
              Beispiel anzeigen
            </button>
            {showExample && (
              <div className="mt-2 rounded-md border bg-muted/50 p-3">
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{EXAMPLE_MARKDOWN}</pre>
                <Button
                  variant="ghost"
                  size="xs"
                  className="mt-2"
                  onClick={handleInsertExample}
                >
                  Beispiel einfügen
                </Button>
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            value={markdown}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="# Kurstitel&#10;> Untertitel&#10;&#10;## Modul 1&#10;### Lernziele&#10;- Lernziel 1&#10;### Thema 1&#10;#### Lektion 1"
            rows={12}
            className="w-full rounded-md border border-zinc-300 bg-background px-3 py-2 font-mono text-xs leading-relaxed dark:border-zinc-700"
          />

          {/* File upload */}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <FileUpIcon className="size-3.5" />
            .md-Datei hochladen
            <input
              type="file"
              accept=".md,.markdown,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Parse error */}
          {parseError && (
            <p className="text-xs text-red-600">{parseError}</p>
          )}

          {/* Preview */}
          {preview && counts && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-1.5 text-xs font-medium">Vorschau</p>
              <p className="text-sm font-medium">{preview.title}</p>
              {preview.subtitle && (
                <p className="text-xs text-muted-foreground">{preview.subtitle}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{counts.modules} Module</span>
                <span>{counts.themen} Themen</span>
                <span>{counts.lessons} Lektionen</span>
                <span>{counts.lernziele} Lernziele</span>
              </div>
              {/* Module tree */}
              <div className="mt-2 space-y-1">
                {preview.modules.map((mod, mi) => (
                  <div key={mi} className="text-xs">
                    <p className="font-medium">{mod.title}</p>
                    {mod.themen.map((th, ti) => (
                      <p key={ti} className="ml-3 text-muted-foreground">
                        {th.title}
                        {th.lessons.length > 0 && (
                          <span className="ml-1 opacity-60">
                            ({th.lessons.length} {th.lessons.length === 1 ? 'Lektion' : 'Lektionen'})
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import error */}
          {importError && (
            <p className="text-xs text-red-600">{importError}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={!preview || importing}
          >
            {importing ? 'Importieren...' : 'Importieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
