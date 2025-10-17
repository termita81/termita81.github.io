const fs = require('fs')
const path = require('path')
const { marked } = require('marked')

const SRC_DIR = './src'
const DOCS_DIR = './docs'
const ARTICLES_SRC = path.join(SRC_DIR, 'articles')
const ARTICLES_DEST = path.join(DOCS_DIR, 'articles')
const TEMPLATES_DIR = path.join(SRC_DIR, 'templates')

// Ensure output directories exist
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true })
if (!fs.existsSync(ARTICLES_DEST)) fs.mkdirSync(ARTICLES_DEST, { recursive: true })

// Read templates
const defaultTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'default.html'), 'utf8')
const articleTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'article.html'), 'utf8')
const homeTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'home.html'), 'utf8')

// Helper function to extract title from markdown
function extractTitle(content) {
	const match = content.match(/^#\s+(.+)$/m)
	return match ? match[1] : 'Untitled'
}

// Helper function to parse article filename
function parseFilename(filename) {
	const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
	if (match) {
		return {
			date: match[1],
			slug: match[2],
			filename: filename
		}
	}
	return null
}

// Process articles
const articles = []
if (fs.existsSync(ARTICLES_SRC)) {
	const files = fs.readdirSync(ARTICLES_SRC).filter(f => f.endsWith('.md'))

	files.forEach(file => {
		const parsed = parseFilename(file)
		if (!parsed) {
			console.warn(`Skipping ${file} - invalid filename format (expected YYYY-MM-DD-title.md)`)
			return
		}

		const content = fs.readFileSync(path.join(ARTICLES_SRC, file), 'utf8')
		const title = extractTitle(content)
		const html = marked.parse(content)
		const outputFile = `${parsed.date}-${parsed.slug}.html`

		// Replace placeholders in article template
		let articleHtml = articleTemplate
			.replace('{{title}}', title)
			.replaceAll('{{date}}', parsed.date) // multiple occurrences
			.replace('{{content}}', html)

		// Wrap in default template
		const finalHtml = defaultTemplate
			.replace('{{title}}', title)
			.replace('{{content}}', articleHtml)

		fs.writeFileSync(path.join(ARTICLES_DEST, outputFile), finalHtml)

		articles.push({
			title,
			date: parsed.date,
			slug: parsed.slug,
			url: `/articles/${outputFile}`
		})
	})
}

// Sort articles by date (newest first)
articles.sort((a, b) => b.date.localeCompare(a.date))

// Generate home page with article list
let articleListHtml = articles.map(article => `
  <article class="article-preview">
    <h2><a href="${article.url}">${article.title}</a></h2>
    <time datetime="${article.date}">${article.date}</time>
  </article>
`).join('\n')

let homeHtml = homeTemplate.replace('{{articles}}', articleListHtml)
const finalHomeHtml = defaultTemplate
	.replace('{{title}}', 'Home')
	.replace('{{content}}', homeHtml)

fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), finalHomeHtml)

// Generate about page
const aboutContent = fs.readFileSync(path.join(SRC_DIR, 'about.html'), 'utf8')
const finalAboutHtml = defaultTemplate
	.replace('{{title}}', 'About')
	.replace('{{content}}', aboutContent)
	.replace('{{build-date}}', `${new Date().toISOString()}`)
fs.writeFileSync(path.join(DOCS_DIR, 'about.html'), finalAboutHtml)

// Copy styles
const stylesSrc = path.join(SRC_DIR, 'styles')
const stylesDest = path.join(DOCS_DIR, 'styles')
if (fs.existsSync(stylesSrc)) {
	if (!fs.existsSync(stylesDest)) fs.mkdirSync(stylesDest, { recursive: true })
	fs.readdirSync(stylesSrc).forEach(file => {
		fs.copyFileSync(
			path.join(stylesSrc, file),
			path.join(stylesDest, file)
		)
	})
}

// Copy scripts
const scriptsSrc = path.join(SRC_DIR, 'scripts')
const scriptsDest = path.join(DOCS_DIR, 'scripts')
if (fs.existsSync(scriptsSrc)) {
	if (!fs.existsSync(scriptsDest)) fs.mkdirSync(scriptsDest, { recursive: true })
	fs.readdirSync(scriptsSrc).forEach(file => {
		fs.copyFileSync(
			path.join(scriptsSrc, file),
			path.join(scriptsDest, file)
		)
	})
}

// Copy PWA files
const manifestSrc = path.join(SRC_DIR, 'manifest.json')
if (fs.existsSync(manifestSrc)) {
	fs.copyFileSync(manifestSrc, path.join(DOCS_DIR, 'manifest.json'))
}

const serviceWorkerSrc = path.join(SRC_DIR, 'service-worker.js')
if (fs.existsSync(serviceWorkerSrc)) {
	fs.copyFileSync(serviceWorkerSrc, path.join(DOCS_DIR, 'service-worker.js'))
}

const iconsSrc = path.join(SRC_DIR, 'icons')
const iconsDest = path.join(DOCS_DIR, 'icons')
if (fs.existsSync(iconsSrc)) {
	if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest, { recursive: true })
	fs.readdirSync(iconsSrc).forEach(file => {
		fs.copyFileSync(
			path.join(iconsSrc, file),
			path.join(iconsDest, file)
		)
	})
}

console.log(`✓ Built ${articles.length} article(s)`)
console.log(`✓ Generated home page`)
console.log(`✓ Generated about page`)
console.log(`✓ Copied static assets`)
console.log(`✓ Copied PWA files`)
console.log(`\nBuild complete! Output in ${DOCS_DIR}/`)
