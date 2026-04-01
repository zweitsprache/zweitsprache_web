// ─── Visibility ──────────────────────────────────────────────
export type BlockVisibility = "both" | "print" | "online";

// ─── View mode ───────────────────────────────────────────────
export type ViewMode = "print" | "online";

// ─── Content locale ──────────────────────────────────────────
// "de" is the base language (always stored in lessons.data).
// "en" / "uk" are learner-language translations stored in lesson_translations.
export type ContentLocale = "de" | "en" | "uk";

export const CONTENT_LOCALE_LABELS: Record<ContentLocale, string> = {
  de: "DE",
  en: "EN",
  uk: "UA",
};

export const CONTENT_LOCALE_FLAGS: Record<ContentLocale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  uk: "🇺🇦",
};

// ─── Block types ─────────────────────────────────────────────
export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "image-cards"
  | "spacer"
  | "divider"
  | "multiple-choice"
  | "fill-in-blank"
  | "matching"
  | "open-response"
  | "word-bank"
  | "number-line"
  | "columns"
  | "true-false-matrix"
  | "order-items"
  | "inline-choices"
  | "word-search"
  | "sorting-categories"
  | "unscramble-words"
  | "fix-sentences"
  | "complete-sentences"
  | "verb-table"
  | "text-cards"
  | "glossary"
  | "article-training"
  | "chart"
  | "numbered-label"
  | "two-column-fill"
  | "dialogue"
  | "fill-in-blank-items"
  | "page-break"
  | "writing-lines"
  | "writing-rows"
  | "linked-blocks"
  | "text-snippet"
  | "email-skeleton"
  | "job-application"
  | "dos-and-donts"
  | "numbered-items"
  | "logo-divider"
  | "ai-prompt"
  | "ai-tool"
  | "table"
  | "text-comparison"
  | "accordion"
  | "audio";

// ─── Base block ──────────────────────────────────────────────
export interface BlockBase {
  id: string;
  type: BlockType;
  visibility: BlockVisibility;
  /**
   * When false this block is never translated — it always renders base (DE)
   * content regardless of the active content locale. Use for blocks whose
   * German text IS the learning target (e.g. a word bank in German).
   * Defaults to true (translatable).
   */
  translatable?: boolean;
}

// ─── Heading block ───────────────────────────────────────────
export interface HeadingBlock extends BlockBase {
  type: "heading";
  content: string;
  level: 1 | 2 | 3;
}

// ─── Text / Rich-text block ─────────────────────────────────
export type TextBlockStyle =
  | "standard"
  | "example"
  | "example-standard"
  | "example-improved"
  | "hinweis"
  | "hinweis-wichtig"
  | "hinweis-alarm"
  | "lernziel"
  | "rows";

export interface TextBlock extends BlockBase {
  type: "text";
  content: string; // HTML string for WYSIWYG
  textStyle?: TextBlockStyle;
  comment?: string;
  imageSrc?: string;
  imageAlign?: "left" | "right";
  imageScale?: number; // 10-100, percentage of container width
}

// ─── Image block ─────────────────────────────────────────────
export type ImageBlockStyle = "standard" | "example";

export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  imageStyle?: ImageBlockStyle;
}

// ─── Image Cards block ───────────────────────────────────────
export interface ImageCardItem {
  id: string;
  src: string;
  alt: string;
  text: string;
}

export interface ImageCardsBlock extends BlockBase {
  type: "image-cards";
  items: ImageCardItem[];
  columns: 2 | 3 | 4;
  imageAspectRatio: "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  imageScale: number; // 10-100
  showWritingLines: boolean;
  writingLinesCount: number;
  showWordBank: boolean;
}

// ─── Text Cards block ────────────────────────────────────────
export interface TextCardItem {
  id: string;
  text: string;
  caption: string;
}

export interface TextCardsBlock extends BlockBase {
  type: "text-cards";
  items: TextCardItem[];
  columns: 2 | 3 | 4;
  textSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  textAlign: "left" | "center" | "right";
  textBold: boolean;
  textItalic: boolean;
  showBorder: boolean;
  showWritingLines: boolean;
  writingLinesCount: number;
  showWordBank: boolean;
}

// ─── Spacer block ────────────────────────────────────────────
export interface SpacerBlock extends BlockBase {
  type: "spacer";
  height: number; // px
}

// ─── Divider block ───────────────────────────────────────────
export interface DividerBlock extends BlockBase {
  type: "divider";
  style: "solid" | "dashed" | "dotted";
}

