import { MatchInfo, PlayerInfo } from "@/api/client";

const mockPlayer1: PlayerInfo = {
    id: 1,
    cursed_technique: {
        name: "my ct",
        id: 2,
        definition: "my ct definition",
        applications: [
            {
                name: "Domain Expansion",
                id: 4,
                number: 1,
                application:
                    "Creates a guaranteed-hit barrier space where technique is amplified",
            },
            {
                name: "Simple Domain",
                id: 5,
                number: 2,
                application:
                    "Creates a small barrier that neutralizes Domain Expansion effects",
            },
            {
                name: "Cursed Energy Reinforcement",
                id: 3,
                number: 3,
                application:
                    "Enhances physical capabilities using cursed energy",
            },
            {
                name: "Black Flash",
                id: 6,
                number: 4,
                application:
                    "Distorts space-time with perfect timing to multiply damage by 2.5",
            },
            {
                name: "Reversed Cursed Technique",
                id: 7,
                number: 5,
                application:
                    "Combines positive and negative energy to heal injuries",
            },
        ],
    },
    age: 60,
    name: "Ethan",
    gender: "male",
    created: new Date().toDateString(),
    grade: 4,
    points: 4.0,
    matches: [],
    user: {
        username: "my username",
        id: 50,
        email: "e@gmail.com",
        created: new Date().toDateString(),
    },
    barrier_technique: null,
    colony: {
        id: 10,
        country: "AD",
    },
};

const mockPlayer2: PlayerInfo = {
    id: 2,
    cursed_technique: {
        name: "void technique",
        id: 3,
        definition: "manipulates empty space",
        applications: [
            {
                name: "Teleport",
                id: 6,
                number: 3,
                application: "instant movement through void",
            },
            {
                name: "Void Pocket",
                id: 7,
                number: 4,
                application: "store items in pocket dimension",
            },
            {
                name: "Hollow Purple",
                id: 8,
                number: 1,
                application:
                    "Combines opposing forces to create destructive void energy",
            },
            {
                name: "Maximum Technique",
                id: 9,
                number: 2,
                application:
                    "Unleashes the technique's full potential at the cost of more cursed energy",
            },
            {
                name: "Binding Vow",
                id: 10,
                number: 3,
                application: "Creates restrictions to gain power boosts",
            },
        ],
    },
    age: 25,
    name: "Nahte",
    gender: "female",
    created: new Date().toDateString(),
    grade: 1,
    points: 8.5,
    matches: [],
    user: {
        username: "void_walker",
        id: 51,
        email: "void@example.com",
        created: new Date().toDateString(),
    },
    barrier_technique: null,
    colony: {
        id: 11,
        country: "JP",
    },
};

const mockPlayers = [mockPlayer2, mockPlayer1];

const mockMatch: MatchInfo = {
    begin: new Date(2025, 3, 29, 13, 60, 90, 500).toLocaleDateString(),
    end: new Date().toLocaleDateString(),
    part: 1,
    id: 1,
    winner: null,
    players: mockPlayers,
    colony: {
        country: "AF",
        id: 1,
    },
};

export { mockMatch, mockPlayers };

