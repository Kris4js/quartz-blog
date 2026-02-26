import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

// Load .env file
const envPath = resolve(process.cwd(), ".env")
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim()
        process.env[key.trim()] = value
      }
    }
  })
}

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Kris4js 的博客",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "kris4js.github.io/quartz-blog",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
    aiSummary: {
      enabled: process.env.ENABLE_AI_SUMMARY === "true",
      provider: "openai", // OpenRouter is compatible with OpenAI API
      apiKeyEnvVar: "OPENAI_API_KEY",
      baseUrl: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",
      model: "deepseek/deepseek-v3.2",
      promptTemplate: "请用2-3句话总结这篇文档的核心内容：\n\n{content}",
      maxTokens: 150,
      cache: {
        type: "file",
        path: ".quartz/cache/ai-summaries.json",
      },
      showInUI: true,
      collapsible: true,
      defaultCollapsed: false,
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.AISummary({
        enabled: process.env.ENABLE_AI_SUMMARY === "true",
        provider: "openai",
        apiKeyEnvVar: "OPENAI_API_KEY",
        baseUrl: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",
        model: "deepseek/deepseek-v3.2",
        promptTemplate: "请用2-3句话总结这篇文档的核心内容：\n\n{content}",
        maxTokens: 150,
        cache: {
          type: "file",
          path: ".quartz/cache/ai-summaries.json",
        },
        showInUI: true,
        collapsible: true,
        defaultCollapsed: false,
      }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