// ─── Logo Divider block ──────────────────────────────────────
export interface LogoDividerBlock extends BlockBase {
  type: "logo-divider";
}

// ─── Table block ─────────────────────────────────────────────
export type TableStyle = "default" | "striped" | "bordered" | "minimal";

export interface TableBlock extends BlockBase {
  type: "table";
  content: string;
  tableStyle?: TableStyle;
  caption?: string;
  columnWidths?: number[];
}

// ─── Multiple-choice block ──────────────────────────────────
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoiceBlock extends BlockBase {
  type: "multiple-choice";
  question: string;
  options: MultipleChoiceOption[];
  allowMultiple: boolean;
}

// ─── Fill-in-blank block ────────────────────────────────────
export interface FillInBlankBlock extends BlockBase {
  type: "fill-in-blank";
  // Text with blanks marked as {{blank:answer}}
  content: string;
}

// ─── Fill-in-blank items block ──────────────────────────────
export interface FillInBlankItem {
  id: string;
  content: string; // text with {{blank:answer}} gaps
}

export interface FillInBlankItemsBlock extends BlockBase {
  type: "fill-in-blank-items";
  items: FillInBlankItem[];
  showWordBank: boolean;
}

// ─── Matching block ─────────────────────────────────────────
export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingBlock extends BlockBase {
  type: "matching";
  instruction: string;
  pairs: MatchingPair[];
  extendedRows?: boolean;
}

// ─── Two-column fill block ──────────────────────────────────
export interface TwoColumnFillItem {
  id: string;
  left: string;
  right: string;
}

export interface TwoColumnFillBlock extends BlockBase {
  type: "two-column-fill";
  instruction: string;
  items: TwoColumnFillItem[];
  fillSide: "left" | "right";
  colRatio?: "1-1" | "1-2" | "2-1";
  extendedRows?: boolean;
  showWordBank?: boolean;
}

// ─── Glossary block ─────────────────────────────────────────
export interface GlossaryPair {
  id: string;
  term: string;
  definition: string;
}

export interface GlossaryBlock extends BlockBase {
  type: "glossary";
  instruction: string;
  pairs: GlossaryPair[];
}

// ─── Open response block ────────────────────────────────────
export interface OpenResponseBlock extends BlockBase {
  type: "open-response";
  question: string;
  lines: number; // number of answer lines
}

// ─── Word bank block ────────────────────────────────────────
export interface WordBankBlock extends BlockBase {
  type: "word-bank";
  words: string[];
}

// ─── Number line block ──────────────────────────────────────
export interface NumberLineBlock extends BlockBase {
  type: "number-line";
  min: number;
  max: number;
  step: number;
  markers: number[];
}

// ─── Columns block (layout) ─────────────────────────────────
export interface ColumnsBlock extends BlockBase {
  type: "columns";
  columns: number; // 1–4
  children: WorksheetBlock[][];
}

// ─── True/False Matrix block ─────────────────────────────────
export interface TrueFalseMatrixBlock extends BlockBase {
  type: "true-false-matrix";
  instruction: string;
  statementColumnHeader?: string;
  trueLabel?: string;
  falseLabel?: string;
  showPill?: boolean;
  statements: {
    id: string;
    text: string;
    correctAnswer: boolean;
  }[];
  statementOrder?: string[];
}

// ─── Article Training block ──────────────────────────────────
export type ArticleAnswer = "der" | "das" | "die";

export interface ArticleTrainingBlock extends BlockBase {
  type: "article-training";
  instruction: string;
  showWritingLine: boolean;
  items: {
    id: string;
    text: string;
    correctArticle: ArticleAnswer;
  }[];
}

// ─── Order Items block ───────────────────────────────────────
export interface OrderItemsBlock extends BlockBase {
  type: "order-items";
  instruction: string;
  showPill?: boolean;
  items: {
    id: string;
    text: string;
    correctPosition: number;
  }[];
}

// ─── Inline Choices block ────────────────────────────────────
export interface InlineChoiceItem {
  id: string;
  content: string;
}

export interface InlineChoicesBlock extends BlockBase {
  type: "inline-choices";
  items: InlineChoiceItem[];
  /** @deprecated — kept for backward compatibility with old data. Use items instead. */
  content?: string;
}

// ─── Word Search block ──────────────────────────────────────
export interface WordSearchBlock extends BlockBase {
  type: "word-search";
  words: string[];
  gridSize?: number; // deprecated, use gridCols/gridRows
  gridCols: number;
  gridRows: number;
  grid: string[][];
  showWordList: boolean;
}

