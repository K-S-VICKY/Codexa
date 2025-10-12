export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "If you don’t like your destiny, don’t accept it. Instead, have the courage to change it the way you want it to be!", author: "Naruto Uzumaki" },
  { text: "Those who forgive themselves, and are able to accept their true nature… They are the strong ones!", author: "Itachi Uchiha" },
  { text: "Those who do not understand true pain can never understand true peace.", author: "Pain (Nagato)" },
  { text: "In this world, those who break the rules are scum… but those who abandon their friends are worse than scum.", author: "Kakashi Hatake" },
  { text: "I’m no one. I don’t want to be anyone.", author: "Obito Uchiha" },
  { text: "When people get hurt, they learn to hate… When people hurt others, they become hated and racked with guilt. But knowing that pain allows people to be kind.", author: "Jiraiya" },
  { text: "When I watch you, I feel strong, like I can do anything — even if I fail, I’ll keep trying.", author: "Hinata Hyuga" },
  { text: "A dropout will beat a genius through hard work!", author: "Rock Lee" },
  { text: "I fight for my sake only, love only myself, and fight only for myself.", author: "Gaara" },
  { text: "Wake up to reality! Nothing ever goes as planned in this accursed world.", author: "Madara Uchiha" }
];

export function getRandomQuoteIndex(maxExclusive: number, exclude?: number): number {
  if (maxExclusive <= 1) return 0;
  let idx = Math.floor(Math.random() * maxExclusive);
  if (exclude !== undefined && idx === exclude) {
    idx = (idx + 1) % maxExclusive;
  }
  return idx;
}



