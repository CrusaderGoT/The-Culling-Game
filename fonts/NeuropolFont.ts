import localFont from "next/font/local";

const Neuropol = localFont({
    src: [
        {
            path: "./neuropol/Neuropol.otf",
        },
    ],
    variable: "--font-Neuropol",
});

export default Neuropol;
