const forcedType = process.env.FORCE_RELEASE_TYPE;

export default {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      forcedType ? { releaseRules: [{ release: forcedType }] } : {},
    ],
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
  ],
};
