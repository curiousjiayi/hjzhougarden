import { titleCase } from 'title-case';

// Matches [[target]], [[target|label]], [[target#section]], etc.
const wikilinkRegExp = /\[\[\s*([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s*\]\]/g;

// Note file stems that a chunk of markdown links to. Labels and #section
// fragments are dropped so [[food#Food|label]] counts as a link to "food".
function wikilinkTargets(markdown) {
	return (markdown.match(wikilinkRegExp) || [])
		.map(link =>
			link
				.slice(2, -2)
				.split('|')[0]
				.split('#')[0]
				.replace(/\.(md|markdown)\s*$/i, '')
				.trim()
		)
		.filter(Boolean);
}

function sameNote(a, b) {
	return a.normalize().toLowerCase() === b.normalize().toLowerCase();
}

export default {
	layout: 'note.html',
	type: 'note',
	// A note's date defaults to its first git commit. Front matter `date`
	// (e.g. on essays) overrides this. Requires full git history at build
	// time; uncommitted files fall back to the file's creation time.
	date: 'git Created',
	eleventyComputed: {
		title: (data) => {
			const title = titleCase(data.title || data.page.fileSlug);

			return data.draft ? `${title} (draft)` : title;
		},
		preview: (data) => {
			// Backlink previews are rendered inside another page, so strip
			// anything that would produce an id and collide with that page's
			// own ids (IdAttributePlugin errors on duplicates):
			// - the leading title heading (the backlink already shows the title)
			// - footnote definitions and references
			const noteContent = data.page.rawInput
				.replace(/^\s*#[^\n]*\n/, '')
				.replace(/^\[\^[^\]]+\]:[^\n]*\n?/gm, '')
				.replace(/\[\^[^\]]+\]/g, '');

			return data.preview || noteContent.slice(0, 240);
		},
		// Other notes that wiki-link to this one.
		backlinks: (data) => {
			const stem = data.page.filePathStem.replace('/notes/', '');

			return (data.collections.notes || [])
				.filter(other =>
					other.inputPath !== data.page.inputPath
					&& wikilinkTargets(other.rawInput).some(target => sameNote(target, stem))
				)
				.map(other => ({
					url: other.url,
					title: other.data.title,
					preview: other.data.preview,
				}));
		},
	},
};
