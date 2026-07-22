/* =========================================================
   FIREBASE IMPORTS
   This project uses Firebase Web SDK via CDN modules.
========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
   Firebase config is already connected for the neon-geoguess-arena project.
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyA8dY8GqTueEC6wTjhAJFSqkK4In_aAoVg",
  authDomain: "neon-geoguess-arena.firebaseapp.com",
  projectId: "neon-geoguess-arena",
  storageBucket: "neon-geoguess-arena.firebasestorage.app",
  messagingSenderId: "410876225250",
  appId: "1:410876225250:web:658926590e0f91464560bb",
  measurementId: "G-WLF5ESQ53S"
};

/* =========================================================
   FIREBASE INITIALIZATION
   This block was missing before. FIREBASE_IS_CONFIGURED and db
   must exist before the leaderboard functions can run.
========================================================= */
const FIREBASE_IS_CONFIGURED = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("PASTE") &&
  !firebaseConfig.projectId.includes("PASTE")
);

let firebaseApp = null;
let db = null;

if (FIREBASE_IS_CONFIGURED) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

/* =========================================================
   EXAM-INSPIRED LOCATION QUESTION POOL
   These are paraphrased, original questions inspired by common
   geography topics from national competitive exams. They are not
   copied verbatim from official papers.
========================================================= */
const questionPool = [
  { question: "Which country is widely known as the Land of the Rising Sun?", targetName: "Japan", lat: 36.2048, lng: 138.2529, answer: "Japan", icon: "🌅", category: "Country nickname", sourceStyle: "BCS/GST-style", note: "Japan is commonly called the Land of the Rising Sun." },
  { question: "Click the location of the Suez Canal, a strategic waterway between the Mediterranean and Red Sea.", targetName: "Suez Canal, Egypt", lat: 30.5852, lng: 32.2654, answer: "Suez Canal", icon: "🚢", category: "Canal", sourceStyle: "BCS/UPSC-style", note: "The Suez Canal is in Egypt and connects the Mediterranean Sea with the Red Sea." },
  { question: "Click the location of the Panama Canal, which links the Atlantic and Pacific Oceans.", targetName: "Panama Canal", lat: 9.08, lng: -79.68, answer: "Panama Canal", icon: "🚢", category: "Canal", sourceStyle: "International exam-style", note: "The Panama Canal crosses the Isthmus of Panama." },
  { question: "Where is the Strait of Malacca, one of the world's busiest shipping routes?", targetName: "Strait of Malacca", lat: 3.2, lng: 100.5, answer: "Strait of Malacca", icon: "⚓", category: "Strait", sourceStyle: "BCS/Gaokao-style", note: "The Strait of Malacca lies between the Malay Peninsula and Sumatra." },
  { question: "Click the approximate location of the Strait of Hormuz.", targetName: "Strait of Hormuz", lat: 26.5667, lng: 56.25, answer: "Strait of Hormuz", icon: "🛢️", category: "Strait", sourceStyle: "Competitive exam-style", note: "The Strait of Hormuz connects the Persian Gulf with the Gulf of Oman." },
  { question: "Which mountain is the highest peak in the world? Click its location.", targetName: "Mount Everest", lat: 27.9881, lng: 86.925, answer: "Mount Everest", icon: "🏔️", category: "Mountain", sourceStyle: "BCS/GST-style", note: "Mount Everest is located in the Himalayas on the Nepal-China border region." },
  { question: "Click the location of Mount Fuji, Japan's iconic volcanic mountain.", targetName: "Mount Fuji, Japan", lat: 35.3606, lng: 138.7274, answer: "Mount Fuji", icon: "🗻", category: "Mountain", sourceStyle: "Gaokao-style", note: "Mount Fuji is Japan's highest mountain." },
  { question: "Click the location of the Andes, the long mountain system along western South America.", targetName: "Central Andes", lat: -16.5, lng: -68.2, answer: "Andes", icon: "⛰️", category: "Mountain range", sourceStyle: "International exam-style", note: "The Andes run along the western edge of South America." },
  { question: "Click the approximate location of the Sahara Desert.", targetName: "Sahara Desert", lat: 23.4162, lng: 25.6628, answer: "Sahara", icon: "🏜️", category: "Desert", sourceStyle: "BCS/GST-style", note: "The Sahara is the largest hot desert and stretches across North Africa." },
  { question: "Click the location of the Gobi Desert in Asia.", targetName: "Gobi Desert", lat: 42.795, lng: 105.032, answer: "Gobi Desert", icon: "🏜️", category: "Desert", sourceStyle: "Gaokao-style", note: "The Gobi Desert spans parts of Mongolia and northern China." },
  { question: "Click the approximate location of the Amazon River basin.", targetName: "Amazon Basin", lat: -3.4653, lng: -62.2159, answer: "Amazon Basin", icon: "🌳", category: "River basin", sourceStyle: "International exam-style", note: "The Amazon Basin is mainly in Brazil and surrounding South American countries." },
  { question: "Click the approximate location of the Nile River delta.", targetName: "Nile Delta", lat: 30.9, lng: 31.1, answer: "Nile Delta", icon: "🌊", category: "River/delta", sourceStyle: "BCS-style", note: "The Nile Delta lies in northern Egypt near the Mediterranean Sea." },
  { question: "Click the approximate location of the Ganges-Brahmaputra Delta.", targetName: "Ganges-Brahmaputra Delta", lat: 22.3, lng: 90.3, answer: "Ganges-Brahmaputra Delta", icon: "🌊", category: "Delta", sourceStyle: "Bangladesh BCS-style", note: "This huge delta covers much of Bangladesh and parts of eastern India." },
  { question: "Click the capital city of Bangladesh.", targetName: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125, answer: "Dhaka", icon: "🏙️", category: "Capital", sourceStyle: "BCS-style", note: "Dhaka is the capital and largest city of Bangladesh." },
  { question: "Click the location of the Sundarbans mangrove forest.", targetName: "Sundarbans", lat: 21.9497, lng: 89.1833, answer: "Sundarbans", icon: "🐅", category: "Forest", sourceStyle: "Bangladesh exam-style", note: "The Sundarbans is the world's largest mangrove forest, shared by Bangladesh and India." },
  { question: "Click the location of Cox's Bazar, famous for its long sandy sea beach.", targetName: "Cox's Bazar", lat: 21.4272, lng: 92.0058, answer: "Cox's Bazar", icon: "🏖️", category: "Bangladesh geography", sourceStyle: "BCS-style", note: "Cox's Bazar is in southeastern Bangladesh." },
  { question: "Click the location of Chattogram, Bangladesh's main port city.", targetName: "Chattogram", lat: 22.3569, lng: 91.7832, answer: "Chattogram", icon: "⚓", category: "Port city", sourceStyle: "BCS-style", note: "Chattogram is the major seaport city of Bangladesh." },
  { question: "Click the location of Saint Martin's Island of Bangladesh.", targetName: "Saint Martin's Island", lat: 20.6279, lng: 92.3226, answer: "Saint Martin's Island", icon: "🏝️", category: "Island", sourceStyle: "Bangladesh exam-style", note: "Saint Martin's is Bangladesh's only coral island." },
  { question: "Click the capital city of India.", targetName: "New Delhi, India", lat: 28.6139, lng: 77.209, answer: "New Delhi", icon: "🏛️", category: "Capital", sourceStyle: "GST/BCS-style", note: "New Delhi is the capital of India." },
  { question: "Click the capital city of China.", targetName: "Beijing, China", lat: 39.9042, lng: 116.4074, answer: "Beijing", icon: "🏯", category: "Capital", sourceStyle: "Gaokao-style", note: "Beijing is the capital of China." },
  { question: "Click the capital city of Japan.", targetName: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, answer: "Tokyo", icon: "🏙️", category: "Capital", sourceStyle: "BCS/Gaokao-style", note: "Tokyo is Japan's capital and one of the world's largest urban regions." },
  { question: "Click the capital city of South Korea.", targetName: "Seoul, South Korea", lat: 37.5665, lng: 126.978, answer: "Seoul", icon: "🏙️", category: "Capital", sourceStyle: "International exam-style", note: "Seoul is the capital of South Korea." },
  { question: "Click the capital city of Thailand.", targetName: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018, answer: "Bangkok", icon: "🏙️", category: "Capital", sourceStyle: "Competitive exam-style", note: "Bangkok is Thailand's capital." },
  { question: "Click the capital city of Indonesia.", targetName: "Jakarta, Indonesia", lat: -6.2088, lng: 106.8456, answer: "Jakarta", icon: "🏙️", category: "Capital", sourceStyle: "Competitive exam-style", note: "Jakarta is Indonesia's current capital region and largest city." },
  { question: "Click the capital city of Malaysia.", targetName: "Kuala Lumpur, Malaysia", lat: 3.139, lng: 101.6869, answer: "Kuala Lumpur", icon: "🏙️", category: "Capital", sourceStyle: "Competitive exam-style", note: "Kuala Lumpur is Malaysia's national capital." },
  { question: "Click the capital city of Nepal.", targetName: "Kathmandu, Nepal", lat: 27.7172, lng: 85.324, answer: "Kathmandu", icon: "🏔️", category: "Capital", sourceStyle: "BCS-style", note: "Kathmandu is Nepal's capital." },
  { question: "Click the capital city of Sri Lanka.", targetName: "Sri Jayawardenepura Kotte", lat: 6.9271, lng: 79.8612, answer: "Sri Jayawardenepura Kotte", icon: "🏛️", category: "Capital", sourceStyle: "BCS-style", note: "Sri Jayawardenepura Kotte is the administrative capital of Sri Lanka, near Colombo." },
  { question: "Click the capital city of Pakistan.", targetName: "Islamabad, Pakistan", lat: 33.6844, lng: 73.0479, answer: "Islamabad", icon: "🏙️", category: "Capital", sourceStyle: "BCS-style", note: "Islamabad is Pakistan's capital." },
  { question: "Click the location of Mecca, a major holy city in Saudi Arabia.", targetName: "Mecca, Saudi Arabia", lat: 21.3891, lng: 39.8579, answer: "Mecca", icon: "🕋", category: "Religious city", sourceStyle: "General knowledge exam-style", note: "Mecca is in western Saudi Arabia." },
  { question: "Click the location of Jerusalem.", targetName: "Jerusalem", lat: 31.7683, lng: 35.2137, answer: "Jerusalem", icon: "🕍", category: "Historic city", sourceStyle: "International exam-style", note: "Jerusalem is a historic city in the Middle East." },
  { question: "Click the headquarters city of the United Nations.", targetName: "New York City", lat: 40.7128, lng: -74.006, answer: "New York", icon: "🇺🇳", category: "Organization HQ", sourceStyle: "BCS/GST-style", note: "The UN Headquarters is in New York City." },
  { question: "Click the headquarters city of UNESCO.", targetName: "Paris, France", lat: 48.8566, lng: 2.3522, answer: "Paris", icon: "🏛️", category: "Organization HQ", sourceStyle: "Competitive exam-style", note: "UNESCO is headquartered in Paris." },
  { question: "Click the headquarters city of the World Health Organization.", targetName: "Geneva, Switzerland", lat: 46.2044, lng: 6.1432, answer: "Geneva", icon: "🏥", category: "Organization HQ", sourceStyle: "BCS-style", note: "WHO is headquartered in Geneva." },
  { question: "Click the headquarters city of the International Court of Justice.", targetName: "The Hague, Netherlands", lat: 52.0705, lng: 4.3007, answer: "The Hague", icon: "⚖️", category: "Organization HQ", sourceStyle: "BCS/GST-style", note: "The International Court of Justice is located in The Hague." },
  { question: "Click the city that hosted the first modern Olympic Games in 1896.", targetName: "Athens, Greece", lat: 37.9838, lng: 23.7275, answer: "Athens", icon: "🏟️", category: "Olympics", sourceStyle: "International exam-style", note: "Athens hosted the first modern Olympic Games in 1896." },
  { question: "Click the city that hosted the 1964 Summer Olympics.", targetName: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, answer: "Tokyo", icon: "🏟️", category: "Olympics", sourceStyle: "Gaokao-style", note: "Tokyo hosted the Summer Olympics in 1964 and 2020." },
  { question: "Click the city that hosted the 2008 Summer Olympics.", targetName: "Beijing, China", lat: 39.9042, lng: 116.4074, answer: "Beijing", icon: "🏟️", category: "Olympics", sourceStyle: "Gaokao-style", note: "Beijing hosted the 2008 Summer Olympics." },
  { question: "Click the city that hosted the 2016 Summer Olympics.", targetName: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729, answer: "Rio de Janeiro", icon: "🏟️", category: "Olympics", sourceStyle: "International exam-style", note: "Rio de Janeiro hosted the 2016 Summer Olympics." },
  { question: "Click the location of the Eiffel Tower.", targetName: "Eiffel Tower, Paris", lat: 48.8584, lng: 2.2945, answer: "Eiffel Tower", icon: "🗼", category: "Landmark", sourceStyle: "General geography", note: "The Eiffel Tower is in Paris, France." },
  { question: "Click the location of the Statue of Liberty.", targetName: "Statue of Liberty", lat: 40.6892, lng: -74.0445, answer: "Statue of Liberty", icon: "🗽", category: "Landmark", sourceStyle: "General geography", note: "The Statue of Liberty is in New York Harbor." },
  { question: "Click the location of the Great Pyramid of Giza.", targetName: "Great Pyramid of Giza", lat: 29.9792, lng: 31.1342, answer: "Great Pyramid", icon: "🔺", category: "Landmark", sourceStyle: "General geography", note: "The Great Pyramid is near Cairo, Egypt." },
  { question: "Click the location of the Taj Mahal.", targetName: "Taj Mahal, Agra", lat: 27.1751, lng: 78.0421, answer: "Taj Mahal", icon: "🕌", category: "Landmark", sourceStyle: "South Asia exam-style", note: "The Taj Mahal is in Agra, India." },
  { question: "Click the location of the Colosseum.", targetName: "Colosseum, Rome", lat: 41.8902, lng: 12.4922, answer: "Colosseum", icon: "🏛️", category: "Landmark", sourceStyle: "General geography", note: "The Colosseum is in Rome, Italy." },
  { question: "Click the location of Machu Picchu.", targetName: "Machu Picchu", lat: -13.1631, lng: -72.545, answer: "Machu Picchu", icon: "⛰️", category: "Landmark", sourceStyle: "International exam-style", note: "Machu Picchu is in Peru." },
  { question: "Click the location of Angkor Wat.", targetName: "Angkor Wat", lat: 13.4125, lng: 103.867, answer: "Angkor Wat", icon: "🏯", category: "Landmark", sourceStyle: "Asian geography", note: "Angkor Wat is in Cambodia." },
  { question: "Click the approximate location of Petra.", targetName: "Petra, Jordan", lat: 30.3285, lng: 35.4444, answer: "Petra", icon: "🏜️", category: "Landmark", sourceStyle: "International exam-style", note: "Petra is an ancient city in Jordan." },
  { question: "Click the location of Stonehenge.", targetName: "Stonehenge, England", lat: 51.1789, lng: -1.8262, answer: "Stonehenge", icon: "🪨", category: "Landmark", sourceStyle: "General geography", note: "Stonehenge is in southern England." },
  { question: "Click the location of the Sydney Opera House.", targetName: "Sydney Opera House", lat: -33.8568, lng: 151.2153, answer: "Sydney Opera House", icon: "🎭", category: "Landmark", sourceStyle: "General geography", note: "The Sydney Opera House is in Australia." },
  { question: "Click the location of the Burj Khalifa.", targetName: "Burj Khalifa, Dubai", lat: 25.1972, lng: 55.2744, answer: "Burj Khalifa", icon: "🏙️", category: "Landmark", sourceStyle: "General geography", note: "The Burj Khalifa is in Dubai, UAE." },
  { question: "Click the approximate location of Niagara Falls.", targetName: "Niagara Falls", lat: 43.0962, lng: -79.0377, answer: "Niagara Falls", icon: "💦", category: "Waterfall", sourceStyle: "International exam-style", note: "Niagara Falls is on the Canada–United States border." },
  { question: "Click the country where the city of Istanbul is located.", targetName: "Istanbul, Türkiye", lat: 41.0082, lng: 28.9784, answer: "Türkiye", icon: "🌉", category: "World city", sourceStyle: "Competitive exam-style", note: "Istanbul is in Türkiye and spans Europe and Asia." },
  { question: "Click the approximate location of the Bosporus Strait.", targetName: "Bosporus Strait", lat: 41.12, lng: 29.05, answer: "Bosporus", icon: "🌉", category: "Strait", sourceStyle: "International exam-style", note: "The Bosporus separates European and Asian parts of Türkiye." },
  { question: "Click the approximate location of the English Channel.", targetName: "English Channel", lat: 50.2, lng: -1.5, answer: "English Channel", icon: "🌊", category: "Water body", sourceStyle: "Competitive exam-style", note: "The English Channel lies between southern England and northern France." },
  { question: "Click the approximate location of the Mediterranean Sea.", targetName: "Mediterranean Sea", lat: 35.0, lng: 18.0, answer: "Mediterranean Sea", icon: "🌊", category: "Sea", sourceStyle: "General geography", note: "The Mediterranean Sea lies between Europe, Africa, and Asia." },
  { question: "Click the approximate location of the Black Sea.", targetName: "Black Sea", lat: 43.4, lng: 34.3, answer: "Black Sea", icon: "🌊", category: "Sea", sourceStyle: "Competitive exam-style", note: "The Black Sea lies north of Türkiye and south of Ukraine/Russia." },
  { question: "Click the approximate location of the Caspian Sea.", targetName: "Caspian Sea", lat: 41.9, lng: 50.7, answer: "Caspian Sea", icon: "🌊", category: "Lake/sea", sourceStyle: "BCS-style", note: "The Caspian Sea is the world's largest inland body of water." },
  { question: "Click the approximate location of the Aral Sea region.", targetName: "Aral Sea", lat: 45.0, lng: 59.0, answer: "Aral Sea", icon: "🌊", category: "Lake/sea", sourceStyle: "Environmental geography", note: "The Aral Sea region lies between Kazakhstan and Uzbekistan." },
  { question: "Click the approximate location of Lake Victoria.", targetName: "Lake Victoria", lat: -1.0, lng: 33.0, answer: "Lake Victoria", icon: "💧", category: "Lake", sourceStyle: "International exam-style", note: "Lake Victoria is in East Africa." },
  { question: "Click the approximate location of the Great Barrier Reef.", targetName: "Great Barrier Reef", lat: -18.2871, lng: 147.6992, answer: "Great Barrier Reef", icon: "🐠", category: "Marine geography", sourceStyle: "Environmental exam-style", note: "The Great Barrier Reef lies off northeastern Australia." },
  { question: "Click the approximate location of the Ring of Fire around the Pacific.", targetName: "Pacific Ring of Fire", lat: 36.0, lng: 142.0, answer: "Pacific Ring of Fire", icon: "🌋", category: "Tectonics", sourceStyle: "Gaokao/UPSC-style", note: "The Ring of Fire follows the margins of the Pacific Ocean; this point marks one active section near Japan." },
  { question: "Click the approximate location of the Mariana Trench.", targetName: "Mariana Trench", lat: 11.35, lng: 142.2, answer: "Mariana Trench", icon: "🌊", category: "Oceanography", sourceStyle: "International exam-style", note: "The Mariana Trench is in the western Pacific Ocean." },
  { question: "Click the approximate location of the North Pole.", targetName: "North Pole", lat: 85.0, lng: 0.0, answer: "North Pole", icon: "🧊", category: "Physical geography", sourceStyle: "General geography", note: "The map is capped near 85°N for Web Mercator display, so this is the visible polar area." },
  { question: "Click the approximate location of Antarctica.", targetName: "Antarctica", lat: -75.0, lng: 0.0, answer: "Antarctica", icon: "🐧", category: "Continent", sourceStyle: "General geography", note: "Antarctica surrounds the South Pole." },
  { question: "Click the approximate location of Greenland.", targetName: "Greenland", lat: 72.0, lng: -40.0, answer: "Greenland", icon: "🧊", category: "Island", sourceStyle: "General geography", note: "Greenland is the world's largest island." },
  { question: "Click the approximate location of Madagascar.", targetName: "Madagascar", lat: -18.7669, lng: 46.8691, answer: "Madagascar", icon: "🏝️", category: "Island", sourceStyle: "Competitive exam-style", note: "Madagascar lies off the southeastern coast of Africa." },
  { question: "Click the approximate location of Borneo.", targetName: "Borneo", lat: 0.9619, lng: 114.5548, answer: "Borneo", icon: "🌴", category: "Island", sourceStyle: "Asian geography", note: "Borneo is shared by Indonesia, Malaysia, and Brunei." },
  { question: "Click the approximate location of the Korean Peninsula.", targetName: "Korean Peninsula", lat: 36.5, lng: 127.8, answer: "Korean Peninsula", icon: "🗺️", category: "Regional geography", sourceStyle: "Gaokao-style", note: "The Korean Peninsula includes North Korea and South Korea." },
  { question: "Click the approximate location of the Arabian Peninsula.", targetName: "Arabian Peninsula", lat: 23.6, lng: 45.0, answer: "Arabian Peninsula", icon: "🏜️", category: "Regional geography", sourceStyle: "BCS-style", note: "The Arabian Peninsula includes Saudi Arabia, Yemen, Oman, UAE, Qatar, Bahrain, and Kuwait." },
  { question: "Click the approximate location of the Iberian Peninsula.", targetName: "Iberian Peninsula", lat: 40.0, lng: -4.0, answer: "Iberian Peninsula", icon: "🗺️", category: "Regional geography", sourceStyle: "International exam-style", note: "The Iberian Peninsula includes Spain and Portugal." },
  { question: "Click the approximate location of the Scandinavian Peninsula.", targetName: "Scandinavian Peninsula", lat: 62.0, lng: 15.0, answer: "Scandinavian Peninsula", icon: "🗺️", category: "Regional geography", sourceStyle: "General geography", note: "The Scandinavian Peninsula includes Norway and Sweden, with part of northern Finland often associated regionally." },
  { question: "Click the approximate location of the Horn of Africa.", targetName: "Horn of Africa", lat: 8.0, lng: 47.0, answer: "Horn of Africa", icon: "🦏", category: "Regional geography", sourceStyle: "International exam-style", note: "The Horn of Africa projects into the Arabian Sea and Gulf of Aden region." },
  { question: "Click the approximate location of the Cape of Good Hope.", targetName: "Cape of Good Hope", lat: -34.3568, lng: 18.474, answer: "Cape of Good Hope", icon: "🌊", category: "Cape", sourceStyle: "General geography", note: "The Cape of Good Hope is near Cape Town, South Africa." },
  { question: "Click the approximate location of the Tropic of Cancer crossing Bangladesh's region.", targetName: "Tropic of Cancer near Bangladesh", lat: 23.436, lng: 90.0, answer: "Tropic of Cancer", icon: "☀️", category: "Latitude", sourceStyle: "Bangladesh BCS-style", note: "The Tropic of Cancer passes through Bangladesh near 23.5°N." },
  { question: "Click the approximate location of the Equator in East Africa.", targetName: "Equator near Kenya", lat: 0.0, lng: 37.0, answer: "Equator", icon: "🌐", category: "Latitude", sourceStyle: "General geography", note: "The Equator crosses several countries, including Kenya." },
  { question: "Click the approximate location of Greenwich, the reference for the Prime Meridian.", targetName: "Greenwich, London", lat: 51.4769, lng: 0.0, answer: "Greenwich", icon: "🕰️", category: "Longitude", sourceStyle: "BCS/GST-style", note: "The Prime Meridian passes through Greenwich, London." },
  { question: "Click the approximate location of the International Date Line in the Pacific.", targetName: "International Date Line", lat: 0.0, lng: 180.0, answer: "International Date Line", icon: "📅", category: "Longitude", sourceStyle: "General geography", note: "The International Date Line roughly follows 180° longitude with several deviations." },
  { question: "Click the approximate location of Silicon Valley.", targetName: "Silicon Valley, California", lat: 37.3875, lng: -122.0575, answer: "Silicon Valley", icon: "💻", category: "Economic geography", sourceStyle: "Competitive exam-style", note: "Silicon Valley is in California, USA." },
  { question: "Click the approximate location of the Ruhr industrial region.", targetName: "Ruhr Region, Germany", lat: 51.5, lng: 7.3, answer: "Ruhr", icon: "🏭", category: "Industrial region", sourceStyle: "International exam-style", note: "The Ruhr is a major industrial region in western Germany." },
  { question: "Click the approximate location of the Great Lakes industrial region of North America.", targetName: "Great Lakes Region", lat: 43.7, lng: -84.5, answer: "Great Lakes", icon: "🏭", category: "Industrial region", sourceStyle: "Competitive exam-style", note: "The Great Lakes region is shared by the USA and Canada." },
  { question: "Click the approximate location of the wheat belt of the Canadian Prairies.", targetName: "Canadian Prairies", lat: 52.0, lng: -106.0, answer: "Canadian Prairies", icon: "🌾", category: "Agricultural region", sourceStyle: "General geography", note: "The Canadian Prairies are a major wheat-producing region." },
  { question: "Click the approximate location of the Corn Belt in the United States.", targetName: "US Corn Belt", lat: 41.6, lng: -93.5, answer: "Corn Belt", icon: "🌽", category: "Agricultural region", sourceStyle: "International exam-style", note: "The Corn Belt is centered in the Midwestern United States." },
  { question: "Click the approximate location of the Yangtze River Delta region.", targetName: "Yangtze River Delta", lat: 31.2, lng: 121.5, answer: "Yangtze River Delta", icon: "🌊", category: "Delta/urban region", sourceStyle: "Gaokao-style", note: "The Yangtze River Delta includes Shanghai and surrounding cities." },
  { question: "Click the approximate location of the Pearl River Delta region.", targetName: "Pearl River Delta", lat: 22.7, lng: 113.6, answer: "Pearl River Delta", icon: "🌊", category: "Delta/urban region", sourceStyle: "Gaokao-style", note: "The Pearl River Delta is one of China's major urban-industrial regions." },
  { question: "Click the approximate location of the North China Plain.", targetName: "North China Plain", lat: 35.5, lng: 115.0, answer: "North China Plain", icon: "🌾", category: "Plain", sourceStyle: "Gaokao-style", note: "The North China Plain is a major agricultural and population region." },
  { question: "Click the approximate location of the Deccan Plateau.", targetName: "Deccan Plateau", lat: 16.0, lng: 77.0, answer: "Deccan Plateau", icon: "⛰️", category: "Plateau", sourceStyle: "South Asia exam-style", note: "The Deccan Plateau covers much of peninsular India." },
  { question: "Click the approximate location of the Tibetan Plateau.", targetName: "Tibetan Plateau", lat: 32.0, lng: 88.0, answer: "Tibetan Plateau", icon: "🏔️", category: "Plateau", sourceStyle: "Gaokao-style", note: "The Tibetan Plateau is often called the Roof of the World." },
  { question: "Click the approximate location of the Great Rift Valley in East Africa.", targetName: "Great Rift Valley", lat: -1.5, lng: 36.0, answer: "Great Rift Valley", icon: "🧭", category: "Landform", sourceStyle: "International exam-style", note: "The East African Rift runs through countries such as Ethiopia, Kenya, and Tanzania." },
  { question: "Click the approximate location of the Dead Sea.", targetName: "Dead Sea", lat: 31.5, lng: 35.5, answer: "Dead Sea", icon: "🧂", category: "Lake/sea", sourceStyle: "General geography", note: "The Dead Sea lies between Jordan and the West Bank/Israel region." },
  { question: "Click the approximate location of the Red Sea.", targetName: "Red Sea", lat: 20.0, lng: 38.0, answer: "Red Sea", icon: "🌊", category: "Sea", sourceStyle: "BCS-style", note: "The Red Sea lies between northeastern Africa and the Arabian Peninsula." },
  { question: "Click the approximate location of the Persian Gulf.", targetName: "Persian Gulf", lat: 26.5, lng: 51.5, answer: "Persian Gulf", icon: "🛢️", category: "Gulf", sourceStyle: "Competitive exam-style", note: "The Persian Gulf is a major oil-producing region." },
  { question: "Click the approximate location of the Gulf of Mexico.", targetName: "Gulf of Mexico", lat: 25.0, lng: -90.0, answer: "Gulf of Mexico", icon: "🌊", category: "Gulf", sourceStyle: "General geography", note: "The Gulf of Mexico is bordered by the USA, Mexico, and Cuba." },
  { question: "Click the approximate location of the Caribbean Sea.", targetName: "Caribbean Sea", lat: 15.0, lng: -75.0, answer: "Caribbean Sea", icon: "🏝️", category: "Sea", sourceStyle: "General geography", note: "The Caribbean Sea lies southeast of the Gulf of Mexico." },
  { question: "Click the approximate location of the Atacama Desert.", targetName: "Atacama Desert", lat: -24.5, lng: -69.25, answer: "Atacama Desert", icon: "🏜️", category: "Desert", sourceStyle: "International exam-style", note: "The Atacama Desert is in northern Chile." },
  { question: "Click the approximate location of the Kalahari Desert.", targetName: "Kalahari Desert", lat: -22.0, lng: 21.0, answer: "Kalahari Desert", icon: "🏜️", category: "Desert", sourceStyle: "International exam-style", note: "The Kalahari spans parts of Botswana, Namibia, and South Africa." },
  { question: "Click the approximate location of the Serengeti ecosystem.", targetName: "Serengeti", lat: -2.3333, lng: 34.8333, answer: "Serengeti", icon: "🦁", category: "Ecosystem", sourceStyle: "Environmental geography", note: "The Serengeti is mainly in Tanzania and extends toward Kenya." },
  { question: "Click the approximate location of the Amazon rainforest in Brazil.", targetName: "Amazon Rainforest", lat: -3.1, lng: -60.0, answer: "Amazon Rainforest", icon: "🌳", category: "Ecosystem", sourceStyle: "Environmental exam-style", note: "The Amazon rainforest is the world's largest tropical rainforest." },
  { question: "Click the approximate location of the Congo Basin rainforest.", targetName: "Congo Basin", lat: -1.5, lng: 23.5, answer: "Congo Basin", icon: "🌳", category: "Ecosystem", sourceStyle: "Environmental geography", note: "The Congo Basin is a major tropical rainforest region in Central Africa." }
];