// ─── Sorting Categories block ───────────────────────────────
export interface SortingCategory {
  id: string;
  label: string;
  correctItems: string[];
}

export interface SortingItem {
  id: string;
  text: string;
}

export interface SortingCategoriesBlock extends BlockBase {
  type: "sorting-categories";
  instruction: string;
  categories: SortingCategory[];
  items: SortingItem[];
  showWritingLines: boolean;
}

// ─── Unscramble Words block ─────────────────────────────────
export interface UnscrambleWordItem {
  id: string;
  word: string;
}

export interface UnscrambleWordsBlock extends BlockBase {
  type: "unscramble-words";
  instruction: string;
  words: UnscrambleWordItem[];
  keepFirstLetter: boolean;
  lowercaseAll: boolean;
  showPill?: boolean;
  itemOrder?: string[];
}

// ─── Fix Sentences block ────────────────────────────────────
export interface FixSentenceItem {
  id: string;
  sentence: string;
}

export interface FixSentencesBlock extends BlockBase {
  type: "fix-sentences";
  instruction: string;
  sentences: FixSentenceItem[];
}

// ─── Complete Sentences block ───────────────────────────────
export interface CompleteSentenceItem {
  id: string;
  beginning: string;
}

export interface CompleteSentencesBlock extends BlockBase {
  type: "complete-sentences";
  instruction: string;
  sentences: CompleteSentenceItem[];
}

// ─── Verb Table block ───────────────────────────────────────
export interface VerbTableRow {
  id: string;
  person: string;
  detail?: string;
  pronoun: string;
  conjugation: string;
  conjugation2?: string;
  showOverride?: "show" | "hide" | null;
  showOverride2?: "show" | "hide" | null;
}

export interface VerbTableBlock extends BlockBase {
  type: "verb-table";
  verb: string;
  splitConjugation?: boolean;
  showConjugations?: boolean;
  singularRows: VerbTableRow[];
  pluralRows: VerbTableRow[];
}

// ─── Dialogue block ──────────────────────────────────────────
export type DialogueSpeakerIcon = "triangle" | "square" | "diamond" | "circle";

export interface DialogueItem {
  id: string;
  speaker: string;
  icon: DialogueSpeakerIcon;
  text: string;
}

export interface DialogueBlock extends BlockBase {
  type: "dialogue";
  instruction: string;
  items: DialogueItem[];
  showWordBank: boolean;
}

