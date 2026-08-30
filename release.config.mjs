const forcedType = process.env.FORCE_RELEASE_TYPE;

export default {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      forcedType ? { releaseRules: [{ release: forcedType }] } : {},
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "✨ Features" },
            { type: "fix", section: "🐛 Bug Fixes" },
            { type: "perf", section: "⚡ Performance" },
            { type: "revert", section: "⏪ Reverts" },
            { type: "refactor", section: "♻️ Refactors" },
            { type: "docs", section: "📝 Documentation" },
            { type: "style", section: "💄 Styles" },
            { type: "test", section: "✅ Tests" },
            { type: "build", section: "📦 Build" },
            { type: "ci", section: "👷 CI" },
            { type: "chore", section: "🔧 Chores" },
          ],
        },
      },
    ],
    "@semantic-release/changelog",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/github",
  ],
};
