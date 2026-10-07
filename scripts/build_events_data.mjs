import fs from 'fs';
import path from 'path';

// Load existing lore.json to preserve houses, gods, glossary, factions, cults
const lorePath = path.resolve('data/lore.json');
const loreData = JSON.parse(fs.readFileSync(lorePath, 'utf8'));

console.log("Lore keys:", Object.keys(loreData));