/* =========================================================
   GAME SETTINGS
========================================================= */
const difficultySettings = {
  easy: { label: "Easy", time: 45, scoringRadiusKm: 3600, startZoom: 2, defaultMaxZoom: 14 },
  medium: { label: "Medium", time: 30, scoringRadiusKm: 2500, startZoom: 2, defaultMaxZoom: 12 },
  hard: { label: "Hard", time: 18, scoringRadiusKm: 1600, startZoom: 2, defaultMaxZoom: 9 }
};

const MAX_SCORE_PER_ROUND = 1000;
const COLLECTION_NAME = "leaderboard";

const basemaps = {
  dark: {
    label: "Neon Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: { attribution: "&copy; OpenStreetMap contributors &copy; CARTO", subdomains: "abcd", maxZoom: 20, noWrap: true }
  },
  light: {
    label: "Clean Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: { attribution: "&copy; OpenStreetMap contributors &copy; CARTO", subdomains: "abcd", maxZoom: 20, noWrap: true }
  },
  osm: {
    label: "Classic OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19, noWrap: true }
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: { attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap", maxZoom: 17, noWrap: true }
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: { attribution: "Tiles &copy; Esri", maxZoom: 19, noWrap: true }
  }
};

/* =========================================================
   DOM REFERENCES
========================================================= */
const $ = (id) => document.getElementById(id);
const loadingScreen = $("loadingScreen");
const toast = $("toast");
const startScreen = $("startScreen");
const finalScreen = $("finalScreen");
const gameHud = $("gameHud");
const mapTools = $("mapTools");
const resultPanel = $("resultPanel");
const playBtn = $("playBtn");
const restartTopBtn = $("restartTopBtn");
const restartFinalBtn = $("restartFinalBtn");
const nextRoundBtn = $("nextRoundBtn");
const refreshLeaderboardBtn = $("refreshLeaderboardBtn");
const scoreForm = $("scoreForm");
const submitScoreBtn = $("submitScoreBtn");
const difficultySelect = $("difficultySelect");
const roundCountSelect = $("roundCountSelect");
const basemapSelect = $("basemapSelect");
const maxZoomRange = $("maxZoomRange");
const maxZoomValue = $("maxZoomValue");
const firebaseStatus = $("firebaseStatus");
const questionText = $("questionText");
const questionMeta = $("questionMeta");
const roundDisplay = $("roundDisplay");
const scoreDisplay = $("scoreDisplay");
const timerDisplay = $("timerDisplay");
const resultTitle = $("resultTitle");
const resultDescription = $("resultDescription");
const roundScoreBadge = $("roundScoreBadge");
const actualPlaceText = $("actualPlaceText");
const distanceText = $("distanceText");
const accuracyText = $("accuracyText");
const answerNote = $("answerNote");
const finalScoreText = $("finalScoreText");
const finalScoreSmall = $("finalScoreSmall");
const finalMessage = $("finalMessage");
const leaderboardList = $("leaderboardList");
const playerNameInput = $("playerNameInput");
const confettiCanvas = $("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

/* =========================================================
   GAME STATE
========================================================= */
let map;
let activeTileLayer;
let countryOutlineLayer;
let currentRound = 1;
let totalRounds = 5;
let totalScore = 0;
let displayedScore = 0;
let currentQuestion = null;
let usedIndexes = [];
let difficulty = difficultySettings.medium;
let timeLeft = difficulty.time;
let timerInterval = null;
let roundLocked = false;
let scoreSubmitted = false;
let guessMarker = null;
let actualMarker = null;
let connectionLine = null;

/* =========================================================
   MAP INITIALIZATION
========================================================= */
function initializeMap() {
  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: Number(maxZoomRange.value),
    zoomControl: true,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 0.92
  });

  setBasemap("dark");
  map.on("click", handleMapClick);
  loadCountryOutlines();

  setTimeout(() => map.invalidateSize(true), 350);
}

