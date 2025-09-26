import sosial from '../public/logo/3430534.png'
import msg from '../public/logo/3841975.png'
import medical from '../public/logo/564276.png'
import animal from '../public/logo/5930063.png'
import pc from '../public/logo/6803322.png'
import sport from '../public/logo/7438654.png'
import mems from '../public/logo/8073599.png'
import film from '../public/logo/906352.png'
import Aesthetic from '../public/logo/Aesthetic-Artwork-PNG-Picture.png'
import anime from '../public/logo/Screenshot 2025-09-24 140638_pixian_ai - Copy.png'
import musik from '../public/logo/png-clipart-computer-icons-apple-music-apple-text-rectangle-thumbnail_pixian_ai.png'
import gaming from '../public/logo/st,small,507x507-pad,600x600,f8f8f8 (4)_pixian_ai (5).png'
import all from '../public/logo/Screenshot 2025-09-24 144245_pixian_ai.png'

export const categoryData = [
  {
    name: "All",
    icon: all,
  },
  
  {
    name: "Anime & Cartoons",
    icon: anime,
    subCategories: [
      "Solo leveling",
      "Naruto",
      "Dragon Ball",
      "One Piece",
      "Attack on Titan",
      "Vinland Saga",
      "Berserk",
      "Death Note",
      "Kimetsu no Yaiba",
      "Nanatsu no Taizai",
      "Re:Zero",
      "Hunter x Hunter",
      "Jujutsu Kaisen",
      "My Hero Academia",
      "One Punch Man",
      "Rick and Morty",
      "SpongeBob",
      "The Simpsons",
      "Adventure Time",
      "Tower of God",
    ],
  },
  {
    name: "Gaming",
    icon: gaming,
    subCategories: [
      "Valorant",
      "Call of Duty",
      "Counter Strike",
      "League of Legends",
      "Dota 2",
      "Smite",
      "Minecraft",
      "Among Us",
      "Rust",
      "The Witcher",
      "Skyrim",
      "Cyberpunk 2077",
    ],
  },
  {
    name: "Movies & TV Shows",
    icon: film,
    subCategories: [
      "Marvel",
      "Lord of the Rings",
      "Harry Potter",
      "Breaking Bad",
      "Peaky Blinders",
      "Sherlock Holmes",
      "Stranger Things",
      "The 100",
      "Dark",
      "Friends",
      "The Office",
      "How I Met Your Mother",
      "Squid Game",
      "The Walking Dead",
    ],
  },
  {
    name: "Music",
    icon: musik,
    subCategories: [
      "Billie Eilish",
      "Lana Del Rey",
      "Black Pink",
      "Pink Floyd",
      "Queen",
      "The Beatles",
      "Eminem",
      "Drake",
      "Tupac",
      "Om Kalthoum",
      "Frank Sinatra",
      "Miles Davis",
    ],
  },
  {
    name: "Technology & Work",
    icon: pc,
    subCategories: [
      "Programming & Development",
      "Cybersecurity",
      "AI & Data Science",
      "Marketing & Business",
    ],
  },
  {
    name: "Memes & Funny",
    icon: mems,
    // subCategories: ['Internet Memes', 'Dark Humor', 'Retro Memes', 'Dirty Memes']
  },
  {
    name: "Quotes & Aesthetic",
    icon: msg,
    // subCategories: ['Inspirational Quotes', 'Feminism', 'Tarot & Zodiac']
  },
  {
    name: "Art & Aesthetic",
    icon: Aesthetic,
    // subCategories: [
    //   'Van Gogh', 'Frida', 'Monalisa', 'Digital Art', 'Minimalist Designs',
    //   'Abstract & Geometric'
    // ]
  },

  {
    name: "Medical & Healthcare",
    icon: medical,
    // subCategories: ['Doctors & Nurses', 'Dentistry', 'Pharmacy', 'Medicine']
  },
  {
    name: "Animals",
    icon: animal,
    // subCategories: ['Cats', 'Dogs', 'Wildlife & Nature', 'Exotic Pets']
  },
  {
    name: "Social & Lifestyle",
    icon: sosial,
    // subCategories: [
    //   'Social Media Trends', 'Travel & Adventure', 'Camping & Outdoor',
    //   'Fashion & Style'
    // ]
  },
  {
    name: "Sports",
    icon: sport,
    // subCategories: [
    //   'Football & Soccer', 'Basketball & NBA', 'Extreme Sports',
    //   'Martial Arts & MMA', 'Cristiano Ronaldo'
    // ]
  },
];
