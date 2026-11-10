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

	// Dates. Front matter like `date: 2026-11-09` is parsed as midnight UTC,
	// so both filters format in UTC to avoid showing the previous day in
	// western time zones.
	const toDate = value => (value instanceof Date ? value : new Date(value));
	eleventyConfig.addFilter('readableDate', value =>
		new Intl.DateTimeFormat('en-GB', {
			day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
		}).format(toDate(value))
	);
	eleventyConfig.addFilter('htmlDateString', value =>
		toDate(value).toISOString().slice(0, 10)
	);

	eleventyConfig.setLibrary('md', md);

	// Add id attributes to headings so sections can be deep-linked.
	eleventyConfig.addPlugin(IdAttributePlugin);

	// Every template under src/notes/. Used by notes.11tydata.js to compute
	// backlinks.
	eleventyConfig.addCollection('notes', collection =>
		collection.getAll().filter(item => item.filePathStem.startsWith('/notes/'))
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