// ─── Chart block ─────────────────────────────────────────────
export type ChartType = "bar" | "pie" | "line";

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface ChartBlock extends BlockBase {
  type: "chart";
  chartType: ChartType;
  title?: string;
  data: ChartDataPoint[];
  showLegend: boolean;
  showValues: boolean;
  showGrid: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// ─── Numbered Label block ────────────────────────────────────
export interface NumberedLabelBlock extends BlockBase {
  type: "numbered-label";
  startNumber: number;
  prefix: string;
  suffix: string;
}

// ─── Page Break block ────────────────────────────────────────
export interface PageBreakBlock extends BlockBase {
  type: "page-break";
}

// ─── Writing Lines block ─────────────────────────────────────
export interface WritingLinesBlock extends BlockBase {
  type: "writing-lines";
  lineCount: number;
  lineSpacing: number;
}

// ─── Writing Rows block ──────────────────────────────────────
export interface WritingRowsBlock extends BlockBase {
  type: "writing-rows";
  rowCount: number;
}

// ─── Text Snippet block ──────────────────────────────────────
export interface TextSnippetBlock extends BlockBase {
  type: "text-snippet";
  content: string;
  translatedContent?: string;
}

// ─── Email Skeleton block ─────────────────────────────────────
export type EmailSkeletonStyle = "none" | "standard" | "teal";

export interface EmailAttachment {
  id: string;
  name: string;
}

export interface EmailSkeletonBlock extends BlockBase {
  type: "email-skeleton";
  from: string;
  to: string;
  subject: string;
  body: string;
  emailStyle: EmailSkeletonStyle;
  attachments: EmailAttachment[];
  comment?: string;
}

// ─── Job Application block ────────────────────────────────────
export type JobApplicationStyle = "none" | "standard" | "teal";

export interface JobApplicationBlock extends BlockBase {
  type: "job-application";
  firstName: string;
  applicantName: string;
  email: string;
  phone: string;
  position: string;
  message: string;
  applicationStyle: JobApplicationStyle;
  comment?: string;
}

// ─── Text Comparison block ───────────────────────────────────
export interface TextComparisonBlock extends BlockBase {
  type: "text-comparison";
  leftContent: string;
  rightContent: string;
  comment?: string;
}

// ─── Dos and Don'ts block ────────────────────────────────────
export interface DosAndDontsItem {
  id: string;
  text: string;
}

export interface DosAndDontsBlock extends BlockBase {
  type: "dos-and-donts";
  layout: "horizontal" | "vertical";
  showTitles: boolean;
  dosTitle: string;
  dontsTitle: string;
  dos: DosAndDontsItem[];
  donts: DosAndDontsItem[];
}

// ─── Numbered Items block ─────────────────────────────────────
export interface NumberedItem {
  id: string;
  content: string;
}

export interface NumberedItemsBlock extends BlockBase {
  type: "numbered-items";
  items: NumberedItem[];
  startNumber: number;
  bgColor?: string;
  borderRadius?: number;
}

// ─── Accordion block ─────────────────────────────────────────
export interface AccordionItem {
  id: string;
  title: string;
  children: WorksheetBlock[];
}

export interface AccordionBlock extends BlockBase {
  type: "accordion";
  items: AccordionItem[];
  showNumbers?: boolean;
}

// ─── Audio block ─────────────────────────────────────────────
export interface AudioBlock extends BlockBase {
  type: "audio";
  src: string;
  title?: string;
}

// ─── AI Prompt block ─────────────────────────────────────────
export interface AiPromptBlock extends BlockBase {
  type: "ai-prompt";
  instructions: string;
  description: string;
  variableName: string;
  prompt: string;
  userInput: string;
  aiResult: string;
}

// ─── AI Tool block ───────────────────────────────────────────
export interface AiToolBlock extends BlockBase {
  type: "ai-tool";
  toolId: string;
  toolSlug: string;
  toolTitle: string;
  toolDescription: string;
}

// ─── Linked Blocks block ─────────────────────────────────────
export interface LinkedBlocksBlock extends BlockBase {
  type: "linked-blocks";
  worksheetId: string;
  worksheetTitle: string;
  worksheetSlug: string;
}

// ─── Union type ──────────────────────────────────────────────
export type WorksheetBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ImageCardsBlock
  | TextCardsBlock
  | SpacerBlock
  | DividerBlock
  | MultipleChoiceBlock
  | FillInBlankBlock
  | MatchingBlock
  | OpenResponseBlock
  | WordBankBlock
  | NumberLineBlock
  | ColumnsBlock
  | TrueFalseMatrixBlock
  | OrderItemsBlock
  | InlineChoicesBlock
  | WordSearchBlock
  | SortingCategoriesBlock
  | UnscrambleWordsBlock
  | FixSentencesBlock
  | CompleteSentencesBlock
  | VerbTableBlock
  | GlossaryBlock
  | ArticleTrainingBlock
  | ChartBlock
  | NumberedLabelBlock
  | TwoColumnFillBlock
  | DialogueBlock
  | FillInBlankItemsBlock
  | PageBreakBlock
  | WritingLinesBlock
  | WritingRowsBlock
  | LinkedBlocksBlock
  | TextSnippetBlock
  | EmailSkeletonBlock
  | JobApplicationBlock
  | TextComparisonBlock
  | DosAndDontsBlock
  | NumberedItemsBlock
  | LogoDividerBlock
  | AccordionBlock
  | AudioBlock
  | AiPromptBlock
  | AiToolBlock
  | TableBlock;

// ─── Brand types ────────────────────────────────────────────
export type Brand = "edoomio" | "lingostar";

export interface BrandSettings {
  logo: string;
  organization: string;
  teacher: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
}

export interface BrandFonts {
  bodyFont: string;
  headlineFont: string;
  headlineWeight: number;
  subHeadlineFont: string;
  subHeadlineWeight: number;
  headerFooterFont: string;
  googleFontsUrl: string;
  primaryColor: string;
}

// ─── CH overrides for Swiss locale ──────────────────────────
/** Per-block, per-field Swiss German text overrides. */
export type ChOverrides = Record<string, Record<string, string>>;

// ─── Worksheet settings ─────────────────────────────────────
export interface WorksheetSettings {
  pageSize: "a4" | "letter";
  orientation: "portrait" | "landscape";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
  fontSize: number;
  fontFamily: string;
  brand: Brand;
  brandSettings: BrandSettings;
  chOverrides?: ChOverrides;
  coverSubtitle: string;
  coverInfoText: string;
  coverImages: string[];
  coverImageBorder: boolean;
}

// ─── Worksheet document ─────────────────────────────────────
export interface WorksheetDocument {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  blocks: WorksheetBlock[];
  settings: WorksheetSettings;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