function setBasemap(key) {
  const selected = basemaps[key] || basemaps.dark;
  if (activeTileLayer) map.removeLayer(activeTileLayer);
  activeTileLayer = L.tileLayer(selected.url, selected.options).addTo(map);
  if (countryOutlineLayer) countryOutlineLayer.bringToFront();
}

function loadCountryOutlines() {
  fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
    .then((res) => res.json())
    .then((geojson) => {
      countryOutlineLayer = L.geoJSON(geojson, {
        style: {
          color: "#67e8f9",
          weight: 0.75,
          opacity: 0.62,
          fillOpacity: 0
        },
        interactive: false
      }).addTo(map);
    })
    .catch(() => showToast("Country outlines could not be loaded. The game still works."));
}

/* =========================================================
   GAME FLOW
========================================================= */
function startGame() {
  difficulty = difficultySettings[difficultySelect.value];
  totalRounds = Number(roundCountSelect.value);
  currentRound = 1;
  totalScore = 0;
  displayedScore = 0;
  usedIndexes = [];
  roundLocked = false;
  scoreSubmitted = false;

  maxZoomRange.value = difficulty.defaultMaxZoom;
  updateMaxZoom();

  startScreen.classList.add("hidden");
  finalScreen.classList.add("hidden");
  resultPanel.classList.add("hidden");
  gameHud.classList.remove("hidden");
  mapTools.classList.remove("hidden");

  clearMapGraphics();
  updateHud();
  setTimeout(() => map.invalidateSize(true), 200);
  startRound();
}

