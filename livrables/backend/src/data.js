import { additionalCards } from './additional-cards.js';

const vocabulary = [
  ['achieve', 'đạt được', '/əˈtʃiːv/', 'You can achieve your goals with regular practice.'],
  ['benefit', 'lợi ích', '/ˈbenɪfɪt/', 'Exercise has many benefits for your health.'],
  ['challenge', 'thử thách', '/ˈtʃælɪndʒ/', 'Learning a new language is an exciting challenge.'],
  ['develop', 'phát triển', '/dɪˈveləp/', 'Reading helps you develop your vocabulary.'],
  ['environment', 'môi trường', '/ɪnˈvaɪrənmənt/', 'We should protect the environment.'],
  ['improve', 'cải thiện', '/ɪmˈpruːv/', 'Daily practice will improve your English.'],
  ['knowledge', 'kiến thức', '/ˈnɒlɪdʒ/', 'Books are a valuable source of knowledge.'],
  ['opportunity', 'cơ hội', '/ˌɒpəˈtjuːnəti/', 'This course is an opportunity to learn new skills.'],
  ['confident', 'tự tin', '/ˈkɒnfɪdənt/', 'She feels confident when speaking English.'],
  ['responsible', 'có trách nhiệm', '/rɪˈspɒnsəbl/', 'Everyone is responsible for keeping the classroom clean.'],
];

const cardDetails = {
  achieve: { exampleVi: 'Bạn có thể đạt được mục tiêu bằng cách luyện tập thường xuyên.', synonyms: ['accomplish', 'attain'], antonyms: ['fail'], wordType: 'Động từ' },
  benefit: { exampleVi: 'Tập thể dục mang lại nhiều lợi ích cho sức khỏe của bạn.', synonyms: ['advantage', 'gain'], antonyms: ['drawback', 'disadvantage'], wordType: 'Danh từ' },
  challenge: { exampleVi: 'Học một ngôn ngữ mới là một thử thách thú vị.', synonyms: ['difficulty', 'test'], antonyms: [], wordType: 'Danh từ' },
  develop: { exampleVi: 'Đọc sách giúp bạn phát triển vốn từ vựng.', synonyms: ['expand', 'build'], antonyms: ['diminish'], wordType: 'Động từ' },
  environment: { exampleVi: 'Chúng ta nên bảo vệ môi trường.', synonyms: ['surroundings'], antonyms: [], wordType: 'Danh từ' },
  improve: { exampleVi: 'Luyện tập hằng ngày sẽ cải thiện tiếng Anh của bạn.', synonyms: ['enhance', 'better'], antonyms: ['worsen'], wordType: 'Động từ' },
  knowledge: { exampleVi: 'Sách là một nguồn kiến thức quý giá.', synonyms: ['understanding', 'awareness'], antonyms: ['ignorance'], wordType: 'Danh từ' },
  opportunity: { exampleVi: 'Khóa học này là một cơ hội để học các kỹ năng mới.', synonyms: ['chance', 'opening'], antonyms: [], wordType: 'Danh từ' },
  confident: { exampleVi: 'Cô ấy cảm thấy tự tin khi nói tiếng Anh.', synonyms: ['self-assured', 'certain'], antonyms: ['insecure', 'uncertain'], wordType: 'Tính từ' },
  responsible: { exampleVi: 'Mọi người đều có trách nhiệm giữ lớp học sạch sẽ.', synonyms: ['accountable', 'answerable'], antonyms: ['irresponsible'], wordType: 'Tính từ' },
};

const everydayCards = vocabulary.map(([front, back, phonetic, example], index) => ({
  id: String(index + 1),
  setId: '1',
  front,
  back,
  phonetic,
  example,
  audioUrl: null,
  meaning: back,
  ...cardDetails[front],
}));

export const cards = [...everydayCards, ...additionalCards];

export const sets = [{
  id: '1',
  title: 'Everyday English',
  description: '10 từ vựng tiếng Anh thông dụng cho người học Việt Nam.',
}, {
  id: '2',
  title: 'Travel & Transport',
  description: '10 từ vựng tiếng Anh về du lịch và giao thông.',
}, {
  id: '3',
  title: 'Study & Work',
  description: '10 từ vựng tiếng Anh về học tập và công việc.',
}].map((set) => ({
  ...set,
  cardCount: cards.filter((card) => card.setId === set.id).length,
  language: 'en-vi',
}));
