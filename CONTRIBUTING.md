# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project uses [bun](https://bun.sh) as its package manager. Install dependencies from the root directory:

```sh
bun install
```

The repository ships an example app in [`example/`](./example/README.md) — an Expo development build demonstrating every SDK feature, with a runtime switcher between the Ola Maps and Mappls providers. Unit tests cover the endpoint construction, response normalization, error handling, and component rendering. Integration tests (see below) exercise the HTTP pipeline end-to-end. To verify your changes locally, run the checks below.

### Scripts

The `package.json` file contains the scripts for common tasks:

- `bun install`: set up the project by installing dependencies.
- `bun run typecheck`: type-check files with TypeScript.
- `bun run lint`: lint files with ESLint and Prettier.
- `bun run test`: run unit tests with Jest.
- `bun run test:integration`: run integration tests with Jest.
- `bun run build`: build the library with `react-native-builder-bob` (also runs via `prepare`).

### Example app

The [`example/`](./example/README.md) app is an Expo development build that consumes the library via a `file:..` dependency, so build the library first:

```sh
bun install && bun run build   # repository root
cd example && bun install
bun run ios                    # or: bun run android
```

Credentials are read from `example/.env.local` (`EXPO_PUBLIC_OLA_MAPS_API_KEY`, `EXPO_PUBLIC_MAPPLS_ACCESS_TOKEN`); see `example/README.md` for details.

### Integration tests

`bun run test:integration` runs the suites in [`integration/`](./integration):

- `localServer.test.ts` always runs — it spins up a real in-process HTTP server and exercises URL building, credential injection, JSON serialization and error mapping with real `fetch`. No credentials or network access needed.
- `olaMaps.live.test.ts` and `mappls.live.test.ts` hit the real provider APIs and are skipped unless the matching environment variable is set:

```sh
OLA_MAPS_API_KEY=your-key bun run test:integration
MAPPLS_ACCESS_TOKEN=your-token bun run test:integration
```

The Ola geofencing round trip additionally needs `OLA_MAPS_GEOFENCE_TESTS=1` because it creates and deletes a real geofence in your account. In CI, configure these as repository secrets (`OLA_MAPS_API_KEY`, `MAPPLS_ACCESS_TOKEN`, `OLA_MAPS_GEOFENCE_TESTS`) to enable the live suites.

Before opening a pull request, make sure everything passes:

```sh
bun run typecheck
bun run lint
bun run test
bun run build
```

To fix formatting errors automatically:

```sh
bun run lint --fix
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module.
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing (via commitlint).

### Linting and tests

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks (via [lefthook](https://lefthook.dev)) lint staged files and verify the commit message format when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
bun run release
```

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the public API, discuss with maintainers first by opening an issue.