function startRound() {
  clearMapGraphics();
  resultPanel.classList.add("hidden");
  roundLocked = false;
  currentQuestion = pickQuestion();
  questionText.textContent = `${currentQuestion.icon} ${currentQuestion.question}`;
  questionMeta.textContent = `${currentQuestion.category} • ${currentQuestion.sourceStyle} • Answer by clicking the map`;
  timeLeft = difficulty.time;
  updateHud();
  startTimer();
  map.setView([20, 0], difficulty.startZoom, { animate: true, duration: 0.7 });
}

function pickQuestion() {
  if (usedIndexes.length >= questionPool.length) usedIndexes = [];
  let index;
  do {
    index = Math.floor(Math.random() * questionPool.length);
  } while (usedIndexes.includes(index));
  usedIndexes.push(index);
  return questionPool[index];
}

function nextRound() {
  if (currentRound >= totalRounds) {
    endGame();
    return;
  }
  currentRound += 1;
  startRound();
}

function endGame() {
  clearInterval(timerInterval);
  gameHud.classList.add("hidden");
  mapTools.classList.add("hidden");
  resultPanel.classList.add("hidden");
  finalScreen.classList.remove("hidden");
  finalScoreSmall.textContent = `out of ${(totalRounds * MAX_SCORE_PER_ROUND).toLocaleString()}`;
  finalMessage.textContent = getFinalMessage(totalScore);
  animateFinalScore(totalScore);
  loadLeaderboard();
}

