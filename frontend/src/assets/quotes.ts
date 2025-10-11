export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "If you can’t measure it, you can’t improve it.", author: "Peter Drucker" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Whether you think you can or you think you can’t, you’re right.", author: "Henry Ford" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" }
];

export function getRandomQuoteIndex(maxExclusive: number, exclude?: number): number {
  if (maxExclusive <= 1) return 0;
  let idx = Math.floor(Math.random() * maxExclusive);
  if (exclude !== undefined && idx === exclude) {
    idx = (idx + 1) % maxExclusive;
  }
  return idx;
}


