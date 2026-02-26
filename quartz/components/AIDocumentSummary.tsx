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
          <span class="ai-summary-icon">✨</span>
          <span class="ai-summary-label">AI 文档总结</span>
        </summary>
        <div class="ai-summary-content">{aiSummary}</div>
      </details>
    </div>
  )
}

AIDocumentSummary.css = `
.ai-summary-container {
  margin: 1rem 0;
}

.ai-summary {
  background: var(--highlight);
  border-left: 3px solid var(--secondary);
  border-radius: 4px;
  padding: 0.5rem 1rem;
}

.ai-summary-header {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--darkgray);
}

.ai-summary-header::-webkit-details-marker {
  display: none;
}

.ai-summary-icon {
  font-size: 1.2em;
}

.ai-summary-label {
  font-size: 0.9em;
}

.ai-summary[open] .ai-summary-header {
  margin-bottom: 0.5rem;
}

.ai-summary-content {
  color: var(--dark);
  font-size: 0.95em;
  line-height: 1.6;
  padding-left: 0.5rem;
}
`

export default (() => AIDocumentSummary) satisfies QuartzComponentConstructor