function restartGame() {
  clearInterval(timerInterval);
  clearMapGraphics();
  currentRound = 1;
  totalScore = 0;
  displayedScore = 0;
  usedIndexes = [];
  roundLocked = false;
  scoreSubmitted = false;
  gameHud.classList.add("hidden");
  mapTools.classList.add("hidden");
  resultPanel.classList.add("hidden");
  finalScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  playerNameInput.value = "";
  submitScoreBtn.disabled = false;
  map.setView([20, 0], 2, { animate: true, duration: 0.6 });
}

/* =========================================================
   ROUND RESULT
========================================================= */
function handleMapClick(event) {
  if (roundLocked || !currentQuestion) return;
  finishRound(event.latlng);
}

function finishRound(guessedLatLng) {
  roundLocked = true;
  clearInterval(timerInterval);

  const actualLatLng = L.latLng(currentQuestion.lat, currentQuestion.lng);
  const distanceKm = calculateDistanceKm(guessedLatLng.lat, guessedLatLng.lng, actualLatLng.lat, actualLatLng.lng);
  const roundScore = calculateScore(distanceKm);
  const accuracy = calculateAccuracy(distanceKm);

  totalScore += roundScore;
  animateScoreCounter(displayedScore, totalScore);
  displayedScore = totalScore;

  addGuessMarker(guessedLatLng);
  addActualMarker(actualLatLng);
  addConnectionLine(guessedLatLng, actualLatLng);
  fitMapToResult(guessedLatLng, actualLatLng);
  showPopup(guessedLatLng, distanceKm, roundScore);
  showResultPanel(distanceKm, roundScore, accuracy);

  if (roundScore >= 850) launchConfetti();
}

