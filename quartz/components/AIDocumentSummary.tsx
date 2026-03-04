import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const AIDocumentSummary: QuartzComponent = ({
  fileData,
  displayClass,
  cfg,
}: QuartzComponentProps) => {
  const aiSummary = fileData.frontmatter?.aiSummary
  const aiConfig = cfg.aiSummary

  if (!aiSummary || !aiConfig?.showInUI) return null

  const { collapsible, defaultCollapsed } = aiConfig

  return (
    <div class={classNames(displayClass, "ai-summary-container")}>
      <details class="ai-summary" {...(collapsible && defaultCollapsed ? {} : { open: true })}>
        <summary class="ai-summary-header">
          <span class="ai-summary-label">TL;DR</span>
        </summary>
        <div class="ai-summary-content">{aiSummary}</div>
      </details>
    </div>
  )
}

AIDocumentSummary.css = `
.ai-summary-container {
  margin: 1.5rem 0;
}

.ai-summary {
  background: linear-gradient(135deg, var(--highlight) 0%, color-mix(in srgb, var(--highlight) 80%, var(--secondary) 20%) 100%);
  border: 1px solid color-mix(in srgb, var(--secondary) 40%, transparent);
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.ai-summary:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-summary-header {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  user-select: none;
}

.ai-summary-header::-webkit-details-marker {
  display: none;
}

.ai-summary-label {
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--secondary);
  background: color-mix(in srgb, var(--secondary) 12%, transparent);
  padding: 0.2em 0.6em;
  border-radius: 4px;
}

.ai-summary[open] .ai-summary-header {
  border-bottom: 1px solid color-mix(in srgb, var(--secondary) 20%, transparent);
}

.ai-summary-content {
  color: var(--dark);
  font-size: 0.93em;
  line-height: 1.65;
  padding: 0.75rem 1rem;
}
`

export default (() => AIDocumentSummary) satisfies QuartzComponentConstructor
