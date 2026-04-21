import { z } from 'zod';
import { createEndpoint } from 'zite-integrations-backend-sdk';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.ZITE_OPENAI_ACCESS_TOKEN });

const MODEL = 'gpt-4.1-mini';

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [

  // ========== WEB & SEARCH ==========
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Fetch and read the full content of any URL from the internet.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'The full URL to fetch' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the internet for current information on any topic.',
      parameters: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'The search query' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wikipedia',
      description: 'Get a summary of any topic from Wikipedia.',
      parameters: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'The topic to look up on Wikipedia' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Get the latest news headlines. Can filter by topic or keyword.',
      parameters: {
        type: 'object' as const,
        properties: { topic: { type: 'string', description: 'News topic or keyword' } },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'youtube_search',
      description: 'Search for YouTube videos and get titles, links, and descriptions.',
      parameters: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'Search query for YouTube videos' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_scrape',
      description: 'Deep scrape a webpage with CSS selectors to extract specific elements.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'URL to scrape' },
          selector: { type: 'string', description: 'CSS selector to extract, e.g. "h1", ".title", "#content", "a[href]"' },
          attribute: { type: 'string', description: 'Optional attribute to extract (e.g. "href", "src"). If omitted, returns text content.' },
        },
        required: ['url', 'selector'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rss_feed',
      description: 'Parse and read any RSS/Atom feed.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'RSS feed URL' },
          limit: { type: 'string', description: 'Max items to return (default: 10)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'link_preview',
      description: 'Get Open Graph metadata (title, description, image) from any URL.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'URL to get preview metadata from' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sitemap_parse',
      description: 'Parse a website sitemap and list all URLs.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'Sitemap URL (usually /sitemap.xml)' },
          limit: { type: 'string', description: 'Max URLs to return (default: 50)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reddit_search',
      description: 'Search Reddit posts and comments.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          subreddit: { type: 'string', description: 'Optional subreddit to search in' },
          sort: { type: 'string', description: 'Sort by: "relevance", "hot", "top", "new" (default: relevance)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hackernews',
      description: 'Get top stories from Hacker News.',
      parameters: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: '"top", "new", "best", "ask", "show" (default: top)' },
          limit: { type: 'string', description: 'Number of stories (default: 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trending_topics',
      description: 'Get trending topics from Google Trends.',
      parameters: {
        type: 'object' as const,
        properties: {
          country: { type: 'string', description: 'Country code, e.g. "US", "GB", "MA" (default: US)' },
        },
        required: [],
      },
    },
  },

  // ========== CODE & MATH ==========
  {
    type: 'function',
    function: {
      name: 'run_code',
      description: 'Execute code in a secure sandbox. Supports Python, JavaScript, TypeScript, Java, C++, C, Ruby, Go, PHP, Rust, Swift, Kotlin, R, Bash, and 50+ more languages.',
      parameters: {
        type: 'object' as const,
        properties: {
          language: { type: 'string', description: 'Programming language' },
          code: { type: 'string', description: 'The full code to execute' },
          stdin: { type: 'string', description: 'Optional standard input' },
        },
        required: ['language', 'code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Evaluate a mathematical expression and return the result.',
      parameters: {
        type: 'object' as const,
        properties: { expression: { type: 'string', description: 'Math expression, e.g. "2 + 2 * 10", "Math.sqrt(144)"' } },
        required: ['expression'],
      },
    },
  },

  // ========== FILES & IMAGES ==========
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: `Create ANY downloadable file. Supports ALL types:
- Documents: PDF (as styled HTML), PPTX (as HTML slides), DOCX (as HTML)
- Data: CSV, JSON, XML, YAML, TOML, INI, SQL dumps
- Web: HTML, CSS, JavaScript, TypeScript, SVG
- Code: Python, Java, C++, C, Go, Rust, Ruby, PHP, Swift, Kotlin, Dart, R, Lua, Shell
- Config: .env, Dockerfile, docker-compose.yml, nginx.conf, Makefile, package.json, tsconfig.json
- Text: Markdown, TXT, LaTeX (.tex), reStructuredText
- Spreadsheets: CSV (for Excel import), TSV
For PPTX: generate a full HTML document with slide-like sections using CSS page breaks (print to save as PDF/PPTX).
For any file: provide complete content with proper formatting.`,
      parameters: {
        type: 'object' as const,
        properties: {
          filename: { type: 'string', description: 'Filename with extension (e.g. "report.pdf", "data.xlsx", "app.py", "style.css", "config.yaml")' },
          content: { type: 'string', description: 'Complete file content. For PDF: full HTML with CSS. For code: complete runnable code. For data: complete dataset.' },
          mimeType: { type: 'string', description: 'MIME type (e.g. "application/pdf", "text/csv", "application/json", "text/html", "text/plain", "text/yaml", "application/xml")' },
        },
        required: ['filename', 'content', 'mimeType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_pptx',
      description: 'Create a presentation with multiple slides. Provide slides as a JSON array. Each slide has a title, content (use \\n for line breaks, "- " prefix for bullets), and optional bg (CSS gradient).',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Presentation title' },
          slides: { type: 'string', description: 'JSON array of slides: [{"title":"Title","content":"Line 1\\n- Bullet 1\\n- Bullet 2","bg":"linear-gradient(...)"}]' },
        },
        required: ['title', 'slides'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_binary_file',
      description: 'Create a binary/base64 file for download. Use this for images, audio, zip archives, Excel files, or any non-text file generated by run_code.',
      parameters: {
        type: 'object' as const,
        properties: {
          filename: { type: 'string', description: 'Filename with extension (e.g. "chart.png", "audio.mp3", "archive.zip", "data.xlsx")' },
          base64: { type: 'string', description: 'Base64-encoded file content' },
          mimeType: { type: 'string', description: 'MIME type (e.g. "image/png", "audio/mpeg", "application/zip", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")' },
        },
        required: ['filename', 'base64', 'mimeType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_image_url',
      description: 'Read, analyze, and extract text (OCR) from any image at a URL.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'Direct URL of the image' },
          task: { type: 'string', description: 'What to do: "ocr", "describe", or ask a question' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_qr',
      description: 'Generate a QR code image for any text, URL, or data.',
      parameters: {
        type: 'object' as const,
        properties: {
          data: { type: 'string', description: 'The data to encode' },
          size: { type: 'string', description: 'Size in pixels (default: 300)' },
        },
        required: ['data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'image_generate',
      description: 'Generate images from text prompts using AI.',
      parameters: {
        type: 'object' as const,
        properties: {
          prompt: { type: 'string', description: 'Detailed description of the image to generate' },
          width: { type: 'string', description: 'Width in pixels (default: 1024)' },
          height: { type: 'string', description: 'Height in pixels (default: 1024)' },
          model: { type: 'string', description: 'Model: "flux", "turbo" (default: flux)' },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'chart_generate',
      description: 'Generate charts/graphs as images (bar, line, pie, doughnut, radar, etc.).',
      parameters: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: 'Chart type: "bar", "line", "pie", "doughnut", "radar", "polarArea"' },
          labels: { type: 'string', description: 'Comma-separated labels, e.g. "Jan,Feb,Mar,Apr"' },
          data: { type: 'string', description: 'Comma-separated data values, e.g. "10,20,30,40"' },
          title: { type: 'string', description: 'Chart title' },
          dataset_label: { type: 'string', description: 'Label for the dataset' },
        },
        required: ['type', 'labels', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'meme_generate',
      description: 'Generate memes from popular templates.',
      parameters: {
        type: 'object' as const,
        properties: {
          template: { type: 'string', description: 'Template name or ID (e.g. "drake", "distracted", "brain", "change-my-mind", "one-does-not-simply")' },
          top_text: { type: 'string', description: 'Top text' },
          bottom_text: { type: 'string', description: 'Bottom text' },
        },
        required: ['top_text', 'bottom_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ascii_art',
      description: 'Convert text to ASCII art.',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to convert' },
          font: { type: 'string', description: 'Font style: "standard", "banner", "big", "block", "bubble", "digital", "lean", "mini", "script", "shadow", "slant", "small", "speed", "star" (default: standard)' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_placeholder_image',
      description: 'Generate a placeholder image URL with custom dimensions, colors, and text.',
      parameters: {
        type: 'object' as const,
        properties: {
          width: { type: 'string', description: 'Width in pixels (default: 600)' },
          height: { type: 'string', description: 'Height in pixels (default: 400)' },
          bg_color: { type: 'string', description: 'Background color hex without # (default: cccccc)' },
          text_color: { type: 'string', description: 'Text color hex without # (default: 333333)' },
          text: { type: 'string', description: 'Custom text' },
        },
        required: [],
      },
    },
  },

  // ========== DATA & WEATHER ==========
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather information for any city.',
      parameters: {
        type: 'object' as const,
        properties: { city: { type: 'string', description: 'City name' } },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crypto_price',
      description: 'Get current cryptocurrency price and 24h change.',
      parameters: {
        type: 'object' as const,
        properties: { symbol: { type: 'string', description: 'Crypto symbol, e.g. "bitcoin", "ethereum"' } },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_price',
      description: 'Get current stock price and info.',
      parameters: {
        type: 'object' as const,
        properties: { ticker: { type: 'string', description: 'Stock ticker, e.g. "AAPL", "TSLA"' } },
        required: ['ticker'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'currency_convert',
      description: 'Convert between any world currencies.',
      parameters: {
        type: 'object' as const,
        properties: {
          amount: { type: 'string', description: 'Amount to convert' },
          from: { type: 'string', description: 'Source currency code' },
          to: { type: 'string', description: 'Target currency code' },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'csv_analyze',
      description: 'Analyze CSV data with statistics (mean, median, min, max, std dev, etc.).',
      parameters: {
        type: 'object' as const,
        properties: {
          csv: { type: 'string', description: 'CSV data to analyze' },
          column: { type: 'string', description: 'Optional: specific column to analyze' },
        },
        required: ['csv'],
      },
    },
  },

  // ========== TEXT & LANGUAGE ==========
  {
    type: 'function',
    function: {
      name: 'translate',
      description: 'Translate text between any languages.',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to translate' },
          from: { type: 'string', description: 'Source language code (or "auto")' },
          to: { type: 'string', description: 'Target language code' },
        },
        required: ['text', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarize_url',
      description: 'Fetch a URL and summarize its content.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'URL to summarize' },
          max_points: { type: 'string', description: 'Max bullet points (default: 5)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'spell_check',
      description: 'Check grammar and spelling, suggest corrections.',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to check' },
          language: { type: 'string', description: 'Language code (default: "en-US")' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'text_to_speech',
      description: 'Convert text to speech audio file.',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to convert to speech' },
          language: { type: 'string', description: 'Language code (default: "en")' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emoji_search',
      description: 'Search emojis by description or keyword.',
      parameters: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'Emoji search query' } },
        required: ['query'],
      },
    },
  },

  // ========== DEVELOPER TOOLS ==========
  {
    type: 'function',
    function: {
      name: 'hash_text',
      description: 'Generate hash of text (MD5, SHA-1, SHA-256, SHA-512).',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to hash' },
          algorithm: { type: 'string', description: 'Algorithm: "md5", "sha1", "sha256", "sha512"' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'encode_decode',
      description: 'Encode/decode text (Base64, URL, HTML entities).',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'Text to process' },
          method: { type: 'string', description: '"base64_encode", "base64_decode", "url_encode", "url_decode", "html_encode", "html_decode"' },
        },
        required: ['text', 'method'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'regex_test',
      description: 'Test a regex pattern against text.',
      parameters: {
        type: 'object' as const,
        properties: {
          pattern: { type: 'string', description: 'Regex pattern' },
          text: { type: 'string', description: 'Text to test against' },
          flags: { type: 'string', description: 'Flags (default: "g")' },
        },
        required: ['pattern', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'diff_text',
      description: 'Compare two texts and show differences.',
      parameters: {
        type: 'object' as const,
        properties: {
          text1: { type: 'string', description: 'First text (original)' },
          text2: { type: 'string', description: 'Second text (modified)' },
        },
        required: ['text1', 'text2'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'json_transform',
      description: 'Parse, format, minify, validate, or extract from JSON. Convert to CSV.',
      parameters: {
        type: 'object' as const,
        properties: {
          json: { type: 'string', description: 'JSON string' },
          action: { type: 'string', description: '"format", "minify", "extract", "to_csv", "validate"' },
          path: { type: 'string', description: 'JSON path for extraction' },
        },
        required: ['json', 'action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'json_to_yaml',
      description: 'Convert between JSON and YAML formats.',
      parameters: {
        type: 'object' as const,
        properties: {
          input: { type: 'string', description: 'JSON or YAML string' },
          direction: { type: 'string', description: '"json_to_yaml" or "yaml_to_json"' },
        },
        required: ['input', 'direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'xml_parse',
      description: 'Parse XML and extract data using tag names or convert to JSON.',
      parameters: {
        type: 'object' as const,
        properties: {
          xml: { type: 'string', description: 'XML content' },
          tag: { type: 'string', description: 'Optional tag name to extract' },
          action: { type: 'string', description: '"extract" (by tag), "to_json" (convert all), "format" (pretty print)' },
        },
        required: ['xml'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'code_format',
      description: 'Format/prettify code (runs through the code executor with formatting tools).',
      parameters: {
        type: 'object' as const,
        properties: {
          code: { type: 'string', description: 'Code to format' },
          language: { type: 'string', description: 'Language: "javascript", "python", "html", "css", "json", "sql"' },
        },
        required: ['code', 'language'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'code_minify',
      description: 'Minify JavaScript, CSS, or HTML code.',
      parameters: {
        type: 'object' as const,
        properties: {
          code: { type: 'string', description: 'Code to minify' },
          language: { type: 'string', description: '"javascript", "css", "html"' },
        },
        required: ['code', 'language'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'npm_search',
      description: 'Search npm packages with download stats and info.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Package name or search query' },
          limit: { type: 'string', description: 'Max results (default: 5)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pypi_search',
      description: 'Search Python packages on PyPI.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Package name or search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_operations',
      description: 'Get info from GitHub repos: file contents, commits, issues, PRs, stars.',
      parameters: {
        type: 'object' as const,
        properties: {
          action: { type: 'string', description: '"repo_info", "commits", "issues", "pulls", "file", "search_code", "releases"' },
          repo: { type: 'string', description: 'Repository in "owner/repo" format' },
          path: { type: 'string', description: 'File path (for "file" action)' },
          query: { type: 'string', description: 'Search query (for "search_code")' },
        },
        required: ['action', 'repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'api_mock',
      description: 'Generate mock API responses from a schema description.',
      parameters: {
        type: 'object' as const,
        properties: {
          schema: { type: 'string', description: 'Describe the API response structure, e.g. "list of 5 users with id, name, email, avatar"' },
          count: { type: 'string', description: 'Number of items to generate (default: 5)' },
        },
        required: ['schema'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'whois_lookup',
      description: 'Look up domain WHOIS data.',
      parameters: {
        type: 'object' as const,
        properties: { domain: { type: 'string', description: 'Domain name' } },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dns_lookup',
      description: 'DNS lookup for a domain.',
      parameters: {
        type: 'object' as const,
        properties: {
          domain: { type: 'string', description: 'Domain name' },
          type: { type: 'string', description: 'Record type: "A", "AAAA", "MX", "NS", "TXT", "ALL"' },
        },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ip_lookup',
      description: 'Get geolocation info for an IP address.',
      parameters: {
        type: 'object' as const,
        properties: { ip: { type: 'string', description: 'IP address or "me"' } },
        required: ['ip'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'shorten_url',
      description: 'Create a shortened URL.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'URL to shorten' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'http_request',
      description: 'Make HTTP requests to any API. Supports GET, POST, PUT, DELETE, PATCH.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'API endpoint URL' },
          method: { type: 'string', description: 'HTTP method (default: GET)' },
          headers: { type: 'string', description: 'JSON string of headers' },
          body: { type: 'string', description: 'Request body (JSON string)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'jwt_decode',
      description: 'Decode a JWT token (header + payload). Does NOT verify signature.',
      parameters: {
        type: 'object' as const,
        properties: { token: { type: 'string', description: 'JWT token string' } },
        required: ['token'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cron_explain',
      description: 'Explain a cron expression in human-readable format.',
      parameters: {
        type: 'object' as const,
        properties: { expression: { type: 'string', description: 'Cron expression' } },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'text_stats',
      description: 'Analyze text: word count, char count, reading time, top words, etc.',
      parameters: {
        type: 'object' as const,
        properties: { text: { type: 'string', description: 'Text to analyze' } },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'markdown_to_html',
      description: 'Convert Markdown to HTML.',
      parameters: {
        type: 'object' as const,
        properties: { markdown: { type: 'string', description: 'Markdown text' } },
        required: ['markdown'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'csv_to_json',
      description: 'Convert CSV to JSON array.',
      parameters: {
        type: 'object' as const,
        properties: {
          csv: { type: 'string', description: 'CSV data' },
          delimiter: { type: 'string', description: 'Delimiter (default: ",")' },
        },
        required: ['csv'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'color_palette',
      description: 'Generate color palettes (complementary, analogous, triadic, monochromatic, random).',
      parameters: {
        type: 'object' as const,
        properties: {
          base_color: { type: 'string', description: 'Base hex color, e.g. "#3498db"' },
          type: { type: 'string', description: 'Palette type (default: analogous)' },
          count: { type: 'string', description: 'Number of colors (default: 5)' },
        },
        required: [],
      },
    },
  },

  // ========== SECURITY ==========
  {
    type: 'function',
    function: {
      name: 'ssl_check',
      description: 'Check SSL certificate details for a domain.',
      parameters: {
        type: 'object' as const,
        properties: { domain: { type: 'string', description: 'Domain to check' } },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'headers_check',
      description: 'Analyze security headers of a website.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'URL to check security headers' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'password_strength',
      description: 'Analyze password strength and provide recommendations.',
      parameters: {
        type: 'object' as const,
        properties: { password: { type: 'string', description: 'Password to analyze' } },
        required: ['password'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'vulnerability_check',
      description: 'Search CVE database for known vulnerabilities.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Software name, CVE ID, or keyword' },
          limit: { type: 'string', description: 'Max results (default: 5)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'malware_url_check',
      description: 'Check if a URL is safe or potentially malicious.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'URL to check' } },
        required: ['url'],
      },
    },
  },

  // ========== COMMUNICATION ==========
  {
    type: 'function',
    function: {
      name: 'send_webhook',
      description: 'Send a webhook/HTTP notification to any URL.',
      parameters: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'Webhook URL' },
          payload: { type: 'string', description: 'JSON payload to send' },
          method: { type: 'string', description: 'HTTP method (default: POST)' },
        },
        required: ['url', 'payload'],
      },
    },
  },

  // ========== LOCATION ==========
  {
    type: 'function',
    function: {
      name: 'geocode',
      description: 'Convert address to coordinates (latitude/longitude).',
      parameters: {
        type: 'object' as const,
        properties: { address: { type: 'string', description: 'Address or place name' } },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reverse_geocode',
      description: 'Convert coordinates to address.',
      parameters: {
        type: 'object' as const,
        properties: {
          lat: { type: 'string', description: 'Latitude' },
          lon: { type: 'string', description: 'Longitude' },
        },
        required: ['lat', 'lon'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distance_calculate',
      description: 'Calculate distance between two locations.',
      parameters: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Starting location (city name or "lat,lon")' },
          to: { type: 'string', description: 'Destination (city name or "lat,lon")' },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'timezone_convert',
      description: 'Convert time between timezones.',
      parameters: {
        type: 'object' as const,
        properties: {
          time: { type: 'string', description: 'Time to convert (e.g. "14:30", "2024-01-15 09:00")' },
          from_tz: { type: 'string', description: 'Source timezone (e.g. "America/New_York", "UTC")' },
          to_tz: { type: 'string', description: 'Target timezone' },
        },
        required: ['time', 'from_tz', 'to_tz'],
      },
    },
  },

  // ========== KNOWLEDGE ==========
  {
    type: 'function',
    function: {
      name: 'arxiv_search',
      description: 'Search academic papers on arXiv.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'string', description: 'Max results (default: 5)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_search',
      description: 'Search books using Google Books API.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Book title, author, or ISBN' },
          limit: { type: 'string', description: 'Max results (default: 5)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'movie_search',
      description: 'Search movies and get details.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Movie title' },
          year: { type: 'string', description: 'Optional release year' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lyrics_search',
      description: 'Find song lyrics.',
      parameters: {
        type: 'object' as const,
        properties: {
          artist: { type: 'string', description: 'Artist name' },
          title: { type: 'string', description: 'Song title' },
        },
        required: ['artist', 'title'],
      },
    },
  },

  // ========== FUN ==========
  {
    type: 'function',
    function: {
      name: 'trivia',
      description: 'Get random trivia questions.',
      parameters: {
        type: 'object' as const,
        properties: {
          category: { type: 'string', description: 'Category: "general", "science", "history", "geography", "entertainment", "sports"' },
          count: { type: 'string', description: 'Number of questions (default: 1)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fact',
      description: 'Get random fun facts.',
      parameters: {
        type: 'object' as const,
        properties: {
          category: { type: 'string', description: '"random", "today", "year", "math" (default: random)' },
        },
        required: [],
      },
    },
  },

  // ========== UTILITIES ==========
  {
    type: 'function',
    function: {
      name: 'random_generate',
      description: 'Generate random data: passwords, UUIDs, numbers, colors, lorem ipsum.',
      parameters: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: '"password", "uuid", "number", "color", "lorem"' },
          length: { type: 'string', description: 'Length or count' },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'timestamp',
      description: 'Get current time, convert timestamps, calculate date differences.',
      parameters: {
        type: 'object' as const,
        properties: {
          action: { type: 'string', description: '"now", "convert", "diff"' },
          value: { type: 'string', description: 'Timestamp or date string' },
          value2: { type: 'string', description: 'Second date for diff' },
          timezone: { type: 'string', description: 'Timezone (default: UTC)' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unit_convert',
      description: 'Convert units: length, weight, temperature, volume, speed, area, data, time.',
      parameters: {
        type: 'object' as const,
        properties: {
          value: { type: 'string', description: 'Numeric value' },
          from: { type: 'string', description: 'Source unit' },
          to: { type: 'string', description: 'Target unit' },
        },
        required: ['value', 'from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_pdf_url',
      description: 'Extract text from a PDF at a URL.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'PDF URL' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'screenshot_url',
      description: 'Take a screenshot of any webpage.',
      parameters: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'Webpage URL' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'user_agent_parse',
      description: 'Parse a User-Agent string.',
      parameters: {
        type: 'object' as const,
        properties: { ua: { type: 'string', description: 'User-Agent string' } },
        required: ['ua'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'port_check',
      description: 'Check if a port is open on a host.',
      parameters: {
        type: 'object' as const,
        properties: {
          host: { type: 'string', description: 'Hostname or IP' },
          port: { type: 'string', description: 'Port number' },
        },
        required: ['host', 'port'],
      },
    },
  },
];

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

const crypto = await import('crypto');

// Unit conversion groups
const UNIT_GROUPS: Record<string, Record<string, number>> = {
  length: {
    km: 1000, m: 1, cm: 0.01, mm: 0.001, um: 0.000001, nm: 0.000000001,
    miles: 1609.344, mile: 1609.344, mi: 1609.344,
    yards: 0.9144, yard: 0.9144, yd: 0.9144,
    feet: 0.3048, foot: 0.3048, ft: 0.3048,
    inches: 0.0254, inch: 0.0254, in: 0.0254,
    nautical_miles: 1852, nmi: 1852,
  },
  weight: {
    kg: 1, g: 0.001, mg: 0.000001, ug: 0.000000001,
    lbs: 0.453592, lb: 0.453592, pounds: 0.453592,
    oz: 0.0283495, ounces: 0.0283495,
    tons: 1000, tonne: 1000, metric_ton: 1000,
    stone: 6.35029, st: 6.35029, short_ton: 907.185,
  },
  speed: { kmh: 1, 'km/h': 1, mph: 1.60934, knots: 1.852, knot: 1.852, kn: 1.852, 'ft/s': 1.09728, fps: 1.09728, 'm/s': 3.6, mps: 3.6 },
  data: { bytes: 1, b: 1, kb: 1024, kib: 1024, mb: 1048576, mib: 1048576, gb: 1073741824, gib: 1073741824, tb: 1099511627776, tib: 1099511627776, pb: 1125899906842624 },
  area: { 'm2': 1, sqm: 1, 'km2': 1000000, sqkm: 1000000, hectares: 10000, ha: 10000, acres: 4046.86, 'ft2': 0.092903, sqft: 0.092903 },
  volume: { liters: 1, l: 1, litres: 1, ml: 0.001, gallons: 3.78541, gal: 3.78541, quarts: 0.946353, qt: 0.946353, pints: 0.473176, pt: 0.473176, cups: 0.236588, fl_oz: 0.0295735, m3: 1000 },
  time: { seconds: 1, sec: 1, s: 1, minutes: 60, min: 60, hours: 3600, hr: 3600, h: 3600, days: 86400, d: 86400, weeks: 604800, wk: 604800, months: 2629746, mo: 2629746, years: 31556952, yr: 31556952 },
};

function findUnitGroup(unit: string): { group: string; factor: number } | null {
  for (const [group, units] of Object.entries(UNIT_GROUPS)) {
    if (unit in units) return { group, factor: units[unit] };
  }
  return null;
}

// Helper: resolve coordinates from a location string
async function resolveCoords(location: string): Promise<{ lat: number; lon: number; name: string } | null> {
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(location.trim())) {
    const [lat, lon] = location.split(',').map(s => parseFloat(s.trim()));
    return { lat, lon, name: `${lat},${lon}` };
  }
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
  const data = await res.json() as any;
  if (!data.results?.length) return null;
  return { lat: data.results[0].latitude, lon: data.results[0].longitude, name: data.results[0].name + (data.results[0].country ? `, ${data.results[0].country}` : '') };
}

// Auto-convert plain URLs to clickable markdown links
function linkifyUrls(text: string): string {
  return text.replace(
    /(?<!\]\()(?<!\()(?<!")(?<!')(?<!src=)(https?:\/\/[^\s\])"'<>]+)/g,
    (url) => {
      if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) {
        return `![image](${url})`;
      }
      const display = url.length > 60 ? url.slice(0, 57) + '...' : url;
      return `[${display}](${url})`;
    }
  );
}

async function executeTool(
  name: string,
  input: Record<string, string>,
  streamFn: (s: string) => Promise<void>,
  fullTextRef: { value: string },
): Promise<string> {

  // ========== WEB & SEARCH ==========

  if (name === 'web_fetch') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Agent/1.0)' }, signal: controller.signal });
      clearTimeout(timeout);
      const text = await res.text();
      const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return stripped;
    } catch (e: any) { return `Fetch error: ${e.name === 'AbortError' ? 'Request timed out' : e.message}`; }
  }

  if (name === 'web_search') {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(input.query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      const data = await res.json() as any;
      const lines: string[] = [];
      if (data.AbstractText) lines.push(`Summary: ${data.AbstractText}`);
      if (data.AbstractURL) lines.push(`Source: ${data.AbstractURL}`);
      (data.RelatedTopics || []).forEach((t: any) => { if (t.Text) lines.push(`- ${t.Text}${t.FirstURL ? ` (${t.FirstURL})` : ''}`); });
      return lines.join('\n') || 'No results found. Try web_fetch with a direct URL.';
    } catch (e: any) { return `Search error: ${e.message}`; }
  }

  if (name === 'wikipedia') {
    try {
      const wikiHeaders = { 'User-Agent': 'ApexAgent/2.0', 'Accept': 'application/json' };
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(input.query)}&format=json&utf8=1`, { headers: wikiHeaders });
      const searchData = await searchRes.json() as any;
      const title = searchData.query?.search?.[0]?.title;
      if (!title) return `No Wikipedia article found for: ${input.query}`;
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&utf8=1`, { headers: wikiHeaders });
      const data = await res.json() as any;
      const page = Object.values(data.query?.pages || {})[0] as any;
      return `**${title}**\n\n${page?.extract || 'No content found.'}`;
    } catch (e: any) { return `Wikipedia error: ${e.message}`; }
  }

  if (name === 'get_news') {
    try {
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(input.topic + ' news')}&format=json&no_html=1`);
      const data = await res.json() as any;
      const lines: string[] = [`Latest news for "${input.topic}":\n`];
      (data.RelatedTopics || []).slice(0, 15).forEach((t: any, i: number) => {
        if (t.Text) lines.push(`${i + 1}. ${t.Text}${t.FirstURL ? `\n   ${t.FirstURL}` : ''}`);
      });
      if (lines.length <= 1) {
        const altRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(input.topic)}&hl=en`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const altText = await altRes.text();
        const titles = altText.match(/<title>(.*?)<\/title>/g)?.slice(1, 16) || [];
        const links = altText.match(/<link>(.*?)<\/link>/g)?.slice(1, 16) || [];
        titles.forEach((t: string, i: number) => {
          lines.push(`${i + 1}. ${t.replace(/<\/?title>/g, '')}${links[i] ? `\n   ${links[i].replace(/<\/?link>/g, '')}` : ''}`);
        });
      }
      return lines.join('\n') || 'No news found.';
    } catch (e: any) { return `News error: ${e.message}`; }
  }

  if (name === 'youtube_search') {
    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(input.query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const matches = html.match(/"videoId":"([^"]+)","thumbnail"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"/g) || [];
      const videos: string[] = [];
      const seen = new Set<string>();
      for (const m of matches) {
        const idMatch = m.match(/"videoId":"([^"]+)"/);
        const titleMatch = m.match(/"text":"([^"]+)"/);
        if (idMatch && titleMatch && !seen.has(idMatch[1])) {
          seen.add(idMatch[1]);
          videos.push(`- ${titleMatch[1]}\n  https://youtube.com/watch?v=${idMatch[1]}`);
        }
        if (videos.length >= 10) break;
      }
      return videos.length > 0 ? `YouTube results for "${input.query}":\n\n${videos.join('\n\n')}` : 'No results found.';
    } catch (e: any) { return `YouTube search error: ${e.message}`; }
  }

  if (name === 'web_scrape') {
    try {
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const selector = input.selector.trim();
      let regex: RegExp;
      if (selector.startsWith('#')) {
        regex = new RegExp(`<[^>]+id=["']${selector.slice(1)}["'][^>]*>([\\s\\S]*?)<\\/`, 'gi');
      } else if (selector.startsWith('.')) {
        regex = new RegExp(`<[^>]+class=["'][^"']*${selector.slice(1)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/`, 'gi');
      } else if (selector.includes('[')) {
        const [tag, attrPart] = selector.split('[');
        const attr = attrPart.replace(']', '');
        regex = new RegExp(`<${tag || '[^>]+'}[^>]*${attr}[^>]*>([\\s\\S]*?)<\\/${tag || '[^>]+'}`, 'gi');
      } else {
        regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'gi');
      }
      const results: string[] = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        let content = match[0];
        if (input.attribute) {
          const attrMatch = content.match(new RegExp(`${input.attribute}=["']([^"']+)["']`));
          if (attrMatch) results.push(attrMatch[1]);
        } else {
          content = content.replace(/<[^>]+>/g, '').trim();
          if (content) results.push(content);
        }
      }
      return results.length > 0 ? `Found ${results.length} matches:\n\n${results.join('\n')}` : 'No matches found for selector.';
    } catch (e: any) { return `Scrape error: ${e.message}`; }
  }

  if (name === 'rss_feed') {
    try {
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const limit = parseInt(input.limit || '10');
      const items: string[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
        const item = match[1] || match[2];
        const title = item.match(/<title[^>]*>(.*?)<\/title>/s)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1') || 'No title';
        const link = item.match(/<link[^>]*>(.*?)<\/link>/s)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1') || item.match(/<link[^>]*href=["']([^"']+)["']/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || item.match(/<published>(.*?)<\/published>/s)?.[1] || '';
        items.push(`${items.length + 1}. ${title}${pubDate ? ` (${pubDate})` : ''}${link ? `\n   ${link}` : ''}`);
      }
      return items.length > 0 ? `RSS Feed (${items.length} items):\n\n${items.join('\n\n')}` : 'No items found in feed.';
    } catch (e: any) { return `RSS error: ${e.message}`; }
  }

  if (name === 'link_preview') {
    try {
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const getOg = (prop: string) => html.match(new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1] || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${prop}["']`, 'i'))?.[1];
      const getTag = (tag: string) => html.match(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'is'))?.[1]?.trim();
      const getMeta = (name: string) => html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1];
      return [
        `Link Preview: ${input.url}`,
        `Title: ${getOg('title') || getTag('title') || 'N/A'}`,
        `Description: ${getOg('description') || getMeta('description') || 'N/A'}`,
        `Image: ${getOg('image') || 'N/A'}`,
        `Site Name: ${getOg('site_name') || 'N/A'}`,
        `Type: ${getOg('type') || 'N/A'}`,
      ].join('\n');
    } catch (e: any) { return `Link preview error: ${e.message}`; }
  }

  if (name === 'sitemap_parse') {
    try {
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const limit = parseInt(input.limit || '50');
      const urls: string[] = [];
      const urlRegex = /<loc>(.*?)<\/loc>/gi;
      let match;
      while ((match = urlRegex.exec(xml)) !== null && urls.length < limit) {
        urls.push(match[1]);
      }
      return urls.length > 0 ? `Sitemap (${urls.length} URLs):\n\n${urls.join('\n')}` : 'No URLs found in sitemap.';
    } catch (e: any) { return `Sitemap error: ${e.message}`; }
  }

  if (name === 'reddit_search') {
    try {
      const sub = input.subreddit ? `/r/${input.subreddit}` : '';
      const sort = input.sort || 'relevance';
      const res = await fetch(`https://www.reddit.com${sub}/search.json?q=${encodeURIComponent(input.query)}&sort=${sort}&limit=15`, {
        headers: { 'User-Agent': 'ApexAgent/2.0' }
      });
      const data = await res.json() as any;
      const posts = data?.data?.children || [];
      if (!posts.length) return 'No Reddit posts found.';
      return posts.map((p: any, i: number) => {
        const d = p.data;
        return `${i + 1}. [${d.score} pts] ${d.title}\n   r/${d.subreddit} | ${d.num_comments} comments\n   https://reddit.com${d.permalink}`;
      }).join('\n\n');
    } catch (e: any) { return `Reddit error: ${e.message}`; }
  }

  if (name === 'hackernews') {
    try {
      const type = input.type || 'top';
      const limit = parseInt(input.limit || '10');
      const res = await fetch(`https://hacker-news.firebaseio.com/v0/${type}stories.json`);
      const ids = (await res.json() as number[]).slice(0, limit);
      const stories = await Promise.all(ids.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return await r.json() as any;
      }));
      return stories.map((s, i) => `${i + 1}. ${s.title} (${s.score} pts, ${s.descendants || 0} comments)\n   ${s.url || `https://news.ycombinator.com/item?id=${s.id}`}`).join('\n\n');
    } catch (e: any) { return `HN error: ${e.message}`; }
  }

  if (name === 'trending_topics') {
    try {
      const country = input.country || 'US';
      const res = await fetch(`https://trends.google.com/trends/trendingsearches/daily/rss?geo=${country}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const xml = await res.text();
      const items: string[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
        const title = match[1].match(/<title>(.*?)<\/title>/)?.[1] || '';
        const traffic = match[1].match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] || '';
        if (title) items.push(`${items.length + 1}. ${title}${traffic ? ` (${traffic})` : ''}`);
      }
      return items.length > 0 ? `Trending in ${country}:\n\n${items.join('\n')}` : 'No trending topics found.';
    } catch (e: any) { return `Trends error: ${e.message}`; }
  }

  // ========== CODE & MATH ==========

  if (name === 'run_code') {
    const langInput = input.language.toLowerCase().trim();

    async function tryPiston(): Promise<string | null> {
      try {
        const langMap: Record<string, { language: string; version: string }> = {
          python: { language: 'python', version: '3.10.0' }, python3: { language: 'python', version: '3.10.0' },
          javascript: { language: 'javascript', version: '18.15.0' }, js: { language: 'javascript', version: '18.15.0' },
          typescript: { language: 'typescript', version: '5.0.3' }, ts: { language: 'typescript', version: '5.0.3' },
          java: { language: 'java', version: '15.0.2' },
          cpp: { language: 'c++', version: '10.2.0' }, 'c++': { language: 'c++', version: '10.2.0' },
          c: { language: 'c', version: '10.2.0' },
          ruby: { language: 'ruby', version: '3.0.1' }, go: { language: 'go', version: '1.16.2' },
          php: { language: 'php', version: '8.2.3' }, rust: { language: 'rust', version: '1.68.2' },
          swift: { language: 'swift', version: '5.8.1' }, kotlin: { language: 'kotlin', version: '1.8.20' },
          r: { language: 'r', version: '4.1.1' },
          bash: { language: 'bash', version: '5.2.0' }, sh: { language: 'bash', version: '5.2.0' },
          perl: { language: 'perl', version: '5.36.0' }, lua: { language: 'lua', version: '5.4.4' },
          haskell: { language: 'haskell', version: '9.4.3' }, scala: { language: 'scala', version: '3.2.2' },
          csharp: { language: 'csharp', version: '6.12.0' }, 'c#': { language: 'csharp', version: '6.12.0' },
          dart: { language: 'dart', version: '2.19.6' }, elixir: { language: 'elixir', version: '1.14.3' },
          clojure: { language: 'clojure', version: '1.11.1' },
          zig: { language: 'zig', version: '0.11.0' }, nim: { language: 'nim', version: '2.0.0' },
          sql: { language: 'sqlite3', version: '3.36.0' }, sqlite: { language: 'sqlite3', version: '3.36.0' },
        };
        const resolved = langMap[langInput] || { language: langInput, version: '*' };
        const body = JSON.stringify({ language: resolved.language, version: resolved.version, files: [{ name: `main.${langInput}`, content: input.code }], stdin: input.stdin || '', run_timeout: 60000, compile_timeout: 60000 });
        const res = await fetch('https://emkc.org/api/v2/piston/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!res.ok) return null;
        const data = await res.json() as any;
        if (data.message) return null;
        const run = data.run || {};
        const compile = data.compile || {};
        const parts: string[] = [];
        if (compile.stderr) parts.push(`Compile errors:\n${compile.stderr}`);
        if (run.stdout) parts.push(`Output:\n${run.stdout}`);
        if (run.stderr) parts.push(`Stderr:\n${run.stderr}`);
        if (run.code !== 0 && run.code !== null) parts.push(`Exit code: ${run.code}`);
        return parts.join('\n') || '(no output)';
      } catch { return null; }
    }

    async function tryGodbolt(): Promise<string | null> {
      try {
        const godboltMap: Record<string, string> = {
          python: 'python312', python3: 'python312', c: 'cclang1810', cpp: 'g132', 'c++': 'g132',
          rust: 'r1750', go: 'gl1220', ruby: 'ruby330', java: 'java2100',
          javascript: 'mozjs', js: 'mozjs', typescript: 'tsc_0_0_35_gc',
          haskell: 'ghc981', swift: 'swift59', kotlin: 'kotlinc1920',
          csharp: 'dotnet800csharp', 'c#': 'dotnet800csharp', scala: 'scalac2133',
          fortran: 'gfortran132', pascal: 'fpc322',
        };
        const compilerId = godboltMap[langInput];
        if (!compilerId) return null;
        const body = JSON.stringify({
          source: input.code,
          options: { compilerOptions: { executorRequest: true }, executeParameters: { stdin: input.stdin || '' } },
        });
        const res = await fetch(`https://godbolt.org/api/compiler/${compilerId}/compile`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body,
        });
        if (!res.ok) return null;
        const data = await res.json() as any;
        const stdout = (data.stdout || []).map((l: any) => l.text).join('\n');
        const stderr = (data.stderr || []).map((l: any) => l.text).join('\n');
        const execStdout = (data.execResult?.stdout || []).map((l: any) => l.text).join('\n');
        const execStderr = (data.execResult?.stderr || []).map((l: any) => l.text).join('\n');
        const output = execStdout || stdout;
        const errors = execStderr || stderr;
        const parts: string[] = [];
        if (output) parts.push(`Output:\n${output}`);
        if (errors) parts.push(`Stderr:\n${errors}`);
        return parts.join('\n') || '(no output)';
      } catch { return null; }
    }

    async function tryJudge0(): Promise<string | null> {
      try {
        const judge0Map: Record<string, number> = {
          python: 71, python3: 71, javascript: 63, js: 63, typescript: 74, ts: 74,
          java: 62, c: 50, cpp: 54, 'c++': 54, csharp: 51, 'c#': 51,
          go: 60, ruby: 72, rust: 73, swift: 83, kotlin: 78, scala: 81,
          php: 68, r: 80, bash: 46, sh: 46, perl: 85, lua: 64, haskell: 61,
        };
        const langId = judge0Map[langInput];
        if (!langId) return null;
        const body = JSON.stringify({ source_code: input.code, language_id: langId, stdin: input.stdin || '' });
        const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
        });
        if (!res.ok) return null;
        const data = await res.json() as any;
        const parts: string[] = [];
        if (data.compile_output) parts.push(`Compile:\n${data.compile_output}`);
        if (data.stdout) parts.push(`Output:\n${data.stdout}`);
        if (data.stderr) parts.push(`Stderr:\n${data.stderr}`);
        if (data.status?.id > 3) parts.push(`Status: ${data.status.description}`);
        return parts.join('\n') || '(no output)';
      } catch { return null; }
    }

    try {
      const result = await tryPiston() || await tryGodbolt() || await tryJudge0();
      if (result) return result;
      return `Code execution failed: All providers (Piston, Godbolt, Judge0) are unavailable for ${langInput}. Try a different language or check the code.`;
    } catch (e: any) { return `Code execution error: ${e.message}`; }
  }

  if (name === 'calculate') {
    try {
      const expr = input.expression;
      if (/[;{}[\]`$\\]/.test(expr) || /\b(eval|function|return|var|let|const|class|import|require|process|global)\b/.test(expr)) return 'Expression contains disallowed characters.';
      const result = new Function(`"use strict"; return (${expr})`)();
      return `${expr} = ${result}`;
    } catch (e: any) { return `Calculation error: ${e.message}`; }
  }

  // ========== FILES & IMAGES ==========

  if (name === 'create_file') {
    const encoded = Buffer.from(input.content).toString('base64');
    const fileMarker = `\n[FILE:${input.filename}|${input.mimeType}|${encoded}]\n`;
    await streamFn(fileMarker);
    fullTextRef.value += fileMarker;
    return `File "${input.filename}" created successfully.`;
  }

  if (name === 'create_pptx') {
    try {
      const slides = JSON.parse(input.slides) as Array<{ title: string; content: string; bg?: string }>;
      const title = input.title || 'Presentation';

      const slidesHtml = slides.map((slide, i) => {
        const bg = slide.bg || (i === 0 ? 'linear-gradient(135deg, #0a0a0a, #1a0a2e)' : 'linear-gradient(135deg, #0f172a, #1e1b4b)');
        const contentLines = slide.content.split('\n').map(line => {
          if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
          if (line.startsWith('# ')) return `<h2 style="font-size:32px;font-weight:800;color:#a78bfa;margin-bottom:12px">${line.slice(2)}</h2>`;
          return `<p style="margin-bottom:8px">${line}</p>`;
        }).join('\n');
        const hasList = slide.content.includes('\n- ');
        const wrapped = hasList ? `<ul style="list-style:none;font-size:22px;line-height:1.8;color:#cbd5e1">${contentLines}</ul>` : `<div style="font-size:22px;line-height:1.8;color:#cbd5e1">${contentLines}</div>`;

        return `<div class="slide" style="background:${bg}">
  <h1 style="font-size:48px;font-weight:800;margin-bottom:28px;background:linear-gradient(90deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${slide.title}</h1>
  ${wrapped}
</div>`;
      }).join('\n\n');

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title>
<style>
@page{size:1280px 720px;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#000}
.slide{width:1280px;height:720px;padding:60px 80px;display:flex;flex-direction:column;justify-content:center;page-break-after:always;break-after:page;position:relative;overflow:hidden}
li{padding:8px 0;padding-left:24px;position:relative}
li::before{content:'▸';position:absolute;left:0;color:#8b5cf6}
@media print{body{background:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media screen{body{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px}.slide{box-shadow:0 20px 60px rgba(0,0,0,0.8);border-radius:12px}}
</style></head><body>
${slidesHtml}
</body></html>`;

      const encoded = Buffer.from(html).toString('base64');
      const fileMarker = `\n[FILE:${title.replace(/\s+/g, '_')}.pptx.html|text/html|${encoded}]\n`;
      await streamFn(fileMarker);
      fullTextRef.value += fileMarker;
      return `Presentation "${title}" created with ${slides.length} slides. Open the HTML file and use Print > Save as PDF for a perfect presentation file.`;
    } catch (e: any) { return `PPTX creation error: ${e.message}. Send slides as JSON array: [{"title":"Slide 1","content":"bullet points"},...]`; }
  }

  if (name === 'create_binary_file') {
    const fileMarker = `\n[FILE:${input.filename}|${input.mimeType}|${input.base64}]\n`;
    await streamFn(fileMarker);
    fullTextRef.value += fileMarker;
    return `Binary file "${input.filename}" created successfully.`;
  }

  if (name === 'read_image_url') {
    try {
      const taskPrompt = input.task || 'Extract all text from this image (OCR). If no text, describe the image in detail.';
      const visionRes = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 16000,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: input.url, detail: 'high' } },
          { type: 'text', text: taskPrompt },
        ]}],
      });
      return visionRes.choices[0]?.message?.content || 'Could not process image.';
    } catch (e: any) { return `Image read error: ${e.message}`; }
  }

  if (name === 'generate_qr') {
    const size = input.size || '300';
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(input.data)}`;
    return `QR Code generated!\nData: ${input.data}\nImage URL: ${url}\n\n![QR Code](${url})`;
  }

  if (name === 'image_generate') {
    try {
      const w = input.width || '1024';
      const h = input.height || '1024';
      const model = (input.model || 'flux').toLowerCase();
      const prompt = encodeURIComponent(input.prompt);
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=${w}&height=${h}&model=${model}&nologo=true`;
      return `Image generated!\n\nPrompt: ${input.prompt}\nSize: ${w}x${h}\n\n![Generated Image](${url})\n\nDirect URL: ${url}`;
    } catch (e: any) { return `Image generation error: ${e.message}`; }
  }

  if (name === 'chart_generate') {
    try {
      const labels = input.labels.split(',').map(l => l.trim());
      const dataPoints = input.data.split(',').map(d => parseFloat(d.trim()));
      const chartConfig = {
        type: input.type,
        data: {
          labels,
          datasets: [{ label: input.dataset_label || 'Data', data: dataPoints, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#7BC8A4', '#E7E9ED'], borderColor: '#36A2EB', borderWidth: 2, fill: false }],
        },
        options: { title: { display: !!input.title, text: input.title || '' }, plugins: { legend: { display: true } } },
      };
      const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=800&h=500&bkg=white`;
      return `Chart generated!\n\n![Chart](${url})\n\nDirect URL: ${url}`;
    } catch (e: any) { return `Chart error: ${e.message}`; }
  }

  if (name === 'meme_generate') {
    try {
      const templates: Record<string, string> = {
        drake: '181913649', 'distracted': '112126428', brain: '93895088', 'change-my-mind': '129242436',
        'one-does-not-simply': '61579', 'two-buttons': '87743020', 'expanding-brain': '93895088',
        'always-has-been': '252600902', 'disaster-girl': '97984', 'hide-the-pain': '27813981',
        'is-this': '247375501', batman: '438680', pikachu: '155067746', doge: '8072285',
      };
      const templateId = input.template ? (templates[input.template.toLowerCase()] || input.template) : '181913649';
      const url = `https://api.imgflip.com/caption_image`;
      const params = new URLSearchParams({
        template_id: templateId, username: 'apex_agent', password: 'apex_agent_2024',
        text0: input.top_text, text1: input.bottom_text,
      });
      const res = await fetch(url, { method: 'POST', body: params });
      const data = await res.json() as any;
      if (data.success) return `Meme created!\n\n![Meme](${data.data.url})\n\nURL: ${data.data.url}`;
      return `Meme template: ${templateId}\nTop: ${input.top_text}\nBottom: ${input.bottom_text}\n\nNote: Could not generate via API. Use the run_code tool with Python PIL for custom memes.`;
    } catch (e: any) { return `Meme error: ${e.message}`; }
  }

  if (name === 'ascii_art') {
    try {
      const font = input.font || 'standard';
      const res = await fetch(`https://artii.herokuapp.com/make?text=${encodeURIComponent(input.text)}&font=${font}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const art = await res.text();
        return `\`\`\`\n${art}\n\`\`\``;
      }
      const simple: Record<string, string[]> = {
        'A': ['  #  ', ' # # ', '#####', '#   #', '#   #'], 'B': ['#### ', '#   #', '#### ', '#   #', '#### '],
        'C': [' ####', '#    ', '#    ', '#    ', ' ####'], 'D': ['#### ', '#   #', '#   #', '#   #', '#### '],
        'E': ['#####', '#    ', '###  ', '#    ', '#####'], 'F': ['#####', '#    ', '###  ', '#    ', '#    '],
        'H': ['#   #', '#   #', '#####', '#   #', '#   #'], 'I': ['#####', '  #  ', '  #  ', '  #  ', '#####'],
        'L': ['#    ', '#    ', '#    ', '#    ', '#####'], 'O': [' ### ', '#   #', '#   #', '#   #', ' ### '],
        'P': ['#### ', '#   #', '#### ', '#    ', '#    '], 'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
        ' ': ['     ', '     ', '     ', '     ', '     '],
      };
      const text = input.text.toUpperCase();
      const lines = [0, 1, 2, 3, 4].map(row => text.split('').map(c => (simple[c] || simple[' '])[row]).join(' '));
      return `\`\`\`\n${lines.join('\n')}\n\`\`\``;
    } catch (e: any) { return `ASCII art error: ${e.message}`; }
  }

  if (name === 'generate_placeholder_image') {
    const w = input.width || '600';
    const h = input.height || '400';
    const bg = input.bg_color || 'cccccc';
    const fg = input.text_color || '333333';
    const text = input.text ? `?text=${encodeURIComponent(input.text)}` : '';
    const url = `https://placehold.co/${w}x${h}/${bg}/${fg}${text}`;
    return `Placeholder Image: ${w}x${h}\n\n![Placeholder](${url})\n\nURL: ${url}`;
  }

  // ========== DATA & MARKETS ==========

  if (name === 'get_weather') {
    try {
      const loc = await resolveCoords(input.city);
      if (!loc) return `City "${input.city}" not found.`;
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,visibility&timezone=auto`);
      const weatherData = await weatherRes.json() as any;
      const c = weatherData.current;
      const weatherCodes: Record<number, string> = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Rain showers',
        81: 'Moderate showers', 82: 'Violent showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
      };
      return `Weather in ${loc.name}:\n${weatherCodes[c.weather_code] || 'Unknown'}\nTemperature: ${c.temperature_2m}C (feels like ${c.apparent_temperature}C)\nHumidity: ${c.relative_humidity_2m}%\nWind: ${c.wind_speed_10m} km/h\nPrecipitation: ${c.precipitation} mm\nVisibility: ${(c.visibility / 1000).toFixed(1)} km`;
    } catch (e: any) { return `Weather error: ${e.message}`; }
  }

  if (name === 'get_crypto_price') {
    try {
      const symbolMap: Record<string, string> = {
        bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA', dogecoin: 'DOGE', ripple: 'XRP', xrp: 'XRP',
        polkadot: 'DOT', litecoin: 'LTC', chainlink: 'LINK', avalanche: 'AVAX', matic: 'MATIC', polygon: 'MATIC',
        shiba: 'SHIB', 'shiba inu': 'SHIB', tron: 'TRX', stellar: 'XLM', monero: 'XMR', uniswap: 'UNI',
        cosmos: 'ATOM', near: 'NEAR', aptos: 'APT', sui: 'SUI', ton: 'TON', pepe: 'PEPE',
      };
      const raw = input.symbol.toLowerCase().trim();
      const ticker = (symbolMap[raw] || input.symbol.toUpperCase()).toUpperCase();
      const headers = { 'User-Agent': 'ApexAgent/2.0', 'Accept': 'application/json' };
      const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${encodeURIComponent(ticker)}&tsyms=USD`, { headers });
      const data = await res.json() as any;
      if (data.Response === 'Error' || !data.RAW?.[ticker]?.USD) {
        const cbRes = await fetch(`https://api.coinbase.com/v2/prices/${encodeURIComponent(ticker)}-USD/spot`, { headers });
        if (!cbRes.ok) return `Could not find price for "${input.symbol}".`;
        const cbData = await cbRes.json() as any;
        return `${ticker}/USD: $${parseFloat(cbData.data?.amount).toLocaleString()} (Source: Coinbase)`;
      }
      const rawData = data.RAW[ticker].USD;
      const display = data.DISPLAY[ticker].USD;
      const change = rawData.CHANGEPCT24HOUR?.toFixed(2);
      return `${ticker}/USD:\nPrice: ${display.PRICE}\n24h Change: ${parseFloat(change) >= 0 ? '+' : ''}${change}%\nMarket Cap: ${display.MKTCAP}\n24h Volume: ${display.TOTALVOLUME24HTO}\n24h High: ${display.HIGH24HOUR}\n24h Low: ${display.LOW24HOUR}\nUpdated: ${new Date(rawData.LASTUPDATE * 1000).toUTCString()}`;
    } catch (e: any) { return `Crypto error: ${e.message}`; }
  }

  if (name === 'get_stock_price') {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(input.ticker.toUpperCase())}?interval=1d&range=5d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json() as any;
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) return `Stock "${input.ticker}" not found.`;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose;
      const change = ((price - prevClose) / prevClose * 100).toFixed(2);
      return `${meta.symbol} - ${meta.longName || meta.symbol}:\nPrice: $${price?.toFixed(2)}\nChange: ${parseFloat(change) >= 0 ? '+' : ''}${change}%\nExchange: ${meta.exchangeName}\nMarket State: ${meta.marketState}\nCurrency: ${meta.currency}`;
    } catch (e: any) { return `Stock error: ${e.message}`; }
  }

  if (name === 'currency_convert') {
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${input.from.toUpperCase()}`);
      const data = await res.json() as any;
      const rate = data.rates?.[input.to.toUpperCase()];
      if (!rate) return `Currency "${input.to}" not found.`;
      return `${input.amount} ${input.from.toUpperCase()} = ${(parseFloat(input.amount) * rate).toFixed(4)} ${input.to.toUpperCase()}\nRate: 1 ${input.from.toUpperCase()} = ${rate} ${input.to.toUpperCase()}`;
    } catch (e: any) { return `Currency error: ${e.message}`; }
  }

  if (name === 'csv_analyze') {
    try {
      const lines = input.csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')));
      const results: string[] = [`CSV Analysis: ${rows.length} rows, ${headers.length} columns\nColumns: ${headers.join(', ')}\n`];
      const targetCols = input.column ? [headers.indexOf(input.column)].filter(i => i >= 0) : headers.map((_, i) => i);
      for (const colIdx of targetCols) {
        const values = rows.map(r => r[colIdx]).filter(v => v !== undefined && v !== '');
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        results.push(`--- ${headers[colIdx]} ---`);
        results.push(`  Total values: ${values.length}`);
        if (nums.length > 0) {
          const sorted = [...nums].sort((a, b) => a - b);
          const sum = nums.reduce((a, b) => a + b, 0);
          const mean = sum / nums.length;
          const median = nums.length % 2 === 0 ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2 : sorted[Math.floor(nums.length / 2)];
          const variance = nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / nums.length;
          const stdDev = Math.sqrt(variance);
          results.push(`  Numeric: min=${sorted[0]}, max=${sorted[sorted.length - 1]}, mean=${mean.toFixed(2)}, median=${median.toFixed(2)}, sum=${sum.toFixed(2)}, stddev=${stdDev.toFixed(2)}`);
        } else {
          const freq: Record<string, number> = {};
          values.forEach(v => freq[v] = (freq[v] || 0) + 1);
          const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
          results.push(`  Unique: ${Object.keys(freq).length}`);
          results.push(`  Top values: ${top.map(([v, c]) => `"${v}" (${c})`).join(', ')}`);
        }
      }
      return results.join('\n');
    } catch (e: any) { return `CSV analyze error: ${e.message}`; }
  }

  // ========== TEXT & LANGUAGE ==========

  if (name === 'translate') {
    try {
      const from = input.from || 'auto';
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input.text)}&langpair=${from}|${input.to}`);
      const data = await res.json() as any;
      if (data.responseStatus !== 200) return `Translation failed: ${data.responseMessage || 'Unknown error'}`;
      return `Translation (${from} -> ${input.to}):\n${data.responseData.translatedText}`;
    } catch (e: any) { return `Translation error: ${e.message}`; }
  }

  if (name === 'summarize_url') {
    try {
      const res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const maxPoints = parseInt(input.max_points || '5');
      const summaryRes = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: `Summarize the following webpage content into ${maxPoints} key bullet points:\n\n${text}` }],
      });
      const content = summaryRes.choices[0]?.message?.content;
      return content ? `Summary of ${input.url}:\n\n${content}` : 'Could not summarize.';
    } catch (e: any) { return `Summarize error: ${e.message}`; }
  }

  if (name === 'spell_check') {
    try {
      const lang = input.language || 'en-US';
      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `text=${encodeURIComponent(input.text)}&language=${lang}`,
      });
      const data = await res.json() as any;
      if (!data.matches?.length) return 'No errors found! Text looks good.';
      const issues = data.matches.map((m: any, i: number) => {
        const replacements = m.replacements?.slice(0, 3).map((r: any) => r.value).join(', ') || 'N/A';
        return `${i + 1}. "${m.context.text.substring(m.context.offset, m.context.offset + m.context.length)}"\n   Issue: ${m.message}\n   Suggestions: ${replacements}`;
      });
      return `Found ${data.matches.length} issues:\n\n${issues.join('\n\n')}`;
    } catch (e: any) { return `Spell check error: ${e.message}`; }
  }

  if (name === 'text_to_speech') {
    try {
      const lang = input.language || 'en';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(input.text.slice(0, 200))}&tl=${lang}&client=tw-ob`;
      return `Text-to-Speech audio:\nLanguage: ${lang}\nText: "${input.text.slice(0, 100)}${input.text.length > 100 ? '...' : ''}"\n\nAudio URL: ${url}\n\nNote: For longer texts, use the run_code tool with Python gTTS library.`;
    } catch (e: any) { return `TTS error: ${e.message}`; }
  }

  if (name === 'emoji_search') {
    try {
      const res = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(input.query)}&access_key=bf63bf82c9f89fce9cb3f11d5e84d40f0dca6aeb`);
      if (!res.ok) {
        const emojiMap: Record<string, string[]> = {
          happy: ['😊', '😄', '😃', '😁', '🥰'], sad: ['😢', '😭', '😞', '😔', '🥺'],
          love: ['❤️', '💕', '💗', '💖', '🥰'], fire: ['🔥', '💥', '✨', '⭐', '🌟'],
          laugh: ['😂', '🤣', '😆', '😹', '😝'], cool: ['😎', '🕶️', '🆒', '💯', '🤙'],
          angry: ['😠', '😡', '🤬', '💢', '👿'], think: ['🤔', '💭', '🧐', '💡', '📝'],
          music: ['🎵', '🎶', '🎸', '🎹', '🎤'], food: ['🍕', '🍔', '🌮', '🍣', '🍰'],
          animal: ['🐱', '🐶', '🦊', '🐻', '🦁'], nature: ['🌿', '🌸', '🌻', '🌊', '🏔️'],
          tech: ['💻', '📱', '🖥️', '⌨️', '🤖'], sport: ['⚽', '🏀', '🎾', '🏈', '🏐'],
          weather: ['☀️', '🌧️', '❄️', '🌈', '⛈️'], party: ['🎉', '🎊', '🥳', '🎈', '🪩'],
          money: ['💰', '💵', '💸', '🤑', '💎'], time: ['⏰', '🕐', '⌛', '📅', '🗓️'],
        };
        const q = input.query.toLowerCase();
        const matches = emojiMap[q] || Object.entries(emojiMap).filter(([k]) => k.includes(q) || q.includes(k)).flatMap(([, v]) => v).slice(0, 10);
        return matches.length > 0 ? `Emojis for "${input.query}":\n${matches.join(' ')}` : `No emojis found for "${input.query}". Try: happy, sad, love, fire, laugh, cool, music, food, animal, tech`;
      }
      const data = await res.json() as any;
      const emojis = (Array.isArray(data) ? data : []).slice(0, 20);
      return emojis.map((e: any) => `${e.character} ${e.unicodeName}`).join('\n') || 'No results.';
    } catch (e: any) { return `Emoji search error: ${e.message}`; }
  }

  // ========== DEVELOPER TOOLS ==========

  if (name === 'hash_text') {
    try {
      const algo = (input.algorithm || 'sha256').toLowerCase();
      const algoMap: Record<string, string> = { md5: 'md5', sha1: 'sha1', sha256: 'sha256', sha512: 'sha512' };
      const resolved = algoMap[algo];
      if (!resolved) return `Unsupported algorithm: "${algo}". Use: md5, sha1, sha256, sha512`;
      return `${resolved.toUpperCase()} hash:\n${crypto.createHash(resolved).update(input.text).digest('hex')}`;
    } catch (e: any) { return `Hash error: ${e.message}`; }
  }

  if (name === 'encode_decode') {
    try {
      const method = input.method.toLowerCase();
      let result = '';
      switch (method) {
        case 'base64_encode': result = Buffer.from(input.text).toString('base64'); break;
        case 'base64_decode': result = Buffer.from(input.text, 'base64').toString('utf-8'); break;
        case 'url_encode': result = encodeURIComponent(input.text); break;
        case 'url_decode': result = decodeURIComponent(input.text); break;
        case 'html_encode': result = input.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); break;
        case 'html_decode': result = input.text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&'); break;
        default: return `Unknown method: ${method}.`;
      }
      return `${method}:\n${result}`;
    } catch (e: any) { return `Encode/decode error: ${e.message}`; }
  }

  if (name === 'regex_test') {
    try {
      const flags = input.flags || 'g';
      const regex = new RegExp(input.pattern, flags.includes('g') ? flags : flags + 'g');
      const matches = [...input.text.matchAll(regex)];
      if (!matches.length) return `No matches for: /${input.pattern}/${flags}`;
      return `Pattern: /${input.pattern}/${flags}\nMatches: ${matches.length}\n\n${matches.map((m, i) => {
        let line = `${i + 1}. "${m[0]}" at index ${m.index}`;
        if (m.length > 1) line += ` | groups: [${m.slice(1).map(g => `"${g}"`).join(', ')}]`;
        return line;
      }).join('\n')}`;
    } catch (e: any) { return `Regex error: ${e.message}`; }
  }

  if (name === 'diff_text') {
    try {
      const lines1 = input.text1.split('\n');
      const lines2 = input.text2.split('\n');
      const result: string[] = [];
      const maxLen = Math.max(lines1.length, lines2.length);
      let additions = 0, deletions = 0, unchanged = 0;
      for (let i = 0; i < maxLen; i++) {
        if (lines1[i] === lines2[i]) { result.push(`  ${lines1[i] ?? ''}`); unchanged++; }
        else {
          if (lines1[i] !== undefined) { result.push(`- ${lines1[i]}`); deletions++; }
          if (lines2[i] !== undefined) { result.push(`+ ${lines2[i]}`); additions++; }
        }
      }
      return `+${additions} added, -${deletions} removed, ${unchanged} unchanged\n\n${result.join('\n')}`;
    } catch (e: any) { return `Diff error: ${e.message}`; }
  }

  if (name === 'json_transform') {
    try {
      if (input.action === 'validate') { try { JSON.parse(input.json); return 'Valid JSON.'; } catch (e: any) { return `Invalid JSON: ${e.message}`; } }
      const parsed = JSON.parse(input.json);
      if (input.action === 'format') return JSON.stringify(parsed, null, 2);
      if (input.action === 'minify') return JSON.stringify(parsed);
      if (input.action === 'extract' && input.path) {
        const keys = input.path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let val: any = parsed;
        for (const k of keys) { if (val == null) return `Path not found at "${k}"`; val = val[k]; }
        return `Value at "${input.path}":\n${JSON.stringify(val, null, 2)}`;
      }
      if (input.action === 'to_csv') {
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (!arr.length) return 'Empty array';
        const headers = Object.keys(arr[0]);
        return [headers.join(','), ...arr.map((row: any) => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      }
      return 'Unknown action. Use: format, minify, extract, to_csv, validate';
    } catch (e: any) { return `JSON error: ${e.message}`; }
  }

  if (name === 'json_to_yaml') {
    try {
      if (input.direction === 'json_to_yaml') {
        const obj = JSON.parse(input.input);
        const toYaml = (o: any, indent = 0): string => {
          const pad = '  '.repeat(indent);
          if (Array.isArray(o)) return o.map(item => `${pad}- ${typeof item === 'object' && item !== null ? '\n' + toYaml(item, indent + 1) : item}`).join('\n');
          if (typeof o === 'object' && o !== null) return Object.entries(o).map(([k, v]) => {
            if (typeof v === 'object' && v !== null) return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
            return `${pad}${k}: ${v === null ? 'null' : typeof v === 'string' ? `"${v}"` : v}`;
          }).join('\n');
          return `${pad}${o}`;
        };
        return toYaml(obj);
      } else {
        const lines = input.input.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
        const obj: any = {};
        for (const line of lines) {
          const match = line.match(/^(\s*)(\w[\w\s]*):\s*(.*)/);
          if (match) {
            const [, , key, value] = match;
            if (value) {
              let v: any = value.trim();
              if (v === 'true') v = true;
              else if (v === 'false') v = false;
              else if (v === 'null') v = null;
              else if (/^\d+\.?\d*$/.test(v)) v = parseFloat(v);
              else v = v.replace(/^["']|["']$/g, '');
              obj[key.trim()] = v;
            }
          }
        }
        return JSON.stringify(obj, null, 2);
      }
    } catch (e: any) { return `Conversion error: ${e.message}`; }
  }

  if (name === 'xml_parse') {
    try {
      const xml = input.xml;
      const action = input.action || 'extract';
      if (action === 'format') {
        let depth = 0;
        return xml.replace(/></g, '>\n<').split('\n').map(line => {
          line = line.trim();
          if (line.startsWith('</')) depth--;
          const result = '  '.repeat(Math.max(0, depth)) + line;
          if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) depth++;
          return result;
        }).join('\n');
      }
      if (action === 'extract' && input.tag) {
        const regex = new RegExp(`<${input.tag}[^>]*>([\\s\\S]*?)<\\/${input.tag}>`, 'gi');
        const matches: string[] = [];
        let m;
        while ((m = regex.exec(xml)) !== null) matches.push(m[1].trim());
        return matches.length > 0 ? `Found ${matches.length} <${input.tag}> elements:\n\n${matches.join('\n')}` : `No <${input.tag}> elements found.`;
      }
      if (action === 'to_json') {
        const parseNode = (s: string): any => {
          const obj: any = {};
          const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
          let match;
          while ((match = tagRegex.exec(s)) !== null) {
            const [, tag, , content] = match;
            const inner = content.trim();
            if (/<\w/.test(inner)) obj[tag] = parseNode(inner);
            else obj[tag] = inner;
          }
          return obj;
        };
        return JSON.stringify(parseNode(xml), null, 2);
      }
      return 'Use action: "extract" (with tag), "to_json", or "format"';
    } catch (e: any) { return `XML error: ${e.message}`; }
  }

  if (name === 'code_format') {
    try {
      const lang = input.language.toLowerCase();
      if (lang === 'python') {
        return `Formatted ${lang} code:\n\`\`\`${lang}\n${input.code}\n\`\`\`\n\nNote: For proper formatting, use the run_code tool with black or autopep8.`;
      }
      if (lang === 'json') {
        return JSON.stringify(JSON.parse(input.code), null, 2);
      }
      let formatted = input.code;
      if (lang === 'html' || lang === 'xml') {
        let depth = 0;
        formatted = input.code.replace(/></g, '>\n<').split('\n').map(line => {
          line = line.trim();
          if (line.startsWith('</')) depth--;
          const result = '  '.repeat(Math.max(0, depth)) + line;
          if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) depth++;
          return result;
        }).join('\n');
      }
      return `Formatted ${lang}:\n\`\`\`${lang}\n${formatted}\n\`\`\``;
    } catch (e: any) { return `Format error: ${e.message}`; }
  }

  if (name === 'code_minify') {
    try {
      const lang = input.language.toLowerCase();
      let result = input.code;
      if (lang === 'javascript' || lang === 'js') {
        result = input.code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1').trim();
      } else if (lang === 'css') {
        result = input.code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>~+])\s*/g, '$1').replace(/;}/g, '}').trim();
      } else if (lang === 'html') {
        result = input.code.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
      }
      const saved = ((1 - result.length / input.code.length) * 100).toFixed(1);
      return `Minified ${lang} (${saved}% smaller):\n\n${result}\n\nOriginal: ${input.code.length} chars -> Minified: ${result.length} chars`;
    } catch (e: any) { return `Minify error: ${e.message}`; }
  }

  if (name === 'npm_search') {
    try {
      const limit = parseInt(input.limit || '5');
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(input.query)}&size=${limit}`);
      const data = await res.json() as any;
      const packages = data.objects || [];
      if (!packages.length) return 'No npm packages found.';
      return packages.map((p: any, i: number) => {
        const pkg = p.package;
        return `${i + 1}. ${pkg.name}@${pkg.version}\n   ${pkg.description || 'No description'}\n   npm: https://npmjs.com/package/${pkg.name}\n   Weekly downloads: ${p.score?.detail?.popularity?.toFixed(2) || 'N/A'}`;
      }).join('\n\n');
    } catch (e: any) { return `npm error: ${e.message}`; }
  }

  if (name === 'pypi_search') {
    try {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(input.query)}/json`);
      if (!res.ok) {
        const searchRes = await fetch(`https://pypi.org/search/?q=${encodeURIComponent(input.query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await searchRes.text();
        const matches = html.match(/<a class="package-snippet"[\s\S]*?<\/a>/g) || [];
        const results = matches.slice(0, 5).map((m, i) => {
          const name = m.match(/class="package-snippet__name">(.*?)<\//)?.[1] || '';
          const ver = m.match(/class="package-snippet__version">(.*?)<\//)?.[1] || '';
          const desc = m.match(/class="package-snippet__description">(.*?)<\//)?.[1]?.trim() || '';
          return `${i + 1}. ${name} ${ver}\n   ${desc}\n   pip install ${name}`;
        });
        return results.length > 0 ? results.join('\n\n') : 'No packages found.';
      }
      const data = await res.json() as any;
      const info = data.info;
      return `${info.name} ${info.version}\n${info.summary}\nAuthor: ${info.author || 'N/A'}\nLicense: ${info.license || 'N/A'}\nPython: ${info.requires_python || 'N/A'}\nHomepage: ${info.home_page || info.project_url || 'N/A'}\npip install ${info.name}`;
    } catch (e: any) { return `PyPI error: ${e.message}`; }
  }

  if (name === 'git_operations') {
    try {
      const headers: Record<string, string> = { 'User-Agent': 'ApexAgent/2.0', 'Accept': 'application/vnd.github.v3+json' };
      if (process.env.ZITE_GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.ZITE_GITHUB_TOKEN}`;
      const base = `https://api.github.com/repos/${input.repo}`;

      if (input.action === 'repo_info') {
        const res = await fetch(base, { headers });
        const data = await res.json() as any;
        return `${data.full_name}\n${data.description || 'No description'}\nStars: ${data.stargazers_count} | Forks: ${data.forks_count} | Issues: ${data.open_issues_count}\nLanguage: ${data.language}\nCreated: ${data.created_at}\nUpdated: ${data.updated_at}\nURL: ${data.html_url}`;
      }
      if (input.action === 'commits') {
        const res = await fetch(`${base}/commits?per_page=10`, { headers });
        const data = await res.json() as any[];
        return data.map((c, i) => `${i + 1}. ${c.sha.slice(0, 7)} - ${c.commit.message.split('\n')[0]}\n   by ${c.commit.author.name} on ${c.commit.author.date}`).join('\n\n');
      }
      if (input.action === 'issues') {
        const res = await fetch(`${base}/issues?per_page=10&state=open`, { headers });
        const data = await res.json() as any[];
        return data.map((iss, i) => `${i + 1}. #${iss.number}: ${iss.title}\n   ${iss.labels.map((l: any) => l.name).join(', ') || 'No labels'}\n   ${iss.html_url}`).join('\n\n');
      }
      if (input.action === 'pulls') {
        const res = await fetch(`${base}/pulls?per_page=10&state=open`, { headers });
        const data = await res.json() as any[];
        return data.map((pr, i) => `${i + 1}. #${pr.number}: ${pr.title}\n   by ${pr.user.login} | ${pr.state}\n   ${pr.html_url}`).join('\n\n');
      }
      if (input.action === 'file' && input.path) {
        const res = await fetch(`${base}/contents/${input.path}`, { headers });
        const data = await res.json() as any;
        if (data.content) return Buffer.from(data.content, 'base64').toString('utf-8');
        return `Could not read file: ${data.message || 'Unknown error'}`;
      }
      if (input.action === 'search_code' && input.query) {
        const res = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(input.query)}+repo:${input.repo}`, { headers });
        const data = await res.json() as any;
        return (data.items || []).slice(0, 10).map((item: any, i: number) => `${i + 1}. ${item.path}\n   ${item.html_url}`).join('\n\n') || 'No code matches.';
      }
      if (input.action === 'releases') {
        const res = await fetch(`${base}/releases?per_page=5`, { headers });
        const data = await res.json() as any[];
        return data.map((r, i) => `${i + 1}. ${r.tag_name} - ${r.name || 'No title'}\n   Published: ${r.published_at}\n   ${r.html_url}`).join('\n\n') || 'No releases.';
      }
      return 'Unknown action. Use: repo_info, commits, issues, pulls, file, search_code, releases';
    } catch (e: any) { return `Git error: ${e.message}`; }
  }

  if (name === 'api_mock') {
    try {
      const count = parseInt(input.count || '5');
      const mockRes = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: `Generate a mock JSON API response with ${count} items matching this schema: ${input.schema}\n\nReturn ONLY valid JSON, no explanation.` }],
      });
      const content = mockRes.choices[0]?.message?.content;
      if (!content) return 'Could not generate mock data.';
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) return JSON.stringify(JSON.parse(jsonMatch[0]), null, 2);
      return content;
    } catch (e: any) { return `Mock API error: ${e.message}`; }
  }

  if (name === 'whois_lookup') {
    try {
      const res = await fetch(`https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(input.domain)}`, { headers: { 'X-Api-Key': process.env.ZITE_API_NINJAS_KEY || '' } });
      if (!res.ok) {
        const altRes = await fetch(`https://www.whois.com/whois/${encodeURIComponent(input.domain)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await altRes.text();
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
      }
      const data = await res.json() as any;
      const lines: string[] = [`WHOIS for ${input.domain}:`];
      if (data.domain_name) lines.push(`Domain: ${Array.isArray(data.domain_name) ? data.domain_name[0] : data.domain_name}`);
      if (data.registrar) lines.push(`Registrar: ${data.registrar}`);
      if (data.creation_date) lines.push(`Created: ${data.creation_date}`);
      if (data.expiration_date) lines.push(`Expires: ${data.expiration_date}`);
      if (data.name_servers) lines.push(`NS: ${Array.isArray(data.name_servers) ? data.name_servers.join(', ') : data.name_servers}`);
      return lines.join('\n');
    } catch (e: any) { return `WHOIS error: ${e.message}`; }
  }

  if (name === 'dns_lookup') {
    try {
      const recordType = (input.type || 'ALL').toUpperCase();
      const types = recordType === 'ALL' ? ['A', 'AAAA', 'MX', 'NS', 'TXT'] : [recordType];
      const results: string[] = [`DNS for ${input.domain}:`];
      for (const type of types) {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(input.domain)}&type=${type}`);
          const data = await res.json() as any;
          if (data.Answer?.length) {
            results.push(`\n[${type}]`);
            data.Answer.forEach((r: any) => results.push(`  ${r.name} -> ${r.data} (TTL: ${r.TTL}s)`));
          }
        } catch { /* skip */ }
      }
      return results.length > 1 ? results.join('\n') : `No records found for ${input.domain}`;
    } catch (e: any) { return `DNS error: ${e.message}`; }
  }

  if (name === 'ip_lookup') {
    try {
      const ip = input.ip === 'me' ? '' : input.ip;
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
      const data = await res.json() as any;
      if (data.status === 'fail') return `IP lookup failed: ${data.message}`;
      return `IP: ${data.query}\nCountry: ${data.country}\nRegion: ${data.regionName}\nCity: ${data.city}\nZIP: ${data.zip}\nCoords: ${data.lat}, ${data.lon}\nTimezone: ${data.timezone}\nISP: ${data.isp}\nOrg: ${data.org}\nAS: ${data.as}`;
    } catch (e: any) { return `IP error: ${e.message}`; }
  }

  if (name === 'shorten_url') {
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(input.url)}`);
      const short = await res.text();
      return short.startsWith('http') ? `Original: ${input.url}\nShort: ${short}` : `Shortener error: ${short.slice(0, 200)}`;
    } catch (e: any) { return `URL shortener error: ${e.message}`; }
  }

  if (name === 'http_request') {
    try {
      const method = (input.method || 'GET').toUpperCase();
      const headers: Record<string, string> = input.headers ? JSON.parse(input.headers) : {};
      if (!headers['User-Agent']) headers['User-Agent'] = 'ApexAgent/2.0';
      if (input.url.includes('api.github.com') && process.env.ZITE_GITHUB_TOKEN && !headers['Authorization']) {
        headers['Authorization'] = `token ${process.env.ZITE_GITHUB_TOKEN}`;
      }
      const options: RequestInit = { method, headers };
      if (input.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = input.body;
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      }
      const res = await fetch(input.url, options);
      const text = await res.text();
      let body: string;
      try { body = JSON.stringify(JSON.parse(text), null, 2); } catch { body = text; }
      return `HTTP ${method} ${input.url}\nStatus: ${res.status} ${res.statusText}\n\n${body}`;
    } catch (e: any) { return `HTTP error: ${e.message}`; }
  }

  if (name === 'jwt_decode') {
    try {
      const parts = input.token.split('.');
      if (parts.length !== 3) return 'Invalid JWT: expected 3 parts.';
      const decode = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
      const header = decode(parts[0]);
      const payload = decode(parts[1]);
      const lines = ['JWT Decoded:\n', '--- Header ---', JSON.stringify(header, null, 2), '\n--- Payload ---', JSON.stringify(payload, null, 2)];
      if (payload.exp) { const d = new Date(payload.exp * 1000); lines.push(`\nExpires: ${d.toUTCString()} (${d < new Date() ? 'EXPIRED' : 'valid'})`); }
      if (payload.iat) lines.push(`Issued: ${new Date(payload.iat * 1000).toUTCString()}`);
      lines.push('\nNote: Signature NOT verified.');
      return lines.join('\n');
    } catch (e: any) { return `JWT error: ${e.message}`; }
  }

  if (name === 'cron_explain') {
    try {
      const parts = input.expression.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) return 'Invalid cron. Expected 5-6 fields.';
      const names = parts.length === 6 ? ['second', 'minute', 'hour', 'day of month', 'month', 'day of week'] : ['minute', 'hour', 'day of month', 'month', 'day of week'];
      const explain = parts.map((p, i) => {
        const n = names[i];
        if (p === '*') return `${n}: every ${n}`;
        if (p.includes('/')) return `${n}: every ${p.split('/')[1]} ${n}s`;
        if (p.includes('-')) return `${n}: ${p} (range)`;
        if (p.includes(',')) return `${n}: ${p} (specific)`;
        return `${n}: ${p}`;
      });
      return `Cron: ${input.expression}\n\n${explain.map(e => `- ${e}`).join('\n')}`;
    } catch (e: any) { return `Cron error: ${e.message}`; }
  }

  if (name === 'text_stats') {
    try {
      const text = input.text;
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const charsNoSpace = text.replace(/\s/g, '').length;
      const freq: Record<string, number> = {};
      words.forEach(w => { const l = w.toLowerCase().replace(/[^a-z0-9]/g, ''); if (l.length > 2) freq[l] = (freq[l] || 0) + 1; });
      const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return `Characters: ${text.length} (${charsNoSpace} no spaces)\nWords: ${words.length}\nSentences: ${sentences.length}\nParagraphs: ${paragraphs.length}\nLines: ${text.split('\n').length}\nAvg word: ${(charsNoSpace / (words.length || 1)).toFixed(1)} chars\nReading: ~${Math.ceil(words.length / 200)} min\nSpeaking: ~${Math.ceil(words.length / 130)} min${topWords.length ? `\n\nTop words: ${topWords.map(([w, c]) => `${w}(${c})`).join(', ')}` : ''}`;
    } catch (e: any) { return `Text stats error: ${e.message}`; }
  }

  if (name === 'markdown_to_html') {
    try {
      let html = input.markdown
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>').replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>').replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>').replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/^---+$/gm, '<hr />').replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>').replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />');
      return `<p>${html}</p>`.replace(/<p>\s*<\/p>/g, '');
    } catch (e: any) { return `Markdown error: ${e.message}`; }
  }

  if (name === 'csv_to_json') {
    try {
      const delimiter = input.delimiter || ',';
      const lines = input.csv.trim().split('\n');
      if (lines.length < 2) return 'Need header + data rows.';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      return JSON.stringify(lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      }), null, 2);
    } catch (e: any) { return `CSV error: ${e.message}`; }
  }

  if (name === 'color_palette') {
    try {
      const count = parseInt(input.count || '5');
      const type = (input.type || 'analogous').toLowerCase();
      const hexToHsl = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
        if (max === min) return [0, 0, l * 100];
        const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
        return [h * 360, s * 100, l * 100];
      };
      const hslToHex = (h: number, s: number, l: number): string => {
        h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0'); };
        return `#${f(0)}${f(8)}${f(4)}`;
      };
      let baseHex = input.base_color || `#${crypto.randomBytes(3).toString('hex')}`;
      if (!baseHex.startsWith('#')) baseHex = '#' + baseHex;
      const [bH, bS, bL] = hexToHsl(baseHex);
      let colors: string[] = [];
      if (type === 'complementary') { colors = [baseHex, hslToHex(bH + 180, bS, bL)]; for (let i = 2; i < count; i++) colors.push(hslToHex(bH + (i * 30), bS, bL + (i % 2 ? 10 : -10))); }
      else if (type === 'triadic') { colors = [baseHex, hslToHex(bH + 120, bS, bL), hslToHex(bH + 240, bS, bL)]; for (let i = 3; i < count; i++) colors.push(hslToHex(bH + (i * 60), bS, bL)); }
      else if (type === 'monochromatic') { for (let i = 0; i < count; i++) colors.push(hslToHex(bH, bS, 20 + (60 / count) * i)); }
      else if (type === 'random') { for (let i = 0; i < count; i++) colors.push(`#${crypto.randomBytes(3).toString('hex')}`); }
      else { for (let i = 0; i < count; i++) colors.push(hslToHex(bH + (i * 30) - ((count - 1) * 15), bS, bL)); }
      return `Palette (${type}), base: ${baseHex}\n\n${colors.slice(0, count).map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    } catch (e: any) { return `Palette error: ${e.message}`; }
  }

  // ========== SECURITY ==========

  if (name === 'ssl_check') {
    try {
      const res = await fetch(`https://${input.domain}`, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      return `SSL Check for ${input.domain}:\nHTTPS: ${res.ok ? 'OK' : 'Failed'}\nStatus: ${res.status}\nHeaders: ${JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2)}`;
    } catch (e: any) { return `SSL error: ${e.message}`; }
  }

  if (name === 'headers_check') {
    try {
      const res = await fetch(input.url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      const h = Object.fromEntries(res.headers.entries());
      const checks: string[] = [`Security Headers for ${input.url}:\n`];
      const important = [
        ['strict-transport-security', 'HSTS', 'Enforces HTTPS'],
        ['content-security-policy', 'CSP', 'Prevents XSS attacks'],
        ['x-frame-options', 'X-Frame-Options', 'Prevents clickjacking'],
        ['x-content-type-options', 'X-Content-Type-Options', 'Prevents MIME sniffing'],
        ['x-xss-protection', 'X-XSS-Protection', 'XSS filter'],
        ['referrer-policy', 'Referrer-Policy', 'Controls referrer info'],
        ['permissions-policy', 'Permissions-Policy', 'Controls browser features'],
      ];
      for (const [header, label, desc] of important) {
        const val = h[header];
        checks.push(`${val ? 'PASS' : 'MISSING'} ${label}: ${val || `Not set (${desc})`}`);
      }
      checks.push(`\nServer: ${h['server'] || 'Not disclosed'}`);
      return checks.join('\n');
    } catch (e: any) { return `Headers check error: ${e.message}`; }
  }

  if (name === 'password_strength') {
    try {
      const p = input.password;
      let score = 0;
      const checks: string[] = [];
      if (p.length >= 8) { score++; checks.push('PASS Length >= 8'); } else checks.push('FAIL Length < 8');
      if (p.length >= 12) { score++; checks.push('PASS Length >= 12'); }
      if (p.length >= 16) { score++; checks.push('PASS Length >= 16'); }
      if (/[a-z]/.test(p)) { score++; checks.push('PASS Lowercase letters'); } else checks.push('FAIL No lowercase');
      if (/[A-Z]/.test(p)) { score++; checks.push('PASS Uppercase letters'); } else checks.push('FAIL No uppercase');
      if (/\d/.test(p)) { score++; checks.push('PASS Numbers'); } else checks.push('FAIL No numbers');
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) { score++; checks.push('PASS Special characters'); } else checks.push('FAIL No special chars');
      if (!/(.)\1{2,}/.test(p)) { score++; checks.push('PASS No repeated chars (3+)'); } else checks.push('FAIL Repeated characters');
      if (!/^(123|abc|qwerty|password|admin)/i.test(p)) { score++; checks.push('PASS Not a common pattern'); } else checks.push('FAIL Common pattern detected');
      const uniqueChars = new Set(p).size;
      if (uniqueChars >= p.length * 0.6) { score++; checks.push(`PASS Good char diversity (${uniqueChars} unique)`); }
      const strength = score <= 3 ? 'WEAK' : score <= 6 ? 'MODERATE' : score <= 8 ? 'STRONG' : 'VERY STRONG';
      const entropy = Math.log2(Math.pow(uniqueChars, p.length)).toFixed(1);
      return `Password Strength: ${strength} (${score}/10)\nEntropy: ~${entropy} bits\nLength: ${p.length}\n\n${checks.join('\n')}`;
    } catch (e: any) { return `Password check error: ${e.message}`; }
  }

  if (name === 'vulnerability_check') {
    try {
      const limit = parseInt(input.limit || '5');
      const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(input.query)}&resultsPerPage=${limit}`, {
        headers: { 'User-Agent': 'ApexAgent/2.0' }
      });
      const data = await res.json() as any;
      const vulns = data.vulnerabilities || [];
      if (!vulns.length) return `No CVEs found for "${input.query}".`;
      return vulns.map((v: any, i: number) => {
        const cve = v.cve;
        const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description';
        const severity = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || cve.metrics?.cvssMetricV2?.[0]?.baseSeverity || 'N/A';
        const score = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 'N/A';
        return `${i + 1}. ${cve.id} [${severity} ${score}]\n   ${desc.slice(0, 200)}${desc.length > 200 ? '...' : ''}\n   Published: ${cve.published}`;
      }).join('\n\n');
    } catch (e: any) { return `CVE error: ${e.message}`; }
  }

  if (name === 'malware_url_check') {
    try {
      const res = await fetch(`https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(input.url)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const domain = new URL(input.url).hostname;
      const voidRes = await fetch(`https://www.urlvoid.com/scan/${domain}/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await voidRes.text();
      const detections = html.match(/(\d+)\/\d+ engines detected/)?.[0] || 'Unknown';
      return `URL Safety Check: ${input.url}\n\nDomain: ${domain}\nDetection: ${detections}\nGoogle Safe Browsing: https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(input.url)}\n\nNote: Always verify with multiple sources for critical security decisions.`;
    } catch (e: any) { return `URL check error: ${e.message}`; }
  }

  // ========== COMMUNICATION ==========

  if (name === 'send_webhook') {
    try {
      const method = (input.method || 'POST').toUpperCase();
      const res = await fetch(input.url, {
        method,
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'ApexAgent/2.0' },
        body: input.payload,
      });
      const text = await res.text();
      return `Webhook ${method} to ${input.url}\nStatus: ${res.status} ${res.statusText}\nResponse: ${text.slice(0, 2000)}`;
    } catch (e: any) { return `Webhook error: ${e.message}`; }
  }

  // ========== LOCATION ==========

  if (name === 'geocode') {
    try {
      const loc = await resolveCoords(input.address);
      if (!loc) return `Could not geocode "${input.address}".`;
      return `Geocode: ${input.address}\n\nName: ${loc.name}\nLatitude: ${loc.lat}\nLongitude: ${loc.lon}\nGoogle Maps: https://www.google.com/maps?q=${loc.lat},${loc.lon}`;
    } catch (e: any) { return `Geocode error: ${e.message}`; }
  }

  if (name === 'reverse_geocode') {
    try {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${input.lat}&lon=${input.lon}`, {
        headers: { 'User-Agent': 'ApexAgent/2.0' }
      });
      const data = await nomRes.json() as any;
      return `Reverse Geocode: ${input.lat}, ${input.lon}\n\nAddress: ${data.display_name || 'Unknown'}\nType: ${data.type || 'N/A'}`;
    } catch (e: any) { return `Reverse geocode error: ${e.message}`; }
  }

  if (name === 'distance_calculate') {
    try {
      const from = await resolveCoords(input.from);
      const to = await resolveCoords(input.to);
      if (!from) return `Could not find location: "${input.from}"`;
      if (!to) return `Could not find location: "${input.to}"`;
      const R = 6371;
      const dLat = (to.lat - from.lat) * Math.PI / 180;
      const dLon = (to.lon - from.lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const miles = km * 0.621371;
      return `Distance: ${from.name} -> ${to.name}\n\n${km.toFixed(1)} km (${miles.toFixed(1)} miles)\nStraight-line (as the crow flies)`;
    } catch (e: any) { return `Distance error: ${e.message}`; }
  }

  if (name === 'timezone_convert') {
    try {
      const date = new Date(input.time.includes('T') || input.time.includes('-') ? input.time : `2024-01-01T${input.time}:00`);
      const fromStr = date.toLocaleString('en-US', { timeZone: input.from_tz, dateStyle: 'full', timeStyle: 'long' });
      const toStr = date.toLocaleString('en-US', { timeZone: input.to_tz, dateStyle: 'full', timeStyle: 'long' });
      return `Timezone Conversion:\n\n${input.from_tz}: ${fromStr}\n${input.to_tz}: ${toStr}`;
    } catch (e: any) { return `Timezone error: ${e.message}`; }
  }

  // ========== KNOWLEDGE ==========

  if (name === 'arxiv_search') {
    try {
      const limit = parseInt(input.limit || '5');
      const res = await fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(input.query)}&start=0&max_results=${limit}`);
      const xml = await res.text();
      const entries: string[] = [];
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim() || 'No title';
        const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 200) || '';
        const link = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.slice(0, 10) || '';
        const authors = entry.match(/<name>(.*?)<\/name>/g)?.slice(0, 3).map(a => a.replace(/<\/?name>/g, '')).join(', ') || '';
        entries.push(`${entries.length + 1}. ${title}\n   ${authors} (${published})\n   ${summary}...\n   ${link}`);
      }
      return entries.length > 0 ? `arXiv results for "${input.query}":\n\n${entries.join('\n\n')}` : 'No papers found.';
    } catch (e: any) { return `arXiv error: ${e.message}`; }
  }

  if (name === 'book_search') {
    try {
      const limit = parseInt(input.limit || '5');
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(input.query)}&maxResults=${limit}`);
      const data = await res.json() as any;
      const items = data.items || [];
      if (!items.length) return 'No books found.';
      return items.map((b: any, i: number) => {
        const v = b.volumeInfo;
        return `${i + 1}. "${v.title}"${v.subtitle ? ': ' + v.subtitle : ''}\n   Author: ${v.authors?.join(', ') || 'Unknown'}\n   Published: ${v.publishedDate || 'N/A'}\n   Pages: ${v.pageCount || 'N/A'}\n   Rating: ${v.averageRating || 'N/A'}/5\n   ${v.infoLink || ''}`;
      }).join('\n\n');
    } catch (e: any) { return `Book search error: ${e.message}`; }
  }

  if (name === 'movie_search') {
    try {
      const yearParam = input.year ? `&y=${input.year}` : '';
      const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(input.query)}${yearParam}&apikey=4a3b711b&plot=full`);
      const data = await res.json() as any;
      if (data.Response === 'False') return `Movie not found: ${data.Error}`;
      return `${data.Title} (${data.Year})\nRated: ${data.Rated}\nRuntime: ${data.Runtime}\nGenre: ${data.Genre}\nDirector: ${data.Director}\nActors: ${data.Actors}\nIMDb: ${data.imdbRating}/10 (${data.imdbVotes} votes)\nMetascore: ${data.Metascore || 'N/A'}\n\nPlot: ${data.Plot}\n\nPoster: ${data.Poster !== 'N/A' ? data.Poster : 'Not available'}`;
    } catch (e: any) { return `Movie error: ${e.message}`; }
  }

  if (name === 'lyrics_search') {
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(input.artist)}/${encodeURIComponent(input.title)}`);
      const data = await res.json() as any;
      if (data.error) return `Lyrics not found: ${data.error}`;
      const lyrics = data.lyrics || 'No lyrics found.';
      const header = `\n"${input.title}" by ${input.artist}\n\n`;
      await streamFn(header);
      await streamFn(lyrics);
      fullTextRef.value += header + lyrics;
      return `Lyrics for "${input.title}" by ${input.artist} streamed successfully (${lyrics.length} chars).`;
    } catch (e: any) { return `Lyrics error: ${e.message}`; }
  }

  // ========== FUN ==========

  if (name === 'trivia') {
    try {
      const count = parseInt(input.count || '1');
      const catMap: Record<string, number> = { general: 9, science: 17, history: 23, geography: 22, entertainment: 11, sports: 21 };
      const cat = input.category ? `&category=${catMap[input.category.toLowerCase()] || 9}` : '';
      const res = await fetch(`https://opentdb.com/api.php?amount=${count}&type=multiple${cat}`);
      const data = await res.json() as any;
      if (!data.results?.length) return 'No trivia questions available.';
      return data.results.map((q: any, i: number) => {
        const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        return `Q${i + 1}. ${decode(q.question)} [${q.difficulty}]\n${answers.map((a: string, j: number) => `   ${String.fromCharCode(65 + j)}. ${decode(a)}`).join('\n')}\n   Answer: ${decode(q.correct_answer)}`;
      }).join('\n\n');
    } catch (e: any) { return `Trivia error: ${e.message}`; }
  }

  if (name === 'fact') {
    try {
      const cat = (input.category || 'random').toLowerCase();
      let url = 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en';
      if (cat === 'today') url = 'https://uselessfacts.jsph.pl/api/v2/facts/today?language=en';
      else if (cat === 'math') url = 'http://numbersapi.com/random/math?json';
      else if (cat === 'year') url = 'http://numbersapi.com/random/year?json';
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json() as any;
      return `Fun Fact:\n${data.text}${data.source ? `\nSource: ${data.source}` : ''}`;
    } catch (e: any) { return `Fact error: ${e.message}`; }
  }

  if (name === 'read_pdf_url') {
    try {
      const pdfRes = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/pdf,*/*' } });
      if (!pdfRes.ok) return `Failed to fetch PDF: ${pdfRes.status}`;
      const arrayBuffer = await pdfRes.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      if (!isPdf) { const text = new TextDecoder().decode(bytes); return `Not a PDF. Content:\n${text.slice(0, 5000)}`; }
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      if (base64.length > 20000000) return 'PDF too large (max ~15MB).';
      // OpenAI vision can process images but not PDFs natively via base64 in the same way.
      // Use a text extraction approach: send the first page as an image or describe via prompt.
      // For now, we try to extract text directly from the PDF binary.
      const textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const extractedText = textContent
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .match(/\(([^)]+)\)/g)
        ?.map(s => s.slice(1, -1))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (extractedText && extractedText.length > 50) {
        return `PDF text extracted (${extractedText.length} chars):\n\n${extractedText}`;
      }
      // Fallback: use OpenAI to describe the PDF content from what we can extract
      const visionRes = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 16000,
        messages: [{ role: 'user', content: `I have a PDF from ${input.url}. Here is the raw text I could extract from it:\n\n${extractedText || '(no extractable text - the PDF may be image-based)'}\n\nPlease organize and present this content clearly.` }],
      });
      return visionRes.choices[0]?.message?.content || 'Could not read PDF.';
    } catch (e: any) { return `PDF error: ${e.message}`; }
  }

  if (name === 'screenshot_url') {
    const url = `https://api.screenshotone.com/take?url=${encodeURIComponent(input.url)}&format=jpg&viewport_width=1280&viewport_height=800`;
    return `Screenshot of ${input.url}:\n![Screenshot](${url})\n\nURL: ${url}`;
  }

  if (name === 'user_agent_parse') {
    try {
      const ua = input.ua;
      const result: string[] = [`User-Agent: ${ua}\n`];
      const browsers: [RegExp, string][] = [[/Firefox\/(\S+)/, 'Firefox'], [/Edg\/(\S+)/, 'Edge'], [/OPR\/(\S+)/, 'Opera'], [/Chrome\/(\S+)/, 'Chrome'], [/Safari\/(\S+)/, 'Safari'], [/MSIE (\S+)/, 'IE']];
      for (const [p, n] of browsers) { const m = ua.match(p); if (m) { result.push(`Browser: ${n} ${m[1]}`); break; } }
      if (ua.includes('Windows NT 10.0')) result.push('OS: Windows 10/11');
      else if (ua.includes('Mac OS X')) result.push(`OS: macOS ${ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.') || ''}`);
      else if (ua.includes('Linux')) result.push('OS: Linux');
      else if (ua.includes('Android')) result.push(`OS: Android ${ua.match(/Android (\d+\.?\d*)/)?.[1] || ''}`);
      else if (ua.includes('iPhone') || ua.includes('iPad')) result.push(`OS: iOS ${ua.match(/OS (\d+_\d+)/)?.[1]?.replace(/_/g, '.') || ''}`);
      result.push(`Device: ${ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') ? 'Mobile' : ua.includes('Tablet') || ua.includes('iPad') ? 'Tablet' : 'Desktop'}`);
      if (/bot|crawler|spider/i.test(ua)) result.push('Type: Bot');
      return result.join('\n');
    } catch (e: any) { return `UA parse error: ${e.message}`; }
  }

  if (name === 'port_check') {
    try {
      const res = await fetch(`https://api.api-ninjas.com/v1/portscanner?address=${encodeURIComponent(input.host)}&port=${encodeURIComponent(input.port)}`, {
        headers: { 'X-Api-Key': process.env.ZITE_API_NINJAS_KEY || '' }
      });
      if (res.ok) {
        const data = await res.json() as any;
        return `Port Check: ${input.host}:${input.port}\nStatus: ${data.is_valid ? (data.is_open ? 'OPEN' : 'CLOSED') : 'Invalid'}`;
      }
      return `Port check service unavailable. Try http_request to test connectivity.`;
    } catch (e: any) { return `Port check error: ${e.message}`; }
  }

  // ========== UTILITIES ==========

  if (name === 'random_generate') {
    try {
      const len = parseInt(input.length || '16');
      if (input.type === 'password') {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        return `Password (${len} chars):\n${Array.from(crypto.randomBytes(len)).map((b: number) => chars[b % chars.length]).join('')}`;
      }
      if (input.type === 'uuid') return `UUID:\n${crypto.randomUUID()}`;
      if (input.type === 'number') return `Random (0-${len}):\n${crypto.randomInt(0, len || 100)}`;
      if (input.type === 'color') { const hex = '#' + crypto.randomBytes(3).toString('hex'); return `Color: ${hex}\nRGB: rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`; }
      if (input.type === 'lorem') {
        const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'.split(' ');
        return Array.from({ length: len }, () => { const s = Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () => words[Math.floor(Math.random() * words.length)]).join(' '); return s.charAt(0).toUpperCase() + s.slice(1) + '.'; }).join(' ');
      }
      return 'Use: password, uuid, number, color, lorem';
    } catch (e: any) { return `Random error: ${e.message}`; }
  }

  if (name === 'timestamp') {
    try {
      const tz = input.timezone || 'UTC';
      if (input.action === 'now') {
        const now = new Date();
        return `Current time (${tz}):\n${now.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' })}\n\nUnix: ${Math.floor(now.getTime() / 1000)}\nISO: ${now.toISOString()}`;
      }
      if (input.action === 'convert' && input.value) {
        if (/^\d+$/.test(input.value)) {
          const ts = parseInt(input.value);
          const date = new Date(ts < 1e12 ? ts * 1000 : ts);
          return `Unix ${input.value} -> ${date.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' })}\nISO: ${date.toISOString()}`;
        }
        const date = new Date(input.value);
        if (isNaN(date.getTime())) return `Could not parse: "${input.value}"`;
        return `"${input.value}" -> Unix: ${Math.floor(date.getTime() / 1000)}\nISO: ${date.toISOString()}`;
      }
      if (input.action === 'diff' && input.value && input.value2) {
        const d1 = new Date(input.value), d2 = new Date(input.value2);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 'Could not parse dates.';
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const days = Math.floor(diffMs / 86400000);
        return `Diff: ${Math.floor(days / 365.25)} years, ${days % 365} days, ${Math.floor((diffMs % 86400000) / 3600000)} hours\nTotal: ${days} days`;
      }
      return 'Use: now, convert, diff';
    } catch (e: any) { return `Timestamp error: ${e.message}`; }
  }

  if (name === 'unit_convert') {
    try {
      const val = parseFloat(input.value);
      if (isNaN(val)) return `Invalid number: "${input.value}"`;
      const from = input.from.toLowerCase().trim(), to = input.to.toLowerCase().trim();
      const tempUnits = ['celsius', 'c', 'fahrenheit', 'f', 'kelvin', 'k'];
      if (tempUnits.includes(from) && tempUnits.includes(to)) {
        const toC = (v: number, u: string) => u === 'celsius' || u === 'c' ? v : u === 'fahrenheit' || u === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
        const fromC = (v: number, u: string) => u === 'celsius' || u === 'c' ? v : u === 'fahrenheit' || u === 'f' ? v * 9 / 5 + 32 : v + 273.15;
        const sym = (u: string) => u === 'celsius' || u === 'c' ? 'C' : u === 'fahrenheit' || u === 'f' ? 'F' : 'K';
        return `${val}${sym(from)} = ${fromC(toC(val, from), to).toFixed(4)}${sym(to)}`;
      }
      const fg = findUnitGroup(from), tg = findUnitGroup(to);
      if (!fg) return `Unknown unit: "${from}".`;
      if (!tg) return `Unknown unit: "${to}".`;
      if (fg.group !== tg.group) return `Can't convert ${fg.group} to ${tg.group}.`;
      const result = val * fg.factor / tg.factor;
      return `${val} ${from} = ${result < 0.001 ? result.toExponential(4) : result.toFixed(6).replace(/\.?0+$/, '')} ${to}`;
    } catch (e: any) { return `Unit error: ${e.message}`; }
  }

  return `Unknown tool: ${name}.`;
}

export default createEndpoint({
  stream: true,
  description: 'Apex AI Agent -- OpenAI gpt-4.1-mini with 80+ tools: web, code, crypto, stocks, weather, files, security, location, knowledge, and more',
  inputSchema: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })),
    attachments: z.array(z.object({
      name: z.string(),
      content: z.string(),
      mimeType: z.string(),
    })).optional(),
  }),
  outputSchema: z.object({ text: z.string() }),
  execute: async ({ input, stream }) => {
    const systemPrompt = `You are Apex, a powerful AI agent with 80+ tools. Use them proactively.

RULES:
- NEVER truncate or abbreviate tool results. Show COMPLETE output always.
- Do NOT say "..." or skip content. Print EVERYTHING the tool returns.
- No output limits. Write as much as needed.
- Always use tools over guessing. Chain tools for thorough answers.
- For code: write complete, self-contained code and EXECUTE it with run_code.
- For file creation: use create_file for ANY file type. Generate complete, properly formatted content.
- For presentations (PPTX): create a styled HTML document with slide sections and page breaks. User prints to PDF.
- For spreadsheets: generate CSV data that can be opened in Excel.
- Use markdown formatting.`;

    const lastIdx = input.messages.length - 1;

    // Build OpenAI-compatible messages
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (let i = 0; i < input.messages.length; i++) {
      const m = input.messages[i];
      if (i === lastIdx && m.role === 'user' && input.attachments?.length) {
        const contentBlocks: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
        for (const att of input.attachments) {
          if (att.mimeType.startsWith('image/')) {
            contentBlocks.push({
              type: 'image_url',
              image_url: { url: `data:${att.mimeType};base64,${att.content}`, detail: 'high' },
            });
          } else {
            contentBlocks.push({
              type: 'text',
              text: `Attached: **${att.name}**\n\`\`\`\n${att.content}\n\`\`\``,
            });
          }
        }
        contentBlocks.push({ type: 'text', text: m.content });
        openaiMessages.push({ role: 'user', content: contentBlocks });
      } else {
        openaiMessages.push({ role: m.role, content: m.content });
      }
    }

    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = openaiMessages;
    let fullText = '';
    const fullTextRef = { value: '' };

    for (let iter = 0; iter < 100; iter++) {
      const chatStream = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 16384,
        stream: true,
        tools: TOOLS,
        messages,
      });

      let assistantContent = '';
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let finishReason: string | null = null;

      for await (const chunk of chatStream) {
        const delta = chunk.choices[0]?.delta;
        finishReason = chunk.choices[0]?.finish_reason || finishReason;

        if (delta?.content) {
          assistantContent += delta.content;
          fullText += delta.content;
          await stream.write(delta.content);
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCalls.has(idx)) {
              toolCalls.set(idx, { id: tc.id || '', name: tc.function?.name || '', arguments: '' });
            }
            const existing = toolCalls.get(idx)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          }
        }
      }

      // Handle max_tokens continuation
      if (finishReason === 'length' && toolCalls.size === 0) {
        messages = [
          ...messages,
          { role: 'assistant', content: assistantContent },
          { role: 'user', content: 'Continue exactly where you left off. Do not repeat anything.' },
        ];
        continue;
      }

      // No tool calls -- we're done
      if (finishReason !== 'tool_calls' && toolCalls.size === 0) break;

      // Build the assistant message with tool_calls
      const toolCallsArray = Array.from(toolCalls.values()).map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }));

      const assistantMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCallsArray,
      };

      messages = [...messages, assistantMsg];

      // Execute each tool and collect results
      const toolResultMessages: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

      for (const tc of toolCallsArray) {
        const toolInput = JSON.parse(tc.function.arguments || '{}');

        if (tc.function.name !== 'create_file') {
          const labelMap: Record<string, (i: any) => string> = {
            web_fetch: i => i.url, web_search: i => `"${i.query}"`, wikipedia: i => i.query,
            calculate: i => i.expression, get_weather: i => i.city, get_news: i => i.topic,
            get_crypto_price: i => i.symbol, get_stock_price: i => i.ticker,
            currency_convert: i => `${i.amount} ${i.from} -> ${i.to}`, translate: i => `-> ${i.to}`,
            summarize_url: i => i.url, generate_qr: i => i.data, shorten_url: i => i.url,
            youtube_search: i => i.query, hash_text: i => i.algorithm || 'sha256',
            encode_decode: i => i.method, regex_test: i => `/${i.pattern}/`,
            diff_text: () => 'comparing', json_transform: i => i.action,
            random_generate: i => i.type, timestamp: i => i.action,
            unit_convert: i => `${i.value} ${i.from} -> ${i.to}`,
            whois_lookup: i => i.domain, dns_lookup: i => `${i.domain} (${i.type || 'ALL'})`,
            ip_lookup: i => i.ip, http_request: i => `${i.method || 'GET'} ${i.url}`,
            read_pdf_url: i => i.url, screenshot_url: i => i.url,
            jwt_decode: () => 'decoding', cron_explain: i => i.expression,
            text_stats: i => `${String(i.text).slice(0, 30)}...`, markdown_to_html: () => 'converting',
            csv_to_json: () => 'converting', color_palette: i => i.type || 'analogous',
            ssl_check: i => i.domain, user_agent_parse: () => 'parsing',
            port_check: i => `${i.host}:${i.port}`, generate_placeholder_image: i => `${i.width || 600}x${i.height || 400}`,
            run_code: i => `${i.language} - ${String(i.code).slice(0, 50).replace(/\n/g, ' ')}`,
            read_image_url: i => i.url, web_scrape: i => `${i.url} (${i.selector})`,
            rss_feed: i => i.url, link_preview: i => i.url, sitemap_parse: i => i.url,
            reddit_search: i => i.query, hackernews: i => i.type || 'top',
            trending_topics: i => i.country || 'US',
            image_generate: i => i.prompt?.slice(0, 50), chart_generate: i => i.type,
            meme_generate: i => i.top_text?.slice(0, 30), ascii_art: i => i.text,
            spell_check: () => 'checking', text_to_speech: () => 'converting',
            emoji_search: i => i.query, json_to_yaml: i => i.direction,
            xml_parse: i => i.action || 'extract', code_format: i => i.language,
            code_minify: i => i.language, npm_search: i => i.query,
            pypi_search: i => i.query, git_operations: i => `${i.action} ${i.repo}`,
            api_mock: i => i.schema?.slice(0, 40), csv_analyze: () => 'analyzing',
            headers_check: i => i.url, password_strength: () => 'analyzing',
            vulnerability_check: i => i.query, malware_url_check: i => i.url,
            send_webhook: i => i.url, geocode: i => i.address,
            reverse_geocode: i => `${i.lat},${i.lon}`,
            distance_calculate: i => `${i.from} -> ${i.to}`,
            timezone_convert: i => `${i.from_tz} -> ${i.to_tz}`,
            arxiv_search: i => i.query, book_search: i => i.query,
            movie_search: i => i.query, lyrics_search: i => `${i.artist} - ${i.title}`,
            trivia: i => i.category || 'general', fact: i => i.category || 'random',
          };
          const labelFn = labelMap[tc.function.name];
          const label = labelFn ? labelFn(toolInput) : '';
          const notif = `\n\n[TOOL:${tc.function.name}]${label}[/TOOL]\n`;
          await stream.write(notif);
          fullText += notif;
        }

        const rawResult = await executeTool(tc.function.name, toolInput, stream.write.bind(stream), fullTextRef);
        const result = linkifyUrls(rawResult);
        fullText += fullTextRef.value;
        fullTextRef.value = '';

        if (tc.function.name !== 'create_file') {
          const resultNotif = `[RESULT]${result}[/RESULT]\n\n`;
          await stream.write(resultNotif);
          fullText += resultNotif;
        }

        toolResultMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }

      messages = [...messages, ...toolResultMessages];
    }

    return { text: fullText };
  },
});
