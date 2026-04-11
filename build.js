const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { marked } = require('marked')

const SRC_DIR = './src'
const DOCS_DIR = './docs'
const ARTICLES_SRC = path.join(SRC_DIR, 'articles')
const ARTICLES_DEST = path.join(DOCS_DIR, 'articles')
const TEMPLATES_DIR = path.join(SRC_DIR, 'templates')

const buildDate = new Date().toISOString()

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true })
if (!fs.existsSync(ARTICLES_DEST))
	fs.mkdirSync(ARTICLES_DEST, { recursive: true })

const defaultTemplate = fs.readFileSync(
	path.join(TEMPLATES_DIR, 'default.html'),
	'utf8'
)
const articleTemplate = fs.readFileSync(
	path.join(TEMPLATES_DIR, 'article.html'),
	'utf8'
)
const homeTemplate = fs.readFileSync(
	path.join(TEMPLATES_DIR, 'home.html'),
	'utf8'
)

// buildVersions() runs first and sets this
let siteVersion = ''

function versionTimestamp() {
	const d = new Date()
	const pad = n => String(n).padStart(2, '0')
	return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`
}

function hashFiles(filePaths) {
	const hash = crypto.createHash('sha256')
	filePaths.sort().forEach(fp => {
		hash.update(fp)
		hash.update(fs.readFileSync(fp))
	})
	return hash.digest('hex').slice(0, 8)
}

function collectFiles(dir, exts) {
	if (!fs.existsSync(dir)) return []
	return fs.readdirSync(dir)
		.filter(f => !exts || exts.some(e => f.endsWith(e)))
		.map(f => path.join(dir, f))
		.filter(fp => fs.statSync(fp).isFile())
}

function buildVersions() {
	const versionsPath = path.join(SRC_DIR, 'versions.json')
	const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'))

	// Site hash — excludes SW files, manifest, and versions.json itself
	const siteFiles = [
		...collectFiles(path.join(SRC_DIR, 'articles'), ['.md']),
		...collectFiles(path.join(SRC_DIR, 'styles')),
		...collectFiles(path.join(SRC_DIR, 'scripts')),
		...collectFiles(path.join(SRC_DIR, 'templates')),
		...collectFiles(path.join(SRC_DIR, 'icons')),
		path.join(SRC_DIR, 'about.html'),
		path.join(SRC_DIR, 'apps.html'),
	].filter(fp => fs.existsSync(fp))

	const siteHash = hashFiles(siteFiles)
	if (siteHash !== versions.site?.hash) {
		versions.site = { version: versionTimestamp(), hash: siteHash, build: buildDate }
		console.log(`✓ Site version bumped → ${versions.site.version}`)
	} else {
		console.log(`✓ Site unchanged (${versions.site.version})`)
	}

	// Per-app hashes
	const appsSrc = path.join(SRC_DIR, 'apps')
	fs.readdirSync(appsSrc)
		.filter(d => fs.statSync(path.join(appsSrc, d)).isDirectory())
		.forEach(appName => {
			const appFiles = collectFiles(path.join(appsSrc, appName))
			const appHash = hashFiles(appFiles)
			const prev = versions[appName]
			if (appHash !== prev?.hash) {
				const size = appFiles.reduce((s, fp) => s + fs.statSync(fp).size, 0)
				versions[appName] = { version: versionTimestamp(), hash: appHash, build: buildDate, size }
				console.log(`✓ App "${appName}" bumped → ${versions[appName].version}`)
			} else {
				console.log(`✓ App "${appName}" unchanged (${prev.version})`)
			}
		})

	// Write back to src (source of truth)
	fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2))

	// Write to docs output (what the SW fetches at /apps/versions.json)
	const dest = path.join(DOCS_DIR, 'apps', 'versions.json')
	if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true })
	fs.writeFileSync(dest, JSON.stringify(versions, null, 2))

	console.log(`✓ Versions written`)

	return versions
}

function extractTitleFromMarkdown(content) {
	const match = content.match(/^#\s+(.+)$/m)
	return match ? match[1] : 'Untitled'
}

function parseArticleFilename(filename) {
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

function getArticles() {
	function processFile(file) {
		const parsed = parseArticleFilename(file)
		if (!parsed) {
			console.warn(
				`Skipping ${file} - invalid filename format (expected YYYY-MM-DD-title.md)`
			)
			return
		}

		const content = fs.readFileSync(path.join(ARTICLES_SRC, file), 'utf8')
		const title = extractTitleFromMarkdown(content)
		const html = marked.parse(content)
		const outputFile = `${parsed.date}-${parsed.slug}.html`

		// Replace placeholders in article template
		let articleHtml = articleTemplate
			.replace('{{title}}', title)
			.replaceAll('{{date}}', parsed.date)
			.replace('{{content}}', html)

		// Wrap in default template
		const finalHtml = defaultTemplate
			.replace('{{title}}', title)
			.replace('{{content}}', articleHtml)
			.replace('{{build-date}}', buildDate)
			.replaceAll('{{site-version}}', siteVersion)

		fs.writeFileSync(path.join(ARTICLES_DEST, outputFile), finalHtml)

		articles.push({
			title,
			date: parsed.date,
			slug: parsed.slug,
			url: `/articles/${outputFile}`
		})
	}

	// Process articles
	const articles = []

	if (fs.existsSync(ARTICLES_SRC)) {
		const files = fs.readdirSync(ARTICLES_SRC).filter(f => f.endsWith('.md'))

		files.forEach(processFile)
	}

	// Sort articles by date (newest first)
	articles.sort((a, b) => b.date.localeCompare(a.date))

	console.log(`✓ Built ${articles.length} article(s)`)

	return articles
}

function getArticlesHtml(articles) {
	// Generate home page with article list
	const articleListHtml = articles
		.map(
			article => `
  <article class="article-preview">
    <h2><a href="${article.url}">${article.title}</a></h2>
    <time datetime="${article.date}">${article.date}</time>
  </article>
`
		)
		.join('\n')
	return articleListHtml
}

function buildHomePage(articleListHtml) {
	const homeHtml = homeTemplate.replace('{{articles}}', articleListHtml)
	const finalHomeHtml = defaultTemplate
		.replace('{{title}}', 'Home')
		.replace('{{content}}', homeHtml)
		.replace('{{build-date}}', buildDate)
		.replaceAll('{{site-version}}', siteVersion)

	fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), finalHomeHtml)

	console.log(`✓ Generated home page`)
}

function buildAboutPage() {
	// Generate about page
	const aboutContent = fs.readFileSync(path.join(SRC_DIR, 'about.html'), 'utf8')
	const finalAboutHtml = defaultTemplate
		.replace('{{title}}', 'About')
		.replace('{{content}}', aboutContent)
		.replace('{{build-date}}', buildDate)
		.replaceAll('{{site-version}}', siteVersion)
	fs.writeFileSync(path.join(DOCS_DIR, 'about.html'), finalAboutHtml)

	console.log(`✓ Generated about page`)
}

function copyFiles(source, destination) {
	if (!fs.existsSync(source)) return

	if (!fs.existsSync(destination))
		fs.mkdirSync(destination, { recursive: true })

	fs.readdirSync(source).forEach(file => {
		fs.copyFileSync(path.join(source, file), path.join(destination, file))
	})
}

function copyStyles() {
	// Copy styles
	const stylesSrc = path.join(SRC_DIR, 'styles')
	const stylesDest = path.join(DOCS_DIR, 'styles')
	copyFiles(stylesSrc, stylesDest)
}

function copyScripts() {
	const scriptsSrc = path.join(SRC_DIR, 'scripts')
	const scriptsDest = path.join(DOCS_DIR, 'scripts')
	copyFiles(scriptsSrc, scriptsDest)
}

function buildServiceWorker() {
	const files = ['serviceWorker.js', 'installServiceWorker.js']
	files.forEach(f => {
		const src = path.join(SRC_DIR, f)
		if (!fs.existsSync(src)) { console.error(`Missing: ${f}`); return }
		fs.copyFileSync(src, path.join(DOCS_DIR, f))
	})
	console.log('✓ Copied service worker')
}

function updateManifest(version) {
	const src = path.join(SRC_DIR, 'manifest.json')
	if (!fs.existsSync(src)) return
	const manifest = JSON.parse(fs.readFileSync(src, 'utf8'))
	manifest.version = version
	manifest.build = buildDate
	fs.writeFileSync(path.join(DOCS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

function copyIcons() {
	const iconsSrc = path.join(SRC_DIR, 'icons')
	const iconsDest = path.join(DOCS_DIR, 'icons')
	if (fs.existsSync(iconsSrc)) {
		if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest, { recursive: true })
		fs.readdirSync(iconsSrc).forEach(file => {
			fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDest, file))
		})
	}

	console.log(`✓ Copied static assets`)
}

function buildAppsPage() {
	// Generate apps page
	const appsContent = fs.readFileSync(path.join(SRC_DIR, 'apps.html'), 'utf8')
	const finalAppsHtml = defaultTemplate
		.replace('{{title}}', 'Apps')
		.replace('{{content}}', appsContent)
		.replace('{{build-date}}', buildDate)
		.replaceAll('{{site-version}}', siteVersion)
	fs.writeFileSync(path.join(DOCS_DIR, 'apps.html'), finalAppsHtml)

	// Copy apps directories
	const appsSrc = path.join(SRC_DIR, 'apps')
	if (!fs.existsSync(appsSrc)) {
		console.error('No apps found')
		return
	}

	const appsDest = path.join(DOCS_DIR, 'apps')
	if (!fs.existsSync(appsDest)) fs.mkdirSync(appsDest, { recursive: true })
	fs.readdirSync(appsSrc).forEach(appDir => {
		const appSrc = path.join(appsSrc, appDir)
		const appDest = path.join(appsDest, appDir)
		if (fs.statSync(appSrc).isDirectory()) {
			fs.cpSync(appSrc, appDest, { recursive: true })
		}
	})

	console.log(`✓ Copied apps`)
}

const versions = buildVersions()
siteVersion = versions.site.version

const articles = getArticles()
const articleListHtml = getArticlesHtml(articles)
buildHomePage(articleListHtml)

buildAboutPage()

copyStyles()
copyScripts()

buildServiceWorker()
updateManifest(siteVersion)

copyIcons()

buildAppsPage()

console.log(`\nBuild complete! Output in ${DOCS_DIR}/`)
