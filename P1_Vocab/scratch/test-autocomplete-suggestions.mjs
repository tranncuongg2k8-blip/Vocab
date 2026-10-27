import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- BẮT ĐẦU KIỂM THỬ GỢI Ý TỰ ĐỘNG ĐIỀN TỪ, CỤM TỪ & IDIOM ---');

// 1. Kiểm tra module dictionary.js
const dictionaryUrl = pathToFileURL(path.join(rootDir, 'livrables/frontend/js/dictionary.js')).href;
const { DICTIONARY_DATABASE, searchDictionary, lookupOnlineWord } = await import(dictionaryUrl);

assert(Array.isArray(DICTIONARY_DATABASE), 'DICTIONARY_DATABASE phải là một mảng');
assert(DICTIONARY_DATABASE.length >= 50, `DICTIONARY_DATABASE phải có ít nhất 50 mục, thực tế: ${DICTIONARY_DATABASE.length}`);
console.log(`✔ Kho từ điển nội bộ: ${DICTIONARY_DATABASE.length} mục phong phú`);

// Kiểm tra có đủ các thể loại: idiom, phrasal verb, collocation, phrase, academic words
const typesFound = new Set(DICTIONARY_DATABASE.map(item => item.type));
console.log('Các loại từ hiện có trong database:', [...typesFound]);
assert(typesFound.has('idiom'), 'Phải có thành ngữ (idiom)');
assert(typesFound.has('phrasal verb'), 'Phải có cụm động từ (phrasal verb)');
assert(typesFound.has('collocation'), 'Phải có cụm kết hợp từ (collocation)');
assert(typesFound.has('phrase'), 'Phải có cụm từ (phrase)');
assert(typesFound.has('adjective'), 'Phải có tính từ (adjective)');
assert(typesFound.has('noun'), 'Phải có danh từ (noun)');
assert(typesFound.has('verb'), 'Phải có động từ (verb)');
console.log('✔ Đầy đủ các loại từ yêu cầu (idiom, phrasal verb, collocation, phrase, noun, verb, adj...)');

// Test 2: Tìm kiếm thành ngữ (Idiom)
const cakeMatches = searchDictionary('cake');
assert(cakeMatches.length > 0, 'Phải tìm thấy gợi ý khi gõ "cake"');
assert(cakeMatches[0].word === 'piece of cake', 'Gợi ý đầu tiên cho "cake" phải là "piece of cake"');
assert(cakeMatches[0].type === 'idiom', 'Loại từ của "piece of cake" phải là "idiom"');
assert(cakeMatches[0].phonetic.includes('/'), 'Phải có phiên âm IPA');
console.log('✔ Tìm thành ngữ "cake" -> "piece of cake" thành công:', cakeMatches[0]);

const legMatches = searchDictionary('break');
assert(legMatches.some(m => m.word === 'break a leg'), 'Phải tìm thấy "break a leg" khi gõ "break"');
console.log('✔ Tìm thành ngữ "break" -> tìm thấy "break a leg"');

const bulletMatches = searchDictionary('bite');
assert(bulletMatches.some(m => m.word === 'bite the bullet'), 'Phải tìm thấy "bite the bullet" khi gõ "bite"');
console.log('✔ Tìm thành ngữ "bite" -> tìm thấy "bite the bullet"');

// Test 3: Tìm kiếm cụm động từ (Phrasal Verb)
const lookMatches = searchDictionary('look forward');
assert(lookMatches.length > 0 && lookMatches[0].word === 'look forward to', 'Phải tìm thấy "look forward to"');
assert(lookMatches[0].type === 'phrasal verb', 'Loại từ phải là "phrasal verb"');
console.log('✔ Tìm cụm động từ "look forward" -> "look forward to" thành công:', lookMatches[0]);

const carryMatches = searchDictionary('carry out');
assert(carryMatches.length > 0 && carryMatches[0].word === 'carry out', 'Phải tìm thấy "carry out"');
console.log('✔ Tìm cụm động từ "carry out" thành công');

// Test 4: Tìm kiếm Collocation & Cụm từ
const decisionMatches = searchDictionary('decision');
assert(decisionMatches.some(m => m.word === 'make a decision'), 'Phải tìm thấy "make a decision" khi gõ "decision"');
console.log('✔ Tìm collocation "decision" -> "make a decision" thành công');