function handleTimeout() {
  if (roundLocked) return;
  roundLocked = true;
  const actualLatLng = L.latLng(currentQuestion.lat, currentQuestion.lng);
  addActualMarker(actualLatLng);
  map.setView(actualLatLng, 5, { animate: true, duration: 0.8 });
  resultPanel.classList.remove("hidden");
  resultTitle.textContent = "⏰ Time's Up!";
  resultDescription.textContent = `Correct answer: ${currentQuestion.answer}`;
  roundScoreBadge.textContent = "+0";
  actualPlaceText.textContent = currentQuestion.targetName;
  distanceText.textContent = "No guess";
  accuracyText.textContent = "0%";
  answerNote.textContent = currentQuestion.note;
  nextRoundBtn.textContent = currentRound >= totalRounds ? "See Final Score 🏁" : "Next Round ➜";
}

function showResultPanel(distanceKm, roundScore, accuracy) {
  resultPanel.classList.remove("hidden");
  resultTitle.textContent = getResultTitle(roundScore);
  resultDescription.textContent = `Correct answer: ${currentQuestion.answer}`;
  roundScoreBadge.textContent = `+${roundScore}`;
  actualPlaceText.textContent = currentQuestion.targetName;
  distanceText.textContent = formatDistance(distanceKm);
  accuracyText.textContent = `${accuracy}%`;
  answerNote.textContent = currentQuestion.note;
  nextRoundBtn.textContent = currentRound >= totalRounds ? "See Final Score 🏁" : "Next Round ➜";
}

