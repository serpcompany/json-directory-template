import type { SiteOwnedContent } from '../types'

export const serpdownloadersSiteContent: SiteOwnedContent = {
  externalTools: [
    {
      description: 'Check if websites implement llms.txt and llms-full.txt files',
      href: 'https://chromewebstore.google.com/detail/llmstxt-checker/klcihkijejcgnaiinaehcjbggamippej',
      icon: 'chrome',
      imageAlt: 'LLMs.txt Checker Screenshot',
      imageSrc: '/tools/llmstxt-checker.png',
      name: 'LLMs.txt Checker Chrome Extension',
      slug: 'chrome-extension'
    },
    {
      description: 'Search and explore llms.txt files directly in VS Code',
      href: 'https://marketplace.visualstudio.com/items?itemName=TheDavidDias.vscode-llms-txt',
      icon: 'code2',
      imageAlt: 'VS Code Extension Screenshot',
      imageSrc: '/tools/vscode-extension.png',
      name: 'LLMS.txt VSCode Extension',
      slug: 'vscode-extension'
    },
    {
      description: 'Explore and analyze llms.txt files using MCP',
      href: 'https://github.com/thedaviddias/mcp-llms-txt-explorer',
      icon: 'gitBranch',
      imageAlt: 'MCP LLMS.txt Explorer Screenshot',
      imageSrc: '/tools/mcp-llms-txt-explorer.png',
      name: 'MCP LLMS.txt Explorer',
      slug: 'mcp-explorer'
    },
    {
      description: 'Search and explore llms.txt files directly in Raycast',
      href: 'https://www.raycast.com/thedaviddias/llms-txt',
      icon: 'command',
      imageAlt: 'Raycast Extension Screenshot',
      imageSrc: '/tools/llms-txt-raycast-extension.png',
      name: 'LLMs Txt Raycast Extension',
      slug: 'raycast-extension'
    },
    {
      description: 'Install llms.txt documentation directly into your AI coding agents',
      href: 'https://www.npmjs.com/package/llmstxt-cli',
      icon: 'terminal',
      imageAlt: 'llmstxt CLI Screenshot',
      imageSrc: '/tools/llmstxt-cli.png',
      name: 'llmstxt CLI',
      slug: 'cli'
    }
  ],
  listingCliInstall: null
}
