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
import fille from '../public/logo/fille.png'


 import icon_dark_academia from '../public/logo/050f0e42-9c56-4d1d-8940-639e17cf8d19.png';
 import icon_vintage from '../public/logo/7b57c907-97ff-411b-9625-72c68000cffb.png';
 import icon_kawaii from '../public/logo/53c4db50-6ef8-4953-b337-8b2b8140c436.png';
 import icon_space from '../public/logo/044d3203-2b2b-4fde-8cb7-42c56d0fbc7c.png';
 import icon_tattoo from '../public/logo/04e1763c-8aa9-4033-a429-bed900eb37bc.png';
 import icon_witchcraft from '../public/logo/6f122521-9085-48ec-8445-62ffc885f936.png';
 import icon_goth from '../public/logo/afd5db7d-df74-4c84-8b20-ecf5d58a8279.png';
 import icon_travel from '../public/logo/8ac3fe47-19ea-4e2d-819c-55efa7be0c50.png';
 import icon_food from '../public/logo/c4e94cd9-f2e7-47c5-ab89-2b9271b835dd.png';
 import icon_plant from '../public/logo/246755dd-8696-4296-a0bd-5c2b196e927d.png';
import icon_crypto from '../public/logo/28375e38-c444-4d86-9225-8a5db7c9c924.png';
 import icon_car from '../public/logo/b8177593-3a2e-410a-802c-1fdf1b1b74d2.png';
 import icon_myth from '../public/logo/26cffd04-2b31-4bf3-82dd-ada930c7ac9e.png';
 import icon_fitness from '../public/logo/178dff16-4dd0-4c47-870a-b103c5c8aa67.png';
 import icon_inspire from '../public/logo/21e7b0fe-463c-4e68-956e-c81f112dd286.png';
import icon_minimal from '../public/logo/8ed80c8e-6a86-44e4-acd9-e7f20fa8e2cb.png';
 import icon_conspiracy from '../public/logo/39809e53-6148-41d7-a943-7761ef719d65.png';
 import icon_horror from '../public/logo/34596bd3-03fc-41ae-b264-483c7c4047c2.png';


export const categoryData = [
  // --- الفئات الأصلية ---
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
    name: "Fille",
    icon: fille,
  },
  {
    name: "Memes & Funny",
    icon: mems,
  },
  {
    name: "Quotes & Aesthetic",
    icon: msg,
  },
  {
    name: "Art & Aesthetic",
    icon: Aesthetic,
  },
  {
    name: "Medical & Healthcare",
    icon: medical,
  },
  {
    name: "Animals",
    icon: animal,
  },
  {
    name: "Social & Lifestyle",
    icon: sosial,
  },
  {
    name: "Sports",
    icon: sport,
  },


  // أنماط جمالية واتجاهات (Aesthetics & Trends)
  {
    name: "Dark Academia", // الأكاديمية المظلمة
    icon: icon_dark_academia,
  },
  {
    name: "Vintage & Retro", // عتيق وريترو
    icon: icon_vintage,
  },
  {
    name: "Kawaii & Cute", // كاواي ولطيف
    icon: icon_kawaii,
  },


 
  {
    name: "Goth & Emo", // قوث وإيمو
    icon: icon_goth,
  },

  // الفن والتصميم (Art & Design)
  {
    name: "Tattoo Flash & Style", // رسومات الوشم
    icon: icon_tattoo,
  },

  {
    name: "Minimalist Designs", // تصاميم بسيطة
    icon: icon_minimal,
  },

  // الخيال، الغموض، والروحانيات (Fantasy & Occult)
  {
    name: "Fantasy & Myth", // خيال وأساطير
    icon: icon_myth,
  },
  {
    name: "Sci-Fi & Space", // خيال علمي وفضاء
    icon: icon_space,
  },

  {
    name: "Witchcraft & Occult", // السحر والخوارق
    icon: icon_witchcraft,
  },
  {
    name: "Horror & Gore", // رعب ودماء
    icon: icon_horror,
  },

  // الهوايات والاهتمامات (Hobbies & Interests)
  {
    name: "Automotive & Cars", // سيارات ومركبات
    icon: icon_car,
  },
  {
    name: "Food & Drink", // طعام ومشروبات
    icon: icon_food,
  },
  {
    name: "Nature & Plants", // الطبيعة والنباتات (أزهار، صبار)
    icon: icon_plant,
  },
  {
    name: "Cities & Travel", // مدن وسفر
    icon: icon_travel,
  },

  {
    name: "Fitness & Gym", // لياقة ورياضة
    icon: icon_fitness,
  },
 


  {
    name: "Conspiracy Theories", // نظريات المؤامرة
    icon: icon_conspiracy,
  },
  {
    name: "Inspirational Quotes", // اقتباسات ملهمة
    icon: icon_inspire,
  },


  
  {
    name: "Financial & Crypto", // مال وأصول مشفرة
    icon: icon_crypto,
  },
];