/* =========================================================
   DISTANCE AND SCORING
========================================================= */
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(deg) { return deg * Math.PI / 180; }

function calculateScore(distanceKm) {
  const score = MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / difficulty.scoringRadiusKm);
  return Math.max(0, Math.round(score));
}

function calculateAccuracy(distanceKm) {
  const accuracy = 100 * Math.exp(-distanceKm / difficulty.scoringRadiusKm);
  return Math.max(0, Math.round(accuracy));
}

function formatDistance(km) {
  const miles = km * 0.621371;
  return `${Math.round(km).toLocaleString()} km / ${Math.round(miles).toLocaleString()} mi`;
}

/* =========================================================
   MAP GRAPHICS
========================================================= */
function addGuessMarker(latlng) {
  const icon = L.divIcon({ className: "", html: '<div class="guess-marker"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
  guessMarker = L.marker(latlng, { icon }).addTo(map);
}

function addActualMarker(latlng) {
  const icon = L.divIcon({ className: "", html: '<div class="actual-marker"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
  actualMarker = L.marker(latlng, { icon }).addTo(map);
  actualMarker.bindPopup(`<div class="popup-title">${currentQuestion.icon} ${currentQuestion.targetName}</div><div class="popup-line">${currentQuestion.note}</div>`);
}

function addConnectionLine(a, b) {
  connectionLine = L.polyline([a, b], { color: "#22d3ee", weight: 3, opacity: 0.92, dashArray: "8 10" }).addTo(map);
}

function fitMapToResult(a, b) {
  map.fitBounds(L.latLngBounds([a, b]), {
    paddingTopLeft: [50, window.innerWidth <= 860 ? 210 : 130],
    paddingBottomRight: [50, window.innerWidth <= 860 ? 260 : 220],
    maxZoom: Math.min(7, Number(maxZoomRange.value)),
    animate: true,
    duration: 0.8
  });
}

function showPopup(latlng, distanceKm, score) {
  L.popup({ closeButton: true, autoClose: false, closeOnClick: false })
    .setLatLng(latlng)
    .setContent(`<div class="popup-title">🎯 Your Guess</div><div class="popup-line"><strong>Actual:</strong> ${currentQuestion.targetName}</div><div class="popup-line"><strong>Distance:</strong> ${formatDistance(distanceKm)}</div><div class="popup-line"><strong>Score:</strong> ${score}</div>`)
    .openOn(map);
}

function clearMapGraphics() {
  if (guessMarker) map.removeLayer(guessMarker);
  if (actualMarker) map.removeLayer(actualMarker);
  if (connectionLine) map.removeLayer(connectionLine);
  guessMarker = null;
  actualMarker = null;
  connectionLine = null;
  if (map) map.closePopup();
}

/* =========================================================
   TIMER AND HUD
========================================================= */
function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = `${timeLeft}s`;
  timerDisplay.classList.remove("safe", "warning", "danger");
  if (timeLeft <= 5) timerDisplay.classList.add("danger");
  else if (timeLeft <= 10) timerDisplay.classList.add("warning");
  else timerDisplay.classList.add("safe");
}

function updateHud() {
  roundDisplay.textContent = `${currentRound}/${totalRounds}`;
  scoreDisplay.textContent = totalScore.toLocaleString();
  updateTimerDisplay();
}

function updateMaxZoom() {
  const newMaxZoom = Number(maxZoomRange.value);
  maxZoomValue.textContent = newMaxZoom;
  if (map) {
    map.setMaxZoom(newMaxZoom);
    if (map.getZoom() > newMaxZoom) map.setZoom(newMaxZoom);
  }
}

/* =========================================================
   GLOBAL FIREBASE LEADERBOARD
========================================================= */
async function submitGlobalScore(event) {
  event.preventDefault();

  if (!FIREBASE_IS_CONFIGURED || !db) {
    showToast("Firebase is not configured yet. Add your config in script.js first.");
    return;
  }

  if (scoreSubmitted) {
    showToast("This score has already been submitted.");
    return;
  }

  const playerName = sanitizePlayerName(playerNameInput.value);
  if (playerName.length < 2) {
    showToast("Please enter a player name with at least 2 characters.");
    return;
  }

  submitScoreBtn.disabled = true;
  submitScoreBtn.textContent = "Submitting...";

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      playerName,
      score: totalScore,
      difficulty: difficulty.label,
      rounds: totalRounds,
      maxPossible: totalRounds * MAX_SCORE_PER_ROUND,
      createdAt: serverTimestamp()
    });
    scoreSubmitted = true;
    showToast("Score submitted to the global leaderboard!");
    await loadLeaderboard();
  } catch (error) {
    console.error(error);
    showToast("Could not submit score. Check Firebase config and Firestore rules.");
    submitScoreBtn.disabled = false;
  } finally {
    submitScoreBtn.textContent = scoreSubmitted ? "Submitted ✅" : "Submit Score 🌍";
  }
}

