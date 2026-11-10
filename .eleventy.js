import { IdAttributePlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import mdAttrs from 'markdown-it-attrs';
import mdFootnote from 'markdown-it-footnote';

import backlinksPlugin from 'eleventy-plugin-backlinks';

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

	eleventyConfig.addFilter('markdownify', string => {
		return md.render(string);
	});

	eleventyConfig.addFilter('encodeURI', string => encodeURI(string));

	eleventyConfig.setLibrary('md', md);

	// Add id attributes to headings so sections can be deep-linked.
	eleventyConfig.addPlugin(IdAttributePlugin);

	eleventyConfig.addPlugin(backlinksPlugin, {
		getData: (note) => ({
			url: note.url,
			title: note.data.title,
			preview: note.data.preview,
		}),
	});

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
