import { titleCase } from 'title-case';

export default {
	layout: 'note.html',
	type: 'note',
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
	},
};
