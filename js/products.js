// js/products.js - Central database for your SimSim eBook Store
const SIMSIM_PRODUCTS = [
    {
        id: "prod-1",
        title: "The Time-Travel School Bus",
        type: "book",
        category: "Bedtime Stories-Book",
        ageGroup: "Ages 3-6",
        price: 4.99,
        images: [
            "images/The Time-Travel School Bus.jpg",
            "images/the_city.jpg",
            "images/egypt.jpg",
            "images/dinosour.jpg",
        ],
        description: "Takes young readers on an unforgettable adventure through history, science, and space! When Emma, Leo, Mia, and Ben climb aboard the magical talking bus, Buzzy, they travel to the age of dinosaurs, explore the pyramids of Ancient Egypt, visit a medieval castle, journey across the Solar System, and even discover a city of the future. Along the way, they meet friendly guides, solve exciting puzzles, and learn fascinating facts about history, geography, teamwork, and science.",
        downloadUrl: "assets/pdfs/The Time-Travel School Bus.pdf",
        videoUrl: ""
    },
    {
        id: "prod-2",
        title: "Fire Truck Freddie's Hero Adventure",
        type: "coloring-activity",
        category: "Activities-Coloring Book",
        ageGroup: "Ages 5-7",
        price: 1.00,
        images: [
            "images/fire_truck.jpg",
            "images/firetruck1.png",
            "images/firetruck2.png",
            "images/firetruck3.png",
        ],
        description: "Fire Truck Freddie on 40 exciting comic-style adventures filled with laughter, learning, and heroic rescues! Alongside Captain Bella and their friends, Freddie helps animals, teaches important fire safety rules, explores colorful shapes, discovers bright colors, and shows how teamwork makes every mission a success.",
        downloadUrl: "assets/pdfs/Fire Truck Freddie's Hero Adventure.pdf",
        videoUrl: ""
    },
    {
        id: "prod-3",
        title: "Jojo the little bee",
        type: "video",
        category: "Bedtime Stories-video",
        ageGroup: "Ages 2-5",
        price: 1.00,
        images: [
            "images/Jojo the little bee.jpg",
            "images/Jojo the little bee1.jpg",
            "images/Jojo the little bee2.jpg",
            "images/Jojo the little bee3.jpg",
        ],
        description: "Little Jojo the bee lives with her loving family deep inside a giant tree in the forest. One sunny morning, she wakes up, exercises her tiny wings, and flies out wearing her colorful dress to collect sweet flower nectar for breakfast.",
        downloadUrl: "#",
        videoUrl: "https://canva.link/g7qqngazzrc3cql"
    },
    {
        id: "prod-4",
        title: "Bobo The Panda",
        type: "book",
        category: "Bedtime Stories-Book",
        ageGroup: "Ages 4-7",
        price: 4.99,
        images: [
            "images/Bobothepanda.jpg",
            "images/Bobothepanda1.jpg",
            "images/Bobothepanda2.jpg",
            "images/Bobothepanda3.jpg",
        ],
        description: "Bobo the Panda on a heartwarming forest adventure filled with friendship, teamwork, and fun! Every day, Bobo enjoys time with his loving family, playful friends, and wonderful school.",
        downloadUrl: "assets/pdfs/Bobo The Panda.pdf",
        videoUrl: ""
    },
    {
        id: "prod-5",
        title: "My Comic Coloring Book",
        type: "coloring-activity",
        category: "Comic Coloring Book",
        ageGroup: "Ages 5-7",
        price: 1.00,
        images: [
            "images/My Comic Coloring Book.jpg",
            "images/My Comic Coloring Book1.png",
            "images/My Comic Coloring Book2.png",
            "images/My Comic Coloring Book3.png",
        ],
        description: "Engage young learners with a vibrant collection of coloring pages and fun educational activities. This book helps children practice essential skills while expressing their creativity.",
        downloadUrl: "assets/pdfs/My Comic Coloring Book.pdf",
        videoUrl: ""
    },
    {
        id: "prod-6",
        title: "Detective Dino",
        type: "coloring-activity",
        category: "Comic Coloring Book",
        ageGroup: "Ages 5-8",
        price: 1.00,
        images: [
            "images/Detective Dino.jpg",
            "images/Detective Dino1.png",
            "images/Detective Dino2.png",
            "images/Detective Dino3.png",
        ],
        description: "Alphabet Valley is bright and colorful again. The Alphabet Crystals sparkle safely inside the museum, and every letter shines across books, signs, songs, and classrooms. Detective Dino smiles proudly as all the animal friends celebrate together with balloons, confetti, and music. Children review the alphabet one last time while everyone cheers. Detective Dino reminds everyone that every letter helps us read, speak, write, and learn new words. The adventure ends with laughter, friendship.",
        downloadUrl: "assets/pdfs/Detective Dino.pdf",
        videoUrl: ""
    },
    {
        id: "prod-7",
        title: "Benny The Bear",
        type: "coloring-activity",
        category: "Comic Coloring Book",
        ageGroup: "Ages 4-7",
        price: 4.00,
        images: [
            "images/Benny Bear.jpg",
            "images/Benny Bear1.jpg",
            "images/Benny Bear2.jpg",
            "images/Benny Bear3.jpg",
        ],
        description: "is a fun-filled comic-style coloring book that helps children ages 5–7 build English skills through exciting stories, colorful adventures, and interactive learning.",
        downloadUrl: "assets/pdfs/Benny The Bear.pdf",
        videoUrl: ""
    }
];
