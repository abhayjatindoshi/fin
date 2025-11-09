import fs from 'fs';

const categories = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
const tags = [];

const flat = [...categories.INCOMING, ...categories.OUTGOING];

for (const category of flat) {
    const tag = {
        name: category.name,
        icon: '',
        description: category.subtext,
    }
    tags.push(tag);

    for (const icon of category.icons) {

        const subtag = {
            name: icon.display_name,
            icon: icon.name,
            parent: category.name,
        }
        tags.push(subtag);
    }
}

fs.writeFileSync('tags.json', JSON.stringify(tags, null, 2), 'utf8');