import localFont from "next/font/local";

/**
 * Configuration for the Nexarust font family using next/font/local
 * @constant
 * @description A custom font configuration that includes multiple weights of the Nexarust font family:
 * - Light (300): NexaRust Extras Free
 * - Normal: NexaRust Handmade Extended
 * - Bold: NexaRust Sans Black
 * - Medium (500): NexaRust Script L-0
 * - Black (900): NexaRust Slab Black Shadow 01
 *
 * The font is configured with CSS variable '--font-Nexarust' for use in styling
 * @example
 * // Usage in CSS
 * .myElement {
 *   font-family: var(--font-Nexarust);
 * }
 */
const Nexarust = localFont({
    src: [
        {
            path: "./nexarust/NexaRustExtras-Free.otf",
            weight: "300",
        },
        {
            path: "./nexarust/NexaRustHandmade-Extended.otf",
            weight: "normal",
        },
        {
            path: "./nexarust/NexaRustSans-Black.otf",
            weight: "bold",
        },
        {
            path: "./nexarust/NexaRustScriptL-0.otf",
            weight: "500",
        },
        {
            path: "./nexarust/NexaRustSlab-BlackShadow01.otf",
            weight: "900",
        },
    ],
    variable: "--font-Nexarust",
});

export default Nexarust;
