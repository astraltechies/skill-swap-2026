/**
 * The starting skill catalogue. Kept separate from the seed runner so the
 * admin portal and tests can import it without pulling in firebase-admin.
 */

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  featured: boolean;
  skills: { slug: string; name: string; description: string; tags: string[] }[];
}

export const CATALOGUE: SeedCategory[] = [
  {
    slug: "code-and-tech",
    name: "Code & Tech",
    description:
      "Programming, websites and the things you can build with a laptop and an afternoon.",
    emoji: "💻",
    featured: true,
    skills: [
      {
        slug: "python",
        name: "Python",
        description: "Variables, loops and your first real programs.",
        tags: ["programming", "beginner friendly"],
      },
      {
        slug: "web-development",
        name: "Web Development",
        description: "HTML, CSS and JavaScript — build a page people can visit.",
        tags: ["programming", "html", "css"],
      },
      {
        slug: "app-building",
        name: "App Building",
        description: "Turn an idea into something that runs on a phone.",
        tags: ["programming", "mobile"],
      },
      {
        slug: "ai-basics",
        name: "AI Basics",
        description: "What machine learning actually is, without the hype.",
        tags: ["ai", "concepts"],
      },
      {
        slug: "scratch",
        name: "Scratch",
        description: "Block-based coding — the fastest way to make a game.",
        tags: ["programming", "games"],
      },
    ],
  },
  {
    slug: "music",
    name: "Music",
    description: "Instruments, voice and making tracks of your own.",
    emoji: "🎸",
    featured: true,
    skills: [
      {
        slug: "guitar",
        name: "Guitar",
        description: "Chords, strumming patterns and your first full song.",
        tags: ["instrument", "strings"],
      },
      {
        slug: "keyboard",
        name: "Keyboard",
        description: "Scales, both hands together, and reading a sheet.",
        tags: ["instrument", "piano"],
      },
      {
        slug: "singing",
        name: "Singing",
        description: "Breath control, pitch and singing without straining.",
        tags: ["voice"],
      },
      {
        slug: "tabla",
        name: "Tabla",
        description: "Bols, taals and keeping time cleanly.",
        tags: ["instrument", "percussion", "classical"],
      },
      {
        slug: "music-production",
        name: "Music Production",
        description: "Recording, layering and mixing a track on a laptop.",
        tags: ["production", "digital"],
      },
    ],
  },
  {
    slug: "art-and-design",
    name: "Art & Design",
    description: "Drawing by hand, drawing on screen, and making things look right.",
    emoji: "🎨",
    featured: true,
    skills: [
      {
        slug: "sketching",
        name: "Sketching",
        description: "Proportion, shading and drawing what you actually see.",
        tags: ["drawing", "pencil"],
      },
      {
        slug: "digital-art",
        name: "Digital Art",
        description: "Layers, brushes and colour on a tablet or phone.",
        tags: ["drawing", "digital"],
      },
      {
        slug: "photography",
        name: "Photography",
        description: "Framing, light and getting a sharp shot on a phone.",
        tags: ["visual", "camera"],
      },
      {
        slug: "graphic-design",
        name: "Graphic Design",
        description: "Posters, layout and why some designs just read better.",
        tags: ["visual", "layout"],
      },
    ],
  },
  {
    slug: "academics",
    name: "Academics",
    description: "The subjects from school, explained by someone who just sat the same paper.",
    emoji: "📐",
    featured: true,
    skills: [
      {
        slug: "mathematics",
        name: "Mathematics",
        description: "Algebra, trigonometry and calculus, worked through slowly.",
        tags: ["school", "maths"],
      },
      {
        slug: "physics",
        name: "Physics",
        description: "Motion, electricity and optics — the intuition, not just formulas.",
        tags: ["school", "science"],
      },
      {
        slug: "chemistry",
        name: "Chemistry",
        description: "Bonding, reactions and organic mechanisms.",
        tags: ["school", "science"],
      },
      {
        slug: "biology",
        name: "Biology",
        description: "Cells, genetics and human physiology.",
        tags: ["school", "science"],
      },
      {
        slug: "economics",
        name: "Economics",
        description: "Demand, supply and why prices move.",
        tags: ["school", "commerce"],
      },
    ],
  },
  {
    slug: "languages",
    name: "Languages",
    description: "Speaking and writing more confidently, in more than one language.",
    emoji: "🗣️",
    featured: true,
    skills: [
      {
        slug: "english-speaking",
        name: "English Speaking",
        description: "Fluency, pronunciation and speaking without freezing.",
        tags: ["language", "speaking"],
      },
      {
        slug: "hindi-writing",
        name: "Hindi Writing",
        description: "Grammar, essays and clean handwriting.",
        tags: ["language", "writing"],
      },
      {
        slug: "sanskrit",
        name: "Sanskrit",
        description: "Shlokas, sandhi and translation.",
        tags: ["language", "classical"],
      },
      {
        slug: "french",
        name: "French",
        description: "Everyday vocabulary and getting the accent close.",
        tags: ["language", "foreign"],
      },
      {
        slug: "japanese",
        name: "Japanese",
        description: "Hiragana, katakana and beginner conversation.",
        tags: ["language", "foreign"],
      },
    ],
  },
  {
    slug: "life-skills",
    name: "Life Skills",
    description: "The things that are not on the syllabus but decide how the year goes.",
    emoji: "🧭",
    featured: true,
    skills: [
      {
        slug: "public-speaking",
        name: "Public Speaking",
        description: "Structure, nerves and holding a room.",
        tags: ["communication", "confidence"],
      },
      {
        slug: "chess",
        name: "Chess",
        description: "Openings, tactics and thinking a move ahead.",
        tags: ["strategy", "games"],
      },
      {
        slug: "study-skills",
        name: "Study Skills",
        description: "Notes, revision timetables and actually remembering things.",
        tags: ["school", "productivity"],
      },
      {
        slug: "financial-literacy",
        name: "Financial Literacy",
        description: "Budgeting, saving and how interest really works.",
        tags: ["money", "practical"],
      },
      {
        slug: "cooking",
        name: "Cooking",
        description: "Three meals you can make properly, start to finish.",
        tags: ["practical", "food"],
      },
    ],
  },
  {
    slug: "movement",
    name: "Sports & Movement",
    description: "Technique you can practise between classes.",
    emoji: "⚽",
    featured: false,
    skills: [
      {
        slug: "football",
        name: "Football",
        description: "First touch, passing and positioning.",
        tags: ["sport", "team"],
      },
      {
        slug: "cricket",
        name: "Cricket",
        description: "Batting stance, bowling action and field awareness.",
        tags: ["sport", "team"],
      },
      {
        slug: "yoga",
        name: "Yoga",
        description: "Asanas, breathing and a routine you'll keep up.",
        tags: ["fitness", "wellbeing"],
      },
      {
        slug: "dance",
        name: "Dance",
        description: "Choreography and moving on the beat.",
        tags: ["performance", "fitness"],
      },
    ],
  },
];