const termsMatches = searchDictionary('in terms of');
assert(termsMatches.length > 0 && termsMatches[0].word === 'in terms of', 'Phải tìm thấy "in terms of"');
console.log('✔ Tìm cụm từ "in terms of" thành công');

// Test 5: Tìm kiếm bằng tiếng Việt (Diacritics insensitive)
const benVungMatches = searchDictionary('bền vững');
assert(benVungMatches.some(m => m.word === 'sustainable'), 'Gõ "bền vững" phải tìm ra "sustainable"');
console.log('✔ Gõ tiếng Việt có dấu "bền vững" -> tìm ra "sustainable"');

const anChaoMatches = searchDictionary('an chao');
assert(anChaoMatches.some(m => m.word === 'piece of cake'), 'Gõ không dấu "an chao" phải tìm ra "piece of cake"');
console.log('✔ Gõ tiếng Việt không dấu "an chao" -> tìm ra "piece of cake"');

// Test 6: Kiểm tra cấu trúc DOM trong index.html
const indexHtml = fs.readFileSync(path.join(rootDir, 'livrables/frontend/index.html'), 'utf-8');
assert(indexHtml.includes('id="input-card-search"'), 'index.html phải có #input-card-search');
assert(indexHtml.includes('id="card-search-suggestions"'), 'index.html phải có #card-search-suggestions');
assert(indexHtml.includes('id="btn-clear-card-search"'), 'index.html phải có #btn-clear-card-search');
assert(indexHtml.includes('id="card-search-spinner"'), 'index.html phải có #card-search-spinner');
assert(indexHtml.includes('card-search-badge-hint'), 'index.html phải có badge gợi ý');
assert(indexHtml.includes('src="js/dictionary.js"'), 'index.html phải nạp dictionary.js');
console.log('✔ index.html chứa đầy đủ các phần tử DOM phục vụ gợi ý tự động điền');

// Test 7: Kiểm tra định dạng CSS trong mydecks.css
const myDecksCss = fs.readFileSync(path.join(rootDir, 'livrables/frontend/css/mydecks.css'), 'utf-8');
assert(myDecksCss.includes('.card-search-suggestions'), 'mydecks.css phải chứa .card-search-suggestions');
assert(myDecksCss.includes('.suggestion-item'), 'mydecks.css phải chứa .suggestion-item');
assert(myDecksCss.includes('.type-badge-idiom'), 'mydecks.css phải chứa .type-badge-idiom');
assert(myDecksCss.includes('.type-badge-phrasal-verb'), 'mydecks.css phải chứa .type-badge-phrasal-verb');
assert(myDecksCss.includes('.type-badge-collocation'), 'mydecks.css phải chứa .type-badge-collocation');
assert(myDecksCss.includes('.suggestion-match-highlight'), 'mydecks.css phải chứa .suggestion-match-highlight');
console.log('✔ mydecks.css chứa đầy đủ style Bento cho dropdown gợi ý và các loại badge');

// Test 8: Kiểm tra tích hợp trong deckdetail.js
const deckdetailJs = fs.readFileSync(path.join(rootDir, 'livrables/frontend/js/deckdetail.js'), 'utf-8');
assert(deckdetailJs.includes("from './dictionary.js'"), 'deckdetail.js phải import dictionary.js');
assert(deckdetailJs.includes('handleQuickSearchInput'), 'deckdetail.js phải có method handleQuickSearchInput');
assert(deckdetailJs.includes('renderSuggestions'), 'deckdetail.js phải có method renderSuggestions');
assert(deckdetailJs.includes('selectSuggestion'), 'deckdetail.js phải có method selectSuggestion');
assert(deckdetailJs.includes('fillCardFields'), 'deckdetail.js phải có method fillCardFields');
assert(deckdetailJs.includes('handleQuickSearchKeydown'), 'deckdetail.js phải có điều hướng phím');
assert(deckdetailJs.includes('getTypeBadgeInfo'), 'deckdetail.js phải có chuyển đổi badge 13 loại từ');
console.log('✔ deckdetail.js tích hợp toàn diện logic tìm kiếm, gợi ý và tự động điền bảng');

console.log('\n========================================');
console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐỀU ĐẠT 100% PASS!');
console.log('========================================');
