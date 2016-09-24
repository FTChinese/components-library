## Add a module to scan

Add the entry in `module-list.json`.

## Steps to taken
```
node scanner.js
node components.js
gulp build
gulp deploy
```

## Data

Data squired by scanning GitHub api.

Tag information scraped from `https://api.github.com/repos/FTChinese/:repo/git/refs/tags`.

Contents of `bower.json` and `origami.json` are requested from `https://api.github.com/repos/FTChinese/:repo/contents/<bower | origami>.json`. File contents returned by GitHub api are encoded in `base64`. I used Node.js `Buffer` to decode the content and converted to string.
