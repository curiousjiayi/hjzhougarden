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
			const noteContent = data.page.rawInput;

			return data.preview || noteContent.slice(0, 240);
		},
	},
};
