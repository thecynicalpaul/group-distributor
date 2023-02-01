# Group CSV generator assignment
_NOTE: Not to be used in production under any circumstances, this is untested and rushed, and your servers will most definitely burn down. ;)_

<br/>

Creates groups of participants from a CSV file for multiple sessions, with various customization options. Uses a mostly greedy algorithm distributing users across
topics and groups as evenly as possible. Supports overlapping options for
overlap across topics (multiple sessions), same departments and levels. You can
additionally specify max size of the groups (last group may have less members
depending on the total number of users), and number of topics/sessions.

---

Example of a CSV file:
```
id, first_name, last_name, email, department, level
1, Abrahan, Galvin, agalvin0, Support, 2
2, Caresse, Yanov, cyanov1, Marketing,
3, Maggie, Inglis, minglis2, Support, 2
4, Flint, Coll, fcoll3, Engineering, 1
```
---

## Usage
```
npm start -- [options] <input-file> <output-file>

Arguments:
  input-file                  location of the source CSV file
  output-file                 location of the resulting CSV file

Options:
  -g, --group <size>          number of users in a group (default: 4)
  -t, --topics <count>        number of topics (default: 2)
  -o, --overlap               minimize group overlap across topics
  -l, --level <overlap>       department overlap (choices: "max", "min")
  -d, --department <overlap>  level overlap (choices: "max", "min")
  --verbose                   output debug messages
  -h, --help                  display help for command
```

## Setup
(from the root of the project)
1. Clone repo:
```
git clone git@github.com:thecynicalpaul/group-distributor.git
cd group-distributor
```
2. On your system of choice, install [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (version 18.3.0-lts preferred)
3. Install dependencies:
```
npm ci
```
4. Build the "production release":
```
npx tsc
```

## Running
- If you are developing:
```
npm start.dev
```
This requires you to have your own copy of `people.csv` in `./priv` directory.

- If running "production build", see: [usage section](#usage)

