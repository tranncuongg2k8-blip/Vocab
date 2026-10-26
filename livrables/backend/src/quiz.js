import { randomInt } from 'node:crypto';

function shuffled(items, drawInt) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = drawInt(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

const meaningOf = (card) => card.meaning ?? card.back;

export function createQuiz(setCards, allCards, count, drawInt = randomInt) {
  const meanings = [...new Set(setCards.map(meaningOf))];
  // Small sets can borrow distractors from other sets without borrowing questions.
  if (meanings.length < 4 && setCards.length > 0) {
    meanings.push(...new Set(allCards.map(meaningOf).filter((meaning) => !meanings.includes(meaning))));
  }
  if (count > 0 && setCards.length > 0 && meanings.length < 4) {
    throw new Error('Quiz data must contain at least four distinct meanings');
  }

  return shuffled(setCards, drawInt).slice(0, count).map((card) => {
    const answer = meaningOf(card);
    const distractors = shuffled(meanings.filter((meaning) => meaning !== answer), drawInt).slice(0, 3);
    const options = shuffled([answer, ...distractors], drawInt);
    return { cardId: card.id, prompt: card.front, options, answerIndex: options.indexOf(answer) };
  });
}
