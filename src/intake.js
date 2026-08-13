import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

// A creator-facing, plain-language Q&A wizard that produces a valid
// nba2k27 build spec without anyone touching JSON. The prompter is
// injected ({ ask(question) -> answer }) so tests can script answers
// without mocking a real readline stream — cli.js wires createReadlinePrompter.

const POSITION_CHOICES = [
  { label: 'Point Guard', code: 'PG' },
  { label: 'Shooting Guard', code: 'SG' },
  { label: 'Small Forward', code: 'SF' },
  { label: 'Power Forward', code: 'PF' },
  { label: 'Center', code: 'C' },
];

const TIER_CHOICES = ['Bronze', 'Silver', 'Gold', 'Hall of Fame'];

export function createReadlinePrompter({ input = stdin, output = stdout } = {}) {
  const rl = createInterface({ input, output });
  return { ask: (question) => rl.question(question), close: () => rl.close() };
}

async function ask(prompter, question) {
  return (await prompter.ask(question)).trim();
}

async function askRequired(prompter, question) {
  let answer = '';
  while (!answer) {
    answer = await ask(prompter, question);
    if (!answer) console.log("  (that one's required — try again)");
  }
  return answer;
}

async function askChoice(prompter, question, choices) {
  console.log(question);
  choices.forEach((c, i) => console.log(`  ${i + 1}. ${typeof c === 'string' ? c : c.label}`));
  for (;;) {
    const answer = await ask(prompter, `Enter a number 1-${choices.length}: `);
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) return choices[n - 1];
    console.log('  Not a valid choice, try again.');
  }
}

async function askAttribute(prompter, label) {
  for (;;) {
    const answer = await ask(prompter, `${label} (0-99): `);
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 0 && n <= 99) return n;
    console.log('  Enter a whole number between 0 and 99.');
  }
}

async function askYesNo(prompter, question, defaultYes) {
  const suffix = defaultYes ? '(Y/n)' : '(y/N)';
  const answer = (await ask(prompter, `${question} ${suffix}: `)).toLowerCase();
  if (!answer) return defaultYes;
  return answer.startsWith('y');
}

export async function runIntake(prompter) {
  console.log("\nLet's build your NBA 2K27 MyPlayer content package.\n");

  const buildName = await askRequired(prompter, 'What do you want to call this build (e.g. "6\'6 Slashing Playmaker")? ');
  const position = await askChoice(prompter, '\nWhat position?', POSITION_CHOICES);
  const height = await askRequired(prompter, "\nHeight (e.g. 6'6\")? ");
  const weight = await askRequired(prompter, 'Weight (e.g. 195 lbs)? ');
  const wingspan = await askRequired(prompter, "Wingspan (e.g. 6'9\")? ");
  const playstyle = await askRequired(prompter, '\nDescribe the playstyle in a sentence (e.g. "downhill slasher who can also shoot")? ');

  console.log('\nNow the attribute ratings, 0-99 each — your best guess is fine.');
  const attributes = {
    finishing: await askAttribute(prompter, 'Finishing'),
    shooting: await askAttribute(prompter, 'Shooting'),
    playmaking: await askAttribute(prompter, 'Playmaking'),
    defense: await askAttribute(prompter, 'Defense'),
    rebounding: await askAttribute(prompter, 'Rebounding'),
    physicals: await askAttribute(prompter, 'Physicals'),
  };

  console.log("\nNow the badges. Enter one at a time; leave the name blank when you're done.");
  const badges = [];
  for (;;) {
    const name = await ask(prompter, `Badge #${badges.length + 1} name (blank to finish): `);
    if (!name) {
      if (badges.length === 0) {
        console.log('  You need at least one badge — enter a name to continue.');
        continue;
      }
      break;
    }
    const tier = await askChoice(prompter, `  Tier for "${name}"?`, TIER_CHOICES);
    badges.push({ name, tier });
  }

  const takeoversRaw = await ask(prompter, '\nTakeover(s), comma-separated (or leave blank): ');
  const takeovers = takeoversRaw ? takeoversRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const targetAudience = await askRequired(prompter, '\nWho is this build for (e.g. "competitive Park and Rec players")? ');

  let visualIdentity;
  if (await askYesNo(prompter, '\nWant to specify the jersey colors/number/look yourself?', false)) {
    const jerseyColorway = await ask(prompter, '  Jersey colors: ');
    const number = await ask(prompter, '  Jersey number: ');
    const appearanceNotes = await ask(prompter, '  Appearance notes (hair, build, etc.): ');
    visualIdentity = { jerseyColorway, number, appearanceNotes };
  }

  return {
    game: 'nba2k27',
    buildName,
    position: position.code,
    height,
    weight,
    wingspan,
    playstyle,
    attributes,
    badges,
    takeovers,
    targetAudience,
    ...(visualIdentity ? { visualIdentity } : {}),
  };
}