async function loadLeaderboard() {
  leaderboardList.innerHTML = "<li>Loading leaderboard...</li>";

  if (!FIREBASE_IS_CONFIGURED || !db) {
    leaderboardList.innerHTML = "<li>Firebase is not configured yet.</li>";
    return;
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("score", "desc"), limit(10));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      leaderboardList.innerHTML = "<li>No global scores yet. Be the first!</li>";
      return;
    }

    leaderboardList.innerHTML = "";
    let rank = 1;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `<strong>#${rank} ${escapeHtml(data.playerName || "Player")}</strong> — ${(data.score || 0).toLocaleString()} pts • ${escapeHtml(data.difficulty || "Mode")} • ${Number(data.rounds || 5)} rounds`;
      leaderboardList.appendChild(li);
      rank += 1;
    });
  } catch (error) {
    console.error(error);
    leaderboardList.innerHTML = "<li>Leaderboard unavailable. Check Firestore rules and internet connection.</li>";
  }
}

function sanitizePlayerName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").replace(/[^a-zA-Z0-9 _.-]/g, "").slice(0, 18);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function getUserAgentLite() {
  if (/Android/i.test(navigator.userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return "iOS";
  if (/Windows/i.test(navigator.userAgent)) return "Windows";
  if (/Mac/i.test(navigator.userAgent)) return "Mac";
  return "Other";
}

/* =========================================================
   ANIMATIONS
========================================================= */
function animateScoreCounter(from, to) {
  const duration = 700;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    scoreDisplay.textContent = Math.round(from + (to - from) * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateFinalScore(score) {
  const duration = 1000;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    finalScoreText.textContent = Math.round(score * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

let confettiPieces = [];
function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  resizeConfettiCanvas();
  const colors = ["#22d3ee", "#3b82f6", "#22c55e", "#ec4899", "#facc15"];
  confettiPieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -Math.random() * confettiCanvas.height,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 4 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 8 - 4
  }));
  animateConfetti();
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach((p) => {
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    confettiCtx.restore();
    p.y += p.speed;
    p.rotation += p.rotationSpeed;
  });
  confettiPieces = confettiPieces.filter((p) => p.y < confettiCanvas.height + 30);
  if (confettiPieces.length) requestAnimationFrame(animateConfetti);
}

/* =========================================================
   TEXT HELPERS
========================================================= */
function getResultTitle(score) {
  if (score >= 900) return "🔥 Legendary Guess!";
  if (score >= 750) return "🎯 Excellent Accuracy!";
  if (score >= 550) return "⚡ Strong Guess!";
  if (score >= 300) return "🧭 Not Bad!";
  return "🌍 Keep Exploring!";
}

function getFinalMessage(score) {
  const max = totalRounds * MAX_SCORE_PER_ROUND;
  const ratio = score / max;
  if (ratio >= 0.86) return "Outstanding! You have elite geography instincts.";
  if (ratio >= 0.66) return "Great job! You handled the exam-style geography questions very well.";
  if (ratio >= 0.44) return "Good performance. A little more map practice will make you sharper.";
  if (ratio >= 0.2) return "Nice effort. Every round helps you learn the world map better.";
  return "Keep exploring. The world is big, and that is what makes the game fun.";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function updateFirebaseStatus() {
  if (FIREBASE_IS_CONFIGURED) {
    firebaseStatus.className = "status-card success";
    firebaseStatus.textContent = "✅ Firebase config detected. Global leaderboard is ready after Firestore is enabled.";
  }
}

/* =========================================================
   EVENTS AND BOOT
========================================================= */
playBtn.addEventListener("click", startGame);
nextRoundBtn.addEventListener("click", nextRound);
restartTopBtn.addEventListener("click", restartGame);
restartFinalBtn.addEventListener("click", restartGame);
refreshLeaderboardBtn.addEventListener("click", loadLeaderboard);
scoreForm.addEventListener("submit", submitGlobalScore);
basemapSelect.addEventListener("change", (e) => setBasemap(e.target.value));
maxZoomRange.addEventListener("input", updateMaxZoom);

window.addEventListener("resize", () => {
  resizeConfettiCanvas();
  setTimeout(() => map && map.invalidateSize(true), 120);
});

window.addEventListener("load", () => {
  updateFirebaseStatus();
  initializeMap();
  resizeConfettiCanvas();
  setTimeout(() => {
    loadingScreen.classList.add("fade-out");
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
      map.invalidateSize(true);
    }, 600);
  }, 900);
});
