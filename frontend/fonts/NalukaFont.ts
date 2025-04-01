import localFont from "next/font/local";

const Naluka = localFont({
    src: [
        {
            path: "./naluka/Naluka.ttf",
            weight: "normal",
        },
        {
            path: "./naluka/Naluka.ttf",
            weight: "bold",
        },
    ],
    variable: "--font-Naluka",
});

export default Naluka;
