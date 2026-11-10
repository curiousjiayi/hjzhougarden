import { readFileSync } from 'node:fs';
import { IdAttributePlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import mdAttrs from 'markdown-it-attrs';
import mdFootnote from 'markdown-it-footnote';


export default function(eleventyConfig) {
	const markdownItOptions = {
		html: true,
		linkify: true,
	};

	const md = markdownIt(markdownItOptions)
		.use(mdFootnote)
		.use(mdAttrs)
		.use(function(md) {
			// Recognize Mediawiki links: [[note]], [[note|label]],
			// [[note#section]], [[note#section|label]], and [[#section]]
			// for a heading on the current page. Section fragments are
			// slugified the same way IdAttributePlugin slugifies headings.
			md.linkify.add('[[', {
				validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
				normalize: match => {
					const slugify = eleventyConfig.getFilter('slugify');
					const [target, label] = match.raw.slice(2, -2).split('|');
					const [notePart, ...sectionParts] = target.split('#');
					const note = notePart.replace(/.(md|markdown)\s?$/i, '').trim();
					const section = sectionParts.join('#').trim();
					const fragment = section ? `#${slugify(section)}` : '';

					match.text = (label || [note, section].filter(Boolean).join(' › ')).trim();
					match.url = note ? `/notes/${note}/${fragment}` : fragment;
				},
			});
		});

	// Open links that leave the site in a new tab. Same test as the CSS that
	// colors external links, so the two stay in sync.
	const defaultLinkOpen = md.renderer.rules.link_open
		|| ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
	md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
		const href = tokens[idx].attrGet('href') || '';
		if (/^(https?:)?\/\//i.test(href)) {
			tokens[idx].attrSet('target', '_blank');
			tokens[idx].attrSet('rel', 'noopener');
		}
		return defaultLinkOpen(tokens, idx, options, env, self);
	};

	eleventyConfig.addFilter('markdownify', string => {
		return md.render(string);
	});

	eleventyConfig.addFilter('encodeURI', string => encodeURI(string));

	// Dates. Two kinds reach these filters:
	// - front matter like `date: 2026-11-09`, parsed as midnight UTC, which
	//   must be formatted in UTC or it shows as the previous day out west;
	// - real timestamps (git Created, file times), which should be shown in
	//   the site's own timezone so an evening commit keeps its local date.
	// A value at exactly 00:00:00 UTC is treated as the former.
	const site = JSON.parse(readFileSync('./src/_data/site.json', 'utf8'));
	const toDate = value => (value instanceof Date ? value : new Date(value));
	const zoneFor = date =>
		(date.getUTCHours() | date.getUTCMinutes() | date.getUTCSeconds()) === 0 ? 'UTC' : site.timezone;
	const ymd = date => new Intl.DateTimeFormat('en-CA', {
		year: 'numeric', month: '2-digit', day: '2-digit', timeZone: zoneFor(date),
	}).format(date);
	eleventyConfig.addFilter('readableDate', value => {
		const date = toDate(value);
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric', month: 'long', year: 'numeric', timeZone: zoneFor(date),
		}).format(date);
	});
	eleventyConfig.addFilter('htmlDateString', value => ymd(toDate(value)));

	eleventyConfig.setLibrary('md', md);

	// Add id attributes to headings so sections can be deep-linked.
	eleventyConfig.addPlugin(IdAttributePlugin);

	// Every template under src/notes/. Used by notes.11tydata.js to compute
	// backlinks.
	eleventyConfig.addCollection('notes', collection =>
		collection.getAll().filter(item => item.filePathStem.startsWith('/notes/'))
	);

	// Notes newest first, excluding the notes index page. Ties (notes added
	// in the same commit) fall back to title order.
	eleventyConfig.addCollection('notesByDate', collection =>
		collection
			.getAll()
			.filter(item => item.filePathStem.startsWith('/notes/') && item.url !== '/notes/')
			.sort((a, b) => (b.date - a.date) || String(a.data.title).localeCompare(String(b.data.title)))
	);

	// Drafts: any template with `draft: true` in its front matter is shown
	// during `--serve`/`--watch` but skipped entirely in a full build.
	eleventyConfig.addPreprocessor('drafts', '*', (data) => {
		if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
			return false;
		}
	});

	eleventyConfig.addPassthroughCopy('src/assets');
	eleventyConfig.setUseGitIgnore(false);

	return {
		dir: {
			input: 'src',
			output: '_site',
			layouts: 'layouts',
			includes: 'includes',
			data: '_data',
		},
		passthroughFileCopy: true,
	};
}
