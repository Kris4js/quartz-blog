import { Root as HTMLRoot } from "hast"
import { toString } from "hast-util-to-string"
import { QuartzTransformerPlugin } from "../types"
import crypto from "crypto"
import fs from "fs/promises"
import path from "path"

export interface Options {
  enabled: boolean
  provider: "openai" | "anthropic" | "custom"
  apiKeyEnvVar: string
  baseUrl?: string
  model: string
  promptTemplate: string
  maxTokens: number
  cache: {
    type: "file" | "redis"
    path?: string
    redis?: {
      host: string
      port: number
      password?: string
      db?: number
    }
  }
  showInUI: boolean
  collapsible: boolean
  defaultCollapsed: boolean
}

const defaultOptions: Options = {
  enabled: false,
  provider: "openai",
  apiKeyEnvVar: "OPENAI_API_KEY",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  promptTemplate: "请用2-3句话总结这篇文档的核心内容：\n\n{content}",
  maxTokens: 150,
  cache: {
    type: "file",
    path: ".quartz/cache/ai-summaries.json",
  },
  showInUI: true,
  collapsible: true,
  defaultCollapsed: false,
}

export const AISummary: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "AISummary",
    htmlPlugins() {
      return [
        () => {
          return async (tree: HTMLRoot, file) => {
            if (!opts.enabled) return

            const content = file.data.text || toString(tree)
            const filePath = file.data.filePath!

            // Generate content hash as cache key
            const contentHash = crypto.createHash("sha256").update(content).digest("hex")
            const cacheKey = `${filePath}:${contentHash.substring(0, 16)}`

            // Check cache first
            const cached = await getFromCache(cacheKey, opts.cache)
            if (cached) {
              if (!file.data.frontmatter) {
                file.data.frontmatter = {} as any
              }
              ;(file.data.frontmatter as any).aiSummary = cached
              return
            }

            // Generate AI summary
            const summary = await generateAISummary(content, opts)
            if (summary) {
              if (!file.data.frontmatter) {
                file.data.frontmatter = {} as any
              }
              ;(file.data.frontmatter as any).aiSummary = summary
              await saveToCache(cacheKey, summary, opts.cache)
            }
          }
        },
      ]
    },
  }
}

async function generateAISummary(content: string, opts: Options): Promise<string | null> {
  const apiKey = process.env[opts.apiKeyEnvVar]
  if (!apiKey) {
    console.warn(`AI Summary: API key not found in ${opts.apiKeyEnvVar}`)
    return null
  }

  const baseUrl = opts.baseUrl || "https://api.openai.com/v1"
  const prompt = opts.promptTemplate.replace("{content}", content.substring(0, 8000))

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }

    // Add OpenRouter specific headers (must use ASCII only)
    if (baseUrl.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "https://kris4js.github.io/quartz-blog"
      headers["X-Title"] = "Kris4js Blog"
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: opts.maxTokens,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI Summary API error: ${response.status} ${response.statusText}`)
      console.error(`Response body: ${errorText}`)
      return null
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content?.trim() || null

    if (!summary) {
      console.warn("AI Summary: Empty response from API")
    }

    return summary
  } catch (error) {
    console.error("AI Summary generation failed:", error)
    return null
  }
}

async function getFromCache(key: string, cacheConfig: Options["cache"]): Promise<string | null> {
  if (cacheConfig.type === "file") {
    try {
      const cachePath = cacheConfig.path || ".quartz/cache/ai-summaries.json"
      const data = await fs.readFile(cachePath, "utf-8")
      const cache = JSON.parse(data)
      return cache[key] || null
    } catch {
      return null
    }
  }
  // TODO: Redis support in future
  return null
}

async function saveToCache(
  key: string,
  value: string,
  cacheConfig: Options["cache"],
): Promise<void> {
  if (cacheConfig.type === "file") {
    try {
      const cachePath = cacheConfig.path || ".quartz/cache/ai-summaries.json"
      const cacheDir = path.dirname(cachePath)

      // Ensure directory exists
      await fs.mkdir(cacheDir, { recursive: true })

      // Read existing cache or create new one
      let cache: Record<string, string> = {}
      try {
        const data = await fs.readFile(cachePath, "utf-8")
        cache = JSON.parse(data)
      } catch {
        // Cache file doesn't exist, start with empty cache
      }

      // Update cache
      cache[key] = value

      // Write cache
      await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), "utf-8")
    } catch (error) {
      console.error("Failed to save cache:", error)
    }
  }
  // TODO: Redis support in future
}
