module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.(t|j)sx?$": "babel-jest",
    },
    moduleNameMapper: {
        "^#(.*)\\.js$": "<rootDir>/src/$1.ts",
        "^#(.*)$": "<rootDir>/src/$1",
    },
};
